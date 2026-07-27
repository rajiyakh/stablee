import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DEFAULT_MARKET_FILTERS,
  MARKET_FILTER_DEFINITIONS,
  type MarketFilterState,
} from "@/config/marketFilters";

function countActive(filters: MarketFilterState): number {
  return Object.values(filters).filter((v) => v !== undefined && v !== false).length;
}

export function MarketFilters({
  scope,
  filters,
  onChange,
}: {
  scope: "trending" | "hot-searches";
  filters: MarketFilterState;
  onChange: (next: MarketFilterState) => void;
}) {
  const definitions = MARKET_FILTER_DEFINITIONS.filter((d) => d.appliesTo.includes(scope));
  const active = countActive(filters);

  const setField = <K extends keyof MarketFilterState>(key: K, value: MarketFilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="size-3.5" />
          Filters
          {active > 0 ? (
            <span className="ml-1 rounded-full bg-brand px-1.5 text-[10px] font-semibold text-brand-foreground">
              {active}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Filters</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange(DEFAULT_MARKET_FILTERS)}
          >
            Reset
          </Button>
        </div>
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {definitions.map((def) => {
            if (def.type === "boolean") {
              const checked = Boolean(filters[def.key]);
              return (
                <label
                  key={def.key}
                  className={`flex items-start gap-2 text-sm ${def.disabled ? "opacity-50" : ""}`}
                >
                  <Checkbox
                    checked={checked}
                    disabled={def.disabled}
                    onCheckedChange={(v) => setField(def.key, Boolean(v) as never)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-medium text-foreground">{def.label}</span>
                    <span className="block text-xs text-muted-foreground">{def.description}</span>
                  </span>
                </label>
              );
            }
            const raw = filters[def.key];
            return (
              <div key={def.key} className={def.disabled ? "opacity-50" : ""}>
                <Label className="text-xs text-muted-foreground">{def.label}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  disabled={def.disabled}
                  value={typeof raw === "number" ? raw : ""}
                  onChange={(e) => {
                    const parsed = e.target.value === "" ? undefined : Number(e.target.value);
                    setField(
                      def.key,
                      (parsed === undefined || Number.isNaN(parsed) ? undefined : parsed) as never,
                    );
                  }}
                  className="mt-1 h-8"
                />
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
