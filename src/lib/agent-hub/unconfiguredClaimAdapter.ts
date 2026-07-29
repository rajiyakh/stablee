import { CONTRACTS_NOT_CONFIGURED_MESSAGE, isPulseClaimConfigured } from "@/config/contracts";
import { isClaimLive, MANUAL_DISTRIBUTION_MESSAGE, tgeConfig } from "@/config/tge";
import type { PreparedClaim, PulseClaimAdapter, PulseClaimStatus } from "./types";

/**
 * Not-configured stub for PulseClaimAdapter. Never returns a claimable
 * amount or a successful claim before TGE + a real claim contract (or the
 * manual-distribution process) are both in place.
 */
export const unconfiguredClaimAdapter: PulseClaimAdapter = {
  async getClaimStatus(_wallet: string): Promise<PulseClaimStatus> {
    if (tgeConfig.distributionMode === "manual-distribution") {
      return { configured: false, claimLive: false, message: MANUAL_DISTRIBUTION_MESSAGE };
    }
    const configured = isPulseClaimConfigured();
    return {
      configured,
      claimLive: configured && isClaimLive(),
      message: configured ? "Configured" : CONTRACTS_NOT_CONFIGURED_MESSAGE,
    };
  },

  async getClaimableAmount(_wallet: string): Promise<string> {
    return "0";
  },

  async prepareClaim(_wallet: string): Promise<PreparedClaim> {
    return {
      configured: false,
      message:
        tgeConfig.distributionMode === "manual-distribution"
          ? MANUAL_DISTRIBUTION_MESSAGE
          : CONTRACTS_NOT_CONFIGURED_MESSAGE,
    };
  },
};
