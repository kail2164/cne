# Proposal

## Why

Flat +3 RP/month ignores the intended research economy. Phase 1 needs **hireable scientists** producing fixed RP per cycle and **research facilities** that cap how many can work, with a factory-like tier/upgrade ladder.

## What Changes

- Hire scientists (cash + capacity); each housed scientist yields a **fixed RP/month**, modified by facility tier/stage efficiency.
- Build/upgrade **research facilities** (5 tiers × 5 stages); capacity N per plant; 2× same-tier buy pricing.
- **RP earn model:** primary income from scientists; remove flat +3/month; reduce contract-win RP.
- Scientist **salary** in monthly upkeep.
- CLI: hire, build, upgrade, list capacity / projected RP/month.
- Campaign starts with one free shed + one free scientist so organic RP still exists.

## Capabilities

### New Capabilities

- `research-scientists`: hire, salary, fixed RP/cycle when assigned to a facility.
- `research-facilities`: 5 tiers, 5 stages, capacity, efficiency, 2× pricing.

### Modified Capabilities

- `research-points`: earn rules shift to scientist output (+ reduced victory bonus).

## Impact

- `types`, new `labs.ts`, `research.ts` constants, `campaign`, `turn`, `upkeep`, CLI/demo status.
