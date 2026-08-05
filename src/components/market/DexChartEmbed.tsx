import { useTheme } from "@/hooks/useTheme";

interface DexChartEmbedProps {
  chainId: string;
  pairAddress: string;
  height?: number;
}

export function DexChartEmbed({ chainId, pairAddress, height = 480 }: DexChartEmbedProps) {
  const { theme } = useTheme();
  const src = `https://dexscreener.com/${encodeURIComponent(chainId)}/${encodeURIComponent(pairAddress)}?embed=1&theme=${theme}&trades=0&info=0`;

  return (
    <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-5">
      <h3 className="text-sm font-semibold text-foreground">Chart</h3>
      <iframe
        title="DEX Screener chart"
        src={src}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        className="mt-4 rounded-lg"
      />
      <p className="mt-3 text-xs text-muted-foreground">Chart by DEX Screener.</p>
    </div>
  );
}
