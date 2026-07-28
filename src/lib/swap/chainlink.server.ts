import { createPublicClient, http } from "viem";
import { chainlinkFeeds, feedForToken, type ChainlinkFeedConfig } from "@/config/chainlinkFeeds";
import { robinhoodChainFacts } from "@/config/robinhoodChain";

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

/**
 * Multiplier applied to a feed's own heartbeatSeconds to decide staleness.
 * A fixed short window (e.g. 1 hour) is wrong here — observed live, a
 * healthy 86400s-heartbeat feed can legitimately sit 90+ minutes without
 * updating during quiet trading (see chainlinkFeeds.ts). 2x heartbeat is
 * generous margin for normal reporting delay without masking a genuinely
 * dead feed.
 */
const STALENESS_HEARTBEAT_MULTIPLIER = 2;

let client: ReturnType<typeof createPublicClient> | null = null;

function getClient() {
  if (!robinhoodChainFacts) return null;
  if (!client) {
    client = createPublicClient({
      chain: robinhoodChainFacts,
      transport: http(process.env.ROBINHOOD_RPC_URL || robinhoodChainFacts.rpcUrls.default.http[0]),
    });
  }
  return client;
}

/** Pure so it's directly unit-testable without mocking a viem client. */
export function isFeedStale(ageSeconds: number, heartbeatSeconds: number): boolean {
  return ageSeconds > heartbeatSeconds * STALENESS_HEARTBEAT_MULTIPLIER;
}

/**
 * Reads a real Chainlink AggregatorV3Interface feed. Wired, functional, and
 * has real entries for the 8 confirmed Robinhood tokenized-equity feeds —
 * see chainlinkFeeds.ts. Every other token still falls through to the next
 * USD-pricing tier.
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
    if (isFeedStale(ageSeconds, feed.heartbeatSeconds)) return null;
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
