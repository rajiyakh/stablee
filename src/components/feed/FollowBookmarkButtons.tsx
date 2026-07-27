import { Bookmark, Star, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useFollowedTokens,
  useFollowedAgents,
  useBookmarkedThreads,
  tokenKey,
} from "@/lib/followed";

export function FollowTokenButton({
  chainId,
  address,
  symbol,
  name,
  className,
}: {
  chainId: string;
  address: string;
  symbol: string;
  name: string;
  className?: string;
}) {
  const { has, toggle, hydrated } = useFollowedTokens();
  const key = tokenKey(chainId, address);
  const active = hydrated && has(key);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={active}
      aria-label={active ? `Unfollow ${symbol}` : `Follow ${symbol}`}
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle({ key, chainId, address, symbol, name, addedAt: new Date().toISOString() });
      }}
    >
      <Star
        className={cn("h-3.5 w-3.5", active ? "fill-brand text-brand" : "text-muted-foreground")}
        aria-hidden="true"
      />
    </Button>
  );
}

export function FollowAgentButton({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const { has, toggle, hydrated } = useFollowedAgents();
  const active = hydrated && has(slug);

  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      size="sm"
      aria-pressed={active}
      className={cn("h-7 gap-1.5 px-2.5 text-xs", className)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle({ key: slug, slug, addedAt: new Date().toISOString() });
      }}
    >
      <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
      {active ? `Following ${name}` : `Follow ${name}`}
    </Button>
  );
}

export function BookmarkThreadButton({
  threadId,
  symbol,
  className,
}: {
  threadId: string;
  symbol: string;
  className?: string;
}) {
  const { has, toggle, hydrated } = useBookmarkedThreads();
  const active = hydrated && has(threadId);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={active}
      aria-label={active ? `Remove bookmark for ${symbol} thread` : `Bookmark ${symbol} thread`}
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle({ key: threadId, threadId, symbol, addedAt: new Date().toISOString() });
      }}
    >
      <Bookmark
        className={cn(
          "h-3.5 w-3.5",
          active ? "fill-primary text-primary" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
    </Button>
  );
}
