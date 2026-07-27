import { createPublicClient, http } from "viem";
import { chainlinkFeeds, feedForToken, type ChainlinkFeedConfig } from "@/config/chainlinkFeeds";
import { robinhoodChain } from "@/config/robinhoodChain";

const AGGREGATOR_V3_ABI = [
  {
    type: "function",
    name: "latestRoundData",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
  },
] as const;

const MAX_FEED_AGE_SECONDS = 3600;

let client: ReturnType<typeof createPublicClient> | null = null;

function getClient() {
  if (!robinhoodChain) return null;
  if (!client) {
    client = createPublicClient({
      chain: robinhoodChain,
      transport: http(process.env.ROBINHOOD_RPC_URL || robinhoodChain.rpcUrls.default.http[0]),
    });
  }
  return client;
}

/**
 * Reads a real Chainlink AggregatorV3Interface feed. Wired and functional,
 * but chainlinkFeeds.ts ships empty (no Robinhood Chain feed addresses were
 * confirmed this session) — this simply never gets a config to act on until
 * the owner adds one, exactly like tradingDestinations.ts's disabled entries.
 */
export async function readChainlinkPrice(feed: ChainlinkFeedConfig): Promise<number | null> {
  const publicClient = getClient();
  if (!publicClient) return null;

  try {
    const result = await publicClient.readContract({
      address: feed.feedAddress as `0x${string}`,
      abi: AGGREGATOR_V3_ABI,
      functionName: "latestRoundData",
    });
    const [, answer, , updatedAt] = result;

    const ageSeconds = Date.now() / 1000 - Number(updatedAt);
    if (ageSeconds > MAX_FEED_AGE_SECONDS) return null;
    if (answer <= 0n) return null;

    return Number(answer) / 10 ** feed.feedDecimals;
  } catch {
    return null;
  }
}

export async function chainlinkUsdPrice(tokenAddress: string): Promise<number | null> {
  if (chainlinkFeeds.length === 0) return null;
  const feed = feedForToken(tokenAddress);
  if (!feed) return null;
  return readChainlinkPrice(feed);
}
