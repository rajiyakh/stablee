import { describe, expect, it } from "vitest";
import {
  addPreviewAgent,
  AGENT_HUB_PREVIEW_STORAGE_KEY,
  clearPreviewAgents,
  readPreviewPositions,
  removePreviewAgent,
  type KeyValueStorage,
} from "./localPreview";

/** In-memory stand-in for localStorage — this repo's Vitest environment is "node", so no real localStorage exists. */
function createMemoryStorage(): KeyValueStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

describe("localPreview", () => {
  it("reads an empty array when nothing has been stored yet", () => {
    const storage = createMemoryStorage();
    expect(readPreviewPositions(storage)).toEqual([]);
  });

  it("adds a preview position that starts farming immediately, under the dedicated storage key", () => {
    const storage = createMemoryStorage();
    const position = addPreviewAgent("shrimp-scout", storage);

    expect(position).not.toBeNull();
    expect(position?.agentId).toBe("shrimp-scout");
    expect(position?.status).toBe("farming");
    expect(position?.claimedPulse).toBe("0");
    expect(storage.getItem(AGENT_HUB_PREVIEW_STORAGE_KEY)).not.toBeNull();
  });

  it("returns null for an unknown agent id instead of creating a fabricated position", () => {
    const storage = createMemoryStorage();
    expect(addPreviewAgent("not-a-real-agent", storage)).toBeNull();
    expect(readPreviewPositions(storage)).toEqual([]);
  });

  it("round-trips multiple preview positions through storage", () => {
    const storage = createMemoryStorage();
    addPreviewAgent("shrimp-scout", storage);
    addPreviewAgent("manta-signal", storage);

    const positions = readPreviewPositions(storage);
    expect(positions).toHaveLength(2);
    expect(positions.map((p) => p.agentId).sort()).toEqual(["manta-signal", "shrimp-scout"]);
  });

  it("removes a single preview position by ownershipId", () => {
    const storage = createMemoryStorage();
    const first = addPreviewAgent("shrimp-scout", storage)!;
    addPreviewAgent("manta-signal", storage);

    removePreviewAgent(first.ownershipId, storage);

    const remaining = readPreviewPositions(storage);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].agentId).toBe("manta-signal");
  });

  it("clears all preview positions", () => {
    const storage = createMemoryStorage();
    addPreviewAgent("shrimp-scout", storage);
    addPreviewAgent("titan-whale", storage);

    clearPreviewAgents(storage);

    expect(readPreviewPositions(storage)).toEqual([]);
  });

  it("tolerates corrupted/tampered JSON in storage by treating it as empty rather than throwing", () => {
    const storage = createMemoryStorage();
    storage.setItem(AGENT_HUB_PREVIEW_STORAGE_KEY, "{not valid json");
    expect(readPreviewPositions(storage)).toEqual([]);
  });

  it("tolerates a non-array JSON value in storage by treating it as empty", () => {
    const storage = createMemoryStorage();
    storage.setItem(AGENT_HUB_PREVIEW_STORAGE_KEY, JSON.stringify({ hacked: true }));
    expect(readPreviewPositions(storage)).toEqual([]);
  });
});
