# Proposal

## Why

Conflict Never Ends needs a Phase 1 playable prototype: 1910 logistical army-building where caliber choice, production, warehouse limits, and ammo risk matter. The current stub only compares abstract unit counts and cannot express supply-chain or timed combat.

## What Changes

- Replace the stub combat model with a pure TypeScript core for 1910 start conditions, caliber families, factories, warehouses, barracks/loadouts, and local contracts.
- Add Factory Engine, Logistics Check, and Combat & Ammo Consumption Simulator modules, decoupled from any UI.
- Evolve the CLI into a Phase 1 demo: caliber pick → recruit/company loadout → factory ammo allocation → warehouse stock → accept Local Contract → timed combat log (ammo, casualties, outcome, loot).
- Keep architecture ready for a later Phaser/Pixi/React front end (core remains importable, side-effect free).
- Research Center and higher contract tiers (province+) are designed for later phases; Phase 1 ships stubs or minimal hooks only where needed for the demo loop.

## Capabilities

### New Capabilities

- `campaign-start-1910`: Starting infrastructure, funds/materials, and one-of-five caliber family selection that unlocks the matching bolt-action rifle with distinct cost, storage, power, and supply traits.
- `supply-chain`: Factory line allocation, warehouse volume/weight limits, and stock movement for materials, weapons, and ammo.
- `force-loadout`: Barracks recruitment, company batch templates, and per-soldier ammo payload for deployment.
- `contract-combat`: Local-region contracts, deployment readiness checks, timed combat ticks with dynamic ammo consumption, and failure modes when ammo runs out.
- `cli-phase1-demo`: Text demo that exercises the end-to-end Phase 1 loop without a graphical UI.

### Modified Capabilities

- (none — no existing main specs yet)

## Impact

- **Code**: Evolve `src/` — introduce `src/core/` for pure logic; replace/retire `src/game.ts` stub; rewrite `src/index.ts` CLI against core APIs.
- **OpenSpec**: New change artifacts under `openspec/changes/phase1-1910-text-prototype/`.
- **Deps**: No new runtime dependencies expected; remain on Node/TypeScript + `tsx`.
- **Later UI**: Core must not import CLI or DOM; CLI is a thin adapter.
