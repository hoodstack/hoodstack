import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { CodeBlock, Panel } from "@/components/ui";

export const metadata: Metadata = { title: "SDKs" };
export const dynamic = "force-dynamic";

const INSTALL = "pnpm add @hoodstack/sdk";

const USAGE = `import { createClient } from "@hoodstack/sdk";

const hoodstack = createClient({ apiKey: process.env.HOODSTACK_API_KEY! });

// Typed reads, no hex or envelope handling.
const account = await hoodstack.data.account("0x…");
console.log(account.balanceFormatted, account.isContract);

const gas = await hoodstack.gas();
const sim = await hoodstack.tx.simulate({
  to: "0x…",
  valueWei: "1000000000000000",
});`;

const ERRORS = `import { isHoodStackError } from "@hoodstack/sdk";

try {
  await hoodstack.data.transaction(hash);
} catch (error) {
  if (isHoodStackError(error)) {
    error.code;      // e.g. "HS_INVALID_API_KEY"
    error.retryable; // whether retrying may help
    error.docsUrl;   // where to read more
  }
}`;

/**
 * The SDKs module: the typed TypeScript client over the live API. React and
 * server helpers build on the same core.
 */
export default async function SdksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">SDKs</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            TypeScript client
          </h1>
        </div>
        <a
          href="https://www.npmjs.com/package/@hoodstack/sdk"
          target="_blank"
          rel="noreferrer noopener"
          className="font-mono text-sm text-content-brand hover:underline"
        >
          @hoodstack/sdk on npm ↗
        </a>
      </div>

      <p className="mb-8 max-w-2xl text-content-secondary">
        A small, typed client over the HoodStack API. Create it with a project API key
        and call the reads and simulation with full types; the client handles auth, the
        response envelope, and typed errors. Its only requirement is <code className="font-mono">fetch</code>.
      </p>

      <section className="mb-8">
        <h2 className="text-md font-medium text-content">Install</h2>
        <Panel className="mt-3 p-0">
          <CodeBlock code={INSTALL} label="terminal" />
        </Panel>
      </section>

      <section className="mb-8">
        <h2 className="text-md font-medium text-content">Use</h2>
        <Panel className="mt-3 p-0">
          <CodeBlock code={USAGE} label="hoodstack.ts" />
        </Panel>
      </section>

      <section>
        <h2 className="text-md font-medium text-content">Errors</h2>
        <p className="mt-1 mb-3 max-w-2xl text-sm text-content-secondary">
          Every failure is a <code className="font-mono">HoodStackError</code> with a
          stable code, so you branch on the code rather than parsing strings.
        </p>
        <Panel className="p-0">
          <CodeBlock code={ERRORS} label="error handling" />
        </Panel>
      </section>
    </div>
  );
}
