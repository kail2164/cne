# Spec Delta

## Purpose

Defines soldier attribute schema with units, weight↔agility/strength coupling, stamina exhaustion (−40%), perk slots, and loadout gear references for Phase 1.

## ADDED Requirements

### Requirement: Soldier core attributes with units
Every `Soldier` MUST expose HP (hit points), max HP, stamina (points), max stamina, accuracy (0–100), agility (0–100), strength (0–100), body weight (kg), salary (funds per pay period), loyalty (0–100), and experience (points).

#### Scenario: Recruit has full schema
- **WHEN** a soldier is recruited in Phase 1
- **THEN** all core attribute fields are present as finite numbers in the stated units/scales

### Requirement: Weight couples agility and strength caps
Body weight MUST cap maximum agility and strength: lighter soldiers MAY reach higher agility and MUST have a lower strength ceiling; heavier soldiers MAY reach higher strength and MUST have a lower agility ceiling. A ~45 kg (~100 lb) body MUST NOT allow top-tier strength.

#### Scenario: Light soldier strength cap
- **WHEN** a soldier weighs about 45 kg
- **THEN** their allowed strength maximum is materially below that of a ~90 kg soldier

#### Scenario: Heavy soldier agility cap
- **WHEN** a soldier weighs about 90 kg
- **THEN** their allowed agility maximum is materially below that of a ~45 kg soldier

### Requirement: Stamina exhaustion penalty
When a soldier's stamina is depleted (≤ 0), their effective combat-relevant stats MUST be reduced by 40% until stamina is restored outside combat (Phase 1: restore after battle).

#### Scenario: Exhausted firepower
- **WHEN** a living soldier has stamina ≤ 0 during combat resolution
- **THEN** their contribution to firepower uses a 0.6 multiplier versus their non-exhausted contribution

### Requirement: Specialty perk slots
A soldier MUST support up to five specialty perk slots. Perks MUST be modelable as percentage boosts to soldier and/or weapon stats. The full perk catalog MAY be empty or stubbed in Phase 1.

#### Scenario: Max five perks
- **WHEN** assigning perks to a soldier
- **THEN** at most five perk ids are accepted
- **AND** additional assignments are rejected or ignored

### Requirement: Loadout carries equipment refs
Soldier equipment/gears MUST attach through the existing `Loadout` (weapon + ammo + gear id list), not a parallel unequipped inventory model for Phase 1 company flow.

#### Scenario: Gear list on loadout
- **WHEN** a soldier has an issued company loadout
- **THEN** the loadout includes a gear id list (possibly empty) alongside weapon and ammo

### Requirement: Phase 1 combat consumes stamina and accuracy
Combat ticks MUST drain stamina for living rifle-armed soldiers and MUST factor soldier accuracy into firepower. Strength and agility MAY apply light modifiers. Full perk application, food-from-weight, and gear encumbrance sims are NOT required yet.

#### Scenario: Stamina drains in combat
- **WHEN** a combat tick resolves with living soldiers
- **THEN** those soldiers' stamina decreases
- **AND** firepower accounts for accuracy and any exhaustion penalty
