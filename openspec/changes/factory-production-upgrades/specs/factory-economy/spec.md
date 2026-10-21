# Spec Delta

## Purpose

Defines buyable factory tiers, upgrade stages with +50% cumulative output, 2× same-tier pricing, and stage-5 dual manufacture slots.

## ADDED Requirements

### Requirement: Starting blacksmith
A new campaign MUST start with one blacksmith at stage 1 whose base cycle output is 250 ammo or 5 weapons.

#### Scenario: Fresh campaign plant
- **WHEN** a campaign is created
- **THEN** exactly one blacksmith factory exists at stage 1

### Requirement: Upgrade stages
Each factory MUST support stages 1–5 where stage N output equals tier base × 1.5^(N−1). Reaching stage 5 MUST unlock a second manufacture slot.

#### Scenario: Stage 2 output
- **WHEN** a blacksmith is upgraded to stage 2
- **THEN** ammo capacity becomes floor(250 × 1.5) = 375 (or weapons floor(5 × 1.5))

### Requirement: Same-tier 2× purchase price
Buying another factory of a tier already purchased MUST cost 2× the previous purchase price paid for that tier.

#### Scenario: Second blacksmith
- **WHEN** the player buys a second blacksmith after paying $800 for the first paid copy
- **THEN** the price is $1600

### Requirement: Five tiers
The catalog MUST define five factory tiers with increasing build cost, base output, and unit production cost multiplier.

#### Scenario: Tier ladder
- **WHEN** listing factory tiers
- **THEN** blacksmith through industrial are available with distinct build costs
