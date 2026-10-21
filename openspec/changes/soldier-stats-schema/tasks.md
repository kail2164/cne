# Tasks

## 1. Schema and rules

- [x] 1.1 Extend `Soldier` / `Loadout` / perk types in `types.ts` with unit docs; remove `skill` in favor of `experience`; verify `tsc --noEmit` after call sites update
- [x] 1.2 Add `src/core/soldier.ts` with weight caps, clamp helpers, exhaustion factor, default recruit factory, perk assign (max 5); verify 45 kg strength cap < 90 kg strength cap
- [x] 1.3 Stub `PERKS` / `GEARS` catalog exports (empty or minimal); verify barrel exports compile

## 2. Barracks and combat hooks

- [x] 2.1 Update `recruitSoldiers` / `issueCompanyAmmo` to use default soldier stats and loadout `gearIds`; verify `npm run demo` recruits successfully
- [x] 2.2 Wire combat firepower for accuracy, light strength/agility, stamina drain, and −40% exhaustion; restore stamina after battle; verify demo completes with combat log
- [x] 2.3 Document live vs deferred soldier stats in README briefly

## 3. Deferred (tracked)

- [ ] 3.1 (Deferred) Full perk catalog + apply % boosts in combat/logistics
- [ ] 3.2 (Deferred) Food/supply burn from weight; gear encumbrance vs strength carry checks
- [ ] 3.3 (Deferred) HP-based wounding instead of binary death; salary pay-period economy

## 4. Docs and validate

- [x] 4.1 Update Project Context with soldier-stat decisions; verify weight/exhaustion noted
- [x] 4.2 `openspec validate soldier-stats-schema --type change` and fix findings

## Workflow follow-up

- Archive when requested; implement 3.x in later changes.
