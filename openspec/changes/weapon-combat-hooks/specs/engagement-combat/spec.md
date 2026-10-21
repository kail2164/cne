# Spec Delta

## Purpose

Extends monthly engagement so hit chance and volleys consume weapon MoA/range, wear-adjusted reliability, and recoil/handling/reload tempo. (Main `engagement-combat` spec may still live only under `power-combat-engagement` until archive.)

## ADDED Requirements

### Requirement: MoA range and wear in engagement volleys
Monthly volley damage MUST use hit chance from soldier accuracy + weapon MoA, real `effectiveRangeM80pct` / `maxRangeM30pct` bands, and wear-adjusted reliability; damage MUST also scale by a tempo/control factor from recoil, handling, reload, and capacity.

#### Scenario: Volley reduces opposition with hooks
- **WHEN** friendly forces fire with ammo remaining
- **THEN** opposition HP decreases by a computed damage amount and the combat log reflects hit / tempo detail

### Requirement: Weapon condition wear during engagement
Each monthly friendly volley that expends ammo MUST apply magazine wear to participating loadouts using `ammoCapacity` and `wearPerMagazine`.

#### Scenario: Condition drops after a firing month
- **WHEN** a combat month consumes soldier ammo
- **THEN** average friendly weapon condition after the step is less than or equal to before (strictly less when any magazine fraction is expended)
