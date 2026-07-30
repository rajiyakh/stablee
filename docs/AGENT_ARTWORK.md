# Agent Artwork

Portrait artwork lives as static image files at `public/agents/*`, referenced by each Genesis Agent's `avatarPath` field (`src/config/genesisAgents.ts`), loaded via a plain `<img src>` in `src/components/agent-hub/AgentPortrait.tsx`.

## Sourcing — client-supplied, not hand-authored

The original build used hand-authored SVG geometric portraits (no external assets, matching this codebase's default "never invent/fabricate" stance). The owner explicitly asked for photorealistic character art instead, referencing an AI-generated (Midjourney-style) example. Producing that quality is outside what this assistant can generate — there's no image-generation or 3D-rendering tool available, only file/code tools. **The owner supplies the six portrait files directly; this codebase only integrates and animates them.**

This means: **licensing and usage rights for these images are the owner's responsibility**, not verified or guaranteed by this codebase. If a file is ever replaced, keep the same filename/aspect ratio so nothing else needs to change.

## Current files

| File                      | Agent                                                         |
| ------------------------- | ------------------------------------------------------------- |
| `vector.png` (or `.webp`) | Vector                                                        |
| `echo.png`                | Echo                                                          |
| `ledger.png`              | Ledger                                                        |
| `atlas.png`               | Atlas                                                         |
| `nova.png`                | Nova                                                          |
| `oracle.png`              | Oracle                                                        |
| `agent-placeholder.svg`   | Error fallback only (unchanged, still hand-authored/original) |

## Image spec for replacements

- Portrait-oriented, roughly 2:3 (`AgentPortrait.tsx` renders every size as `aspect-[2/3]` with `object-cover`) — a square or landscape image will be center-cropped
- Consistent framing/crop across all six so they sit evenly in a grid
- Under ~500KB each; convert to WEBP if a PNG export comes in larger
- Save into `public/agents/` under the agent's slug, then update that agent's `avatarPath` in `genesisAgents.ts` if the extension differs from what's already there

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
