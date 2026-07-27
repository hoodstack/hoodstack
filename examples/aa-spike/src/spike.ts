/* eslint-disable no-console */
/**
 * Account-abstraction spike, part 2: send one sponsored UserOperation.
 *
 * This is the proof that closes the loop: derive a Kernel account (as in
 * derive.ts), then send a no-op UserOperation through a bundler, sponsored by a
 * paymaster, and wait for the receipt. A single confirmed UserOp validates
 * EntryPoint + Kernel + bundler + paymaster on chain 46630.
 *
 * It needs infrastructure this example cannot provision itself:
 *   - SPIKE_PRIVATE_KEY: an owner EOA (any key; the smart account is derived).
 *   - PIMLICO_BUNDLER_URL: a bundler+paymaster endpoint for chain 46630. Get one
 *     from the Pimlico dashboard, or run Alto locally against the testnet RPC.
 *
 * Run: PIMLICO_BUNDLER_URL=… SPIKE_PRIVATE_KEY=… pnpm --filter @hoodstack/example-aa-spike spike
 *
 * Provider note: fee handling can differ per bundler. Pimlico exposes
 * `pimlico_getUserOperationGasPrice`; if your provider differs, adjust
 * `userOperation.estimateFeesPerGas`.
 */
import { robinhoodTestnet } from "@hoodstack/network";
import { createSmartAccountClient } from "permissionless";
import { toKernelSmartAccount } from "permissionless/accounts";
import { createPublicClient, http } from "viem";
import {
  createPaymasterClient,
  entryPoint07Address,
} from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";

async function main(): Promise<void> {
  const bundlerUrl = process.env.PIMLICO_BUNDLER_URL;
  const privateKey = process.env.SPIKE_PRIVATE_KEY as `0x${string}` | undefined;
  if (!bundlerUrl || !privateKey) {
    console.error(
      "Set PIMLICO_BUNDLER_URL (bundler+paymaster for chain 46630) and SPIKE_PRIVATE_KEY.",
    );
    process.exitCode = 1;
    return;
  }

  const rpcUrl =
    process.env.HOODSTACK_RPC_URL_TESTNET || robinhoodTestnet.rpcUrls.default.http[0]!;
  const client = createPublicClient({
    chain: robinhoodTestnet as never,
    transport: http(rpcUrl),
  });

  const owner = privateKeyToAccount(privateKey);
  const account = await toKernelSmartAccount({
    client,
    owners: [owner],
    entryPoint: { address: entryPoint07Address, version: "0.7" },
    version: "0.3.1",
    useMetaFactory: false,
  });

  const paymaster = createPaymasterClient({ transport: http(bundlerUrl) });
  const smartAccountClient = createSmartAccountClient({
    account,
    chain: robinhoodTestnet as never,
    bundlerTransport: http(bundlerUrl),
    paymaster,
  });

  console.log("Smart account:", account.address);
  console.log("Sending a no-op UserOperation…");

  const hash = await smartAccountClient.sendUserOperation({
    calls: [{ to: account.address, value: 0n, data: "0x" }],
  });
  console.log("UserOperation hash:", hash);

  const receipt = await smartAccountClient.waitForUserOperationReceipt({ hash });
  console.log("Included in tx:   ", receipt.receipt.transactionHash);
  console.log("Success:          ", receipt.success);
}

main().catch((error) => {
  console.error("spike failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});