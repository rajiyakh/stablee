import { isClaimLive, tgeConfig } from "@/config/tge";
import { isPulseClaimConfigured } from "@/config/contracts";

export type ClaimButtonState =
  | "tge-not-live"
  | "distribution-pending"
  | "claim-not-enabled"
  | "connect-wallet"
  | "wrong-network"
  | "nothing-to-claim"
  | "claim-ready"
  | "claiming"
  | "claimed";

export const CLAIM_BUTTON_LABEL: Record<ClaimButtonState, string> = {
  "tge-not-live": "TGE Not Live",
  "distribution-pending": "Distribution Pending",
  "claim-not-enabled": "Claim Not Enabled",
  "connect-wallet": "Connect Wallet",
  "wrong-network": "Wrong Network",
  "nothing-to-claim": "Nothing to Claim",
  "claim-ready": "Claim $ORCA",
  claiming: "Claiming",
  claimed: "Claimed",
};

export function deriveClaimButtonState(input: {
  isWalletConnected: boolean;
  isWrongNetwork: boolean;
  pendingAmount: string;
  isClaiming: boolean;
  justClaimed: boolean;
}): ClaimButtonState {
  if (input.justClaimed) return "claimed";
  if (input.isClaiming) return "claiming";
  if (tgeConfig.distributionMode === "manual-distribution") return "distribution-pending";
  if (!isClaimLive()) return "tge-not-live";
  if (!isPulseClaimConfigured()) return "claim-not-enabled";
  if (!input.isWalletConnected) return "connect-wallet";
  if (input.isWrongNetwork) return "wrong-network";
  if (Number(input.pendingAmount) <= 0) return "nothing-to-claim";
  return "claim-ready";
}
