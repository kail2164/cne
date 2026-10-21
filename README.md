# Conflict Never Ends (CNE)

Army-building game where the player takes part in **multiple conflicts** over time — with logistics that hurt when you get them wrong.

## Vision

- **Build and grow an army** — units, composition, and upgrades matter.
- **Enter distinct conflicts** — each fight is a chapter, not one endless battle.
- **Supply the fight** — caliber choice, factory allocation, warehouse limits, and ammo risk shape outcomes.

## Phase 1 (1910 text prototype)

Pure TypeScript core (`src/core`) + CLI adapter (`src/index.ts`):

1. Pick a starting **caliber family** (unlocks matching bolt-action)
2. Set the **factory** to one product (`ammo` or `rifles`) — **money only**, locked for the month
3. **End turn** → production resolves and the calendar advances (**1 cycle = 1 month**)
4. **Recruit** / issue loadout / **accept a contract** (`turnsNeeded` months) — each **End turn** fights one combat month until the mission resolves

Research trees, vehicles/garages, and higher contract tiers are stubbed for later phases. Architecture keeps game rules out of the UI so Phaser/Pixi/React can sit on the same core later.

## Requirements

- Node.js 18+ (20+ recommended; OpenSpec CLI wants ≥20.19)

## Setup

```bash
npm install
```

## Play

Interactive (menu includes **End turn**):

```bash
npm start
```

In the menu: choose **2) End turn** to resolve factory output and advance one month. You can end multiple turns at once when prompted.

Non-interactive demo:

```bash
npm run demo
```

## Project layout

```
src/
  core/          # pure game logic (no I/O)
    types.ts
    catalog.ts
    campaign.ts
    warehouse.ts
    factory.ts
    turn.ts
    barracks.ts
    logistics.ts
    combat.ts
    index.ts
  index.ts       # CLI / --demo
openspec/        # OpenSpec config + changes
.cursor/         # OpenSpec Cursor skills & commands
```

## OpenSpec

```bash
openspec --version
openspec list
openspec status --change phase1-1910-text-prototype
```

In Cursor chat: `/opsx-propose`, `/opsx-apply`, etc.

## Weapon stats

`Weapon` carries a full 1910 ballistics/handling profile (m/s, MoA, ranges, rpm, %, kg, mm, etc.).  
**Live in Phase 1 combat:** `damage`, `fireRateRpm`, `reliabilityPct` (plus logistics `productionCost` / `weight`).  
**Schema ready, sim deferred:** MoA/range hit chance, wear, recoil, handling, reload cadence — see OpenSpec change `weapon-stats-schema`.

## Soldier stats

`Soldier` sheet: HP, stamina, accuracy, agility, strength, weight (kg), salary, loyalty, experience, up to **5 perk slots** (%-boost model; catalog stubbed).  
Weight caps agility (lighter↑) and strength (heavier↑). Stamina ≤ 0 → **−40%** combat contribution.  
Loadout includes `gearIds[]` alongside weapon/ammo.  
**Live:** accuracy / light str+agi / experience / exhaustion + stamina drain.  
**Deferred:** perk catalog, food-from-weight, gear encumbrance, HP wounds, salary ticks — see `soldier-stats-schema`.

## Turns, factory & combat

- **1 cycle = 1 month.** End turn advances the calendar and resolves factory + active mission combat.
- **Factory:** one product (ammo|rifles), money only, locked until end turn.
- **Contracts:** `turnsNeeded` months; accept starts a mission; each end turn = one combat month step (no separate minute-tick loop).
- Try: `npm start` → accept local contract → **2) End turn** until mission resolves (or `npm run demo`).

## Systems stats (OpenSpec `systems-stats-schema`)

- **Caliber:** family/variant, `baseDamage`/`basePenetration` (+ flat weapon bonuses), gun powder grains, manufacture cost
- **Food:** nourishment, happiness (can be negative), cost, recipe unlock (`FOODS` catalog)
- **Composition:** squads, doctrine, consumption, combine/appoint helpers
- **Contracts:** manpower, cash/item rewards, combat type/terrain, duration, success→KIA/wounded
- **Barracks:** pop slots, duty states, default squad fill on recruit

**Wired now:** caliber damage formula, manpower gate, pop-cap recruit, default squad, success/wound pass.  
**Deferred:** daily consumption/happiness economy, multi-squad optimizer, building pop upgrades, variant ballistics.

## Status

Phase 1 MVP is playable via CLI. Balance numbers are tunable constants in `src/core/catalog.ts`.
