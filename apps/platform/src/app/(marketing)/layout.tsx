import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <SiteNav />
      {/* Clears the floating nav, which is fixed and out of flow. */}
      <main id="main" className="pt-20 lg:pt-24">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
