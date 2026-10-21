# Proposal

## Why

Factories, calibers, gear, and barracks exist without a spendable unlock ladder. Phase 1 needs **research points (RP)** that gate techs (boosts), buildings, and the caliber→rifle→accessory / gear item tree so progression is intentional rather than everything unlocked at start.

## What Changes

- Add **RP earn/spend** on `GameState` with monthly + contract-win income and catalog costs.
- Catalog **research nodes**: tech boosts, building unlocks (housing / warehouse / factory tiers / garage / shipyard stubs), item paths (caliber → primary rifle → accessories; 2nd weapon; gear + accessories).
- **Vehicles** = Phase 2 stub nodes only (listable; spend blocked or no-op with note).
- Wire **gates**: factory tier buy, weapon/gear/load production & issue, warehouse/housing effects, combat/production boosts from techs.
- Seed **1910 starter path**: selecting a caliber auto-grants that family’s caliber + primary rifle; other nodes cost RP.
- CLI: view RP, browse tree / available unlocks, spend RP.

## Capabilities

### New Capabilities

- `research-points`: earn (month + contract win) and spend RP; balance on state.
- `technology-research`: techs grant manpower / morale / production / success-chance boosts.
- `building-research`: unlock housing, warehouses, factory tiers, garage, shipyard (latter two stub).
- `item-research`: caliber → rifle → accessories; 2nd weapon gates; gear + accessories.

### Modified Capabilities

- Factory buy / production and meal/food unlocks respect research gates.
- End-turn awards monthly RP; victorious jobs award bonus RP.
- Caliber select grants starter research nodes for the chosen family.

## Impact

- `types`, new `research.ts` + catalog seed, `campaign`, `turn`, `factory`, `combat`/`board`, CLI/demo status line.
- Vehicles remain non-producing stubs.
