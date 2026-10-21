# Spec Delta

## Purpose

Defines local-region contracts and timed combat with dynamic ammo consumption so logistical preparation determines mission success or costly failure.

## ADDED Requirements

### Requirement: Local contract acceptance
The system MUST offer at least one Local Region contract with minimum power, minimum troop count, and recommended ammo payload. Acceptance MUST be blocked when readiness checks fail.

#### Scenario: Accept when ready
- **WHEN** the company meets the contract's minimum troops and power and has issued ammo
- **THEN** the contract can be accepted and combat simulation begins

#### Scenario: Reject underpowered force
- **WHEN** the company is below the contract minimum power or troop count
- **THEN** acceptance is rejected with the failed check listed

### Requirement: Timed combat ticks
Combat MUST advance in discrete ticks. Each tick MUST consume ammo based on living rifle-armed soldiers and caliber supply efficiency, apply casualties using stopping power versus opposition, and emit a log entry.

#### Scenario: Combat tick with ammo
- **WHEN** a combat tick runs and the force still has ammo
- **THEN** ammo decreases
- **AND** a log entry records ammo remaining, casualties this tick, and force status

#### Scenario: Combat ends on victory or wipe
- **WHEN** opposition is reduced to zero or the player's force is wiped out
- **THEN** combat ends
- **AND** the result includes outcome, casualty totals, ammo expended, and loot if victorious

### Requirement: Ammo exhaustion penalty
If ammo reaches zero before victory, subsequent ticks MUST apply a severe penalty (elevated casualties and/or forced retreat/failure) representing sidearms and bayonets only.

#### Scenario: Dry magazines
- **WHEN** ammo reaches zero while opposition remains
- **THEN** later ticks apply elevated casualty rates or force a retreat/failure
- **AND** the combat log notes ammo exhaustion

### Requirement: Contract scale placeholder
Phase 1 MUST model Local Region contracts. Higher tiers (Nearby Provinces through Global) MAY be represented as locked placeholders without playable acceptance.

#### Scenario: Local available
- **WHEN** the player lists contracts in Phase 1
- **THEN** at least one Local Region contract is available
- **AND** higher tiers are not acceptably playable
