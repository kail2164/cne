# Proposal

## Why

Phase 1 weapons only store coarse fields (`basePower`, weight, cost). Combat and future logistics need a full ballistics/handling profile so caliber and rifle choice create meaningful trade-offs beyond a single power number.

## What Changes

- Extend the existing `Weapon` type with an explicit stats schema (units documented) covering velocity, accuracy, ranges, fire/reload rates, reliability, cost, dimensions, capacity, handling, wear, recoil, penetration, and damage.
- Seed all five 1910 starter bolt-actions in the catalog with plausible placeholder values.
- Map manufacture cost to the existing factory `productionCost` (funds); keep warehouse `weight`/`volume` and `materialCost` for logistics.
- Replace `basePower` with `damage` as the primary damage stat; update company power and combat firepower to use `damage` plus a small reliability/fire-rate modifier.
- Leave deeper combat uses (MoA hit chance by range, wear/jams over magazines, recoil/handling in elite/individual fire) as follow-on tasks in this change.

## Capabilities

### New Capabilities

- `weapon-stats`: Canonical weapon ballistic and handling stats, catalog seeding for 1910 rifles, and the Phase 1 combat fields that consume them.

### Modified Capabilities

- (none archived yet — Phase 1 specs still live only under the prior change; this change owns the weapon-stats capability going forward)

## Impact

- `src/core/types.ts`, `src/core/catalog.ts`, `src/core/combat.ts`, `src/core/barracks.ts`
- OpenSpec change `weapon-stats-schema`
- No new runtime dependencies
