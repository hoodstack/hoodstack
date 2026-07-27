import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** A bare project route opens on its home. */
export default async function ProjectIndex({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/app/${projectId}/overview`);
}
