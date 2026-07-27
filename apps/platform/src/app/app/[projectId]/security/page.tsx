import { formatEther } from "viem";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { listApiKeys } from "@/server/api-keys";
import { getPolicy } from "@/server/policies";
import { getProjectForMember } from "@/server/projects";
import { listWebhooks } from "@/server/webhooks";

import { StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Security" };
export const dynamic = "force-dynamic";

/**
 * The Security module: a posture view over the controls a project already has,
 * policies, allowlists, keys, and webhooks. Enforcement at submit and risk checks
 * on live execution land with account abstraction.
 */
export default async function SecurityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const [policy, keys, webhooks] = await Promise.all([
    getPolicy(session.user.id, projectId),
    listApiKeys(session.user.id, projectId),
    listWebhooks(session.user.id, projectId),
  ]);

  const activeKeys = keys.filter((k) => k.revokedAt === null);
  const liveKeys = activeKeys.filter((k) => k.environment === "live");

  const items: {
    label: string;
    tone: "success" | "warning" | "neutral";
    state: string;
    href: string;
    detail: string;
  }[] = [
    {
      label: "Spending limit",
      tone: policy.maxValueWei ? "success" : "neutral",
      state: policy.maxValueWei ? `${formatEther(BigInt(policy.maxValueWei))} ETH` : "None",
      href: `/app/${project.id}/policies`,
      detail: "Caps the value of any single simulated transaction.",
    },
    {
      label: "Recipient allowlist",
      tone: policy.allowlistMode === "enforce" ? "success" : "neutral",
      state:
        policy.allowlistMode === "enforce"
          ? `Enforced, ${policy.allowlist.length} allowed`
          : "Off",
      href: `/app/${project.id}/policies`,
      detail: "Restricts which recipients a transaction may target.",
    },
    {
      label: "Live API keys",
      tone: liveKeys.length > 0 ? "warning" : "neutral",
      state: `${liveKeys.length} live, ${activeKeys.length} total`,
      href: `/app/${project.id}/api-keys`,
      detail: "Live keys act against mainnet. Rotate them regularly and revoke unused ones.",
    },
    {
      label: "Webhook endpoints",
      tone: webhooks.length > 0 ? "success" : "neutral",
      state: `${webhooks.length} configured`,
      href: `/app/${project.id}/webhooks`,
      detail: "Deliveries are signed so a receiver can verify authenticity.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Security</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">Posture</h1>
        </div>
        <StatusBadge tone="info">Enforcement at submit on the roadmap</StatusBadge>
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line">
        {items.map((item) => (
          <li key={item.label} className="bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-content">{item.label}</span>
                <StatusBadge tone={item.tone}>{item.state}</StatusBadge>
              </div>
              <Link
                href={item.href}
                className="text-xs font-medium text-content-brand hover:underline"
              >
                Manage
              </Link>
            </div>
            <p className="mt-1 text-sm text-content-secondary">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
