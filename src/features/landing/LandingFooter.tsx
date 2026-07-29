import { Link } from "@tanstack/react-router";
import { AnimatedPulseLogo } from "@/components/branding/AnimatedPulseLogo";
import { configuredSocialLinks } from "@/config/project";

const platformLinks = [
  { to: "/app" as const, label: "Overview" },
  { to: "/app/markets" as const, label: "Markets" },
  { to: "/app/swap" as const, label: "Swap" },
  { to: "/app/portfolio" as const, label: "Portfolio" },
];

const transparencyLinks = [
  { to: "/app/data" as const, label: "Data sources" },
  { to: "/app/disclaimer" as const, label: "Risk disclaimer" },
  { to: "/app/methodology" as const, label: "Methodology" },
];

export function LandingFooter() {
  const socials = configuredSocialLinks();

  return (
    <footer className="border-t border-border/70 bg-card/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <AnimatedPulseLogo size={22} />
              <span className="text-sm font-semibold text-foreground">RobinPulse</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              The intelligence layer of Robinhood Mainnet — AI market analysis, live analytics, and
              native trading in one platform.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Platform
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {platformLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Transparency
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {transparencyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
              {socials.map((social) => (
                <li key={social.key}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/70 pt-6 text-xs text-muted-foreground">
          Not affiliated with Robinhood Markets, Inc. Market data is supplied by third-party
          providers and may be delayed or incomplete. Nothing on this site is investment advice.
        </div>
      </div>
    </footer>
  );
}
