# Spec Delta

## Purpose

Item research covers the small-arms caliber path (caliber → rifle → accessories; 2nd weapon; load subtypes) and personal gear with accessories. Vehicles are Phase 2 stubs only.

## ADDED Requirements

### Requirement: Caliber → primary rifle → accessories
For each starter caliber family the catalog MUST define a caliber node, a primary rifle node (prereq caliber), and at least one accessory node (prereq primary rifle).

#### Scenario: Mosin path
- **WHEN** inspecting the `762x54r` path
- **THEN** nodes exist for the caliber, `mosin-m91`, and at least one `acc-mosin-m91-*` accessory

### Requirement: Second weapon on same caliber
Each family MUST offer a second weapon research node gated by the primary rifle (and optional earliest year metadata).

#### Scenario: Second Mauser
- **WHEN** primary `gewehr-98` is unlocked and RP is sufficient
- **THEN** a second `792x57` rifle node can be spent to unlock

### Requirement: Starter caliber grant
Selecting a starting caliber MUST auto-unlock that family’s caliber node and primary rifle at no RP cost.

#### Scenario: Select Mauser
- **WHEN** the player selects `792x57`
- **THEN** `caliber-792x57` and `weapon-gewehr-98` appear in `researchUnlocked` without spending RP

### Requirement: Load subtype gates
FMJ MUST be available with the caliber unlock. Hollow-point and AP loads for a family MUST require their own research nodes before factory production or load selection.

#### Scenario: AP gated
- **WHEN** AP load research for the selected family is not unlocked
- **THEN** setting load subtype to AP fails

### Requirement: Gear research
Personal gear beyond the starter pouch MUST be researched before factory gear production can output that item. Gear accessories MUST require their parent gear.

#### Scenario: Bandolier gated
- **WHEN** `gear-ammo-bandolier` is not unlocked
- **THEN** factory gears production does not output bandoliers (defaults to unlocked pouch only)

### Requirement: Vehicle item stubs
Vehicle research nodes MUST be listable with `kind: "vehicle"` but MUST NOT be spendable to a playable unlock this phase.

#### Scenario: Vehicle spend blocked
- **WHEN** the player attempts to research a `vehicle-*` node
- **THEN** the action fails with a Phase 2 / deferred message
