# Proposal

## Why

Contracts are a tiny fixed list with a hard Phase-1 lock on non-local tiers. The campaign needs a **board of up to 10 jobs**, **tier progression** after enough completions, and higher tiers that demand a stronger army while paying better rewards.

## What Changes

- Add a contract **board** (≤10 job ids) filled from a tiered pool; refill on campaign start and when jobs leave the board.
- Track **completions toward next tier** (≥20 victories to advance Local → Province → Interstate → National → Global).
- Gate acceptance by **unlocked tier** plus stronger manpower/power for higher-tier jobs; scale rewards upward by tier.
- Update CLI to show board, tier progress, and gates; keep demo runnable (one local victory).

## Capabilities

### New Capabilities

- `contract-board`: Board capacity, fill/refill rules, pick-from-board acceptance.
- `tier-progression`: Completion counters, unlock next regional tier, stronger gates and better rewards.

### Modified Capabilities

- (none archived in main specs)

## Impact

- New `board.ts`, GameState fields, catalog pool, logistics readiness, combat finalize, CLI
