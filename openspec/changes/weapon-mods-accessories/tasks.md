# Tasks

## 1. Mod catalog and resolver

- [ ] 1.1 Add the nine mods from design.md (id, slot, factors, flats, stat deltas) plus `parseVariant`, `variantId`, and `resolveWeapon`. Plain ids stay the catalog id. Modified ids are `{base}@{sorted mods}`. Apply slot order and the clamps in the design. Verify with `npx tsx` that a Gewehr with only `mod-barebone` has lower funds, lower materials, and worse reliability or handling; only `mod-scope-2x` has higher funds, better MoA or effective range, and worse handling; sling plus hardened bolt costs more than either alone; two sight mods are rejected; reliability stays inside 50–99.
- [ ] 1.2 Export the catalog and helpers from `src/core/index.ts`. Verify `npx tsc --noEmit` passes and `getRifle("gewehr-98")` still returns the unmodified catalog row.

## 2. Research

- [ ] 2.1 Remove `acc-{rifle}-bayonet` and `acc-{rifle}-sling` from `buildFamilyItemNodes`. Add one research node per mod id, with the RP, `requires`, `requiresBuilding`, and `earliestYear` from the design. Leave helmet liner, armor plate, and kit lamp nodes in place. Verify the research catalog contains no `acc-*-bayonet` or `acc-*-sling` id, those three gear nodes remain, `canResearch` rejects `mod-scope-2-8x` when the year is before 1924 or `mod-scope-2x` is locked, and rejects `mod-hardened-bolt` without workshop plans.

## 3. Factory

- [ ] 3.1 Resolve weapon quotes, rejection, and month output through `resolveWeapon`. Unlock-check the base rifle, then require every mod researched and one mod per slot. `listManufacturable` still lists plain rifles only. Verify a slot set to `gewehr-98@mod-scope-2x` stores that id and spends more funds per gun than plain `gewehr-98`, a slot with no mods still stores `gewehr-98` at catalog cost, and an unresearched or double-sight variant is rejected. `npm run demo` still completes on the plain starter rifle.

## 4. Issuing

- [ ] 4.1 `equipSoldiers` and the optional variant argument on `armSoldiers` withdraw and return the variant id via `resolveWeapon` (weight and volume included). Do not substitute another variant when stock runs out. Omitting the variant on `armSoldiers` still arms the plain primary rifle. Verify one scoped rifle in stock issued to two soldiers changes only one soldier, a formation can hold the scoped id while other soldiers hold the barebone id, and replacing a gun puts the previous variant back on its own warehouse row.

## 5. Combat

- [ ] 5.1 Fire, wear, and power reads of an issued weapon use `resolveWeapon`. Ammo-out opposition damage uses `0.2 + 0.15 × bayonetShare`, and share zero stays ×0.2. Verify at the same range a 2× variant has a higher hit chance than the plain rifle, and an ammo-out tick with bayonets on every rifle deals more opposition damage than the same force without `mod-bayonet`.

## 6. HTML

- [ ] 6.1 Arsenal accessories tab lists researched weapon mods with slot and cost up or cost down, and is not a "to come" placeholder. Weapon rows count every variant of that rifle in warehouse and equipped totals, and the warehouse cell names each pile. Verify in the browser after researching the sling.
- [ ] 6.2 Factory weapon lines keep the plain-rifle select and add one radio group per slot that has a researched mod, defaulting to service. Set writes the variant id. A locked line restores that rifle and those mods. Verify in the browser that aperture and 2× cannot be selected together, and that a sling month increases the sling pile rather than the plain pile.
- [ ] 6.3 Loadout weapons list only warehouse rows with quantity above zero, labeled with the resolved name. Verify in the browser that a barebone pile is listed, an unbuilt scoped combination is not, and equipping a formation with one pile and other soldiers with another leaves those two weapon ids on the roster.

## 7. Integration

- [ ] 7.1 Run `npx tsc --noEmit` and `npm run demo`. Confirm the demo still arms and fights with plain rifle ids.

## Workflow follow-up

- Archive when requested.
