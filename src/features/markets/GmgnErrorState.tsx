import { ErrorState } from "@/components/common/ErrorState";
import { ApiError } from "@/lib/market/client";

/** Maps GMGN provider error codes to the exact required user-facing copy. */
export function GmgnErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const code = error instanceof ApiError ? error.code : null;

  if (code === "not_configured") {
    return (
      <ErrorState
        title="GMGN market data is not configured"
        message="GMGN market data is not configured. Add a valid GMGN API key to enable Robinhood Mainnet Trending and Hot Searches."
      />
    );
  }

  if (code === "rate_limited") {
    return (
      <ErrorState
        title="Rate limited"
        message="GMGN is temporarily rate-limiting requests. Cached data will remain visible where available."
        onRetry={onRetry}
      />
    );
  }

  return (
    <ErrorState
      title="Provider unavailable"
      message="Robinhood Mainnet market data is temporarily unavailable."
      onRetry={onRetry}
    />
  );
}
