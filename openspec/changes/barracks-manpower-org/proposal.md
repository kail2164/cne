# Proposal

## Why

Recruiting currently auto-arms from warehouse and skips monthly upkeep. Reserves, loyalty/desertion, meal quality, and a real infantry hierarchy (fire team → division) are needed so manpower is an economy, not just a pop counter. Vehicles stay out of scope.

## What Changes

- Recruit costs **money + 1 pop**; unarmed = **reserve** (still paid/fed).
- **Arm** requires ≥1 weapon and ≥1 magazine of ammo; shared carry weight (ammo/gear) from strength.
- Monthly **salary + meal** upkeep; shortfalls cut loyalty; loyalty &lt; 40 raises desertion chance.
- Better meals and mission victory raise loyalty; failed/retreat missions cut it.
- Soldier roster list; infantry **OrgUnit** hierarchy fire team → division (commanders from roster).
- CLI: list, recruit, arm, fire team / squad (platoon if light); higher echelons schema-ready.

## Capabilities

### New Capabilities

- `manpower-economy`: recruit/arm/reserve, salary/food/loyalty/desertion, carry weight, meal plan.
- `infantry-org`: fire team → division schema and assignment helpers (vehicles excluded).

### Modified Capabilities

- Barracks recruit no longer auto-consumes rifles; monthly end-turn runs upkeep.

## Impact

- `types`, `barracks`, new `org.ts` / `upkeep.ts` / `gear.ts`, `turn`, `combat` morale, `composition`, CLI/demo.
