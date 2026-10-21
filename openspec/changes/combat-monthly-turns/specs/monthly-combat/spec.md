# Spec Delta

## Purpose

Moves contract combat onto the monthly end-turn cycle: contracts declare turns needed, missions progress one combat step per end-turn, and minute-tick mission loops are removed from play.

## ADDED Requirements

### Requirement: Contract turns needed
Each contract MUST declare `turnsNeeded` as the number of monthly end-turns required for the mission timeline (months).

#### Scenario: Local contract has turns
- **WHEN** the Phase 1 local contract is listed
- **THEN** it exposes a positive `turnsNeeded` value

### Requirement: Accept starts active mission
Accepting a contract when ready MUST create an active mission with remaining turns equal to `turnsNeeded`, without instantly resolving combat.

#### Scenario: Accept does not finish fight
- **WHEN** the player accepts a local contract
- **THEN** an active mission is present with remaining turns > 0
- **AND** rewards are not granted yet

### Requirement: End turn advances combat
While an active mission exists, ending a turn MUST apply one monthly combat step (ammo use, opposition damage, casualties) and decrement remaining turns.

#### Scenario: Mid-mission end turn
- **WHEN** a mission has remaining turns > 1 and opposition remains
- **AND** the player ends the turn
- **THEN** remaining turns decrease by 1
- **AND** a combat log entry for that month is recorded

### Requirement: Mission resolution
The mission MUST resolve when opposition HP reaches 0 (victory), the force is wiped or forced to retreat (defeat/retreat), or remaining turns reach 0 with opposition still up (time expiry / retreat). Resolution applies success-chance wound model and rewards on victory.

#### Scenario: Victory mid-timeline
- **WHEN** opposition HP hits 0 before turns remaining hit 0
- **THEN** the mission resolves as victory and active mission clears

### Requirement: No separate minute-tick mission loop
Campaign play MUST NOT require a separate real-time or multi-tick minute combat loop to progress a contract; monthly end-turn is the progress driver.

#### Scenario: CLI path
- **WHEN** the player accepts a contract and ends turns until it finishes
- **THEN** combat completes without invoking an instant multi-tick simulator as the primary path
