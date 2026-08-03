import type { BridgeStatusState } from "./types";

/**
 * Each provider reports status in its own vocabulary. This maps a
 * normalized (providerCategory, providerSubstatus) pair into the app's
 * shared BridgeStatusState. The hard rule the whole app depends on: never
 * "completed" without the destination leg actually being confirmed by the
 * provider — a source-chain confirmation alone is "bridging" or
 * "destination_pending", never "completed".
 */
export interface ProviderStatusInput {
  /** Coarse category the provider's own status maps to. */
  category:
    | "pending"
    | "source_confirmed"
    | "bridging"
    | "destination_confirmed"
    | "failed"
    | "refund_pending"
    | "refunded";
  /** true only when the provider's own API reports the destination-chain leg settled. */
  destinationConfirmed: boolean;
}

export function mapProviderStatus(input: ProviderStatusInput): BridgeStatusState {
  if (input.category === "refunded") return "refunded";
  if (input.category === "refund_pending") return "refund_required";
  if (input.category === "failed") return "failed";

  // Destination confirmation is required for "completed" regardless of what
  // category the provider reports — a provider that says "completed" but
  // hasn't actually confirmed the destination leg is treated as still bridging.
  if (input.category === "destination_confirmed" && input.destinationConfirmed) {
    return "completed";
  }

  if (input.category === "bridging" || input.category === "destination_confirmed") {
    return "destination_pending";
  }

  if (input.category === "source_confirmed") return "bridging";

  return "submitted";
}
