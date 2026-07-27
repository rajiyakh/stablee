export function formatUsd(value: number | null | undefined, opts?: { compact?: boolean }): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (opts?.compact && abs >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }
  const digits = abs === 0 ? 2 : abs < 0.000001 ? 10 : abs < 0.01 ? 6 : abs < 1 ? 4 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, compact = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : 0,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function changeTone(value: number | null | undefined): "positive" | "negative" | "muted" {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0)
    return "muted";
  return value > 0 ? "positive" : "negative";
}

export function shortenAddress(address: string | null | undefined, size = 4): string {
  if (!address) return "—";
  if (address.length <= size * 2 + 3) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function formatAge(timestampMs: number | null | undefined): string {
  if (!timestampMs || !Number.isFinite(timestampMs)) return "—";
  const diff = Date.now() - timestampMs;
  if (diff < 0) return "—";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 365) return `${days}d`;
  return `${Math.floor(days / 365)}y`;
}

/** Seconds-granular pair age for the Markets table: 45s / 8m / 2h / 3d. */
export function formatPairAge(ageSeconds: number | null | undefined): string {
  if (
    ageSeconds === null ||
    ageSeconds === undefined ||
    !Number.isFinite(ageSeconds) ||
    ageSeconds < 0
  )
    return "—";
  if (ageSeconds < 60) return `${Math.floor(ageSeconds)}s`;
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return "never";
  const seconds = Math.round((Date.now() - date) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Basic contract-address validation across common address shapes. */
export function isPlausibleContractAddress(value: string): boolean {
  const v = value.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return true; // EVM
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)) return true; // base58
  return false;
}

export function sanitizeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Tailwind class for a change value, using semantic tokens only. */
export function changeClass(value: number | null | undefined): string {
  const tone = changeTone(value);
  if (tone === "positive") return "text-positive";
  if (tone === "negative") return "text-negative";
  return "text-muted-foreground";
}

export function formatCompactUsd(value: number | null | undefined): string {
  return formatUsd(value, { compact: true });
}

export function formatRelativeTime(iso: string | null | undefined): string {
  return relativeTime(iso);
}
