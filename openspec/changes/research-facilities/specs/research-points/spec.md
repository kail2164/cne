# Spec Delta

## Purpose

Revise RP income so scientists/facilities are the primary monthly source (supersedes flat +3 stipend from research-system).

## ADDED Requirements

### Requirement: Lab-driven monthly RP
Ending a turn MUST award RP from housed scientists via the facility formula and MUST NOT award a flat monthly RP stipend.

#### Scenario: End turn with labs only
- **WHEN** the player ends a turn with one stage-1 shed scientist and no victory bonus that step
- **THEN** researchPoints increases by 2 (lab output) with no additional flat stipend

### Requirement: Reduced contract-win RP
Resolving a mission as a victory MUST award **+5 RP**. Defeat or retreat MUST NOT award this bonus.

#### Scenario: Win awards reduced RP
- **WHEN** an active mission resolves with `won: true`
- **THEN** the campaign gains 5 RP from the victory bonus
