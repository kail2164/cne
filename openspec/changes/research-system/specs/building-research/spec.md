# Spec Delta

## Purpose

Building research unlocks advanced housing, warehouses, factory tiers, and stub garage/shipyard entries. Some items may require a building before unlock/production.

## ADDED Requirements

### Requirement: Building node kinds
The catalog MUST include building nodes for housing expansion, medium warehouse, factory tiers workshop→industrial, plus garage and shipyard stubs.

#### Scenario: Factory workshop research
- **WHEN** `building-factory-workshop` is unlocked
- **THEN** the player may buy a workshop factory tier

### Requirement: Gate higher factory tiers
Buying a factory tier above blacksmith MUST require the matching building research unlock. Blacksmith MUST remain buyable without research.

#### Scenario: Workshop gated
- **WHEN** workshop research is not unlocked
- **THEN** `buyFactory(workshop)` fails with a research-gate message

### Requirement: Housing and warehouse effects
Unlocking expanded housing MUST increase `barracksPopSlots`. Unlocking medium warehouse MUST raise warehouse weight and volume caps.

#### Scenario: Housing unlock
- **WHEN** `building-housing-expanded` is researched
- **THEN** `barracksPopSlots` increases by 20

### Requirement: Garage and shipyard stubs
Garage and shipyard building nodes MUST exist as stubs without enabling vehicle production this phase.

#### Scenario: Garage unlock
- **WHEN** `building-garage` is researched
- **THEN** the unlock is recorded but vehicle factory output remains deferred
