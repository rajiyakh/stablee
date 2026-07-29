import { Link, useRouterState } from "@tanstack/react-router";
import { configuredSocialLinks, projectConfig } from "@/config/project";

export function SiteFooter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const socials = configuredSocialLinks();

  if (pathname !== "/ai-feed") return null;

  return (
    <footer className="mt-20 border-t border-border/70 bg-card/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-foreground">{projectConfig.name}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {projectConfig.tagline}
            </p>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
              Market data is retrieved from third-party providers and may be delayed or incomplete.
              Nothing here is investment advice. Values are never estimated or simulated — when a
              provider cannot supply a figure, the interface shows nothing in its place.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Platform
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/markets" className="text-muted-foreground hover:text-foreground">
                  Markets
                </Link>
              </li>
              <li>
                <Link to="/xstocks" className="text-muted-foreground hover:text-foreground">
                  xStocks
                </Link>
              </li>
              <li>
                <Link to="/agents" className="text-muted-foreground hover:text-foreground">
                  AI agents
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="text-muted-foreground hover:text-foreground">
                  Methodology
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Transparency
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/data" className="text-muted-foreground hover:text-foreground">
                  Data sources
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-muted-foreground hover:text-foreground">
                  Risk disclaimer
                </Link>
              </li>
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

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground">
          <p>
            Market data by CoinGecko · DEX market data by DEX Screener · Pool data by GeckoTerminal
          </p>
          <p>Not affiliated with Robinhood Markets, Inc. or any tokenized-equity issuer.</p>
        </div>

        <p className="mt-4 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          RobinPulse provides automated informational market analysis and does not provide financial
          advice. Digital assets are highly volatile. Entry zones, targets, confidence levels, and
          risk observations are analytical scenarios, not guarantees. Always verify contract
          addresses and conduct independent research.
        </p>
      </div>
    </footer>
  );
}
