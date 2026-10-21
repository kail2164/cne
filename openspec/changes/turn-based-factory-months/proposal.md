# Proposal

## Why

Multi-line %-split factory ticks and free-running production ticks do not match the intended Phase 1 feel. Factories should be simple money sinks making one product per month, and the campaign should advance on explicit player end-turn (1 cycle = 1 month).

## What Changes

- Replace factory %-allocation ticks with a **single product slot** (ammo or rifles), **money-only** cost, locked for the current cycle.
- Add turn-based calendar: year/month/turn; **end turn** resolves that month’s production and opens a new cycle.
- Update CLI/demo to choose factory product and end turns instead of multi-tick production loops.
- Document that contract/combat `durationMinutes` / combat ticks are **mission-internal**; the campaign calendar only advances on end turn.

## Capabilities

### New Capabilities

- `turn-cycle`: Turn-based play where ending a turn starts a new monthly cycle.
- `factory-simple`: Money-only, one-item factory with product lock until next cycle.

### Modified Capabilities

- (none archived in main specs yet)

## Impact

- `GameState`, `factory.ts`, new `turn.ts`, `campaign.ts`, CLI `src/index.ts`, README / project-context
- Removes `factoryAllocation` multi-line model from active play
