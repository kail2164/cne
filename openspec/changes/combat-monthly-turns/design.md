# Design

## Context

Factories already resolve on `endTurn`. Combat still uses `simulateCombat` with `maxTicks` / `durationMinutes`. Need one calendar.

## Goals / Non-Goals

**Goals:** `turnsNeeded` on contracts; active mission; one combat step per end-turn; CLI/demo via accept + end turns.

**Non-Goals:** Simultaneous multi-contract missions; pausing missions mid-month without end-turn.

## Decisions

### Model (locked)
**One combat month step per end-turn** while `activeMission` is set. Mission lasts up to `turnsNeeded` months; may end early on wipe/victory.

### Contract fields
- Add `turnsNeeded: number`
- Rename play field to `oppositionDamagePerTurn` (keep seeding from old per-tick values, retuned for monthly scale — higher damage/ammo burn per month since fewer steps)
- Drop play use of `maxTicks`, `durationMinutes` (remove from type)

### ActiveMission
```
{ contractId, turnsNeeded, turnsRemaining, oppositionHp, log, successChance,
  startAmmo, startLiving, dryMonths }
```

### Flow
1. `startContract(state, id)` — readiness check; set activeMission; clone nothing yet (mutate company during steps)
2. `endTurn` order: factory resolve → unlock factory → **progressCombatMonth** (if mission) → calendar advance → wounded tick
3. `progressCombatMonth`: one step; if done, finalize (wounds, loot, clear mission)

### Monthly step scale
With turnsNeeded=2 for local: each step uses heavier volley (`firepower * 1.1`) and opposition damage ~25–30 so 2 months can finish a 380 HP fight with 20 troops.

### CLI
Accept starts mission; status shows remaining turns; end turn prints combat month line; when resolved, print outcome.

## Risks

- **[Risk] Demo too long** → local `turnsNeeded: 2`
- **[Risk] Ammo starvation over months** → issue 35×20=700; monthly burn ~40–80 OK
