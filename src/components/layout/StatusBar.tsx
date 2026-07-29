import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { statusQuery } from "@/lib/market/client";
import { cn } from "@/lib/utils";

const stateLabel: Record<string, string> = {
  live: "Live",
  delayed: "Delayed",
  unavailable: "Unavailable",
  not_configured: "Not configured",
};

const stateDot: Record<string, string> = {
  live: "bg-positive",
  delayed: "bg-warning",
  unavailable: "bg-negative",
  not_configured: "bg-muted-foreground/50",
};

export function StatusBar() {
  const { data } = useQuery(statusQuery());
  const providers = data?.providers ?? [];

  if (!providers.length) return null;

  return (
    <div className="border-b border-border/60 bg-card/50">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 text-xs text-muted-foreground sm:px-6 lg:px-8">
        <span className="font-medium uppercase tracking-[0.16em]">Data providers</span>
        {providers.map((provider) => (
          <span key={provider.id} className="inline-flex items-center gap-1.5">
            <span
              className={cn("h-1.5 w-1.5 rounded-full", stateDot[provider.state])}
              aria-hidden="true"
            />
            <span>{provider.label}</span>
            <span className="opacity-70">{stateLabel[provider.state]}</span>
          </span>
        ))}
        <Link to="/app/data" className="ml-auto font-medium text-foreground hover:underline">
          Details
        </Link>
      </div>
    </div>
  );
}
