/* eslint-disable no-console */
/**
 * Account-abstraction spike, part 1: derive a Kernel smart account on Robinhood
 * Chain testnet and confirm it is counterfactual (not yet deployed).
 *
 * This needs no bundler and no funds: it computes the account's deterministic
 * address from an owner key and reads whether code exists there. It proves the
 * account layer works on chain 46630, where the EntryPoint and Kernel factory
 * are already deployed.
 *
 * Run: pnpm --filter @hoodstack/example-aa-spike derive
 * Optionally set SPIKE_PRIVATE_KEY to reuse an owner; otherwise a random one is
 * generated each run.
 */
import { robinhoodTestnet } from "@hoodstack/network";
import { toKernelSmartAccount } from "permissionless/accounts";
import { createPublicClient, http } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

async function main(): Promise<void> {
  const rpcUrl =
    process.env.HOODSTACK_RPC_URL_TESTNET || robinhoodTestnet.rpcUrls.default.http[0]!;

  const client = createPublicClient({
    chain: robinhoodTestnet as never,
    transport: http(rpcUrl),
  });

  const privateKey = (process.env.SPIKE_PRIVATE_KEY as `0x${string}`) ?? generatePrivateKey();
  const owner = privateKeyToAccount(privateKey);

  const account = await toKernelSmartAccount({
    client,
    owners: [owner],
    entryPoint: { address: entryPoint07Address, version: "0.7" },
    version: "0.3.1",
    // Robinhood Chain has the Kernel factory deployed but not the meta-factory,
    // so address through the direct factory. (Verified on-chain.)
    useMetaFactory: false,
  });

  const code = await client.getCode({ address: account.address });
  const deployed = Boolean(code && code !== "0x");

  console.log("Network:            Robinhood Chain testnet (46630)");
  console.log("Owner (EOA):       ", owner.address);
  console.log("Kernel account:    ", account.address);
  console.log("Already deployed?  ", deployed);
  console.log(
    deployed
      ? "This owner already has a deployed smart account."
      : "Counterfactual: the account will deploy on its first UserOperation.",
  );
}

main().catch((error) => {
  console.error("derive failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});