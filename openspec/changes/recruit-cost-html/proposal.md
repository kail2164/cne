# Proposal

## Why

Flat recruit pricing never pressures late-game manpower. Players also need a browser surface over the existing pure TS core without rewriting game logic into the page.

## What Changes

- **Recruit cost scaling:** unit hire cost = `base × (1.2)^floor(lifetimeRecruitsHired / 10)` (lifetime hired, not living roster). Batch hires charge per recruit as the lifetime counter advances.
- Track `lifetimeRecruitsHired` on `GameState`; show current unit price in CLI and HTML.
- **HTML UI:** Vite page importing `src/core` for status, recruit, factory product, research list/spend, contract board, end turn, combat log.
- `npm run web` serves the page; CLI/demo remain green.

## Capabilities

### New Capabilities

- `recruit-cost-scaling`: lifetime-based compound +20% per 10 hires.
- `html-game-ui`: thin browser front end over core.

## Impact

- `types`, `barracks`, `campaign`, CLI status/recruit prompt, new `web/` + Vite scripts.
