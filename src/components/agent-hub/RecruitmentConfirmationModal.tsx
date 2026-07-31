import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AgentPortrait } from "./AgentPortrait";
import { RarityBadge } from "./RarityBadge";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { isAgentHubContractsConfigured } from "@/config/contracts";
import { AGENT_HUB_WALLET_LIMIT_LABEL } from "@/config/agentHub";
import type { GenesisAgentConfig } from "@/config/genesisAgents";

export function RecruitmentConfirmationModal({
  agent,
  open,
  onOpenChange,
}: {
  agent: GenesisAgentConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!agent) return null;
  const quantity = 1;
  const totalPrice = (Number(agent.price) * quantity).toString();
  const contractsConfigured = isAgentHubContractsConfigured();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-3 p-5">
        <DialogHeader>
          <DialogTitle>Preview Minting</DialogTitle>
          <DialogDescription>
            This is a preview only. No wallet will be contacted and no purchase will occur.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <AgentPortrait src={agent.avatarPath} name={agent.name} size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{agent.name}</p>
              <RarityBadge rarity={agent.rarity} />
            </div>
            <p className="text-xs text-muted-foreground">{agent.role}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-y-1.5 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
          <dt className="text-muted-foreground">Quantity</dt>
          <dd className="text-right tabular-nums text-foreground">{quantity}</dd>
          <dt className="text-muted-foreground">Price per Agent</dt>
          <dd className="text-right tabular-nums text-foreground">
            {agent.price} {agent.paymentTokenSymbol}
          </dd>
          <dt className="text-muted-foreground">Total payment</dt>
          <dd className="text-right font-semibold tabular-nums text-foreground">
            {totalPrice} {agent.paymentTokenSymbol}
          </dd>
          <dt className="text-muted-foreground">Daily Farming</dt>
          <dd className="text-right tabular-nums text-foreground">{agent.pulsePerDay} $ORCA/day</dd>
          <dt className="text-muted-foreground">Wallet limit</dt>
          <dd className="text-right text-foreground">{AGENT_HUB_WALLET_LIMIT_LABEL}</dd>
          <dt className="text-muted-foreground">Maximum supply</dt>
          <dd className="text-right tabular-nums text-foreground">
            {agent.maxSupply.toLocaleString()}
          </dd>
          <dt className="text-muted-foreground">Contract status</dt>
          <dd className="text-right">
            <ContractStatusBadge configured={contractsConfigured} className="justify-end" />
          </dd>
        </dl>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Farmed $ORCA remains locked until TGE and official claim activation. Minting is not
          currently live — this preview does not reserve an Agent or guarantee availability.
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
