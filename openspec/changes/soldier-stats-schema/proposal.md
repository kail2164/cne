# Proposal

## Why

Phase 1 soldiers only store `alive`, `skill`, and a weapon/ammo loadout. Logistics and combat need a full soldier profile (HP, stamina, accuracy, agility, strength, weight, pay, loyalty, experience, specialties) so recruitment and exhaustion create meaningful trade-offs aligned with weapon stats.

## What Changes

- Extend `Soldier` with unit-documented stats and encode weight↔agility / weight↔strength caps.
- Model stamina exhaustion as **−40%** to combat-relevant effective stats when stamina is depleted.
- Add up to **5 perk slots** with a %-boost perk model; perk catalog remains stubbed for later.
- Extend `Loadout` with gear/equipment id list tied to the existing company loadout flow.
- Seed recruit defaults; wire combat for stamina drain + exhaustion penalty + accuracy (and light strength/agility) factors.
- Defer full perk catalog, food consumption from weight, and deep gear encumbrance as explicit tasks.

## Capabilities

### New Capabilities

- `soldier-stats`: Soldier attribute schema, weight coupling rules, stamina exhaustion, perk slots, loadout gear refs, and Phase 1 combat hooks that consume them.

### Modified Capabilities

- (none in main `openspec/specs/` yet)

## Impact

- `src/core/types.ts`, new helpers (e.g. `src/core/soldier.ts`), `barracks.ts`, `combat.ts`, catalog stubs for perks/gear
- OpenSpec change `soldier-stats-schema`
- No new runtime dependencies
