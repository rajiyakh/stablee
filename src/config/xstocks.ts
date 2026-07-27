/**
 * Verified xStock / tokenized-equity registry.
 *
 * This registry is intentionally EMPTY. Add a record only when a real,
 * verifiable CoinGecko ID or an on-chain contract address has been confirmed
 * by the owner. Never add a symbol speculatively — the UI resolves every entry
 * against a live provider and hides anything it cannot verify.
 *
 * See docs/ADDING_XSTOCKS.md.
 */

export interface XStockRegistryItem {
  symbol: string;
  name: string;
  coinGeckoId?: string;
  platformId?: string;
  contractAddress?: string;
  underlyingTicker?: string;
  issuerUrl?: string;
  documentationUrl?: string;
  verified: boolean;
}

export const xStockRegistry: XStockRegistryItem[] = [
  {
    symbol: "AAPLx",
    name: "Apple xStock",
    coinGeckoId: "apple-xstock",
    underlyingTicker: "AAPL",
    verified: true,
  },
  {
    symbol: "TSLAx",
    name: "Tesla xStock",
    coinGeckoId: "tesla-xstock",
    underlyingTicker: "TSLA",
    verified: true,
  },
  {
    symbol: "NVDAx",
    name: "NVIDIA xStock",
    coinGeckoId: "nvidia-xstock",
    underlyingTicker: "NVDA",
    verified: true,
  },
  {
    symbol: "GOOGLx",
    name: "Alphabet xStock",
    coinGeckoId: "alphabet-xstock",
    underlyingTicker: "GOOGL",
    verified: true,
  },
  {
    symbol: "AMZNx",
    name: "Amazon xStock",
    coinGeckoId: "amazon-xstock",
    underlyingTicker: "AMZN",
    verified: true,
  },
  {
    symbol: "MSFTx",
    name: "Microsoft xStock",
    coinGeckoId: "microsoft-xstock",
    underlyingTicker: "MSFT",
    verified: true,
  },
  {
    symbol: "METAx",
    name: "Meta xStock",
    coinGeckoId: "meta-xstock",
    underlyingTicker: "META",
    verified: true,
  },
  {
    symbol: "SPYx",
    name: "SP500 xStock",
    coinGeckoId: "sp500-xstock",
    underlyingTicker: "SPY",
    verified: true,
  },
  {
    symbol: "QQQx",
    name: "Nasdaq xStock",
    coinGeckoId: "nasdaq-xstock",
    underlyingTicker: "QQQ",
    verified: true,
  },
  {
    symbol: "MSTRx",
    name: "MicroStrategy xStock",
    coinGeckoId: "microstrategy-xstock",
    underlyingTicker: "MSTR",
    verified: true,
  },
  {
    symbol: "COINx",
    name: "Coinbase xStock",
    coinGeckoId: "coinbase-xstock",
    underlyingTicker: "COIN",
    verified: true,
  },
  {
    symbol: "HOODx",
    name: "Robinhood xStock",
    coinGeckoId: "robinhood-xstock",
    underlyingTicker: "HOOD",
    verified: true,
  },
  {
    symbol: "CRCLx",
    name: "Circle xStock",
    coinGeckoId: "circle-xstock",
    underlyingTicker: "CRCL",
    verified: true,
  },
  {
    symbol: "NFLXx",
    name: "Netflix xStock",
    coinGeckoId: "netflix-xstock",
    underlyingTicker: "NFLX",
    verified: true,
  },
  {
    symbol: "PLTRx",
    name: "Palantir xStock",
    coinGeckoId: "palantir-xstock",
    underlyingTicker: "PLTR",
    verified: true,
  },
  {
    symbol: "AVGOx",
    name: "Broadcom xStock",
    coinGeckoId: "broadcom-xstock",
    underlyingTicker: "AVGO",
    verified: true,
  },
  {
    symbol: "ORCLx",
    name: "Oracle xStock",
    coinGeckoId: "oracle-xstock",
    underlyingTicker: "ORCL",
    verified: true,
  },
  {
    symbol: "AMDx",
    name: "AMD xStock",
    coinGeckoId: "amd-xstock",
    underlyingTicker: "AMD",
    verified: true,
  },
  {
    symbol: "INTCx",
    name: "Intel xStock",
    coinGeckoId: "intel-xstock",
    underlyingTicker: "INTC",
    verified: true,
  },
  {
    symbol: "BRK.Bx",
    name: "Berkshire Hathaway xStock",
    coinGeckoId: "berkshire-hathaway-xstock",
    underlyingTicker: "BRK.B",
    verified: true,
  },
  {
    symbol: "JPMx",
    name: "JPMorgan Chase xStock",
    coinGeckoId: "jpmorgan-chase-xstock",
    underlyingTicker: "JPM",
    verified: true,
  },
  {
    symbol: "GSx",
    name: "Goldman Sachs xStock",
    coinGeckoId: "goldman-sachs-xstock",
    underlyingTicker: "GS",
    verified: true,
  },
  {
    symbol: "Vx",
    name: "Visa xStock",
    coinGeckoId: "visa-xstock",
    underlyingTicker: "V",
    verified: true,
  },
  {
    symbol: "MAx",
    name: "Mastercard xStock",
    coinGeckoId: "mastercard-xstock",
    underlyingTicker: "MA",
    verified: true,
  },
  {
    symbol: "WMTx",
    name: "Walmart xStock",
    coinGeckoId: "walmart-xstock",
    underlyingTicker: "WMT",
    verified: true,
  },
  {
    symbol: "UBERx",
    name: "Uber xStock",
    coinGeckoId: "uber-xstock",
    underlyingTicker: "UBER",
    verified: true,
  },
  {
    symbol: "GMEx",
    name: "Gamestop xStock",
    coinGeckoId: "gamestop-xstock",
    underlyingTicker: "GME",
    verified: true,
  },
  {
    symbol: "MARAx",
    name: "MARA xStock",
    coinGeckoId: "mara-xstock",
    underlyingTicker: "MARA",
    verified: true,
  },
  {
    symbol: "RIOTx",
    name: "Riot Platforms xStock",
    coinGeckoId: "riot-platforms-xstock",
    underlyingTicker: "RIOT",
    verified: true,
  },
  {
    symbol: "GLDx",
    name: "Gold xStock",
    coinGeckoId: "gold-xstock",
    underlyingTicker: "GLD",
    verified: true,
  },
];

export function verifiedXStocks(): XStockRegistryItem[] {
  return xStockRegistry.filter((item) => item.verified);
}
