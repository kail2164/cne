# Proposal

## Why

Combat still resolves in an instant multi-tick loop decoupled from monthly end-turns. That fights the new turn model. Contracts need an explicit **turns needed** (months), and combat progress should advance on the same end-turn cycle as factories.

## What Changes

- Add `turnsNeeded` to contracts (months until mission can complete).
- Introduce an **active mission** on game state; accepting a contract starts it; each **end turn** applies one combat month step and decrements remaining turns.
- Resolve when opposition is defeated, force is wiped/retreats, or turns remaining hit zero.
- Remove mission progress via `durationMinutes` / multi-tick instant loops from play.
- Update CLI/demo: accept contract → end turns until resolved.

## Capabilities

### New Capabilities

- `monthly-combat`: Contract turnsNeeded + active mission progressed/resolved on end-turn.

### Modified Capabilities

- (none in archived main specs)

## Impact

- `Contract`, `GameState`, `combat.ts`, `turn.ts`, catalog seeds, CLI
