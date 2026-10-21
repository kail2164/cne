# Spec Delta

## Purpose

Technology research nodes grant percentage (or flat) boosts to manpower, morale, production, and success chance.

## ADDED Requirements

### Requirement: Tech catalog entries
The research catalog MUST include technology nodes with `kind: "tech"` and one or more boost effects targeting manpower, morale, production, or successChance.

#### Scenario: Drill tech listed
- **WHEN** listing research nodes of kind tech
- **THEN** at least one tech that boosts successChance is present (e.g. `tech-drill`)

### Requirement: Stacked tech boosts
Unlocked tech boosts MUST stack additively when queried (e.g. two +5% production → +10%).

#### Scenario: Production boost applied
- **WHEN** `tech-logistics` (+10% production) is unlocked
- **THEN** monthly factory output quantities are multiplied by 1.10 (floor after multiply)

### Requirement: Manpower and morale effects
Manpower techs MUST increase effective barracks capacity. Morale techs MUST improve loyalty retention during monthly upkeep (reduced desertion pressure or loyalty floor).

#### Scenario: Recruiting tech
- **WHEN** `tech-recruiting` is unlocked
- **THEN** barracks pop slots increase by the tech’s flat manpower bonus
