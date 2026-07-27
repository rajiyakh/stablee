import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWatchlist, watchKey, type WatchEntry } from "@/lib/watchlist";

export function WatchButton({
  entry,
  className,
}: {
  entry: Omit<WatchEntry, "key" | "addedAt">;
  className?: string;
}) {
  const { has, toggle, hydrated } = useWatchlist();
  const active = hydrated && has(watchKey(entry));

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={active}
      aria-label={
        active ? `Remove ${entry.symbol} from watchlist` : `Add ${entry.symbol} to watchlist`
      }
      className={cn("h-8 w-8", className)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(entry);
      }}
    >
      <Star
        className={cn("h-4 w-4", active ? "fill-brand text-brand" : "text-muted-foreground")}
        aria-hidden="true"
      />
    </Button>
  );
}
