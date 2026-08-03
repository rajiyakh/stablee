import type { ReactNode } from "react";

/**
 * Full-bleed photo backdrop for the top of a page — escapes PageContainer's
 * own padding (edge-to-edge within the sidebar's content area) via negative
 * margins, then restores that same padding for children so text still
 * aligns with the rest of the page. Fades to the page's own background
 * color at the bottom so normal card content below transitions naturally.
 */
export function PageHeroBackground({
  image,
  height = 420,
  children,
}: {
  image: string;
  height?: number;
  children: ReactNode;
}) {
  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
      <div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ height }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-background" />
      </div>
      <div className="relative z-10 px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
