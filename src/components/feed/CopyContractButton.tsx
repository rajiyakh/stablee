import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/market/format";
import { cn } from "@/lib/utils";

export function CopyContractButton({
  address,
  className,
}: {
  address: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("h-6 gap-1 px-1.5 font-mono text-[11px] text-muted-foreground", className)}
      aria-label={`Copy contract address ${address}`}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(address);
          toast.success("Contract address copied");
        } catch {
          toast.error("Could not copy address");
        }
      }}
    >
      {shortenAddress(address, 5)}
      <Copy className="h-3 w-3" aria-hidden="true" />
    </Button>
  );
}
