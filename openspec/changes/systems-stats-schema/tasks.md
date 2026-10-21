# Tasks

## 1. Caliber + food schemas

- [x] 1.1 Extend `AmmoCaliber` / families/variants; reseeds catalog; switch combat to `baseDamage + weapon.damage`; verify `npm run demo` still wins or completes
- [x] 1.2 Add `FoodDef` + `FOODS` + unlock helper; verify locked recipe rejects via helper unit path (call from a tiny assert in demo or tsc-safe export)

## 2. Composition + barracks

- [x] 2.1 Add squad/doctrine/consumption types + `composition.ts` helpers; verify create/combine/assign compile
- [x] 2.2 Add pop slots + soldier duty/squadId/woundedRest; recruit respects cap; auto-fill default squad for demo; verify recruit + demo

## 3. Contract stats + light combat hook

- [x] 3.1 Extend `Contract` metadata; update logistics manpower gate; seed local/locked contracts; verify under-strength fails
- [x] 3.2 Add `estimateSuccessChance` + light post-combat wound tagging; verify demo runnable
- [x] 3.3 README + project-context brief update

## 4. Deferred (tracked)

- [ ] 4.1 (Deferred) Daily food/ammo/supply consumption ticks & happiness→loyalty
- [ ] 4.2 (Deferred) Multi-squad contract assignment UI/optimizer & terrain XP grind
- [ ] 4.3 (Deferred) Building-driven pop slot upgrades & full wounded recovery loop
- [ ] 4.4 (Deferred) Caliber variant ballistics differences in combat (tracer/hollow/etc.)

## 5. Validate

- [x] 5.1 `openspec validate systems-stats-schema --type change`

## Workflow follow-up

- Archive when requested.
