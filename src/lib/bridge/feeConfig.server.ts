import { computeBridgeFeeBps, BRIDGE_FEE_BPS_DEFAULT } from "./fee";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/** The bps actually used for outbound provider fee requests — env-overridable, always clamped to BRIDGE_FEE_BPS_MAX. */
export function bridgeFeeBps(): number {
  const raw = process.env.BRIDGE_PLATFORM_FEE_BPS;
  const parsed = raw ? Number(raw) : BRIDGE_FEE_BPS_DEFAULT;
  return computeBridgeFeeBps(Number.isFinite(parsed) ? parsed : BRIDGE_FEE_BPS_DEFAULT);
}

/**
 * The only source of truth for the bridge fee treasury. Empty or malformed
 * env value returns null — callers must disable live bridging rather than
 * fall back to any other address (never a developer wallet, never generated).
 */
export function bridgeTreasuryAddress(): string | null {
  const raw = (process.env.ROBINPULSE_TREASURY_ADDRESS ?? "").trim();
  return EVM_ADDRESS_RE.test(raw) ? raw : null;
}
