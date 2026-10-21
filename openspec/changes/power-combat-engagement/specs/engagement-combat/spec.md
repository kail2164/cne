# Spec Delta

## Purpose

Monthly combat steps resolve via engagement rules: initiative by combat type, hit chance / range / penetration damage, and low incoming damage when out-ranging or out-armoring.

## ADDED Requirements

### Requirement: Initiative by combat type
Engagement MUST decide first strike from contract combat type: defense → enemy first; offense (and scout/convoy) → friendly first; escort → frontline or backline encounter rules.

#### Scenario: Defense enemy opens
- **WHEN** the active contract combat type is defense
- **THEN** the monthly combat log records the enemy as first striker

### Requirement: Escort frontline vs backline
Escort contracts MUST pick a deterministic zone: frontline uses standard enemy forces; backline uses a thieves/robbers profile (weaker, often surprise first strike).

#### Scenario: Escort zone logged
- **WHEN** an escort mission takes a monthly combat step
- **THEN** the log notes frontline or backline and which profile fought

### Requirement: Damage from hit, range, pen, size
Volley damage MUST be computed from hit chance (accuracy + range band), penetration vs armor, and `damagePerEntity × attackerSize`, applied against the defender HP pool (`hpPerEntity × size` / oppositionHp).

#### Scenario: Volley reduces opposition
- **WHEN** friendly forces fire with ammo remaining
- **THEN** opposition HP decreases by a computed damage amount reflected in the combat log

### Requirement: Out-range or out-armor mitigation
If friendly forces out-range or out-armor the enemy, the probability of taking meaningful return damage MUST be very low (mitigated hit chance).

#### Scenario: Advantage noted
- **WHEN** friendly effective range or penetration clearly exceeds the enemy
- **THEN** the combat log notes out-range and/or out-armor and enemy return damage is heavily reduced

### Requirement: Monthly wire-up
Engagement resolution MUST run inside the existing monthly end-turn combat step (not a separate instant simulator).

#### Scenario: End turn fights
- **WHEN** the player ends a turn with an active mission
- **THEN** one engagement month is resolved and logged with power / first-strike / damage detail
