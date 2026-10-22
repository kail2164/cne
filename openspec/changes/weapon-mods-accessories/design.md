# Design

## Context

See proposal.md for why. Rifles are one `Weapon` row each in `RIFLES`. Factory slots store a single `itemId`. Warehouse weapon rows and `Loadout.weaponId` use that same id. `getRifle` only finds catalog ids.

Research already emits `acc-{primaryRifle}-bayonet` and `acc-{primaryRifle}-sling` from `buildFamilyItemNodes`. Nothing in the catalog, factory, or combat reads those ids. The arsenal accessories tab says they are still to come. Gear accessories (liner, plate, lamp) are separate nodes and stay.

`canResearch` already enforces `requires`, `requiresBuilding`, and `earliestYear`. Monthly combat already applies MoA, rate, reliability, and `wearPerMagazine` from the weapon on the soldier (`firepower.ts`, `combat.ts`). The ammo-out tick multiplies force damage by 0.2 and does not look at fittings.

`openspec/specs/` has no archived copy of `item-research` or `factory-products`. This change's spec is `weapon-variants`.

## Goals / Non-Goals

**Goals:**

- One mod catalog, one resolver, one stock id scheme, used by research, factory, warehouse, issuing, and combat.
- Numeric tradeoffs fixed below so a barebone rifle is cheaper and worse and a scoped rifle is costlier and steadier.
- Factory and loadout UI pick a built variant without listing the cartesian product of every mod.

**Non-Goals:**

- Refitting a rifle already in the warehouse. A different variant is a new build; issuing swaps whole guns.
- Per-rifle accessories, consumable cleaning kits, or a new elite rank.
- Changing raw `damage` or `penetration` on the rifle. Quality shows up as accuracy, range, handling, reliability, and wear. The bayonet only changes the ammo-out tick.
- Personal gear accessories.

## Decisions

### Variant id is the stock id

Unmodified rifle: existing catalog id (`gewehr-98`).

Modified rifle: `{baseId}@{modId}+{modId}` with mod ids sorted lexicographically.

`gewehr-98@mod-hardened-bolt+mod-sling`

`@` and `+` do not appear in current rifle or mod ids. `Loadout.weaponId`, factory `itemId`, and warehouse `itemId` stay one string. No second field.

Alternative considered: `modIds[]` on the slot and the loadout. Rejected because the warehouse row is only an item id, so the array would have to be serialized anyway.

### Resolve on read, leave `getRifle` as the catalog

`parseVariant(id)` returns `{ baseId, modIds }`. A plain id has an empty mod list.

`resolveWeapon(id)` copies the base `Weapon`, sets `id` to the stock id, and appends short labels to `name` (`Gewehr 98 (sling, bolt)`). Unknown base or unknown mod returns undefined.

`getRifle` keeps returning only `RIFLES` rows. Unlock checks use the base id (`isWeaponUnlocked(state, baseId)`), then each mod id must be researched and each slot must appear once.

Stat call sites switch to `resolveWeapon`: factory quote and output, `soldierWeaponFactor`, equip/return weight and volume, `firepower.ts`, wear in `combat.ts`, power estimates, and UI labels. Missing a site makes a variant look like no gun.

### Apply order and clamps

Apply mods in slot order: furniture, stock, bolt, sight, carry, upkeep, melee.

- Funds: `max(base × 0.5, base × product(costFactor)) + sum(flatFunds)`, then round to 2 decimals. Factory tier multiplier still applies on top, as it does today.
- Materials: `max(1, round(base × product(costFactor)))`. Flat optic funds do not add materials.
- Weight: `max(2, base + sum(weightKg))`. Volume scales by `resolvedWeight / baseWeight` so a heavier optic takes more warehouse space.
- Length: `max(400, base + sum(lengthMm))`.
- MoA: `max(0.8, base × product(moaFactor))`.
- Effective and max range: multiply, then round. Effective range at least 50 m.
- Rate: `max(6, base × product(rpmFactor))`.
- Reliability: add, then clamp to 50–99.
- Handling: add, then clamp to 20–95.
- Recoil: add, then clamp to 20–95.
- Wear per magazine: `max(0.2, base × product(wearFactor))`.

The 50% funds floor does not bind on the current cheap pair (0.78 × 0.92 = 0.72).

### Mod table

| Id | Slot | RP | Gate | Cost × | Flat $ | Weight | Other |
|---|---|---|---|---|---|---|---|
| `mod-sling` | carry | 6 | — | 1.04 | 0 | +0.10 kg | handling +6 |
| `mod-bayonet` | melee | 8 | — | 1.06 | 0 | +0.40 kg, length +350 mm | handling −4. Ammo-out only. |
| `mod-short-stock` | stock | 8 | — | 0.92 | 0 | −0.25 kg, length −80 mm | handling +8, recoil +6, MoA ×1.12, effective range ×0.88, max range ×0.90 |
| `mod-barebone` | furniture | 10 | — | 0.78 | 0 | −0.45 kg | handling −10, reliability −6, recoil +4, wear ×1.25 |
| `mod-hardened-bolt` | bolt | 12 | `requiresBuilding: building-factory-workshop` | 1.18 | 0 | — | reliability +4, wear ×0.70 |
| `mod-cleaning-kit` | upkeep | 8 | — | 1.08 | 0 | +0.15 kg | reliability +2, wear ×0.75 |
| `mod-aperture` | sight | 8 | — | 1.06 | 0 | +0.05 kg | MoA ×0.92, handling +2 |
| `mod-scope-2x` | sight | 14 | requires `mod-aperture` | 1.28 | +8 | +0.35 kg | MoA ×0.72, effective range ×1.15, handling −8, rpm ×0.90 |
| `mod-scope-2-8x` | sight | 18 | requires `mod-scope-2x`, `earliestYear: 1924` | 1.55 | +18 | +0.55 kg | MoA ×0.55, effective range ×1.35, max range ×1.10, handling −14, rpm ×0.80 |

Research node id equals mod id. `effects: [{ type: "unlock_item", itemId: modId }]`. No `nation` field, so every company can research them. Short labels for names: sling, bayonet, short stock, barebone, bolt, kit, aperture, 2×, 2–8×.

Delete the bayonet and sling pushes inside `buildFamilyItemNodes`. Do not add per-weapon copies for later rifles.

### Factory chooses mods beside the rifle

`listManufacturable` keeps listing plain rifles. The weapon `<select>` stays that list.

When the chosen product is a weapon, a fieldset shows one radio group per slot that has at least one researched mod, plus "service" selected by default. Unresearched mods are absent. Set writes `weapons:{variantId}`. A locked slot restores the base rifle in the select and the saved mods on the radios.

`rejectItem` rejects two mods in one slot, an unknown mod, or an unresearched mod. Month resolve already stores `itemId` and spends `catalogCost`; pointing those at `resolveWeapon` is enough for cost and the warehouse row.

### Issuing does not substitute

`equipSoldiers` already takes a weapon id and returns the previous gun to the warehouse. Pass the variant id through `resolveWeapon` for weight, volume, and the stored id.

The loadout weapon list becomes weapon warehouse rows with quantity greater than zero. Label is the resolved name. Unbuilt combinations are not radio options. Checked soldiers and a formation already exist as the apply target, so the scoped stock can go to a formation and the barebone stock to other soldiers.

`armSoldiers` gains an optional variant id. Omitted, it still arms the plain primary rifle of the selected caliber (CLI demo). Passed, it withdraws that stock id and does not fall back to another variant when the pile runs out.

### Combat

Fire and wear read `resolveWeapon(loadout.weaponId)`. Groups already split on MoA, rate, magazine, and reload, so a scoped rifle and a plain rifle do not share a hit chance.

Ammo-out opposition multiplier becomes `0.2 + 0.15 × bayonetShare`, where share is living armed soldiers whose variant includes `mod-bayonet`, divided by living armed soldiers. Share zero keeps today's ×0.2. Friendly casualty pressure on that tick stays as it is. Bayonet does not change aimed-fire damage.

### Arsenal

Accessories tab drops the "to come" marker. It lists researched weapon mods with slot and "cost up" or "cost down". Researched gear accessories (liner, plate, lamp) stay as extra rows with their existing blurb, since they are not gun mods.

The weapons table's warehouse and equipped counts include every variant of that base rifle, and the warehouse cell names each pile (`4 plain, 2 barebone`).

## Risks / Trade-offs

- [Risk] A stat path still calls `getRifle` on a variant id and treats the soldier as unarmed. → Switch the call sites listed above and cover resolve, factory output, equip, and a scoped hit-chance comparison with tests.
- [Risk] Slot radios and the select disagree after a re-render. → The saved `itemId` is the only source; radios are parsed from it.
- [Risk] Players who already researched `acc-*-sling` lose that node id. → Those nodes never changed a gun. No id rewrite. Campaigns are in memory only.
- [Risk] A 2× scope's +$8 flat is a large jump on a cheap rifle. → Intended. Glass is a flat extra, not a percent of a Lebel.

## Migration Plan

No save file. Removing the stub nodes is the whole migration. Plain rifle ids already in a running session stay the unmodified gun.

Rollback is reverting the change. Existing plain stock ids need no rewrite.
