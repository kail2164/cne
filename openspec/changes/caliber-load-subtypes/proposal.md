# Proposal

## Why

Caliber families only expose a single "ball" round. Players need clear load choices: default FMJ, soft-target hollow point, and armor-piercing — with distinct cost and dmg/pen tradeoffs.

## What Changes

- Replace ad-hoc ball/tracer variants with three playable **load subtypes**: FMJ, hollow point, AP.
- Cost multipliers: FMJ **1.0×**, hollow point **1.2×**, AP **2.0×** of family base cost.
- Profiles: FMJ baseline dmg/pen; hollow point high dmg / low pen; AP baseline dmg / high pen.
- Seed all starter 1910 families with all three subtypes; default production/issue to FMJ.
- Wire factory, warehouse stock ids, loadouts, combat effectiveDamage/Penetration, and CLI subtype select.

## Capabilities

### New Capabilities

- `caliber-load-subtypes`: FMJ / hollow_point / AP variants per family with cost and ballistic multipliers.

### Modified Capabilities

- `caliber-stats` (systems-stats): variant enum and seeding for the three load subtypes.

## Impact

- `types.ts`, `catalog.ts`, `campaign.ts`, `factory.ts`, `barracks.ts`, CLI; combat/power consume subtype stats via existing effectiveDamage/Penetration.
