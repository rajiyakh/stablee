import { Beaker } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Placed near any aggregated number sourced from local preview/demo positions — never implies a real, on-chain, or purchased position. */
export function PreviewDataBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-dashed text-[10px] font-medium">
      <Beaker className="size-3" aria-hidden="true" />
      Local Preview
    </Badge>
  );
}
