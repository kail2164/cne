# Conflict Never Ends (CNE)

Army-building game where the player takes part in **multiple conflicts** over time — with logistics that hurt when you get them wrong.

## Vision

- **Build and grow an army** — units, composition, and upgrades matter.
- **Enter distinct conflicts** — each fight is a chapter, not one endless battle.
- **Supply the fight** — caliber choice, factory allocation, warehouse limits, and ammo risk shape outcomes.

## Phase 1 (1910 text prototype)

Pure TypeScript core (`src/core`) + CLI adapter (`src/index.ts`):

1. Pick a starting **caliber family** (unlocks matching bolt-action)
2. Allocate **factory** lines (ammo / rifles) and run production ticks
3. Stock the **warehouse** (volume/weight capped)
4. **Recruit** a company and issue ammo loadout
5. Accept a **Local** contract and watch a **timed combat log**

Research trees, vehicles/garages, and higher contract tiers are stubbed for later phases. Architecture keeps game rules out of the UI so Phaser/Pixi/React can sit on the same core later.

## Requirements

- Node.js 18+ (20+ recommended; OpenSpec CLI wants ≥20.19)

## Setup

```bash
npm install
```

## Play

Interactive Phase 1 loop:

```bash
npm start
```

Non-interactive demo (no prompts):

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

## Status

Phase 1 MVP is playable via CLI. Balance numbers are tunable constants in `src/core/catalog.ts`.
