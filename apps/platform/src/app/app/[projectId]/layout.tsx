import { buildAppNavigation, isModuleEnabled } from "@hoodstack/config";
import { DEFAULT_CHAIN } from "@hoodstack/network";
import { notFound } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getProjectForMember } from "@/server/projects";

import { AppChrome, type NavSection } from "./_components/app-chrome";
import { SignedOut } from "../_components/signed-out";

/**
 * Authenticated application shell.
 *
 * This server layout gates the whole project subtree: it resolves the session
 * and confirms the caller belongs to the project, then hands the presentation to
 * AppChrome. The sidebar is generated from the module registry, so every module
 * is present from the first release and keeps its position permanently. Live
 * modules carry a marker; the rest open a preview of what is coming.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await getSessionUser();
  if (!session) return <SignedOut />;

  const project = await getProjectForMember(session.user.id, projectId);
  if (!project) notFound();

  const sections: NavSection[] = buildAppNavigation().map((section) => ({
    category: section.category,
    label: section.label,
    modules: section.modules.map((module) => ({
      id: module.id,
      name: module.name,
      href: module.appHref(projectId),
      live: isModuleEnabled(module.id),
    })),
  }));

  return (
    <AppChrome
      projectName={project.name}
      email={session.user.email}
      chainName={DEFAULT_CHAIN.name}
      isTestnet={DEFAULT_CHAIN.isTestnet}
      sections={sections}
    >
      {children}
    </AppChrome>
  );
}
