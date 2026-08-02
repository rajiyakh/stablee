import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deriveSentiment } from "@/lib/market/format";
import { cn } from "@/lib/utils";

const toneClass: Record<ReturnType<typeof deriveSentiment>, string> = {
  bullish: "bg-positive/10 text-positive",
  bearish: "bg-negative/10 text-negative",
  neutral: "bg-muted text-muted-foreground",
};

const label: Record<ReturnType<typeof deriveSentiment>, string> = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
};

export function SentimentBadge({
  priceChange24h,
  className,
}: {
  priceChange24h: number | null | undefined;
  className?: string;
}) {
  const sentiment = deriveSentiment(priceChange24h);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
            toneClass[sentiment],
            className,
          )}
        >
          {label[sentiment]}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>Based on 24h price move. Not a prediction or financial advice.</p>
      </TooltipContent>
    </Tooltip>
  );
}
