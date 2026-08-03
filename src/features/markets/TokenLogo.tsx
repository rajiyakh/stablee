import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Token logo with a graceful fallback to symbol initials — used both when
 * `logoUrl` is absent AND when the hotlinked image fails to load (some
 * GMGN-sourced token logo hosts send a Cross-Origin-Resource-Policy header
 * that blocks the cross-origin <img> request, e.g. net::ERR_BLOCKED_BY_
 * RESPONSE.NotSameOrigin — without onError this rendered a broken-image icon).
 */
export function TokenLogo({
  logoUrl,
  symbol,
  size,
  sizeClassName,
  textClassName,
}: {
  logoUrl?: string;
  symbol: string;
  /** Intrinsic pixel size for the <img> width/height attrs (prevents layout shift). */
  size: number;
  sizeClassName: string;
  textClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={cn("rounded-full border border-border object-cover", sizeClassName)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-border bg-muted font-semibold",
        sizeClassName,
        textClassName,
      )}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}
