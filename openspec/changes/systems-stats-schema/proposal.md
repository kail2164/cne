# Proposal

## Why

Phase 1 has calibers, contracts, and barracks only in thin form. The design needs explicit stats for caliber families/variants, food, army composition (squads/doctrine/consumption), richer contracts (manpower, rewards, type/terrain, success→casualties), and barracks population/duty states — without inventing parallel models beside existing Phase 1 / weapon / soldier schemas.

## What Changes

- Extend `AmmoCaliber` with base damage/penetration (weapon adds flat), gun powder, family + variant; manufacture cost stays `productionCost`.
- Add food defs (nourishment, happiness, cost, recipe gate).
- Add squad/composition types: size, appointed weapon, combine into parent groups, doctrine, consumption rates.
- Extend contracts: manpower, assigned-squad success model, cash/item rewards, combat type/terrain, duration, success→casualty/wound rules.
- Extend barracks: pop slots, duty states (ready / wounded / unassigned), squad creation hooks on `GameState`.
- Wire small coherent hooks (caliber damage formula, manpower gate, pop-slot recruit, default squad fill, light success/wound tagging); defer deep economy/UI loops as tasks.

## Capabilities

### New Capabilities

- `caliber-stats`: Caliber family/variant, base damage/pen, powder, manufacture cost aligned with weapons.
- `food-stats`: Food nourishment/happiness/cost/recipe unlock model.
- `army-composition`: Squads, doctrine, consumption, combine/appoint weapons.
- `contract-combat-stats`: Manpower, rewards, type/terrain, duration, success chance → casualties/wounds.
- `barracks-management`: Pop slots, duty states, squad creation, ready/wounded/unassigned.

### Modified Capabilities

- (main specs not archived yet; deltas live in this change)

## Impact

- `src/core/types.ts`, `catalog.ts`, new `composition.ts` / food stubs, `campaign.ts`, `barracks.ts`, `logistics.ts`, `combat.ts`, `soldier.ts`
- OpenSpec `systems-stats-schema`
- CLI demo must remain runnable
