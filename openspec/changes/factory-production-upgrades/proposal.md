# Proposal

## Why

The single money-only factory with a flat capacity point cannot express buyable tiers, staged upgrades, duplicate plants at 2× cost, or multi-product identity (ammo/weapons/gears/grenades). Phase 1 needs a blacksmith start and a clear upgrade/build ladder.

## What Changes

- Replace `GameState.factory` with owned **factories[]** starting with one **blacksmith**.
- Blacksmith base output: **250 ammo** or **5 rifles** per cycle (cash = unit manufacture costs).
- **5 upgrade stages** per plant: output × **1.5^(stage−1)** vs base; stage 5 unlocks a **2nd manufacture slot**.
- **5 tiers** (blacksmith → industrial): better base output, higher unit-cost mult, higher build cost.
- Same-tier next purchase costs **2×** the previous purchase price for that tier.
- Per-slot product: ammo / weapons / gears / grenades (vehicles stub); locked for the month.
- CLI: list, buy, upgrade, set slot product; demo uses starting blacksmith.

## Capabilities

### New Capabilities

- `factory-economy`: buy, upgrade stages, tier ladder, 2× same-type pricing, dual slots at stage 5.
- `factory-products`: per-factory/slot product identity across ammo/weapons/gears/grenades (+ vehicles stub).

### Modified Capabilities

- Monthly factory resolve iterates all owned plants/slots instead of one global product.

## Impact

- `types`, `factory.ts`, `campaign`, `turn`, warehouse stock kinds, catalog tier defs, CLI/demo.
