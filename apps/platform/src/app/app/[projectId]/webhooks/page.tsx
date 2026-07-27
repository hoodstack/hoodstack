import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";
import { listWebhooks } from "@/server/webhooks";

import { CodeBlock, Panel, StatusBadge } from "@/components/ui";

import { WebhooksManager, type EndpointView } from "./_components/webhooks-manager";

export const metadata: Metadata = { title: "Webhooks" };
export const dynamic = "force-dynamic";

/**
 * The Webhooks module: register signed endpoints and verify delivery with a test
 * event. Automatic delivery of your chosen events, with retries and a delivery
 * log, lands with the delivery worker.
 */
export default async function WebhooksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) notFound();
  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const endpoints = await listWebhooks(session.user.id, projectId);
  const views: EndpointView[] = endpoints.map((endpoint) => ({
    id: endpoint.id,
    url: endpoint.url,
    secret: endpoint.secret,
  }));

  const verify = `import { createHmac, timingSafeEqual } from "node:crypto";

// Verify a HoodStack webhook signature.
function verify(rawBody, headers, secret) {
  const timestamp = headers["x-hoodstack-timestamp"];
  const signature = headers["x-hoodstack-signature"].replace("sha256=", "");
  const expected = createHmac("sha256", secret)
    .update(\`\${timestamp}.\${rawBody}\`)
    .digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div>
          <p className="hs-mono-label mb-3">Webhooks</p>
          <h1 className="text-2xl font-semibold tracking-tight text-content">Endpoints</h1>
        </div>
        <StatusBadge tone="info">Automatic delivery on the roadmap</StatusBadge>
      </div>

      <WebhooksManager projectId={project.id} endpoints={views} />

      <section className="mt-12">
        <h2 className="text-md font-medium text-content">Verifying signatures</h2>
        <p className="mt-1 mb-4 max-w-2xl text-sm text-content-secondary">
          Every delivery carries <code className="font-mono">x-hoodstack-signature</code>{" "}
          and <code className="font-mono">x-hoodstack-timestamp</code>. Recompute the HMAC
          over <code className="font-mono">timestamp.body</code> with your secret and
          compare in constant time.
        </p>
        <Panel className="p-0">
          <CodeBlock code={verify} label="verify.ts" />
        </Panel>
      </section>
    </div>
  );
}
