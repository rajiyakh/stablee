import { computeSwapFeeBps, FEE_BPS_DEFAULT, MIN_SWAP_USD_DEFAULT } from "./fees";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/** The bps actually used for outbound 0x requests — env-overridable, always clamped to the hardcoded FEE_BPS_MAX ceiling. */
export function serverFeeBps(): number {
  const raw = process.env.ROBINPULSE_SWAP_FEE_BPS;
  const parsed = raw ? Number(raw) : FEE_BPS_DEFAULT;
  return computeSwapFeeBps(Number.isFinite(parsed) ? parsed : FEE_BPS_DEFAULT);
}

export function serverMinSwapUsd(): number {
  const raw = process.env.ROBINPULSE_MINIMUM_SWAP_USD;
  const parsed = raw ? Number(raw) : MIN_SWAP_USD_DEFAULT;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : MIN_SWAP_USD_DEFAULT;
}

/**
 * The only source of truth for where fees are sent. Empty or malformed
 * env value returns null — callers must disable live swapping rather than
 * fall back to any other address (never a developer wallet, never generated).
 */
export function serverFeeRecipient(): string | null {
  const raw = (process.env.ROBINPULSE_FEE_RECIPIENT ?? "").trim();
  return EVM_ADDRESS_RE.test(raw) ? raw : null;
}
