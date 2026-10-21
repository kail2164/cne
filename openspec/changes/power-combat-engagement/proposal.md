# Proposal

## Why

Monthly combat still uses a flat firepower volley and fixed enemy return damage. That ignores soldier count quality, morale, experience, and weapon range/pen matchups. Engagement needs a real power model and first-strike rules by combat type.

## What Changes

- Introduce a **force power** score from size, loadout quality, morale (loyalty), experience, and enemy force profile.
- Drive monthly combat steps through an **engagement model**: initiative by combat type, hit chance, range, penetration, and `damage×size` vs `hp×size`.
- When out-ranging or out-armoring the foe, incoming damage probability is very low.
- Escort jobs: frontline vs backline encounter tables (enemy forces vs thieves).
- Surface power / first-strike / damage lines in the combat log; keep demo runnable.

## Capabilities

### New Capabilities

- `force-power`: Company and enemy power accounting for matchup and combat inputs.
- `engagement-combat`: Initiative, volleys, hit/range/pen damage, range/armor advantage.

### Modified Capabilities

- `monthly-combat`: Monthly step uses engagement resolution instead of flat firepower×1.35.

## Impact

- New `src/core/power.ts`; updates to `combat.ts`, `barracks.ts` / logistics power, types (`CombatLogEntry`), CLI combat log display.
