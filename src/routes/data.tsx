import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { ErrorState } from "@/components/common/ErrorState";
import { CardSkeleton } from "@/components/common/Skeletons";
import { statusQuery } from "@/lib/market/client";
import { formatRelativeTime } from "@/lib/market/format";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Data sources & provider status | RobinPulse" },
      {
        name: "description",
        content:
          "Live status, capabilities and attribution for every market data provider powering RobinPulse.",
      },
      { property: "og:title", content: "Data sources & provider status" },
      {
        property: "og:description",
        content: "Live status and attribution for every market data provider.",
      },
    ],
  }),
  component: DataPage,
});

function DataPage() {
  const query = useQuery(statusQuery());
  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Transparency"
        title="Data sources"
        description="Every figure in this application comes from one of these providers. Nothing is generated, estimated or back-filled."
      />
      <div className="mt-6">
        {query.isPending ? (
          <CardSkeleton />
        ) : query.isError ? (
          <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(query.data?.providers ?? []).map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{p.label}</p>
                  <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {p.state.replace("_", " ")}
                  </span>
                </div>
                {p.detail ? <p className="mt-2 text-sm text-muted-foreground">{p.detail}</p> : null}
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  Last success: {p.lastSuccessAt ? formatRelativeTime(p.lastSuccessAt) : "none yet"}
                  {p.lastError ? ` · Last error: ${p.lastError}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{p.attribution}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
