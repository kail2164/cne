# Design

## Context

`GameState.researchUnlocked` already gates food recipes. Phase 1 needs a full RP economy and a 1910 unlock tree aligned with calibers, rifles, factory tiers, barracks, and gear.

## Goals / Non-Goals

**Goals:** RP earn/spend; tech boosts; building unlocks; item research (caliber path + gear); factory/housing/warehouse gates; CLI view/spend; demo still runs; vehicles stub only.

**Non-Goals:** Full vehicle research/production; Research Center building UI; persistence; multi-caliber plants; time-gated calendar unlocks beyond optional `earliestYear` metadata.

## Decisions

### RP earn (Phase 1)
| Source | Amount |
|--------|--------|
| Each end-turn (1 month) | **+3 RP** |
| Victorious contract resolution | **+10 RP** (flat all tiers) |

No RP on defeat/retreat. Starting balance **0**. Debug/CLI does not grant free RP except via play.

### RP spend
Each catalog node has `rpCost ≥ 0`. Spend fails if insufficient RP, missing prerequisites, already unlocked, or node is a Phase-2 vehicle stub (`kind: "vehicle"` → reject with stub message).

### Node kinds
`tech | building | item | vehicle`

### Boost targets (tech)
Applied as percent modifiers stacked from unlocked techs:
- `manpower` → barracks pop slot bonus (flat from effect, or % of base)
- `morale` → loyalty floor / reduced desertion pressure in upkeep
- `production` → factory output qty multiplier
- `successChance` → mission success chance / combat edge

### Building unlocks
| Node | Effect |
|------|--------|
| `building-housing-expanded` | +20 `barracksPopSlots` |
| `building-warehouse-medium` | warehouse maxWeight/Volume ×1.5 |
| `building-factory-workshop` | may buy `workshop` tier |
| `building-factory-manufactory` | may buy `manufactory` (prereq workshop research) |
| `building-factory-arsenal` | may buy `arsenal` |
| `building-factory-industrial` | may buy `industrial` |
| `building-garage` | stub flag only |
| `building-shipyard` | stub flag only |

Blacksmith remains free (starting plant). Higher tiers require their research node before `buyFactory`.

### Item research — small arms
Per caliber family:
1. `caliber-{familyId}` — unlock family / FMJ production
2. `weapon-{primaryRifleId}` — primary bolt-action (prereq caliber)
3. `acc-{rifleId}-*` — accessories (prereq primary weapon)
4. `weapon-{secondRifleId}` — 2nd weapon on same caliber (prereq primary; optional `earliestYear`)
5. Load subtypes: FMJ free with caliber; `load-{familyId}-hollow_point` / `load-{familyId}-ap` cost RP

### Item research — gear
`gear-basic-pouch` starter-unlocked. Bandolier / helmet / body-armor / demo-suit + accessory nodes (material, mount, light stubs).

### Starter path (1910)
On `selectCaliber(family)`: auto-unlock `caliber-{id}` + primary `weapon-{rifle}` at **0 RP** (grant, not spend). Demo still picks Mauser and produces without extra research.

### Vehicles
Catalog entries `vehicle-*` with `kind: "vehicle"`; `spendResearch` returns not-ok Phase 2 message. No production wiring.

### CLI
- Status shows RP
- Actions: list available / full tree; research (spend) by id or menu #

## Risks

- **[Risk] Demo breakage** — starter auto-unlock + blacksmith ungated keeps demo green.
- **[Risk] Over-gating factory tiers** — only workshop+ gated; blacksmith free.
