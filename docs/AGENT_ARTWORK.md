# Agent Artwork

Portrait artwork lives as static image files at `public/agents/*`, referenced by each Genesis Agent's `avatarPath` field (`src/config/genesisAgents.ts`), loaded via a plain `<img src>` in `src/components/agent-hub/AgentPortrait.tsx`.

## Sourcing — client-supplied, not hand-authored

The original build used hand-authored SVG geometric portraits (no external assets, matching this codebase's default "never invent/fabricate" stance). The owner asked for photorealistic character art instead, referencing an AI-generated (Midjourney-style) example. Producing that quality is outside what this assistant can generate — there's no image-generation or 3D-rendering tool available, only file/code tools. **The owner supplied the portrait files directly.** The original six (delivered as `1.png`–`6.png`, 1254×1254, mapped to agents by visor color and motif) were later fully replaced by a second owner-supplied set of six marine-AI renders (also `1.png`–`6.png`, 1254×1254, mapped to agents by species and on-image branding) when the collection rebranded to the Ocean Intelligence Fleet. This codebase only optimizes, integrates, and animates whatever set is current.

This means: **licensing and usage rights for these images are the owner's responsibility**, not verified or guaranteed by this codebase. If a file is ever replaced, keep the same filename/aspect ratio so nothing else needs to change.

Source PNGs were resized (max width ~1200px) and converted to WEBP at ~q82 via `sharp-cli` (`npx --yes sharp-cli`, one-off — not a project dependency), bringing each file from ~2MB down to roughly 95–180KB.

## Current files

| File                    | Agent                                                         | Match signal                                         |
| ----------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `shrimp-scout.webp`     | Shrimp Scout                                                  | Robotic shrimp                                       |
| `manta-signal.webp`     | Manta Signal                                                  | Robotic manta ray, "MANTA SIGNAL" labeled on the art |
| `dolphin-echo.webp`     | Dolphin Echo                                                  | Robotic dolphin                                      |
| `razor-shark.webp`      | Razor Shark                                                   | Robotic shark                                        |
| `blackfin-orca.webp`    | Blackfin Orca                                                 | Robotic orca                                         |
| `titan-whale.webp`      | Titan Whale                                                   | Robotic humpback whale (most ornate, mythic)         |
| `agent-placeholder.svg` | Error fallback only (unchanged, still hand-authored/original) | —                                                    |

## Image spec for replacements

- **Square (1:1)** — `AgentPortrait.tsx` renders every size as `aspect-square` with `object-cover`, matching the delivered art's native 1254×1254 dimensions. This is intentional: some agents (e.g. Blackfin Orca, Titan Whale) have elements positioned near the horizontal edges — a portrait (2:3) crop would clip them. Don't switch back to a portrait aspect ratio without re-checking those side elements survive the crop.
- Consistent framing/crop across all six so they sit evenly in a grid
- Under ~500KB each; convert to WEBP if a PNG export comes in larger (see the `sharp-cli` command above)
- Save into `public/agents/` under the agent's slug, then update that agent's `avatarPath` in `genesisAgents.ts` if the extension differs from what's already there — and update the `.svg` regex in `genesisAgents.test.ts` if the extension family changes again

## Why "animated" is a motion layer, not the image itself

A static raster file can't carry baked-in animation. "Animated" here means CSS effects **composited around** the static image, all built in `src/components/agent-hub/AgentPortraitStage.tsx`:

- **Ambient glow pulse** — a soft radial gradient behind the portrait, tinted with the agent's own `accent` token (`--color-agent-cyan`, `--color-agent-purple`, etc. — see `src/styles.css`), breathing in opacity/scale on a slow loop
- **Ken-Burns zoom** — a very slow (~10s) scale animation on the image itself, applied via `AgentPortrait`'s `animated` prop
- **Rim-light sweep** (Rare and above) — a diagonal gradient band that sweeps across the portrait every few seconds, clipped to the frame, blended with `mix-blend-mode: overlay`
- **Floating particle orbs** (Legendary/Mythic only) — 2–3 small glowing dots orbiting just outside the frame, at fixed (non-random) positions for SSR/hydration consistency

Rarity gates which effects apply — Common/Uncommon get the base glow+zoom, Rare/Epic add the sweep, Legendary/Mythic add particles — the same "higher rarity feels more advanced" principle already used by the rarity badge/frame color scale.

Every one of these is a standard CSS `@keyframes` animation, so the site's existing global `prefers-reduced-motion: reduce` rule (`src/styles.css`) collapses all of them automatically — no per-component reduced-motion logic needed.

## Where the motion layer is used

`AgentPortraitStage` replaces the old `RarityFrame` + `AgentPortrait` pairing everywhere a "real" portrait renders: `AgentRecruitCard.tsx` (grid) and `agents-hub.$slug.tsx` (detail page). The small "Other Genesis Agents" strip at the bottom of the detail page intentionally uses plain `AgentPortrait` (no motion) — motion reads as noise at that compact list size.

## Fallback behavior

`AgentPortrait.tsx`'s `onError` handler swaps the `<img>` `src` to `/agents/agent-placeholder.svg` exactly once, unchanged from the original design — covers a missing file, a corrupted image, or a typo'd `avatarPath`.
