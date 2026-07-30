import { useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER_PATH = "/agents/agent-placeholder.svg";

/**
 * Portrait-oriented (2:3) to match the client-supplied character art — see
 * docs/AGENT_ARTWORK.md. Widths only; height is derived from aspect-[2/3].
 * The current placeholder SVGs are square, so they'll appear center-cropped
 * until the real portrait files are dropped in.
 */
const SIZE_CLASSES = {
  sm: "w-14",
  md: "w-32 sm:w-36",
  lg: "w-52",
  xl: "w-64 sm:w-72",
} as const;

export function AgentPortrait({
  src,
  name,
  size = "md",
  animated = false,
  className,
}: {
  src: string;
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  /** Applies the slow Ken-Burns zoom loop (see styles.css animate-agent-zoom) — disable for small/list contexts where the motion reads as noise. */
  animated?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <img
      src={failed ? PLACEHOLDER_PATH : src}
      alt={`${name} — Genesis Agent portrait`}
      width={512}
      height={768}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        "aspect-[2/3] rounded-xl object-cover",
        SIZE_CLASSES[size],
        animated && "animate-agent-zoom",
        className,
      )}
    />
  );
}
