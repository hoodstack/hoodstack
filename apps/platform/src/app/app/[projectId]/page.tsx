import { redirect } from "next/navigation";

/** A bare project route resolves to its overview. */
export default async function ProjectIndex({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/app/${encodeURIComponent(projectId)}/overview`);
}
