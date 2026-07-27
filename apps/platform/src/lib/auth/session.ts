import "server-only";

import {
  and,
  eq,
  getDb,
  memberships,
  organizations,
  users,
  type Organization,
  type User,
} from "@hoodstack/db";
import { cookies, headers } from "next/headers";
import { cache } from "react";

import { getPrivyClient, PRIVY_TOKEN_COOKIE } from "./privy";

/**
 * The signed-in user, resolved from Privy and mapped onto our own records.
 *
 * `user` is the HoodStack row (not the Privy object); `defaultOrg` is the org
 * the dashboard opens into. Provisioning guarantees every user has at least one.
 */
export type SessionUser = {
  user: User;
  defaultOrg: Organization;
};

type PrivyIdentity = { privyDid: string; email: string | null };

function bearerToken(headerList: Headers): string | null {
  const auth = headerList.get("authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * Verify the caller's Privy token and return their identity, or null.
 *
 * The token comes from the SSR cookie the Privy browser SDK sets, falling back
 * to an `Authorization: Bearer` header for programmatic callers. Verification is
 * cryptographic (Privy's JWKS); a failure returns null rather than throwing, so
 * callers treat "no valid session" uniformly.
 */
async function getPrivyIdentity(): Promise<PrivyIdentity | null> {
  const cookieStore = await cookies();
  const headerList = await headers();
  const token = cookieStore.get(PRIVY_TOKEN_COOKIE)?.value ?? bearerToken(headerList);
  if (!token) return null;

  try {
    const privy = getPrivyClient();
    const claims = await privy.verifyAuthToken(token);
    const account = await privy.getUser(claims.userId);
    const email = account.email?.address ?? null;
    return { privyDid: claims.userId, email };
  } catch {
    return null;
  }
}

/** Turn a display name or email into a URL-safe, reasonably unique org slug. */
function slugify(seed: string): string {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "team"}-${suffix}`;
}

function personalOrgName(user: Pick<User, "email">): string {
  const handle = user.email ? user.email.split("@")[0]! : "My workspace";
  return `${handle}'s team`;
}

/** The org the dashboard opens into: the user's earliest-joined org, if any. */
async function defaultOrgFor(userId: string): Promise<Organization | undefined> {
  const rows = await getDb()
    .select({ org: organizations })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.orgId, organizations.id))
    .where(eq(memberships.userId, userId))
    .orderBy(organizations.createdAt)
    .limit(1);
  return rows[0]?.org;
}

/** Create a personal org and owner membership for a user, atomically. */
async function createPersonalOrg(user: User): Promise<Organization> {
  return getDb().transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name: personalOrgName(user), slug: slugify(user.email ?? "team") })
      .returning();
    await tx.insert(memberships).values({ orgId: org!.id, userId: user.id, role: "owner" });
    return org!;
  });
}

/**
 * Find the HoodStack user for a Privy identity, creating one on first sight.
 *
 * The user row is upserted idempotently on `privyDid`, so concurrent first
 * requests cannot create duplicate accounts. The personal org is then created
 * only if the user has none, which also self-heals any user left without one.
 */
async function findOrProvision(identity: PrivyIdentity): Promise<SessionUser> {
  const db = getDb();

  await db
    .insert(users)
    .values({ privyDid: identity.privyDid, email: identity.email })
    .onConflictDoNothing({ target: users.privyDid });

  const user = await db.query.users.findFirst({
    where: eq(users.privyDid, identity.privyDid),
  });
  if (!user) throw new Error("User provisioning failed");

  const org = (await defaultOrgFor(user.id)) ?? (await createPersonalOrg(user));
  return { user, defaultOrg: org };
}

/**
 * The current session, or null if the caller is not signed in.
 *
 * Wrapped in React `cache` so multiple callers in one request, a layout and the
 * page it wraps, say, share a single Privy verification and provisioning pass.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const identity = await getPrivyIdentity();
  if (!identity) return null;
  return findOrProvision(identity);
});

/**
 * The current session, or throw. Use in server actions and gateway-adjacent
 * code where an unauthenticated caller is an authorization error.
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) throw new Error("Not authenticated");
  return session;
}

/**
 * The user's membership in an org, or null. The single chokepoint every
 * project/key query passes through so no request reaches another org's data.
 */
export async function orgMembership(userId: string, orgId: string) {
  return getDb().query.memberships.findFirst({
    where: and(eq(memberships.userId, userId), eq(memberships.orgId, orgId)),
  });
}
