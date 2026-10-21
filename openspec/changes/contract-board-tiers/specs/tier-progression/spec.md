# Spec Delta

## Purpose

Defines regional tier unlocks after enough job completions, with higher tiers requiring a stronger army and granting better rewards.

## ADDED Requirements

### Requirement: Tier ladder
Unlocked regional scale MUST progress Local → Nearby Provinces (province) → Interstates → National → Global.

#### Scenario: Start local
- **WHEN** a campaign starts
- **THEN** the current unlocked tier is local

### Requirement: Twenty completions to advance
The player MUST complete at least 20 victorious jobs at the current tier progress counter to unlock the next tier.

#### Scenario: Advance after twenty wins
- **WHEN** victorious completions toward the next tier reach 20 and a higher tier exists
- **THEN** the unlocked tier advances one step
- **AND** the toward-next counter resets

### Requirement: Higher tier gates
Jobs at higher tiers MUST require greater manpower and/or combat power than local jobs.

#### Scenario: Province harder than local
- **WHEN** comparing a typical province job to a typical local job
- **THEN** province manpowerRequired or minPower is strictly greater

### Requirement: Better rewards at higher tiers
Higher-tier jobs MUST offer greater cashReward (and typically loot) than lower-tier jobs of similar role.

#### Scenario: Reward scaling
- **WHEN** comparing seeded local vs national template rewards
- **THEN** national cashReward is greater than local cashReward

### Requirement: Locked tier cannot accept
Accepting a job whose tier is above the campaign's unlocked tier MUST fail.

#### Scenario: Province before unlock
- **WHEN** unlocked tier is local
- **AND** the player attempts a province job
- **THEN** acceptance is rejected citing tier lock
