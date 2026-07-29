import { getGenesisAgent } from "@/config/genesisAgents";
import type { OwnedAgentPosition } from "./types";

/**
 * Dev-only local preview ("Local Preview" / "Demo Ownership") positions —
 * completely separate from real wallet ownership, gated behind
 * isAgentHubPreviewEnabled(). Never mixed with real positions returned by
 * AgentOwnershipAdapter. UI components must badge anything read from this
 * store as preview data; nothing here is ever implied as purchased, minted,
 * or on-chain.
 */
export const AGENT_HUB_PREVIEW_STORAGE_KEY = "robinpulse_agent_hub_preview";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStorage(): KeyValueStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Storage access can throw in some privacy-mode/sandboxed contexts.
    return null;
  }
}

function resolveStorage(storage?: KeyValueStorage): KeyValueStorage | null {
  return storage ?? browserStorage();
}

export function readPreviewPositions(storage?: KeyValueStorage): OwnedAgentPosition[] {
  const store = resolveStorage(storage);
  if (!store) return [];
  const raw = store.getItem(AGENT_HUB_PREVIEW_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OwnedAgentPosition[]) : [];
  } catch {
    return [];
  }
}

function writePreviewPositions(positions: OwnedAgentPosition[], storage?: KeyValueStorage): void {
  const store = resolveStorage(storage);
  if (!store) return;
  store.setItem(AGENT_HUB_PREVIEW_STORAGE_KEY, JSON.stringify(positions));
}

/**
 * Adds a demo position that starts "farming" immediately, so the pending
 * allocation counter has something to demonstrate. It is never described as
 * owned/minted/live — that labeling is the caller's/UI's responsibility via
 * a "Local Preview" badge, not this store.
 */
export function addPreviewAgent(
  agentId: string,
  storage?: KeyValueStorage,
): OwnedAgentPosition | null {
  const agent = getGenesisAgent(agentId);
  if (!agent) return null;

  const now = new Date().toISOString();
  const position: OwnedAgentPosition = {
    ownershipId: `preview:${agentId}:${Date.now()}`,
    agentId,
    acquiredAt: now,
    activatedAt: now,
    claimedPulse: "0",
    status: "farming",
  };

  const positions = [...readPreviewPositions(storage), position];
  writePreviewPositions(positions, storage);
  return position;
}

export function removePreviewAgent(ownershipId: string, storage?: KeyValueStorage): void {
  const positions = readPreviewPositions(storage).filter((p) => p.ownershipId !== ownershipId);
  writePreviewPositions(positions, storage);
}

export function clearPreviewAgents(storage?: KeyValueStorage): void {
  const store = resolveStorage(storage);
  if (!store) return;
  store.removeItem(AGENT_HUB_PREVIEW_STORAGE_KEY);
}
