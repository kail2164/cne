# Spec Delta

## Purpose

Defines force power accounting for friendly companies and enemy opposition so readiness gates and engagement combat share one model.

## ADDED Requirements

### Requirement: Friendly power inputs
Friendly force power MUST account for living soldier count, loadout quality, morale (loyalty), and experience.

#### Scenario: Recruits with rifles contribute power
- **WHEN** the company has living soldiers with weapon loadouts
- **THEN** company power is positive and increases with more soldiers or better loadouts

### Requirement: Enemy force profile
Each contract engagement MUST derive an enemy force profile (size, quality, range, penetration, armor, damage/hp per entity) from contract opposition stats and tier baselines.

#### Scenario: Local job has enemy profile
- **WHEN** a local contract is engaged
- **THEN** an enemy profile with size ≥ 1 and opposition HP pool consistent with the contract is available

### Requirement: Shared readiness power
Contract readiness `minPower` checks MUST use the same friendly power accounting as engagement inputs (not a divergent ad-hoc score).

#### Scenario: Gate uses force power
- **WHEN** readiness is assessed for a board job
- **THEN** reported power matches the force-power module computation for that company
