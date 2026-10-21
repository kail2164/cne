# Spec Delta

## Purpose

Wires deferred weapon stats (MoA, range bands, wear, recoil, handling, reload, capacity) into monthly engagement combat.

## ADDED Requirements

### Requirement: MoA and range bands in hit chance
Friendly engagement hit chance MUST combine soldier accuracy with weapon MoA-derived accuracy, and MUST use the weapon's `effectiveRangeM80pct` / `maxRangeM30pct` bands for the range factor (full ≤ effective; lerp between effective and max; low beyond max).

#### Scenario: Tighter MoA hits more often
- **WHEN** two otherwise identical friendly forces engage at the same range
- **THEN** the force with lower average `accuracyMoaAt200m` has equal or higher hit chance

### Requirement: Magazine wear degrades reliability
Expending ammunition in a combat month MUST reduce loadout `weaponCondition` by magazines expended (`rounds / ammoCapacity`) times `wearPerMagazine`. Effective reliability used in hit chance MUST fall as condition falls.

#### Scenario: Wear after firing
- **WHEN** a soldier expends at least one magazine worth of ammo in a monthly engagement
- **THEN** that loadout's `weaponCondition` is lower after the step than before

### Requirement: Recoil handling reload tempo
Volley damage MUST be scaled by a tempo/control factor derived from weapon `recoil`, `handling`, `reloadSeconds`, and `ammoCapacity` (with soldier strength/agility for control). Faster reload / better handling MUST not reduce damage relative to a slower, clumsier peer under otherwise equal stats.

#### Scenario: Faster cycle deals more
- **WHEN** two rifles differ mainly in reload speed and magazine capacity favoring a shorter mag cycle
- **THEN** the faster-cycle rifle contributes a higher tempo factor to its force profile
