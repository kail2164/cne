# Design

## Context

Phase 1 recruit withdraws rifles and dumps everyone into a flat squad. Food catalog exists but is unused. Need manpower economy + infantry-only org tree.

## Goals / Non-Goals

**Goals:** Money+pop recruit; arm/reserve rules; monthly salary/food/loyalty/desertion; meal + mission morale; shared carry weight; OrgUnit fire team→division schema; CLI for roster + fire team/squad (platoon if cheap); demo still wins.

**Non-Goals:** Vehicles in this hierarchy; full brigade/division CLI builders; grenade inventory sim beyond weight stubs; daily food ticks.

## Decisions

### Recruit / arm
- `recruitSoldiers(n)`: cost `n × recruitCost`, consume `n` pop slots, create soldiers with `loadout: null`, duty `unassigned` (reserve).
- `armSoldiers(ids?)`: for each target, withdraw 1 rifle + `weapon.ammoCapacity` rounds of selected ammo; set loadout; duty ready/assigned.
- **Armed** iff loadout has weaponId and ammoRounds ≥ 1 magazine (ammoCapacity). Else reserve.
- Manpower/power gates count **armed living** only; reserves still cost upkeep (warn in recruit message).

### Carry weight
```
capacityKg = 8 + strength × 0.35   // ~27 kg at str 55
carried = ammoRounds×weightPerRound + Σ gear.weightKg
```
Issue ammo / add gear rejects if over capacity. Gear catalog: basic-pouch → bandolier → body-armor → demo-suit (ammo capacity bonus on pouches/bandolier).

### Meal plan + upkeep (per end-turn month)
- `GameState.mealPlanId` default `army-stew`.
- Salary bill = Σ living.salary.
- Food bill = living × food.productionCost × `MEALS_PER_MONTH` (20).
- Pay what funds allow (salary first, then food). Unpaid salary → −8 loyalty; unpaid food → −10 loyalty; paid good meal (happiness&gt;0) → +happiness loyalty; biscuit → happiness penalty.
- After loyalty updates: if loyalty &lt; 40, desertion chance = `(40−loyalty)×1.5%` (cap 45%); on desert remove from roster (free pop).

### Mission morale
On finalize: victory → +6 loyalty (cap 100); retreat/defeat → −12 loyalty (floor 0).

### Infantry org (commanders = roster soldiers)
| Echelon | Children / members | Size guide |
|---------|-------------------|------------|
| fire_team | 3–5 soldiers; 1 commanderSoldierId among them | 3–5 |
| squad | 2–3 fire teams + 1 squad CDR (not double-counted in a team) | ~7–16 |
| platoon | 3–4 squads + CDR | |
| company | 4–5 platoons + CDR | |
| battalion | 4–5 companies + CDR | |
| brigade | 4–5 battalions + CDR | |
| division | 2–5 brigades + CDR | |

`OrgUnit { id, name, echelon, soldierIds, childUnitIds, commanderSoldierId, parentUnitId, doctrine, … }`  
Keep legacy `squads` synced as fire_team/squad views for terrain XP hooks, or migrate logistics to formations.

### CLI (playable)
- List roster (armed/reserve, loyalty, unit).
- Recruit, arm, set meal, issue ammo (carry-aware).
- Form fire team from soldier #s; form squad from fire team #s + CDR.
- Platoon optional if time; battalion+ create helpers exist, CLI deferred.

### Demo
Recruit → arm all → issue ammo → accept → end turns (unchanged victory path). Upkeep runs but with 20 troops + stew stays affordable.

## Risks

- **[Risk] Demo funds drain** → stew+salary ~20×(8 + 1.2×20) ≈ $640/mo; starting funds OK for short demo.
- **[Risk] Power gate breaks if unarmed** → demo must arm before accept.
