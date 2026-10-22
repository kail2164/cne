# Proposal

## Why

Unlocked rifles are a single factory pattern. A researched bayonet or sling is only a name: it does not change cost, handling, or what the warehouse holds. The company needs manufactured variants of those rifles so a better gun costs more to build and a stripped gun costs less, and so those stocks can be issued to different soldiers.

## What Changes

- Add a shared weapon-mod catalog, researched once and legal on every unlocked rifle. Each mod sits in one slot. Empty slots stay the service pattern.
- Cheap mods cut funds and materials and worsen the gun. Expensive mods raise cost and improve it. Slots keep mutually exclusive choices (one sight, one stock, one furniture kit).
- A factory weapon slot builds one variant: the base rifle plus a legal set of researched mods. The warehouse stores that variant separately from the plain rifle. An unmodified rifle keeps today's stock id.
- Issuing draws a specific variant from stock. The player can put the expensive build on a chosen formation and the cheap build on reserves. There is no new elite rank.
- Combat, wear, and the dry-ammo bayonet tick read the resolved variant, not the plain catalog row.
- **BREAKING:** Remove the per-rifle stub nodes `acc-{rifleId}-bayonet` and `acc-{rifleId}-sling`. Sling and bayonet become shared mods. Personal gear accessories (liner, plate, lamp) stay as they are.

## Capabilities

### New Capabilities

- `weapon-variants`: Mod slots and stat/cost resolution, variant stock identity, and issuing a manufactured variant to chosen soldiers.

### Modified Capabilities

None. `openspec/specs/` has no archived capabilities to delta. Replacement behavior for the per-rifle accessory stubs and for plain-rifle factory output is specified on `weapon-variants`. Earlier change text in `item-research` and `factory-products` is superseded for those two points only.

## Impact

- `src/core/research.ts` (drop per-rifle accessory stubs; add mod nodes), catalog/resolution for mods, `factory.ts` quotes and output, warehouse weapon ids, `barracks.ts` arm/equip, combat wear and the ammo-out bayonet tick, and the HTML arsenal, factory, and loadout screens.
- Plain rifle ids, starter grants, and gear research stay valid. No new persistence format beyond weapon stock ids that already exist.
