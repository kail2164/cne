# Tasks

## 1. Core types and catalog

- [x] 1.1 Add `src/core/types.ts` with Soldier, Loadout, Weapon, AmmoCaliber, FactoryLine, Warehouse, Vehicle, Contract, GameState interfaces and verify TypeScript compiles via `npx tsc --noEmit` once modules are wired
- [x] 1.2 Add `src/core/catalog.ts` with five caliber families, matching rifles, start constants, and one Local contract; verify exports list five calibers and one local contract
- [x] 1.3 Add `src/core/campaign.ts` (`createCampaign`, `selectCaliber`) and verify selecting a caliber unlocks its rifle and blocks a second selection

## 2. Supply chain modules

- [x] 2.1 Implement `src/core/warehouse.ts` store/withdraw with volume/weight limits; verify overfill rejects without mutation
- [x] 2.2 Implement `src/core/factory.ts` allocation + production tick into warehouse; verify 60/40 split consumes funds/materials and stocks ammo+rifles when capacity allows
- [x] 2.3 Implement `src/core/logistics.ts` readiness check against contract mins; verify underpowered company fails acceptance check

## 3. Force and combat modules

- [x] 3.1 Implement `src/core/barracks.ts` recruit + company ammo issue from warehouse; verify ammo-per-soldier withdraws N×P rounds
- [x] 3.2 Implement `src/core/combat.ts` timed tick simulator with ammo consumption, exhaustion penalty, log, loot; verify ammo-starved run fails or retreats and well-supplied run can win
- [x] 3.3 Add `src/core/index.ts` barrel exporting public API; verify CLI can import from `./core/index.js`

## 4. CLI demo and docs

- [x] 4.1 Rewrite `src/index.ts` for Phase 1 interactive loop + `--demo`; remove stub dependency on old `src/game.ts` (delete or leave unused); verify `npm run demo` completes with combat log (ammo, casualties, outcome, loot)
- [x] 4.2 Update root `README.md` for Phase 1 run instructions and architecture sketch; verify documented commands match package.json scripts
- [x] 4.3 Update Project Context `docs/project-context.md` with short Phase 1 decisions; verify file exists and mentions caliber/supply/combat pillars

## 5. Integration check

- [x] 5.1 Run `npm run demo` end-to-end and confirm console shows caliber → factory → warehouse → loadout → local contract → timed combat log
- [x] 5.2 Run `openspec validate --change phase1-1910-text-prototype` and fix any validation errors

## Workflow follow-up

- Archive the change after review (`/opsx-archive` or `openspec archive`) when the user requests it.
- Sync main specs from the change during archive.
