# Design

## Context

`START.recruitCostPerSoldier` ($25) is flat. Need compound scaling and a browser shell.

## Goals / Non-Goals

**Goals:** Lifetime-hire scaling; CLI + HTML price display; Vite UI over core; demo green.

**Non-Goals:** Full CLI parity in HTML; persistence; auth; CSS framework.

## Decisions

### Scaling rule
- Counter: **`lifetimeRecruitsHired`** (increments on each successful hire; never decreases on death/desertion).
- Unit price for the next hire:  
  `unitCost(n) = round(base × (1.2)^floor(n / 10))`  
  where `n = lifetimeRecruitsHired` before that hire, `base = START.recruitCostPerSoldier`.
- Batch of K: sum `unitCost(n), unitCost(n+1), …, unitCost(n+K-1)` then `lifetime += K`.
- Affordability: greedily take as many as funds/slots allow under progressive pricing.

### Examples
| Lifetime before | floor(n/10) | Mult | Unit $ (base 25) |
|-----------------|-------------|------|------------------|
| 0–9 | 0 | 1.0 | 25 |
| 10–19 | 1 | 1.2 | 30 |
| 20–29 | 2 | 1.44 | 36 |

Recruiting 20 from n=0 costs `10×25 + 10×30 = 550`.

### HTML
- Vite root `web/`; entry imports `../src/core/index.ts`.
- Phase 1 panels: status, caliber pick (once), recruit, factory slot, research available/spend, board + accept, end turn, log.
- Architecture: UI calls core ActionResult helpers only.

## Risks

- **[Risk] Demo cost** — 20 recruits now $550 vs $500; still fine vs $6500 start.
