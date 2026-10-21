# Spec Delta

## Purpose

Simplifies factories to money-only, single-product-per-cycle production that locks until the next monthly cycle.

## ADDED Requirements

### Requirement: Money-only production
Factory production MUST consume funds only. Raw materials MUST NOT block or be consumed by factory output in this model.

#### Scenario: Produce without materials
- **WHEN** the warehouse has zero raw materials but sufficient funds
- **THEN** ending the turn can still produce the locked factory product

### Requirement: One product at a time
Each factory MUST have at most one chosen product for the cycle (`ammo` or `rifles`).

#### Scenario: Single slot
- **WHEN** the player sets the factory to ammo
- **THEN** the factory is not simultaneously producing rifles that cycle

### Requirement: Product locked until next cycle
Once a product is chosen for the current cycle, changing to a different product MUST be rejected until the cycle ends via end-turn.

#### Scenario: Cannot switch mid-cycle
- **WHEN** the factory is locked to ammo this cycle
- **AND** the player attempts to set rifles before ending the turn
- **THEN** the action fails and the product remains ammo

#### Scenario: Can switch next cycle
- **WHEN** the player ends the turn after locking ammo
- **THEN** they MAY set rifles (or ammo again) for the new cycle

### Requirement: Production resolves on cycle end
Factory output for the locked product MUST be applied when the turn ends (new cycle boundary), not as free-running mid-turn ticks.

#### Scenario: Output on end turn
- **WHEN** a product is locked and the player ends the turn with enough funds and warehouse space
- **THEN** the corresponding ammo or rifles are added to the warehouse and funds decrease
