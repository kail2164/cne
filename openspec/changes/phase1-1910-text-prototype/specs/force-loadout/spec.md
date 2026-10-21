# Spec Delta

## Purpose

Covers barracks recruitment and company-level batch loadouts so forces can be fielded with standard rifles and per-soldier ammo payloads for Phase 1 contracts.

## ADDED Requirements

### Requirement: Barracks recruitment
The barracks MUST recruit soldiers into a company when funds and unlocked rifles are available, deducting recruitment cost and assigning the selected caliber's standard rifle.

#### Scenario: Recruit a company
- **WHEN** the player recruits N soldiers with sufficient funds and N available rifles in stock (or newly issued from production stock)
- **THEN** the company gains N soldiers each equipped with the unlocked bolt-action rifle
- **AND** funds decrease by the recruitment cost

#### Scenario: Cannot recruit without rifles
- **WHEN** the player attempts to recruit more soldiers than available rifles
- **THEN** recruitment is rejected or capped at available rifles
- **AND** the system reports the shortfall

### Requirement: Company batch loadout
The system MUST support batch/template loadout for a company: standard rifle plus a configurable bulk ammo-per-soldier count drawn from warehouse stock of the selected caliber.

#### Scenario: Issue ammo payload
- **WHEN** the player sets ammo-per-soldier to P for a company of N soldiers and warehouse has at least N×P rounds
- **THEN** N×P rounds are removed from the warehouse
- **AND** each soldier's loadout carries P rounds of the selected caliber

#### Scenario: Insufficient ammo stock
- **WHEN** warehouse ammo is less than N×P
- **THEN** the loadout issue fails or is capped to available rounds uniformly
- **AND** the system reports remaining shortfall

### Requirement: Deployment readiness fields
A company prepared for a contract MUST expose troop count, estimated combat power, and total ammo payload for logistics and combat systems.

#### Scenario: Readiness summary
- **WHEN** a company has soldiers with rifles and issued ammo
- **THEN** readiness reports include troop count, power estimate, and total rounds carried
