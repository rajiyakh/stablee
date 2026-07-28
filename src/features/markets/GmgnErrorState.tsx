import { ErrorState } from "@/components/common/ErrorState";
import { ApiError } from "@/lib/market/client";

/** Maps GMGN provider error codes to the exact required user-facing copy. */
export function GmgnErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const code = error instanceof ApiError ? error.code : null;

  if (code === "not_configured") {
    return (
      <ErrorState
        title="Market data is not configured"
        message="Robinhood Mainnet Trending and Hot Searches are not yet configured for this deployment."
      />
    );
  }

  if (code === "rate_limited") {
    return (
      <ErrorState
        title="Rate limited"
        message="The data provider is temporarily rate-limiting requests. Cached data will remain visible where available."
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
