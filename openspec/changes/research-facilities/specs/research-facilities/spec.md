# Spec Delta

## Purpose

Research facilities (labs) provide scientist capacity. Five tiers and five upgrade stages mirror the factory ladder, including 2× same-tier purchase pricing.

## ADDED Requirements

### Requirement: Five facility tiers
The catalog MUST define five research facility tiers (shed → academy) with increasing build cost, base scientist capacity, and RP multiplier.

#### Scenario: Tier ladder
- **WHEN** listing research facility tiers
- **THEN** shed, lab, institute, campus, and academy are present with distinct baseBuildCost and baseCapacity

### Requirement: Starting shed
A new campaign MUST start with one free shed at stage 1 (does not count as a paid purchase).

#### Scenario: Fresh campaign lab
- **WHEN** a campaign is created
- **THEN** exactly one shed facility exists at stage 1

### Requirement: Capacity by stage
Facility capacity MUST equal `baseCapacity + (stage − 1)` for stages 1–5.

#### Scenario: Shed stage 3
- **WHEN** a shed is upgraded to stage 3
- **THEN** its scientist capacity is 4 (2 + 2)

### Requirement: Stage efficiency
RP efficiency for a facility MUST be `1.5^(stage−1)` multiplied by the tier’s `tierRpMult`.

#### Scenario: Stage 2 shed
- **WHEN** a shed is at stage 2 with 1 scientist
- **THEN** lab RP that month is floor(1 × 2 × 1.0 × 1.5) = 3

### Requirement: Same-tier 2× pricing
Buying another facility of a tier already purchased MUST cost 2× the previous purchase price paid for that tier.

#### Scenario: Second shed
- **WHEN** the player buys a second shed after paying $500 for the first paid copy
- **THEN** the price is $1000
