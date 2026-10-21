# Design

## Context

Research unlocks exist; RP currently +3/month +10 on win. Need scientist/facility loop mirroring factory economy.

## Goals / Non-Goals

**Goals:** Hire scientists; facilities with capacity; 5×5 tier/stage ladder; RP from scientists; salary; CLI; demo green.

**Non-Goals:** Manual scientist reassignment UI; Research Center research-tree gate for shed; per-scientist specialties.

## Decisions

### Scientists
| Field | Value |
|-------|-------|
| Hire cost | **$150** |
| Monthly salary | **$12** (upkeep, with troop salaries) |
| Base RP / cycle | **2 RP** per housed scientist |
| Hire gate | Free facility seat required (auto-assign to first open seat) |

Unhoused scientists are not allowed (hire fails if full). Firing not in Phase 1.

### Facility tiers (first-copy build; next same tier = 2× last paid)
| Tier | Id | Build $ | baseCapacity N | tierRpMult |
|------|-----|---------|----------------|------------|
| 1 | shed | 500 | 2 | 1.0 |
| 2 | lab | 1000 | 3 | 1.1 |
| 3 | institute | 2000 | 4 | 1.25 |
| 4 | campus | 4000 | 5 | 1.4 |
| 5 | academy | 8000 | 6 | 1.6 |

Campaign starts with **one free shed** (stage 1) + **one free scientist** assigned (does not count as paid purchase).

### Stages (1–5)
- Capacity: `baseCapacity + (stage − 1)` (shed: 2→6)
- Efficiency: `1.5^(stage−1)` vs stage 1
- Upgrade cost stage→stage+1: `round(baseBuild × 0.35 × stage)` (factory formula)

### Monthly RP from labs
```
per facility:
  mult = tier.tierRpMult × 1.5^(stage−1)
  rp  += floor(assignedScientists × RP_PER_SCIENTIST × mult)
```
`RP_PER_SCIENTIST = 2`.

### RP earn (revised)
| Source | Amount |
|--------|--------|
| Flat end-turn | **0** (removed former +3) |
| Scientists in facilities | formula above (primary) |
| Contract victory | **+5 RP** (was +10) |

### Compatibility
- Existing research spend/tree unchanged.
- Demo needs no RP; starting scientist still yields ~2 RP/month (shed stage 1).

## Risks

- **[Risk] Early RP too low** — starter scientist + victory +5 keeps unlocks reachable.
- **[Risk] Salary pressure** — $12/scientist is light vs troop payroll.
