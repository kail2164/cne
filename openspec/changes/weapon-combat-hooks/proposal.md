# Proposal

## Why

`weapon-stats-schema` seeded MoA, range bands, wear, recoil, handling, reload, and capacity, but engagement combat only consumes damage / fire-rate / reliability. Those deferred hooks (tasks 3.1–3.3) need to land so rifle choice affects hit chance, reliability over magazines, and monthly tempo.

## What Changes

- Wire **MoA + effective/max range bands** into engagement hit chance (replacing the 1.8× effective approximation).
- Track **weapon condition** on loadouts; apply `wearPerMagazine` from ammo spent / `ammoCapacity`; degrade effective reliability.
- Fold **recoil, handling, reloadSeconds** (with capacity) into a monthly tempo / control factor on volleys.
- Align with the existing power-combat monthly engagement model; keep demo victory path.
- Mark weapon-stats deferred tasks 3.1–3.3 complete.

## Capabilities

### New Capabilities

- `weapon-combat-hooks`: MoA/range hit bands, magazine wear → reliability, recoil/handling/reload tempo in engagement.

### Modified Capabilities

- (none in main specs yet — deltas under this change ADD requirements that complete deferred weapon-stats hooks and extend engagement behavior; archive alongside `power-combat-engagement` / `weapon-stats-schema` when those land in main specs)

## Impact

- `src/core/types.ts` (loadout condition), `power.ts`, `combat.ts`, `soldier.ts`, `barracks.ts`, `catalog.ts`
- OpenSpec change `weapon-combat-hooks`; task checkboxes in `weapon-stats-schema`
- No new runtime dependencies
