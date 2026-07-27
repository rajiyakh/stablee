import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { tokenConfig, hasTokenUpdatesChannel, primaryTokenUpdatesUrl } from "@/config/token";

export const Route = createFileRoute("/token/")({
  head: () => ({
    meta: [
      { title: "Token — RobinPulse Protocol Token | RobinPulse AI" },
      {
        name: "description",
        content:
          "The RobinPulse protocol token has not launched. This page explains its potential future utility. No contract, price, or launch date has been announced.",
      },
      { property: "og:title", content: "The RobinPulse Protocol Token Is Coming" },
      {
        property: "og:description",
        content:
          "A future utility layer designed to connect AI market intelligence, community participation, platform access, and protocol incentives.",
      },
    ],
  }),
  component: TokenPage,
});

function ProtocolIllustration() {
  return (
    <svg
      viewBox="0 0 320 220"
      role="presentation"
      aria-hidden="true"
      className="h-full w-full max-w-md"
    >
      <g stroke="var(--color-primary)" strokeOpacity="0.35" strokeWidth="1.2" fill="none">
        <path d="M40 170 L120 90 L200 130 L280 50" />
        <path d="M40 170 L100 40" />
        <path d="M120 90 L200 40" />
        <path d="M200 130 L120 190" />
      </g>
      <g fill="var(--color-brand)">
        <circle cx="40" cy="170" r="5" opacity="0.9" />
        <circle cx="120" cy="90" r="7" opacity="0.9" />
        <circle cx="200" cy="130" r="5" opacity="0.9" />
        <circle cx="280" cy="50" r="6" opacity="0.9" />
        <circle cx="100" cy="40" r="4" opacity="0.7" />
        <circle cx="200" cy="40" r="4" opacity="0.7" />
        <circle cx="120" cy="190" r="4" opacity="0.7" />
      </g>
      <circle
        cx="120"
        cy="90"
        r="16"
        stroke="var(--color-primary)"
        strokeOpacity="0.25"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function TokenPage() {
  const updatesConfigured = hasTokenUpdatesChannel();
  const updatesUrl = primaryTokenUpdatesUrl();

  const statusLabel =
    tokenConfig.status === "coming-soon"
      ? "Coming Soon"
      : tokenConfig.status === "announced"
        ? "Announced"
        : "Launched";

  const statusRows: Array<{ label: string; value: string; href?: string }> = [
    { label: "Status", value: statusLabel },
    { label: "Token name", value: tokenConfig.tokenName || "To be announced" },
    { label: "Symbol", value: tokenConfig.tokenSymbol || "To be announced" },
    { label: "Network", value: tokenConfig.chainId || "To be announced" },
    { label: "Contract", value: tokenConfig.contractAddress || "Not deployed" },
    { label: "Launch date", value: tokenConfig.launchDate || "To be announced" },
    {
      label: "Tokenomics",
      value: tokenConfig.tokenomicsUrl ? "View tokenomics" : "To be announced",
      href: tokenConfig.tokenomicsUrl || undefined,
    },
    {
      label: "Documentation",
      value: tokenConfig.documentationUrl ? "View documentation" : "To be announced",
      href: tokenConfig.documentationUrl || undefined,
    },
  ];

  const updateLinks = [
    { label: "Announcement", url: tokenConfig.announcementUrl },
    { label: "X", url: tokenConfig.socialLinks.x },
    { label: "Discord", url: tokenConfig.socialLinks.discord },
    { label: "Telegram", url: tokenConfig.socialLinks.telegram },
  ].filter((link) => Boolean(link.url));

  return (
    <PageContainer>
      <section className="grid gap-8 rounded-2xl border border-border bg-card px-6 py-14 sm:px-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <Badge variant="secondary" className="rounded-full">
            Coming Soon
          </Badge>
          <h1 className="mt-5 max-w-xl font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            {tokenConfig.headline}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            {tokenConfig.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/">
                Explore RobinPulse
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            {updatesConfigured && updatesUrl ? (
              <Button asChild size="lg" variant="outline">
                <a href={updatesUrl} target="_blank" rel="noopener noreferrer">
                  Follow Updates
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-center py-4">
          <ProtocolIllustration />
        </div>
      </section>

      <section className="mt-16 max-w-3xl">
        <SectionHeading eyebrow="Rationale" title="Why a Protocol Token" />
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          RobinPulse AI is evaluating a future protocol token as a way to connect several parts of
          the platform that today operate independently: AI-driven market intelligence, user
          participation, platform access, incentive design, governance, and data services. A token
          is one possible mechanism to align these pieces — it is not a promise of price
          performance, and no utility described on this page is guaranteed. Final protocol design,
          if any, will be announced through official RobinPulse channels only.
        </p>
      </section>

      <section className="mt-16">
        <SectionHeading
          eyebrow="Proposed"
          title="Potential Utility"
          description="Subject to final protocol design. Nothing below is guaranteed or currently active."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tokenConfig.utilities.map((utility) => (
            <div key={utility} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium text-foreground">{utility}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Planned — details will be announced later.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <SectionHeading eyebrow="Status" title="Launch Status" />
        <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {statusRows.map((row) => (
            <div key={row.label} className="bg-card p-5">
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-2 text-sm font-semibold text-foreground">
                {row.href ? (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16 max-w-3xl rounded-xl border border-warning/40 bg-warning/10 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Safety notice</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              No official RobinPulse protocol token contract has been announced yet. Always verify
              future contract addresses through official RobinPulse channels. Ignore unofficial
              tokens, links, and private messages claiming to represent the protocol.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 mb-4 max-w-3xl">
        <SectionHeading eyebrow="Stay informed" title="Updates" />
        {updateLinks.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-3">
            {updateLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Official token updates will be published through verified RobinPulse channels.
          </p>
        )}
        <div className="mt-6 flex max-w-md flex-wrap items-center gap-2">
          <label htmlFor="token-updates-email" className="sr-only">
            Email address
          </label>
          <Input
            id="token-updates-email"
            type="email"
            placeholder="Email subscription unavailable"
            disabled
            className="flex-1"
          />
          <Button type="button" disabled variant="outline">
            Unavailable
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}
