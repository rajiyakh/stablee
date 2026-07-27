import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  feedFilters,
  feedSortOptions,
  type FeedFilterValue,
  type FeedSortValue,
} from "@/config/feed";

export function FeedFilters({
  active,
  onChange,
  className,
}: {
  active: FeedFilterValue;
  onChange: (value: FeedFilterValue) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {feedFilters.map((f) => (
        <Button
          key={f.value}
          type="button"
          size="sm"
          variant={active === f.value ? "secondary" : "outline"}
          className="h-7 px-2.5 text-xs"
          aria-pressed={active === f.value}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
}

export function FeedSortMenu({
  value,
  onChange,
  className,
}: {
  value: FeedSortValue;
  onChange: (value: FeedSortValue) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as FeedSortValue)}>
      <SelectTrigger className={cn("h-8 w-[168px] text-xs", className)} aria-label="Sort feed">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {feedSortOptions.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
