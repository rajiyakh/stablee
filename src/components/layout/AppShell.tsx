import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { MobileTabBar } from "./MobileTabBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="relative min-h-screen w-full">
        {/* Site-wide ambient backdrop — DOM-first + relative z-10 on the
            content below (not negative z-index) so it never risks painting
            behind an ancestor's own opaque background. Fixed to the
            viewport so it stays put while each page scrolls. */}
        <div
          className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-[0.8]"
          style={{ backgroundImage: "url(/backgrounds/app-shell-bg.webp)" }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex min-h-screen w-full flex-col">
          <SiteHeader />
          <main id="main-content" className="min-w-0 flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <SiteFooter />
        </div>
      </div>
      <MobileTabBar />
    </>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{children}</div>;
}
