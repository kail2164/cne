# Spec Delta

## Purpose

Defines caliber family/variant stats so round base damage and penetration combine with flat weapon bonuses, with powder and manufacture cost tracked.

## ADDED Requirements

### Requirement: Caliber base damage and penetration
Each ammo caliber MUST expose base damage and base penetration. Effective damage MUST be base damage plus the weapon's flat damage bonus; effective penetration MUST be base penetration plus the weapon's flat penetration bonus.

#### Scenario: Flat weapon bonus
- **WHEN** a soldier fires a weapon chambered for a caliber
- **THEN** combat damage contribution uses caliber `baseDamage` + weapon `damage`
- **AND** penetration uses caliber `basePenetration` + weapon `penetration` when penetration is applied

### Requirement: Family and variant
Each round MUST belong to a caliber family that lists allowed variants (e.g. ball, steel tip, tracer, hollow). Starter 1910 rounds MUST declare family id and variant.

#### Scenario: Starter family linkage
- **WHEN** a starter caliber is read from the catalog
- **THEN** it has a `familyId` and a `variant`
- **AND** that variant is listed on the matching family

### Requirement: Powder and manufacture cost
Each caliber MUST expose gun powder amount and manufacture cost (funds via `productionCost`).

#### Scenario: Factory cost unchanged source
- **WHEN** ammo is manufactured
- **THEN** funds cost per round uses the caliber's `productionCost`
