import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { listAccounts } from "@/server/accounts";
import { getProjectForMember } from "@/server/projects";

import { CodeBlock, Panel, StatusBadge } from "@/components/ui";

import { AccountsManager, type AccountView } from "./_components/accounts-manager";

export const metadata: Metadata = { title: "Accounts" };
export const dynamic = "force-dynamic";

/**
 * The Accounts module: a project account registry with live on-chain state.
 *
 * Track any address, a contract, a user wallet, a treasury, and monitor its
 * balance, nonce, and type through the same reads the Data API serves.
 * Smart-account creation and the user-operation lifecycle land here later.
 */
export default async function AccountsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const accounts = await listAccounts(session.user.id, projectId);
  const views: AccountView[] = accounts.map((account) => ({
    id: account.id,
    address: account.address,
    label: account.label,
  }));

  const curl = [
    "curl 'https://www.hoodstack.io/api/v1/data/account?address=0x…' \\",
    '  -H "Authorization: Bearer hs_test_your_key"',
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Accounts</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Account registry
          </h1>
        </div>
        <StatusBadge tone="info">Smart accounts on the roadmap</StatusBadge>
      </div>

      <AccountsManager projectId={project.id} accounts={views} />

      <section className="mt-12">
        <h2 className="text-md font-medium text-content">From the API</h2>
        <p className="mt-1 mb-4 max-w-2xl text-sm text-content-secondary">
          The same account state is available with a project API key.
        </p>
        <Panel className="p-0">
          <CodeBlock code={curl} label="Account read" />
        </Panel>
      </section>
    </div>
  );
}
