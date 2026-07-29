import { useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER_PATH = "/agents/agent-placeholder.svg";

const SIZE_CLASSES = {
  sm: "h-16 w-16",
  md: "h-32 w-32",
  lg: "h-56 w-56",
  xl: "h-64 w-64 sm:h-80 sm:w-80",
} as const;

export function AgentPortrait({
  src,
  name,
  size = "md",
  className,
}: {
  src: string;
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <img
      src={failed ? PLACEHOLDER_PATH : src}
      alt={`${name} — Genesis Agent portrait`}
      width={512}
      height={512}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("rounded-xl object-contain", SIZE_CLASSES[size], className)}
    />
  );
}
