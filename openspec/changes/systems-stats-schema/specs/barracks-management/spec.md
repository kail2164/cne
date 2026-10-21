# Spec Delta

## Purpose

Defines barracks population slots and soldier duty states (ready, wounded, unassigned) plus squad creation so army size and assignment are manageable.

## ADDED Requirements

### Requirement: Population slots
The campaign MUST track barracks pop slots as an army size cap. Recruitment MUST fail or cap when living soldiers would exceed pop slots. Buildings MAY raise the cap later; Phase 1 starts with a fixed starter value.

#### Scenario: Cap blocks recruit
- **WHEN** living soldiers equal pop slots
- **THEN** further recruitment is rejected or recruits zero

### Requirement: Duty states
Each soldier MUST have a duty state among: unassigned (reserve), assigned (in a squad), wounded (recovering), or ready (healthy, armed, assignable/combat-ready). Fresh recruits MUST start unassigned until placed in a squad.

#### Scenario: Fresh recruit unassigned
- **WHEN** a soldier is newly recruited
- **THEN** their duty is `unassigned` and `squadId` is null

### Requirement: Squad creation from barracks
The barracks layer MUST support creating a squad and assigning unassigned soldiers into it up to squad size, flipping duty to assigned/ready when armed.

#### Scenario: Fill squad
- **WHEN** enough unassigned armed soldiers exist and a squad of size N is filled
- **THEN** up to N soldiers gain that `squadId` and leave `unassigned`
