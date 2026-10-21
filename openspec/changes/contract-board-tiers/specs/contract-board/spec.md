# Spec Delta

## Purpose

Defines a contract board holding up to 10 available jobs that the player can accept under existing logistics/readiness rules.

## ADDED Requirements

### Requirement: Board capacity
The contract board MUST hold at most 10 job ids at a time.

#### Scenario: Cap at ten
- **WHEN** the board is filled from the pool
- **THEN** it contains ≤ 10 contracts

### Requirement: Initial fill
A new campaign MUST start with a filled board of jobs appropriate to the starting unlocked tier.

#### Scenario: Fresh campaign board
- **WHEN** a campaign is created
- **THEN** the board has between 1 and 10 jobs
- **AND** each job's tier is unlocked for that campaign

### Requirement: Pick from board
The player MUST accept only jobs currently on the board (plus normal readiness checks).

#### Scenario: Off-board rejected
- **WHEN** the player tries to accept a contract id not on the board
- **THEN** acceptance fails

### Requirement: Refill after resolution
When an active mission resolves, that job MUST be removed from the board and the board MUST refill toward 10 from eligible pool jobs not already listed.

#### Scenario: Slot freed
- **WHEN** a board job mission ends
- **THEN** that id is no longer on the board
- **AND** the board size returns toward 10 if eligible jobs remain
