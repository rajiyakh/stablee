import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/market/format";

export function DataSourceNote({
  source,
  fetchedAt,
  stale,
  className,
}: {
  source: string;
  fetchedAt?: string | null;
  stale?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Source: {source}
      {fetchedAt ? ` · updated ${formatRelativeTime(fetchedAt)}` : ""}
      {stale ? " · showing last successful response" : ""}
    </p>
  );
}
