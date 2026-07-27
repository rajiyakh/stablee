import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartQuery } from "@/lib/market/client";
import { formatUsd } from "@/lib/market/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";

const ranges = [
  { value: "1", label: "24H" },
  { value: "7", label: "7D" },
  { value: "30", label: "30D" },
  { value: "90", label: "90D" },
  { value: "365", label: "1Y" },
] as const;

export function PriceChart({ coinId }: { coinId: string }) {
  const [days, setDays] = useState<string>("7");
  const query = useQuery(chartQuery(coinId, days));
  const points = query.data?.data ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Price history</h3>
        <div className="flex gap-1">
          {ranges.map((range) => (
            <Button
              key={range.value}
              size="sm"
              variant={days === range.value ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setDays(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-72">
        {query.isPending ? (
          <Skeleton className="h-full w-full" />
        ) : query.isError ? (
          <ErrorState
            message={(query.error as Error).message}
            onRetry={() => query.refetch()}
            className="h-full"
          />
        ) : points.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            CoinGecko returned no price history for this asset.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(t: number) =>
                  new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                }
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                dataKey="price"
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => formatUsd(v, { compact: true })}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <RechartsTooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
                formatter={(value: number) => [formatUsd(value), "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#priceFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Market data by CoinGecko. Points are provider-reported and never interpolated.
      </p>
    </div>
  );
}
