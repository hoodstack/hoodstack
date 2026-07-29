"use client";

import { robinhood, robinhoodTestnet } from "@hoodstack/network";
import { useWallets } from "@privy-io/react-auth";
import { toKernelSmartAccount } from "permissionless/accounts";
import { useCallback, useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  http,
  type Address,
} from "viem";
import { entryPoint07Address } from "viem/account-abstraction";

import type { KeyEnvironment } from "@/lib/api-keys";
import type { SerializedUserOp } from "@/lib/aa-types";
import { Button, StatusBadge } from "@/components/ui";

import { prepareSubmitAction, submitSignedAction } from "../actions";

type Phase =
  | { status: "idle" }
  | { status: "preparing" }
  | { status: "signing" }
  | { status: "submitting" }
  | { status: "done"; txHash: string; success: boolean }
  | { status: "error"; message: string };

function chainFor(env: KeyEnvironment) {
  return env === "live" ? robinhood : robinhoodTestnet;
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
  return op.factory ? { ...base, factory: op.factory, factoryData: op.factoryData } : base;
}

/**
 * Sign and submit a real transaction through the smart account.
 *
 * The user's Privy embedded wallet owns the account and signs; the server builds
 * the exact op (policy-checked) and a relayer submits it. HoodStack never holds
 * the key. Every state is real - nothing is faked.
 */
export function SubmitTransaction({
  projectId,
  environment,
}: {
  projectId: string;
  environment: KeyEnvironment;
}) {
  const { wallets } = useWallets();
  const wallet = wallets.find((w) => w.walletClientType === "privy") ?? wallets[0];

  const [account, setAccount] = useState<Address | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const [form, setForm] = useState({ to: "", value: "", data: "" });

  // Derive the smart-account address for the connected wallet, and read its
  // balance so the user knows whether it can pay for gas.
  useEffect(() => {
    let live = true;
    setAccount(null);
    setBalance(null);
    if (!wallet) return;
    (async () => {
      try {
        const chain = chainFor(environment);
        const client = createPublicClient({ chain, transport: http() });
        const provider = await wallet.getEthereumProvider();
        const owner = createWalletClient({
          account: wallet.address as Address,
          chain,
          transport: custom(provider),
        });
        const smart = await toKernelSmartAccount({
          client,
          owners: [owner],
          entryPoint: { address: entryPoint07Address, version: "0.7" },
          version: "0.3.1",
          useMetaFactory: false,
        });
        if (!live) return;
        setAccount(smart.address);
        const bal = await client.getBalance({ address: smart.address });
        if (live) setBalance(formatEther(bal));
      } catch {
        /* address display is best-effort */
      }
    })();
    return () => {
      live = false;
    };
  }, [wallet, environment]);

  const submit = useCallback(async () => {
    if (!wallet) return;
    try {
      setPhase({ status: "preparing" });
      const ownerAddress = wallet.address;
      const to = form.to.trim();
      const valueEth = form.value.trim();
      const data = form.data.trim();

      const prepared = await prepareSubmitAction({
        projectId,
        environment,
        ownerAddress,
        to,
        valueEth,
        data,
      });
      if (!prepared.ok) {
        setPhase({ status: "error", message: prepared.error });
        return;
      }

      // Client-side signing with the Privy wallet.
      setPhase({ status: "signing" });
      const chain = chainFor(environment);
      const client = createPublicClient({ chain, transport: http() });
      const provider = await wallet.getEthereumProvider();
      const owner = createWalletClient({
        account: ownerAddress as Address,
        chain,
        transport: custom(provider),
      });
      const smart = await toKernelSmartAccount({
        client,
        owners: [owner],
        entryPoint: { address: entryPoint07Address, version: "0.7" },
        version: "0.3.1",
        useMetaFactory: false,
      });
      const signature = await smart.signUserOperation(
        deserialize(prepared.data.userOp) as never,
      );
      const signed: SerializedUserOp = { ...prepared.data.userOp, signature };

      setPhase({ status: "submitting" });
      const result = await submitSignedAction({
        projectId,
        environment,
        ownerAddress,
        to,
        valueEth,
        data,
        userOp: signed,
      });
      if (!result.ok) {
        setPhase({ status: "error", message: result.error });
        return;
      }
      setPhase({
        status: "done",
        txHash: result.data.transactionHash,
        success: result.data.success,
      });
    } catch (error) {
      setPhase({
        status: "error",
        message: error instanceof Error ? error.message : "Submission failed.",
      });
    }
  }, [wallet, form, projectId, environment]);

  const busy =
    phase.status === "preparing" ||
    phase.status === "signing" ||
    phase.status === "submitting";
  const inputClass =
    "h-9 w-full rounded-control border border-line-strong bg-surface px-3 font-mono text-sm text-content placeholder:text-content-tertiary focus-visible:border-line-brand focus-visible:outline-none disabled:opacity-50";
  const explorer = chainFor(environment).blockExplorers?.default.url;

  if (!wallet) {
    return (
      <p className="rounded-card border border-line bg-surface p-4 text-sm text-content-secondary">
        Sign in to get a wallet, then submit a transaction from your smart account.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* The account that will send, and whether it can pay for gas. */}
      <div className="rounded-card border border-line bg-surface-inset p-4">
        <p className="text-xs text-content-tertiary">Your smart account</p>
        <p className="mt-1 break-all font-mono text-sm text-content">
          {account ?? "deriving…"}
        </p>
        {balance !== null ? (
          <p className="mt-2 text-xs text-content-tertiary">
            Balance {balance} ETH{" "}
            {Number(balance) === 0 ? (
              <span className="text-status-warning">
                · fund it to pay for gas (no paymaster yet)
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <input
          value={form.to}
          onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
          placeholder="Recipient address (to)"
          disabled={busy}
          className={inputClass}
          spellCheck={false}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            placeholder="Value in ETH (optional)"
            disabled={busy}
            className={inputClass}
            spellCheck={false}
          />
          <input
            value={form.data}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            placeholder="Calldata 0x… (optional)"
            disabled={busy}
            className={inputClass}
            spellCheck={false}
          />
        </div>
        <div>
          <Button type="button" onClick={submit} disabled={busy || !form.to.trim()}>
            {phase.status === "preparing"
              ? "Preparing"
              : phase.status === "signing"
                ? "Awaiting signature"
                : phase.status === "submitting"
                  ? "Submitting"
                  : "Sign & submit"}
          </Button>
        </div>
      </div>

      {phase.status === "error" ? (
        <p className="text-sm text-status-danger">{phase.message}</p>
      ) : null}

      {phase.status === "done" ? (
        <div className="rounded-card border border-line bg-surface p-4">
          <StatusBadge tone={phase.success ? "success" : "danger"}>
            {phase.success ? "Confirmed" : "Reverted"}
          </StatusBadge>
          <p className="mt-3 break-all font-mono text-xs text-content-secondary">
            {phase.txHash}
          </p>
          {explorer ? (
            <a
              href={`${explorer}/tx/${phase.txHash}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-block text-sm font-medium text-content-brand hover:underline"
            >
              View on explorer ↗
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
