# Spec Delta

## Purpose

Defines turn-based campaign time where the player manages within a turn, ends the turn to start a new cycle, and each cycle equals one month.

## ADDED Requirements

### Requirement: Calendar fields
Game state MUST track calendar year, month (1–12), and an absolute turn/cycle index.

#### Scenario: Fresh campaign date
- **WHEN** a new campaign is created
- **THEN** it starts at year 1910, month 1 (or documented starter month), turn 1

### Requirement: End turn advances one month
Ending the turn MUST advance the calendar by exactly one month (rolling year when month exceeds 12), increment the turn index, and begin a new cycle.

#### Scenario: Month rollover
- **WHEN** the player ends a turn in December
- **THEN** the next cycle is January of the following year

### Requirement: Management before end turn
The player MUST be able to perform management actions (caliber if unset, factory product choice, recruit, loadout, contracts) during the current turn before ending it.

#### Scenario: CLI end turn
- **WHEN** the player chooses to end the turn in the CLI
- **THEN** the cycle resolves and the new month is reported

### Requirement: Combat vs calendar
Mission combat duration (minutes / internal ticks) MUST NOT automatically advance the campaign calendar; only end-turn does.

#### Scenario: Fight same month
- **WHEN** a contract combat resolves during a turn
- **THEN** year/month remain unchanged until end turn
