import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER_PATH = "/agents/agent-placeholder.svg";

/**
 * Square (1:1) to match the client-supplied character art — see
 * docs/AGENT_ARTWORK.md. Widths only; height is derived from aspect-square.
 * Square keeps side elements (Echo's drone orbs, Nova's shards, Oracle's
 * halo orbs) intact — a portrait crop would clip them.
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
  const imgRef = useRef<HTMLImageElement>(null);

  // The server-rendered <img> can start (and fail) its request before React
  // finishes hydrating and attaches the onError listener below, so a fast
  // failure is otherwise missed. This mount-time check catches that case;
  // onError still covers failures that happen after hydration.
  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  return (
    <img
      ref={imgRef}
      src={failed ? PLACEHOLDER_PATH : src}
      alt={`${name} — Genesis Agent portrait`}
      width={1200}
      height={1200}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        "aspect-square rounded-xl object-cover",
        SIZE_CLASSES[size],
        animated && "animate-agent-zoom",
        className,
      )}
    />
  );
}
