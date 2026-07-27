import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { CodeBlock, Panel } from "@/components/ui";

export const metadata: Metadata = { title: "CLI" };
export const dynamic = "force-dynamic";

const INSTALL = "pnpm add -g @hoodstack/cli";

const USAGE = `export HOODSTACK_API_KEY=hs_test_your_key

hoodstack health
hoodstack account 0x0000000000000000000000000000000000000000
hoodstack gas
hoodstack token 0xTOKEN 0xHOLDER
hoodstack tx 0xHASH
hoodstack block latest
hoodstack simulate --to 0xRECIPIENT --value 1000000000000000`;

/**
 * The CLI module: the terminal client. It wraps the same API the SDK does, so
 * every command is a real, authenticated call.
 */
export default async function CliPage({
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
          <p className="hs-mono-label mb-3">CLI</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            The terminal client
          </h1>
        </div>
        <a
          href="https://www.npmjs.com/package/@hoodstack/cli"
          target="_blank"
          rel="noreferrer noopener"
          className="font-mono text-sm text-content-brand hover:underline"
        >
          @hoodstack/cli on npm ↗
        </a>
      </div>

      <p className="mb-8 max-w-2xl text-content-secondary">
        Query Robinhood Chain and your project from a terminal. Every command reads your
        key from <code className="font-mono">HOODSTACK_API_KEY</code> (or{" "}
        <code className="font-mono">--key</code>) and prints JSON.
      </p>

      <section className="mb-8">
        <h2 className="text-md font-medium text-content">Install</h2>
        <Panel className="mt-3 p-0">
          <CodeBlock code={INSTALL} label="terminal" />
        </Panel>
      </section>

      <section>
        <h2 className="text-md font-medium text-content">Commands</h2>
        <Panel className="mt-3 p-0">
          <CodeBlock code={USAGE} label="terminal" />
        </Panel>
      </section>
    </div>
  );
}
