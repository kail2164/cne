# Spec Delta

## Purpose

Defines recruit cost, arm/reserve rules, shared carry weight, and monthly salary/food/loyalty/desertion with meal and mission morale.

## ADDED Requirements

### Requirement: Recruit costs money and pop
Recruiting MUST spend funds and consume one barracks pop slot per recruit, without requiring a weapon in warehouse.

#### Scenario: Unarmed recruit
- **WHEN** the player recruits with funds and free pop slots but no rifles
- **THEN** soldiers are created as reserves (no weapon loadout)

### Requirement: Armed vs reserve
A soldier MUST be armed only when they have a weapon and at least one magazine of ammo; otherwise they are a reserve. Reserves still incur salary and food.

#### Scenario: Arm from warehouse
- **WHEN** the player arms a reserve with a rifle and magazine ammo available
- **THEN** the soldier becomes armed and warehouse stocks decrease

### Requirement: Shared carry weight
Ammo and gear MUST share a strength-based carry capacity; exceeding capacity MUST be rejected.

#### Scenario: Overload rejected
- **WHEN** issuing ammo would exceed carry capacity
- **THEN** the issue fails or is capped with a clear message

### Requirement: Monthly upkeep and desertion
Each end-turn month MUST charge salary and meal costs. Shortfalls MUST reduce loyalty. Loyalty below 40 MUST raise desertion chance that month.

#### Scenario: Unpaid troops lose loyalty
- **WHEN** funds cannot cover salary or meals
- **THEN** affected soldiers lose loyalty

### Requirement: Meals and mission morale
Selecting a better meal plan MUST improve loyalty when paid. Mission victory MUST raise loyalty; failure/retreat MUST lower it.

#### Scenario: Victory boosts morale
- **WHEN** a mission resolves as victory
- **THEN** living soldiers gain loyalty (capped at 100)
