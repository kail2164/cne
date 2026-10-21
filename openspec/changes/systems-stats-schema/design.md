# Design

## Context

See proposal.md. Existing `AmmoCaliber.stoppingPower` feeds combat; contracts use `minTroops`/`lootFunds`; company is a flat soldier list; no food/squads/pop caps.

## Goals / Non-Goals

**Goals:** Schema + catalogs for caliber family/variant, food, squads, extended contracts, barracks duty/pop; small hooks so demo still runs.

**Non-Goals:** Full food economy ticks, UI for squad editor, multi-squad contract optimizer, terrain XP grind loop, building-driven pop upgrades.

## Decisions

### Caliber
- Add `familyId`, `variant`, `baseDamage`, `basePenetration`, `gunPowderAmount` (grains).
- Remove `stoppingPower`; combat uses `baseDamage + weapon.damage`.
- Penetration available as `basePenetration + weapon.penetration` (logged/factor light; full pen sim deferred).
- `CALIBER_FAMILIES` lists allowed variants; starters use `ball`.

### Food
- `FoodDef` + `FOODS` catalog (hard biscuit, stew, tinned meat placeholders).
- `isFoodUnlocked(state, foodId)` checks `recipeId` vs `researchUnlocked`.
- Happiness→loyalty long-term deferred.

### Composition
- `Squad` on `GameState.squads`; doctrine enum; consumption template by doctrine.
- Helpers: `createSquad`, `combineSquads`, `assignSoldiersToSquad`, `doctrineConsumption`.

### Contract
- Replace dual meaning: `manpowerRequired` (was minTroops), `cashReward` (was lootFunds); keep `minPower`, opposition fields for tick sim.
- Add `itemRewards`, `combatType`, `terrain`, `durationMinutes`, `baseSuccessChance`.
- `estimateSuccessChance(state, contract)`: base + squad count bonus − over-assign waste − terrain XP bonus (fieldExperience stub).

### Barracks
- `barracksPopSlots` default 40 (starter barracks).
- Soldier: `duty`, `squadId`, `woundedRestTicks`.
- Recruit respects pop slots; auto `ensureReserveSquad` / fill for demo so combat still has assigned troops.
- Ready = alive, armed, hp full-ish, duty assigned|ready, not wounded.

### Combat hook (small)
- Damage formula switch to baseDamage+weapon.damage.
- After battle: `applySuccessCasualties` — if success≈100%, convert tick KIA back to living wounded=0; if lower, mark some dead as wounded with rest. Keep tick sim; adjust post-pass so demo still wins with some wounds possible.

Actually for "100% success leaves intact" — estimateSuccessChance for well-prepared local demo should be high (~90+) not always 100. At 100 only when overkill. Simpler: successChance reduces extra casualty pressure; post-process: `woundInsteadOfKill = success/100` chance to revive as wounded.

### Demo
- Auto-create "1st Squad" and assign recruits so manpower/squad model works without new CLI steps.

## Risks

- **[Risk] Power formula change** → Retune if demo fails manpower/power gates.
- **[Risk] Scope creep** → Defer economy ticks explicitly in tasks.

## Open Questions

- Exact over-assignment penalty curve for many squads (defer tuning).
- Supply itemization (med/grenade ids) vs abstract supply points (abstract for now).
