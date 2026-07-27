# Token Page Setup

The `/token` page is driven entirely by `src/config/token.ts`'s `tokenConfig` object. Every field is empty until the owner supplies real, confirmed information — the page hides or degrades any UI element backed by an empty field, so it's always safe to ship, launched or not.

## Where to add each value

| Field                                      | Where it appears                                                                                           | Notes                                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `tokenName`                                | Launch Status table ("Token name")                                                                         | Shows "To be announced" while empty                                                                        |
| `tokenSymbol`                              | Launch Status table ("Symbol")                                                                             | Shows "To be announced" while empty                                                                        |
| `headline`                                 | Hero `<h1>` and homepage announcement                                                                      | Already set to the required copy                                                                           |
| `description`                              | Hero supporting paragraph                                                                                  | Already set to the required copy                                                                           |
| `launchDate`                               | Launch Status table ("Launch date")                                                                        | Free text (e.g. "Q1 2027") — shows "To be announced" while empty                                           |
| `contractAddress`                          | Launch Status table ("Contract")                                                                           | Shows "Not deployed" while empty. **Never fill this in until a real, audited contract exists.**            |
| `chainId`                                  | Launch Status table ("Network")                                                                            | e.g. `"Robinhood Chain"` once known                                                                        |
| `explorerUrl`                              | Not currently rendered directly — reserved for a future "View contract" link once `contractAddress` is set |                                                                                                            |
| `tokenomicsUrl`                            | Launch Status table ("Tokenomics") — becomes a real link when set                                          |                                                                                                            |
| `documentationUrl`                         | Launch Status table ("Documentation") — becomes a real link when set                                       |                                                                                                            |
| `announcementUrl`                          | "Follow Updates" hero button + Updates section link                                                        | First-priority updates link                                                                                |
| `utilities`                                | "Potential Utility" card grid                                                                              | Add/remove strings freely — each renders as its own card with "Planned — details will be announced later." |
| `socialLinks.x` / `.discord` / `.telegram` | Updates section links + fallback "Follow Updates" hero button                                              | Only non-empty ones render                                                                                 |

## Status field

`status: "coming-soon" | "announced" | "launched"` controls the badge text shown in the hero ("Coming Soon" / "Announced" / "Launched"). Do not set this to `"launched"` until the token has actually launched — the rest of the page's copy assumes a pre-launch state and would need a full content review first.

## Safety

The Safety Notice section is static and always shown, regardless of configuration — it exists specifically to warn users against unofficial tokens/contracts claiming to represent RobinPulse. Do not remove it.
