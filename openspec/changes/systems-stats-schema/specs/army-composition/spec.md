# Spec Delta

## Purpose

Defines squad/fire-team composition: configurable size, appointed weapons, combining into larger groups, doctrine, and per-squad consumption of food/ammo/supplies.

## ADDED Requirements

### Requirement: Squad configuration
A squad MUST have an id, name, target size, member soldier ids, doctrine (offensive / balance / defensive / support), optional appointed weapon id, optional parent squad id for combining, and consumption rates for food, ammo, and supplies per day.

#### Scenario: Create squad
- **WHEN** a squad is created with size N and doctrine balance
- **THEN** it stores those fields and starts with an empty or partial member list up to N

### Requirement: Combine squads
Squads MUST be combinable under a parent squad/group id without deleting child identity in Phase 1 schema.

#### Scenario: Attach child to parent
- **WHEN** squad A is combined into parent P
- **THEN** A's `parentSquadId` equals P's id

### Requirement: Consumption model
Each squad MUST declare daily consumption of food units, ammo rounds, and supply units (med kits/grenades/etc. as abstract supply points until itemized).

#### Scenario: Offensive burns more
- **WHEN** comparing default consumption templates
- **THEN** offensive doctrine templates use at least as much ammo as defensive templates
