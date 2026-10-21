# Spec Delta

## Purpose

Owns factory production allocation and warehouse storage limits so manufacturing and stockpiles create meaningful scarcity for Phase 1 logistics.

## ADDED Requirements

### Requirement: Factory line allocation
The workshop/factory MUST accept capacity allocations across supported product lines (at least ammo and rifles) that sum to 100%. Each tick MUST consume funds and raw materials proportional to allocated lines and stock produced output when inputs suffice.

#### Scenario: Split ammo and rifles
- **WHEN** the player sets factory allocation to 60% ammo and 40% rifles with sufficient funds and materials
- **THEN** a production tick produces both ammo (selected caliber) and rifles in proportions reflecting those allocations
- **AND** funds and raw materials decrease

#### Scenario: Insufficient inputs
- **WHEN** a production tick runs without enough funds or raw materials for the allocated lines
- **THEN** the factory produces nothing for underfunded lines
- **AND** the system reports which inputs were short

### Requirement: Warehouse capacity limits
Each warehouse MUST enforce strict maximum volume and weight for stored goods. Stock transfers that would exceed either limit MUST be rejected without mutating inventory.

#### Scenario: Accept stock within limits
- **WHEN** produced ammo fits within remaining warehouse volume and weight
- **THEN** the ammo is added to warehouse inventory

#### Scenario: Reject overfill
- **WHEN** a transfer would exceed warehouse volume or weight
- **THEN** the transfer fails
- **AND** warehouse contents remain unchanged

### Requirement: Inventory categories
The warehouse MUST track raw materials, weapons, and ammo by caliber as separate stock entries with weight and volume contributions.

#### Scenario: Ammo tracked by caliber
- **WHEN** ammo of the selected caliber is stored
- **THEN** warehouse inventory exposes a distinct stock entry for that caliber including quantity, weight, and volume
