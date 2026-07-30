import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RarityBadge } from "./RarityBadge";
import { sortGenesisAgents, type AgentSortKey } from "@/lib/agent-hub/sort";
import { AGENT_HUB_WALLET_LIMIT_LABEL } from "@/config/agentHub";
import type { GenesisAgentConfig } from "@/config/genesisAgents";

const SORT_OPTIONS: { key: AgentSortKey; label: string }[] = [
  { key: "price", label: "Price" },
  { key: "rarity", label: "Rarity" },
  { key: "farming-rate", label: "Daily Farming" },
  { key: "supply", label: "Max supply" },
];

export function AgentComparisonTable({ agents }: { agents: GenesisAgentConfig[] }) {
  const [sortKey, setSortKey] = useState<AgentSortKey>("rarity");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(
    () => sortGenesisAgents(agents, sortKey, direction),
    [agents, sortKey, direction],
  );

  const toggleSort = (key: AgentSortKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  };

  return (
    <section>
      <SectionHeading eyebrow="Compare" title="Agent comparison" />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Sort by</span>
        {SORT_OPTIONS.map((option) => (
          <Button
            key={option.key}
            type="button"
            variant={sortKey === option.key ? "default" : "outline"}
            size="sm"
            className="h-7 gap-1 rounded-full px-3 text-xs"
            onClick={() => toggleSort(option.key)}
          >
            {option.label}
            {sortKey === option.key ? <ArrowUpDown className="size-3" aria-hidden="true" /> : null}
          </Button>
        ))}
      </div>

      {/* Desktop: real table */}
      <div className="mt-4 hidden rounded-xl border border-border bg-card sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Rarity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Daily Farming</TableHead>
              <TableHead className="text-right">Max supply</TableHead>
              <TableHead className="text-right">Wallet limit</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="font-medium text-foreground">{agent.name}</TableCell>
                <TableCell className="text-muted-foreground">{agent.role}</TableCell>
                <TableCell>
                  <RarityBadge rarity={agent.rarity} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {agent.price} {agent.paymentTokenSymbol}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {agent.pulsePerDay} $PULSE/day
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {agent.maxSupply.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{AGENT_HUB_WALLET_LIMIT_LABEL}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  Coming Soon
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="mt-4 space-y-3 sm:hidden">
        {sorted.map((agent) => (
          <div key={agent.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{agent.name}</span>
              <RarityBadge rarity={agent.rarity} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{agent.role}</p>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-muted-foreground">Price</dt>
              <dd className="text-right tabular-nums text-foreground">
                {agent.price} {agent.paymentTokenSymbol}
              </dd>
              <dt className="text-muted-foreground">Daily Farming</dt>
              <dd className="text-right tabular-nums text-foreground">
                {agent.pulsePerDay} $PULSE/day
              </dd>
              <dt className="text-muted-foreground">Max supply</dt>
              <dd className="text-right tabular-nums text-foreground">
                {agent.maxSupply.toLocaleString()}
              </dd>
              <dt className="text-muted-foreground">Wallet limit</dt>
              <dd className="text-right text-foreground">{AGENT_HUB_WALLET_LIMIT_LABEL}</dd>
            </dl>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Farming rates and collection parameters are pre-launch configurations and may be finalized
        before recruitment opens.
      </p>
    </section>
  );
}
