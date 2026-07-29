import { CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContractStatusBadge({
  configured,
  className,
}: {
  configured: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        configured ? "bg-positive/10 text-positive" : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {configured ? (
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
      ) : (
        <CircleDashed className="size-3.5" aria-hidden="true" />
      )}
      {configured ? "Configured" : "Not configured"}
    </span>
  );
}
