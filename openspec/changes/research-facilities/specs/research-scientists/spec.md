# Spec Delta

## Purpose

Hireable scientists produce a fixed amount of research points per monthly cycle when assigned to a research facility, and draw salary during upkeep.

## ADDED Requirements

### Requirement: Hire scientist into free capacity
The player MUST be able to hire a scientist for a fixed cash cost when total facility capacity has a free seat. The new scientist MUST be auto-assigned to a facility with room.

#### Scenario: Hire with open seat
- **WHEN** a shed has capacity 2 and 1 scientist assigned, and funds ≥ hire cost
- **THEN** hire succeeds, scientist count becomes 2, and funds decrease by the hire cost

### Requirement: Fixed RP per scientist per cycle
Each housed scientist MUST contribute a fixed base of **2 RP** per end-turn, scaled by their facility’s tier and stage multipliers.

#### Scenario: Starter shed scientist
- **WHEN** one scientist is assigned to a stage-1 shed (tierRpMult 1.0)
- **THEN** end-turn awards 2 RP from labs (floor(1 × 2 × 1.0 × 1.0))

### Requirement: Scientist salary in upkeep
Each scientist MUST cost a fixed monthly salary paid during upkeep alongside troop salaries.

#### Scenario: Salary billed
- **WHEN** two scientists are employed at $12 each
- **THEN** upkeep includes $24 scientist salary in the salary bill
