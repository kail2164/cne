# Spec Delta

## Purpose

Provides a text CLI (and non-interactive demo mode) that exercises the full Phase 1 loop against the pure game core without embedding rules in the UI layer.

## ADDED Requirements

### Requirement: End-to-end CLI loop
The CLI MUST allow the player to: choose a starting caliber, recruit and set company loadout, allocate factory capacity toward ammo, run production into the warehouse, accept a Local Contract, and view a timed combat log including ammo, casualties, outcome, and loot.

#### Scenario: Interactive happy path
- **WHEN** the player completes each step of the Phase 1 CLI in order with valid inputs
- **THEN** combat runs to completion
- **AND** the console shows a combat log with ammo, casualties, outcome, and loot fields

### Requirement: Non-interactive demo mode
The CLI MUST support a `--demo` (or equivalent) mode that runs a scripted happy-path Phase 1 sequence without waiting for interactive prompts.

#### Scenario: Demo completes
- **WHEN** the demo mode is invoked
- **THEN** it prints the Phase 1 sequence results and exits successfully without requiring stdin

### Requirement: Core decoupling
The CLI MUST import game rules only from the pure core API and MUST NOT embed factory, warehouse, or combat formulas in the CLI module.

#### Scenario: Logic lives in core
- **WHEN** a future UI replaces the CLI
- **THEN** the same core modules can run the Phase 1 loop without the CLI module
