import { useCallback, useEffect, useState } from "react";
import { isAgentHubPreviewEnabled } from "@/config/agentHub";
import {
  addPreviewAgent,
  clearPreviewAgents,
  readPreviewPositions,
  removePreviewAgent,
} from "@/lib/agent-hub/localPreview";
import type { OwnedAgentPosition } from "@/lib/agent-hub/types";

/**
 * Dev-only local preview workforce. `isAgentHubPreviewEnabled()` is already
 * hard-false in any production build (see src/config/agentHub.ts), so this
 * hook's controls are simply absent outside a local dev session.
 */
export function useAgentHubPreview() {
  const [positions, setPositions] = useState<OwnedAgentPosition[]>([]);
  const enabled = isAgentHubPreviewEnabled();

  const refresh = useCallback(() => {
    setPositions(readPreviewPositions());
  }, []);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  const add = useCallback(
    (agentId: string) => {
      if (!enabled) return;
      addPreviewAgent(agentId);
      refresh();
    },
    [enabled, refresh],
  );

  const remove = useCallback(
    (ownershipId: string) => {
      if (!enabled) return;
      removePreviewAgent(ownershipId);
      refresh();
    },
    [enabled, refresh],
  );

  const clear = useCallback(() => {
    if (!enabled) return;
    clearPreviewAgents();
    refresh();
  }, [enabled, refresh]);

  return { enabled, positions: enabled ? positions : [], add, remove, clear };
}
