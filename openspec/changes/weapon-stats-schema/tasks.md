# Tasks

## 1. Schema and catalog

- [x] 1.1 Extend `Weapon` in `src/core/types.ts` with documented unit fields; remove `basePower` in favor of `damage`; verify `npx tsc --noEmit` after call sites update
- [x] 1.2 Reseed `RIFLES` in `src/core/catalog.ts` with plausible 1910 values for all five starters; verify each rifle has distinct stats
- [x] 1.3 Update factory/warehouse call sites if needed so `productionCost`/`weight` still work; verify `npm run demo` still produces rifles

## 2. Combat hook (Phase 1 slice)

- [x] 2.1 Update `companyPower` and combat `firepower` to use `damage` + fire-rate/reliability modifiers; verify demo still completes with a combat log
- [x] 2.2 Document in a short comment or README note which stats are live vs deferred

## 3. Deferred hooks (tracked, not blocking MVP of this change)

- [x] 3.1 Use MoA + range bands for hit chance when engagement distance exists — done in `weapon-combat-hooks`
- [x] 3.2 Apply `wearPerMagazine` to weapon instance condition and jam/reliability over time — done in `weapon-combat-hooks`
- [x] 3.3 Model recoil/handling reload cadence via `reloadSeconds`/`ammoCapacity` — done in `weapon-combat-hooks`

## 4. Docs and validate

- [x] 4.1 Update Project Context with locked weapon-stat units decision; verify file mentions the schema
- [x] 4.2 Run `openspec validate weapon-stats-schema --type change` and fix findings

## Workflow follow-up

- Archive after review when requested.
- Deferred tasks 3.x implemented by change `weapon-combat-hooks`.
