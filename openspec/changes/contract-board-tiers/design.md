# Design

## Context

See proposal.md. Today: `LOCAL_CONTRACT` + locked stub; logistics hard-rejects non-local.

## Goals / Non-Goals

**Goals:** Board ≤10; 20 wins to next tier; scaled gates/rewards; CLI board + progress; demo still one local win.

**Non-Goals:** Dynamic procedural generation beyond seeded pool; decaying board refresh without resolution.

## Decisions

### State
```
currentTier: ContractTier  // highest unlocked
jobsCompletedTowardNext: number  // 0..20
jobsCompletedTotal: number
contractBoard: string[]  // ≤10 ids
```

### Pool
Seed ~10–12 contracts per tier in `CONTRACT_POOL`. Keep `local-border-patrol` as a local entry for demo.

### Fill rules
Eligible = tier index ≤ unlocked index, not on board, not active mission id. Prefer current-tier jobs, then lower. Fill to `BOARD_SIZE` (10).

### Completion
Only **victory** increments `jobsCompletedTowardNext` / total. Any resolution removes job from board + refill. At 20: advance tier, reset toward counter, refill (new tier jobs appear).

### Gates (templates)
| Tier | manpower | minPower | cash ~ |
|------|----------|----------|--------|
| local | 12 | 140 | 400 |
| province | 28 | 300 | 900 |
| interstate | 45 | 500 | 1800 |
| national | 70 | 800 | 3500 |
| global | 100 | 1200 | 7000 |

### Acceptance
Must be on board + tier unlocked + manpower/power/ammo checks (remove Phase-1-only lock).

## Risks

- **[Risk] Demo board empty** → always include local-border-patrol on first fill.
- **[Risk] 20 wins too grindy for demo** → demo still single job; progress shown in CLI.
