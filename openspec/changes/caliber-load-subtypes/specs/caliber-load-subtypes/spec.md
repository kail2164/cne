# Spec Delta

## Purpose

Each caliber family exposes three manufacture/combat load subtypes — FMJ, hollow point, and AP — with fixed cost and ballistic multipliers.

## ADDED Requirements

### Requirement: Three load subtypes
Every starter caliber family MUST offer FMJ, hollow_point, and AP ammo entries.

#### Scenario: Mauser family has three loads
- **WHEN** the 7.92×57mm family is inspected in the catalog
- **THEN** FMJ, hollow_point, and AP variants exist with distinct ammo ids

### Requirement: Cost multipliers
Manufacture cost MUST be family base × 1.0 (FMJ), × 1.2 (hollow point), × 2.0 (AP).

#### Scenario: AP costs double FMJ
- **WHEN** AP and FMJ costs for the same family are compared
- **THEN** AP productionCost equals 2× the FMJ productionCost (within rounding)

### Requirement: Damage and penetration profiles
FMJ MUST use baseline dmg/pen. Hollow point MUST have higher damage and lower penetration than FMJ. AP MUST keep baseline (normal) damage and higher penetration than FMJ.

#### Scenario: Hollow point vs FMJ
- **WHEN** hollow_point and FMJ of the same family are compared
- **THEN** hollow_point baseDamage > FMJ baseDamage
- **AND** hollow_point basePenetration < FMJ basePenetration

### Requirement: Default FMJ
New campaigns and caliber selection MUST default the active load subtype to FMJ for factory production and ammo issue unless the player changes it.

#### Scenario: Demo produces FMJ
- **WHEN** the player selects a family and produces ammo without changing subtype
- **THEN** warehouse stock uses the FMJ ammo id for that family

### Requirement: Combat uses selected subtype stats
Effective damage and penetration in combat/power MUST use the loadout's ammo subtype stats.

#### Scenario: Loadout AP raises pen
- **WHEN** soldiers are issued AP of the selected family
- **THEN** effectivePenetration uses the AP catalog entry (higher than FMJ)
