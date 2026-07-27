import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { CodeBlock } from "@/components/ui";

export const metadata: Metadata = { title: "Recipes" };
export const dynamic = "force-dynamic";

const RECIPES: { title: string; summary: string; code: string }[] = [
  {
    title: "Check a wallet's balance",
    summary: "Read native balance, nonce, and whether an address is a contract.",
    code: `const account = await hoodstack.data.account(address);
if (Number(account.balanceWei) === 0) {
  console.log("Empty wallet:", account.address);
}`,
  },
  {
    title: "Verify a token before you trust it",
    summary: "Read ERC-20 metadata by chain and address, never by ticker.",
    code: `const token = await hoodstack.data.token(tokenAddress);
console.log(token.name, token.symbol, token.decimals);
// Compare token.address against your Asset Registry entry.`,
  },
  {
    title: "Watch a transaction to confirmation",
    summary: "Poll a hash until it has a receipt, then read its status.",
    code: `let tx = await hoodstack.data.transaction(hash);
while (tx.found && tx.status === "pending") {
  await new Promise((r) => setTimeout(r, 2000));
  tx = await hoodstack.data.transaction(hash);
}
console.log(tx.status); // "success" | "reverted"`,
  },
  {
    title: "Simulate before you send",
    summary: "Dry-run a call and estimate gas without signing anything.",
    code: `const sim = await hoodstack.tx.simulate({
  to: recipient,
  valueWei: "1000000000000000",
});
if (!sim.success) throw new Error(sim.revertReason ?? "Would revert");
console.log("Estimated gas:", sim.gasEstimate);`,
  },
  {
    title: "Show current gas",
    summary: "Read the live gas price and a worked transfer cost.",
    code: `const gas = await hoodstack.gas();
console.log(\`\${gas.gasPriceGwei} gwei, transfer ~\${gas.transferCostFormatted}\`);`,
  },
];

const SETUP = `import { createClient } from "@hoodstack/sdk";
const hoodstack = createClient({ apiKey: process.env.HOODSTACK_API_KEY! });`;

/** The Recipes module: complete, working snippets over the shipped API. */
export default async function RecipesPage({
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
      <div className="mb-6">
        <p className="hs-mono-label mb-3">Recipes</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          Working examples
        </h1>
        <p className="mt-2 max-w-2xl text-content-secondary">
          Short, complete solutions over the shipped API. Each assumes the client below.
        </p>
      </div>

      <div className="mb-8 overflow-hidden rounded-card border border-line">
        <CodeBlock code={SETUP} label="setup" />
      </div>

      <div className="flex flex-col gap-8">
        {RECIPES.map((recipe) => (
          <section key={recipe.title}>
            <h2 className="text-md font-medium text-content">{recipe.title}</h2>
            <p className="mt-1 mb-3 max-w-2xl text-sm text-content-secondary">
              {recipe.summary}
            </p>
            <div className="overflow-hidden rounded-card border border-line">
              <CodeBlock code={recipe.code} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
