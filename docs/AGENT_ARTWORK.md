# Agent Artwork

Portrait artwork lives as static SVG files at `public/agents/*.svg`, referenced by each Genesis Agent's `avatarPath` field (`src/config/genesisAgents.ts`). This is deliberately different from the site's other brand mark (`AnimatedPulseLogo`, an inline React component using `var(--color-*)` CSS custom properties) — these are larger illustrations meant to be cached/portable as ordinary image files, loaded via a plain `<img src>` in `src/components/agent-hub/AgentPortrait.tsx`.

## Current files

| File                    | Agent  | Rarity    | Visual direction                                                            |
| ----------------------- | ------ | --------- | --------------------------------------------------------------------------- |
| `vector.svg`            | Vector | Common    | Angular forward-pointing hood, horizontal visor, lime speed lines           |
| `echo.svg`              | Echo   | Uncommon  | Round head, concentric radar/listening rings, sage/cyan-green               |
| `ledger.svg`            | Ledger | Rare      | Shield-shaped head, diamond analytical eyes, amber risk ticks               |
| `atlas.svg`             | Atlas  | Epic      | Heavy hexagonal head, single large scanning lens, deep green/metallic seams |
| `nova.svg`              | Nova   | Legendary | Pointed launch-nose hood, starburst ignition rays, purple/lime              |
| `oracle.svg`            | Oracle | Mythic    | Crown-topped round head, layered holographic rings, gold/lime/white         |
| `agent-placeholder.svg` | —      | —         | Neutral fallback, used only on a load error                                 |

## Why colors are hardcoded literals, not CSS tokens

An SVG loaded through `<img src>` cannot read the host page's CSS custom properties (`var(--color-primary)` etc. resolve to nothing across that boundary) — only the SVG file's own internal styles apply. Every color inside these files is therefore a literal hex value chosen to harmonize with the site's palette family (forest green, lime, ivory, plus the four new rarity hues defined in `src/styles.css`: cyan, purple, gold, mythic lime-gold), not a copy-paste of the CSS token values.

## Blink animation

Each file (except the placeholder) includes a self-contained `<style>` block with a CSS `@keyframes` blink animation on the eye/visor element, plus an internal `@media (prefers-reduced-motion: reduce)` rule that disables it. This runs correctly even through `<img src>` because it depends only on the SVG document's own styles, not the host page's CSS or JavaScript — nothing in `AgentPortrait.tsx` needs to know the animation exists.

## Replacing or adding artwork

1. Author a new SVG with a `viewBox="0 0 512 512"`, no embedded text, and either a transparent or soft-ivory background (never a solid black rectangle).
2. Keep the outer silhouette bold and simple enough to read clearly at 64px — the portrait renders at four sizes (`sm`/`md`/`lg`/`xl` in `AgentPortrait.tsx`, roughly 64–320px).
3. Include a `<title>` element for accessibility.
4. Save it to `public/agents/<slug>.svg` and point the matching `GenesisAgentConfig.avatarPath` at it.
5. `AgentPortrait.tsx` automatically falls back to `agent-placeholder.svg` on any load error — no code change needed to get fallback behavior for a new agent.

## Fallback behavior

`AgentPortrait.tsx` uses an `onError` handler that swaps the `<img>` `src` to `/agents/agent-placeholder.svg` exactly once. This covers a missing file, a malformed SVG, or a typo'd `avatarPath` — the page never shows a broken-image icon.
