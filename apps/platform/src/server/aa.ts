import "server-only";

import { robinhood, robinhoodTestnet, type HoodStackChain } from "@hoodstack/network";
import { toKernelSmartAccount } from "permissionless/accounts";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
  type Address,
  type Chain,
  type Hex,
} from "viem";
import {
  entryPoint07Abi,
  entryPoint07Address,
  getUserOperationHash,
  toPackedUserOperation,
} from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";

import type { KeyEnvironment } from "@/lib/api-keys";
import type { CallRequest, SerializedUserOp, SubmitResult } from "@/lib/aa-types";

export type { CallRequest, SerializedUserOp, SubmitResult } from "@/lib/aa-types";

/**
 * The smart-account adapter: the platform's write path.
 *
 * A Kernel (ERC-4337) account is owned by the end user's key and signs its own
 * operations; HoodStack never holds that key. The server builds the exact
 * UserOperation from the owner's *address* (so it controls and can policy-check
 * what is submitted), and a server relayer submits it via EntryPoint.handleOps,
 * paying gas. A relayer can never move an account's funds - it only relays a
 * signed op - so a relayer-key compromise costs only its gas float.
 *
 * No standalone bundler: for a single-operator platform, submitting handleOps
 * directly from a server action is the whole bundler. Verified on-chain first.
 */

const KERNEL = { version: "0.3.1", useMetaFactory: false } as const;
const EP = { address: entryPoint07Address, version: "0.7" } as const;

function chainFor(env: KeyEnvironment): HoodStackChain {
  return env === "live" ? robinhood : robinhoodTestnet;
}

function rpcUrlFor(env: KeyEnvironment): string {
  const override =
    env === "live"
      ? process.env.HOODSTACK_RPC_URL_MAINNET
      : process.env.HOODSTACK_RPC_URL_TESTNET;
  return override || chainFor(env).rpcUrls.default.http[0]!;
}

function relayerKeyFor(env: KeyEnvironment): Hex | null {
  const key =
    env === "live"
      ? process.env.HOODSTACK_RELAYER_KEY_MAINNET
      : process.env.HOODSTACK_RELAYER_KEY_TESTNET;
  return key && key.startsWith("0x") ? (key as Hex) : null;
}

/** Whether signed submission is available for this network (relayer configured). */
export function writesEnabled(env: KeyEnvironment): boolean {
  return relayerKeyFor(env) !== null;
}

function viemChain(env: KeyEnvironment): Chain {
  return chainFor(env) as unknown as Chain;
}

function publicClientFor(env: KeyEnvironment) {
  return createPublicClient({ chain: viemChain(env), transport: http(rpcUrlFor(env)) });
}

/** A view-only owner: address only, signing throws. Enough to build and derive. */
function stubOwner(address: Address) {
  const fail = async () => {
    throw new Error("owner cannot sign server-side");
  };
  return {
    address,
    type: "local",
    source: "custom",
    publicKey: "0x" as Hex,
    signMessage: fail,
    signTypedData: fail,
    sign: fail,
  } as never;
}

function kernelFor(env: KeyEnvironment, owner: never) {
  return toKernelSmartAccount({
    client: publicClientFor(env),
    owners: [owner],
    entryPoint: EP,
    version: KERNEL.version,
    useMetaFactory: KERNEL.useMetaFactory,
  });
}

/** The counterfactual smart-account address for an owner. */
export async function deriveSmartAccountAddress(
  env: KeyEnvironment,
  ownerAddress: Address,
): Promise<Address> {
  const account = await kernelFor(env, stubOwner(ownerAddress));
  return account.address;
}

/**
 * Build the exact UserOperation the owner will sign, from the owner's address
 * alone. Returns it serialized plus the hash to sign. The server holds no key.
 */
export async function buildUserOperation(
  env: KeyEnvironment,
  ownerAddress: Address,
  calls: CallRequest[],
): Promise<{ userOp: SerializedUserOp; userOpHash: Hex }> {
  const client = publicClientFor(env);
  const account = await kernelFor(env, stubOwner(ownerAddress));

  const [nonce, callData, factoryArgs, fees] = await Promise.all([
    account.getNonce(),
    account.encodeCalls(
      calls.map((c) => ({ to: c.to, value: BigInt(c.valueWei), data: c.data ?? "0x" })),
    ),
    account.getFactoryArgs(),
    client.estimateFeesPerGas(),
  ]);

  const unpacked = {
    sender: account.address,
    nonce,
    factory: factoryArgs.factory,
    factoryData: factoryArgs.factoryData,
    callData,
    // Generous fixed limits; unused gas is refunded. Estimation via the on-chain
    // EntryPointSimulations is a follow-up refinement.
    callGasLimit: 300_000n,
    verificationGasLimit: 600_000n,
    preVerificationGas: 150_000n,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    signature: await account.getStubSignature(),
  };

  const userOpHash = getUserOperationHash({
    chainId: chainFor(env).id,
    entryPointAddress: entryPoint07Address,
    entryPointVersion: "0.7",
    userOperation: unpacked as never,
  });

  return { userOp: serialize(unpacked, factoryArgs), userOpHash };
}

/**
 * Submit a signed UserOperation via the relayer, after verifying it does exactly
 * the policy-checked call. Returns the on-chain result. Throws if writes are not
 * enabled for this network or verification fails.
 */
export async function submitUserOperation(
  env: KeyEnvironment,
  ownerAddress: Address,
  calls: CallRequest[],
  signed: SerializedUserOp,
): Promise<SubmitResult> {
  const relayerKey = relayerKeyFor(env);
  if (!relayerKey) throw new Error("Signed submission is not enabled for this network.");

  const client = publicClientFor(env);
  const account = await kernelFor(env, stubOwner(ownerAddress));

  // The op must be for this owner's account and do exactly the described call -
  // otherwise a client could have signed something the policy never saw.
  if (signed.sender.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error("UserOperation sender does not match the owner's account.");
  }
  const expectedCallData = await account.encodeCalls(
    calls.map((c) => ({ to: c.to, value: BigInt(c.valueWei), data: c.data ?? "0x" })),
  );
  if (signed.callData.toLowerCase() !== expectedCallData.toLowerCase()) {
    throw new Error("UserOperation call data does not match the requested call.");
  }

  const relayer = privateKeyToAccount(relayerKey);
  const wallet = createWalletClient({
    account: relayer,
    chain: viemChain(env),
    transport: http(rpcUrlFor(env)),
  });

  const packed = toPackedUserOperation(deserialize(signed) as never);
  const txHash = await wallet.writeContract({
    address: entryPoint07Address,
    abi: entryPoint07Abi,
    functionName: "handleOps",
    args: [[packed], relayer.address],
  });

  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  const events = parseEventLogs({
    abi: entryPoint07Abi,
    logs: receipt.logs,
    eventName: "UserOperationEvent",
  });
  const event = events[0];
  return {
    userOpHash: (event?.args.userOpHash as Hex) ?? "0x",
    transactionHash: txHash,
    success: receipt.status === "success" && (event?.args.success ?? false),
  };
}

// --- (de)serialization: bigint <-> hex string for the wire ---

function serialize(
  op: {
    sender: Address;
    nonce: bigint;
    callData: Hex;
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    signature: Hex;
  },
  factoryArgs: { factory?: Address | undefined; factoryData?: Hex | undefined },
): SerializedUserOp {
  const hex = (n: bigint): Hex => `0x${n.toString(16)}`;
  const out: SerializedUserOp = {
    sender: op.sender,
    nonce: hex(op.nonce),
    callData: op.callData,
    callGasLimit: hex(op.callGasLimit),
    verificationGasLimit: hex(op.verificationGasLimit),
    preVerificationGas: hex(op.preVerificationGas),
    maxFeePerGas: hex(op.maxFeePerGas),
    maxPriorityFeePerGas: hex(op.maxPriorityFeePerGas),
    signature: op.signature,
  };
  if (factoryArgs.factory) out.factory = factoryArgs.factory;
  if (factoryArgs.factoryData) out.factoryData = factoryArgs.factoryData;
  return out;
}

function deserialize(op: SerializedUserOp) {
  const base = {
    sender: op.sender,
    nonce: BigInt(op.nonce),
    callData: op.callData,
    callGasLimit: BigInt(op.callGasLimit),
    verificationGasLimit: BigInt(op.verificationGasLimit),
    preVerificationGas: BigInt(op.preVerificationGas),
    maxFeePerGas: BigInt(op.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(op.maxPriorityFeePerGas),
    signature: op.signature,
  };
  return op.factory
    ? { ...base, factory: op.factory, factoryData: op.factoryData }
    : base;
}
