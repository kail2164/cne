# Spec Delta

## Purpose

Defines food kinds with nourishment, happiness (including negative), manufacture cost, and recipe unlock gating for later research.

## ADDED Requirements

### Requirement: Food attribute sheet
Each food kind MUST expose nourishment (flat), happiness (may be negative), manufacture cost (funds), and an optional required recipe id (null means starter-unlocked).

#### Scenario: Bland food negative happiness
- **WHEN** a food with negative happiness is defined
- **THEN** the catalog stores that negative value without clamping to zero

### Requirement: Recipe gate
Foods with a non-null `recipeId` MUST be considered locked until that recipe appears in unlocked research/recipes.

#### Scenario: Locked food
- **WHEN** a food requires a recipe not in the campaign unlock list
- **THEN** production/issue of that food is rejected (full production loop may be deferred; schema and check helper MUST exist)
