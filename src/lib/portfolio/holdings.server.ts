import { formatUnits } from "viem";
import { robinhoodChainFacts } from "@/config/robinhoodChain";
import { NATIVE_SENTINEL } from "@/config/swapTokens";
import type { PortfolioData, PortfolioHolding } from "./client";
import {
  blockscoutConfigured,
  fetchAddressOverview,
  fetchAddressTokenBalances,
} from "./blockscout.server";

function parseNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Confirmed live against a real wallet: an airdropped token named
// "rh-compliance.xyz | TRM LABS ALERT: ... assets TEMPORARILY FROZEN ...
// Verify at rh-compliance.xyz within 72h ..." — a phishing payload disguised
// as a token name, with Blockscout's own reputation field reporting "ok" for
// it (their reputation system flags known scam contracts, not deceptive
// metadata). No real token name/symbol is anywhere near this long, so a hard
// length cap neutralizes the payload regardless of wording, and anything
// past the threshold is independently flagged — never trusting Blockscout's
// reputation field alone to catch this class of attack.
const MAX_NAME_LENGTH = 40;
const MAX_SYMBOL_LENGTH = 15;

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}…` : value;
}

/**
 * Combines Blockscout's two address endpoints into one normalized,
 * value-sorted holdings list. Every token the account actually holds is
 * included — nothing is hidden for looking unfamiliar or being "dust"; a
 * token is flagged (never dropped) when Blockscout didn't mark its
 * reputation "ok" OR when its raw name/symbol is abnormally long (see
 * MAX_NAME_LENGTH above) — matching how the swap picker treats unverified
 * tokens elsewhere in this app.
 */
export async function fetchPortfolio(address: string): Promise<PortfolioData> {
  if (!blockscoutConfigured() || !robinhoodChainFacts) {
    throw new Error("fetchPortfolio called without a configured Blockscout explorer");
  }

  const [overview, tokenBalances] = await Promise.all([
    fetchAddressOverview(address),
    fetchAddressTokenBalances(address),
  ]);

  const holdings: PortfolioHolding[] = [];

  const nativeBalance = overview.data.coin_balance;
  if (nativeBalance && nativeBalance !== "0") {
    const priceUsd = parseNumber(overview.data.exchange_rate);
    const decimals = 18;
    const balanceFormatted = formatUnits(BigInt(nativeBalance), decimals);
    holdings.push({
      address: NATIVE_SENTINEL,
      symbol: robinhoodChainFacts.nativeCurrency.symbol,
      name: robinhoodChainFacts.nativeCurrency.name,
      decimals,
      logoUrl: null,
      balance: nativeBalance,
      balanceFormatted,
      priceUsd,
      valueUsd: priceUsd !== null ? Number(balanceFormatted) * priceUsd : null,
      isNative: true,
      flagged: false,
    });
  }

  for (const entry of tokenBalances.data) {
    if (!entry.value || entry.value === "0") continue;
    const decimals = parseNumber(entry.token.decimals);
    if (decimals === null || !entry.token.symbol) continue; // never guess decimals or a symbol

    const priceUsd = parseNumber(entry.token.exchange_rate);
    const balanceFormatted = formatUnits(BigInt(entry.value), decimals);
    const rawName = entry.token.name ?? entry.token.symbol;
    const abnormalMetadata =
      rawName.length > MAX_NAME_LENGTH || entry.token.symbol.length > MAX_SYMBOL_LENGTH;
    holdings.push({
      address: entry.token.address_hash,
      symbol: truncate(entry.token.symbol, MAX_SYMBOL_LENGTH),
      name: truncate(rawName, MAX_NAME_LENGTH),
      decimals,
      logoUrl: entry.token.icon_url,
      balance: entry.value,
      balanceFormatted,
      priceUsd,
      valueUsd: priceUsd !== null ? Number(balanceFormatted) * priceUsd : null,
      isNative: false,
      flagged:
        abnormalMetadata || (entry.token.reputation !== null && entry.token.reputation !== "ok"),
    });
  }

  holdings.sort((a, b) => {
    if (a.valueUsd === null && b.valueUsd === null) return a.symbol.localeCompare(b.symbol);
    if (a.valueUsd === null) return 1;
    if (b.valueUsd === null) return -1;
    return b.valueUsd - a.valueUsd;
  });

  const totalUsd = holdings.some((h) => h.valueUsd !== null)
    ? holdings.reduce((sum, h) => sum + (h.valueUsd ?? 0), 0)
    : null;

  return { address, totalUsd, holdings };
}
