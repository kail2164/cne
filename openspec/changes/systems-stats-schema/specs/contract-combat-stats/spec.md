# Spec Delta

## Purpose

Extends contracts with manpower gates, squad assignment success trade-offs, cash/item rewards, combat type/terrain, duration, and success-chance-driven casualty/wound outcomes.

## ADDED Requirements

### Requirement: Manpower gate
A contract MUST declare manpower required. Acceptance MUST fail when living ready/assigned manpower is below that requirement.

#### Scenario: Under strength rejected
- **WHEN** living troops available for the contract are below `manpowerRequired`
- **THEN** acceptance is rejected with a manpower failure

### Requirement: Contract metadata
Each contract MUST expose cash reward, optional item rewards, combat type (offense / defense / convoy / escort / scout), terrain (urban / desert / jungle / plains / forest), duration in minutes, and a base success chance (0–100).

#### Scenario: Local contract seeded
- **WHEN** the Phase 1 local contract is listed
- **THEN** all metadata fields above are present with finite values

### Requirement: Success chance drives casualties
Estimated success chance MUST influence casualties: at 100% success, squads remain intact (no success-model casualties); lower success increases wounded and/or KIA. Wounded soldiers MUST carry a rest duration.

#### Scenario: Perfect success intact
- **WHEN** estimated success chance is 100%
- **THEN** the success-model adds zero KIA and zero wounded

#### Scenario: Low success wounds
- **WHEN** estimated success chance is well below 100% after a resolved fight
- **THEN** some casualties MAY be tagged wounded with rest time instead of or in addition to KIA per the design rules
