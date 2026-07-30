import type { CSSProperties } from "react";
import { AgentPortrait } from "./AgentPortrait";
import { RarityFrame } from "./RarityFrame";
import { ACCENT_COLOR } from "@/lib/agent-hub/accentColor";
import type { AgentRarity, GenesisAgentConfig } from "@/config/genesisAgents";

/** Higher rarities get progressively more motion — "each rarity should visibly feel more advanced," same principle as the badge/frame color scale. */
type MotionTier = "base" | "sweep" | "particles";

const MOTION_TIER: Record<AgentRarity, MotionTier> = {
  Common: "base",
  Uncommon: "base",
  Rare: "sweep",
  Epic: "sweep",
  Legendary: "particles",
  Mythic: "particles",
};

const SIZE_BOX = {
  sm: "w-14",
  md: "w-32 sm:w-36",
  lg: "w-52",
  xl: "w-64 sm:w-72",
} as const;

/** Fixed, non-random particle offsets — deterministic so SSR and client render identically (see the app-wide "never Math.random() in decorative markup" convention). */
const PARTICLES = [
  { top: "8%", left: "-6%", x: "5px", y: "-8px", delay: "0s" },
  { top: "55%", left: "102%", x: "-6px", y: "6px", delay: "1.2s" },
  { top: "88%", left: "-4%", x: "4px", y: "-5px", delay: "2.1s" },
];

/**
 * Composites the motion layer around a static portrait image: ambient
 * rarity-tinted glow pulse, a slow Ken-Burns zoom on the image itself, and
 * (Rare+) a rim-light sweep and (Legendary/Mythic) floating particle orbs.
 * "Animated" here means CSS/DOM effects layered around the static file —
 * see docs/AGENT_ARTWORK.md for why a raster portrait can't carry baked-in
 * animation on its own.
 */
export function AgentPortraitStage({
  agent,
  size = "md",
  className,
}: {
  agent: GenesisAgentConfig;
  size?: keyof typeof SIZE_BOX;
  className?: string;
}) {
  const glow = ACCENT_COLOR[agent.accent] ?? ACCENT_COLOR.primary;
  const tier = MOTION_TIER[agent.rarity];

  return (
    <div className={`relative ${SIZE_BOX[size]} ${className ?? ""}`}>
      <div
        aria-hidden="true"
        className="animate-agent-glow pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${glow} 0%, transparent 65%)`,
          filter: "blur(8px)",
        }}
      />

      <RarityFrame rarity={agent.rarity} className="w-full">
        <div className="relative w-full overflow-hidden rounded-lg">
          <AgentPortrait
            src={agent.avatarPath}
            name={agent.name}
            size={size}
            animated
            className="w-full"
          />

          {tier !== "base" ? (
            <div
              aria-hidden="true"
              className="animate-agent-sweep pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(75deg, transparent 40%, ${glow} 50%, transparent 60%)`,
                mixBlendMode: "overlay",
              }}
            />
          ) : null}
        </div>
      </RarityFrame>

      {tier === "particles"
        ? PARTICLES.map((p, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="animate-agent-particle pointer-events-none absolute size-1.5 rounded-full"
              style={
                {
                  top: p.top,
                  left: p.left,
                  background: glow,
                  boxShadow: `0 0 6px ${glow}`,
                  animationDelay: p.delay,
                  "--particle-x": p.x,
                  "--particle-y": p.y,
                } as CSSProperties
              }
            />
          ))
        : null}
    </div>
  );
}
