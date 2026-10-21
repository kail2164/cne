# Spec Delta

## Purpose

Defines per-factory manufacture slots and product identity across ammo, weapons, gears, and grenades (vehicles stub).

## ADDED Requirements

### Requirement: Slot product identity
Each manufacture slot MUST select a product kind (ammo, weapons, gears, grenades, or vehicles) locked for the current month until end turn.

#### Scenario: Lock for month
- **WHEN** a slot is set to ammo
- **THEN** it cannot switch to weapons until the month ends

### Requirement: Ammo and weapons playable
Ammo slots MUST produce the selected load subtype; weapon slots MUST produce the rifle for the selected caliber family.

#### Scenario: Ammo line uses FMJ default
- **WHEN** an ammo slot resolves with default load subtype FMJ
- **THEN** warehouse stock increases for the FMJ ammo id

### Requirement: Gears and grenades playable
Gear and grenade slots MUST produce catalog stub items into the warehouse.

#### Scenario: Gear production
- **WHEN** a gear slot resolves with funds available
- **THEN** gear stock quantity increases

### Requirement: Vehicles stub
Vehicle product MAY be selected but MUST NOT produce vehicles in Phase 1 (deferred note in resolve).

#### Scenario: Vehicle slot idle output
- **WHEN** a slot is set to vehicles and the month resolves
- **THEN** no vehicle stock is added and a deferred note is recorded
