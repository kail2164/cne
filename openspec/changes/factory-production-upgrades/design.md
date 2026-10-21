# Design

## Context

Current factory: one `FactoryState` with `monthlyCapacity` → ammo `cap×2.5` or rifles `cap/8`. Demo needs 250 ammo / ~5 rifles blacksmith baseline and upgrade/buy loops.

## Goals / Non-Goals

**Goals:** Starting blacksmith; 5 stages (+50% cumulative); 2× same-tier buy; 5 tiers; stage-5 dual slots; product kinds ammo/weapons/gears/grenades; vehicles stub; monthly lock; CLI; demo green.

**Non-Goals:** Full vehicle production; research gates for tiers; multi-caliber lines beyond selected family/subtype; %-split within a slot.

## Decisions

### Tiers (build cost = first copy; next same tier = 2× last paid for that tier)
| Tier | Id | Build $ | baseAmmo | baseWeapons | baseGears | baseGrenades | unitCostMult |
|------|-----|---------|----------|-------------|-----------|--------------|--------------|
| 1 | blacksmith | 800 | 250 | 5 | 6 | 15 | 1.0 |
| 2 | workshop | 1600 | 300 | 6 | 8 | 20 | 1.1 |
| 3 | manuf | 3200 | 375 | 8 | 10 | 28 | 1.25 |
| 4 | arsenal | 6400 | 450 | 10 | 14 | 36 | 1.4 |
| 5 | industrial | 12800 | 550 | 12 | 18 | 45 | 1.6 |

Campaign starts with **one free blacksmith** (stage 1); does not count as a paid purchase (first paid blacksmith still starts at $800).

Track `tierPurchaseCount[tierId]` and `tierNextPrice[tierId]` (starts at baseBuild; after buy, next = paid × 2).

### Upgrade stages
`stage ∈ 1..5`. Output multiplier = **1.5^(stage−1)** vs tier base (document: +50% each stage vs previous).
Upgrade cost to go stage→stage+1: `tier.baseBuild × 0.35 × stage` (stage 1→2 uses ×1, etc.).
Stage 5: `slots = 2`; else `slots = 1`.

### Slots
Each slot: `{ product: FactoryProductKind | null, locked: boolean }`.
Product kinds: `ammo | weapons | gears | grenades | vehicles`.
Ammo/weapons use selected caliber family + load subtype / chambered rifle.
Gears: produce `basic-pouch` by default (or selected gear id later).
Grenades: `mills-bomb` stub.
Vehicles: settable but resolve yields 0 + note "vehicles deferred".

Lock: setting a product locks that slot until endTurn clears locks on all slots.

### Monthly resolve (per factory, per active slot)
```
mult = 1.5^(stage-1)
qty  = floor(tier.baseX * mult)   // X by product
cost = qty * unitCost * tier.unitCostMult
```
Pay from funds (salary-style: produce what you can afford). Store to warehouse.

### Compatibility
- Deprecated `GameState.factory` removed; use `factories: OwnedFactory[]`.
- `setFactoryProduct(product)` → sets factories[0].slots[0] (demo/CLI convenience).
- `CycleProductionResult` aggregates all plants; optional `lines[]` detail.

### Demo
Starting blacksmith: set weapons ×4 months (5×1.0=5 rifles/mo → 20 rifles), ammo ×3 (250/mo). Still enough for 20 troops.

## Risks

- **[Risk] Demo rifle count** — blacksmith 5/mo ×4 = 20 exactly; OK.
- **[Risk] Funds** — production + upkeep + upgrades; demo does not buy/upgrade.
