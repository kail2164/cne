# Spec Delta

## Purpose

Defines 1910 campaign start conditions: starting base infrastructure and the irreversible choice of one caliber family that unlocks its standard bolt-action rifle.

## ADDED Requirements

### Requirement: Starting infrastructure
At campaign start the player MUST receive one Small Warehouse, one Basic Barracks, one Workshop/Factory, starting funds, and a starting pool of raw materials.

#### Scenario: Fresh campaign inventory
- **WHEN** a new Phase 1 campaign is created
- **THEN** the game state includes exactly one small warehouse, one basic barracks, and one workshop/factory with positive funds and raw materials

### Requirement: Caliber family selection
The player MUST select exactly one of five starting caliber families before production and recruitment unlock. Selection MUST unlock the corresponding 1910 bolt-action rifle and MUST NOT be changeable within the same campaign without a later (out-of-scope) reset flow.

#### Scenario: Choose 7.62x54mmR
- **WHEN** the player selects the 7.62x54mmR family
- **THEN** that caliber and its matching bolt-action rifle become available for production, storage, and loadouts
- **AND** the other four starting families remain locked

#### Scenario: Selection required before factory ammo focus
- **WHEN** the player attempts to allocate factory capacity to ammo before selecting a caliber
- **THEN** the system MUST reject the action until a caliber family is selected

### Requirement: Distinct caliber traits
Each starting caliber family MUST expose distinct production cost, storage weight/volume per round, stopping power, and supply efficiency values used by factory, warehouse, and combat systems.

#### Scenario: Trait differentiation
- **WHEN** two different starting calibers are compared
- **THEN** at least one of production cost, storage weight, storage volume, stopping power, or supply efficiency differs
