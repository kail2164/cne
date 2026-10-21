# Spec Delta

## Purpose

Defines infantry-only organizational hierarchy from fire team through division. Vehicles are excluded.

## ADDED Requirements

### Requirement: Echelon schema
The game MUST model echelons: fire_team, squad, platoon, company, battalion, brigade, division, each with optional parent, child units, member soldier ids, and a commander soldier id drawn from the roster.

#### Scenario: Fire team bounds
- **WHEN** a fire team is created
- **THEN** it has 3–5 soldier members including its commander

### Requirement: Squad composed of fire teams
A squad MUST attach 2–3 fire teams plus one squad-level commander soldier.

#### Scenario: Form squad
- **WHEN** the player forms a squad from valid fire teams and a free commander
- **THEN** those fire teams list the squad as parent and the squad lists them as children

### Requirement: Higher echelons schema-ready
Platoon through division MUST be creatable in core (size guides per design) even if CLI only exposes fire team and squad initially.

#### Scenario: Create platoon in core
- **WHEN** `createOrgUnit` / attach helpers are called for platoon with 3–4 squads
- **THEN** a platoon OrgUnit exists with those children

### Requirement: No vehicles in infantry tree
Org hierarchy helpers MUST NOT require or attach vehicle entities.

#### Scenario: Infantry only
- **WHEN** listing org echelons
- **THEN** no vehicle echelon is defined
