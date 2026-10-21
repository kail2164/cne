# Spec Delta

## Purpose

Defines the weapon stats schema (with units), 1910 catalog seeding, and which combat fields Phase 1 must already consume versus defer.

## ADDED Requirements

### Requirement: Ballistic and range stats
Every `Weapon` MUST expose muzzle velocity (m/s), accuracy MoA at 200 m, max range for ~30% hit potential (m), and effective range for ~80% hit potential (m).

#### Scenario: Ballistics present
- **WHEN** any 1910 starter rifle is read from the catalog
- **THEN** `muzzleVelocityMps`, `accuracyMoaAt200m`, `maxRangeM30pct`, and `effectiveRangeM80pct` are finite numbers with those units

### Requirement: Rate, reliability, and reload stats
Every `Weapon` MUST expose practical fire rate (rpm), reliability (% fire without jam, 0–100), ammo capacity (rounds), gun handling (0–100), and reload time (seconds per full magazine/clip).

#### Scenario: Handling present
- **WHEN** any starter rifle is read
- **THEN** `fireRateRpm`, `reliabilityPct`, `ammoCapacity`, `handling`, and `reloadSeconds` are finite numbers in the stated scales

### Requirement: Physical and cost stats
Every `Weapon` MUST expose manufacture cost as `productionCost` (funds), weight (kg), overall length (mm), barrel length (mm), and ammo caliber id.

#### Scenario: Factory uses manufacture cost
- **WHEN** the factory produces a rifle
- **THEN** funds spent per rifle equal that weapon's `productionCost`

### Requirement: Wear, recoil, penetration, damage
Every `Weapon` MUST expose wear per magazine (condition points on a 0–100 loss scale), recoil (0–100), penetration (0–100), and damage (combat contribution).

#### Scenario: Damage field replaces basePower
- **WHEN** combat or company power is calculated
- **THEN** it uses `damage` rather than a removed `basePower` field

### Requirement: 1910 starter rifles seeded
The five Phase 1 starter bolt-actions (Mosin M1891, Springfield M1903, Lee–Enfield SMLE, Lebel M1886, Gewehr 98) MUST each have plausible placeholder stats consistent with their historical roles.

#### Scenario: Differentiation
- **WHEN** two starter rifles are compared
- **THEN** at least three schema fields differ between them

### Requirement: Phase 1 combat consumes damage and rate/reliability
Combat firepower and company power estimates MUST use weapon `damage` (plus caliber stopping power). Practical fire rate and reliability MUST apply a modifier to delivered damage in Phase 1.

#### Scenario: Higher damage deals more
- **WHEN** otherwise identical forces differ only in weapon damage
- **THEN** the higher-damage force deals more opposition HP damage per combat tick

### Requirement: Deferred advanced combat hooks
Accuracy-by-range (MoA / 30%–80% range bands), magazine wear accumulation, recoil/handling for individual aim, and jam events from reliability rolls MUST remain optional for Phase 1 tick resolution until a later change implements them.

#### Scenario: Schema without full sim
- **WHEN** Phase 1 combat runs
- **THEN** it does not fail if MoA or wear fields are unused beyond being present on the weapon
