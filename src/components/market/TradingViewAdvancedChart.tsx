import { useEffect, useRef } from "react";

interface TradingViewAdvancedChartProps {
  symbol: string;
  height?: number;
}

export function TradingViewAdvancedChart({ symbol, height = 480 }: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbol,
      autosize: true,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      hide_top_toolbar: false,
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground">Chart — {symbol}</h3>
      <div className="tradingview-widget-container mt-4" style={{ height }} ref={containerRef} />
      <p className="mt-3 text-xs text-muted-foreground">
        Chart by TradingView, showing the underlying listed stock this xStock tracks.
      </p>
    </div>
  );
}
