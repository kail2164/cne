# Spec Delta

## Purpose

Defines research point (RP) balance, monthly and contract-win income, and spend rules for unlocking catalog nodes.

## ADDED Requirements

### Requirement: RP balance on campaign state
A campaign MUST track `researchPoints` (non-negative integer) and a list of unlocked research node ids.

#### Scenario: Fresh campaign RP
- **WHEN** a campaign is created
- **THEN** `researchPoints` is 0 and starter unlocks include at least `gear-basic-pouch` (caliber/rifle granted on select)

### Requirement: Monthly RP income
Ending a turn (one month) MUST award **+3 RP**.

#### Scenario: End turn earns RP
- **WHEN** the player ends a turn with 0 RP
- **THEN** `researchPoints` becomes 3 (before any other RP awards that same resolution)

### Requirement: Contract-win RP income
Resolving a mission as a victory MUST award **+10 RP**. Defeat or retreat MUST NOT award this bonus.

#### Scenario: Win awards RP
- **WHEN** an active mission resolves with `won: true`
- **THEN** the campaign gains 10 RP in addition to any monthly award from that end-turn

### Requirement: Spend RP to unlock
Spending RP on an available node MUST deduct `rpCost`, append the node id to unlocked, and apply node effects. Spend MUST fail when RP is insufficient, prerequisites are missing, the node is already unlocked, or the node is a Phase-2 vehicle stub.

#### Scenario: Affordable unlock
- **WHEN** the player has ≥ node `rpCost` and all prerequisites unlocked
- **THEN** RP decreases by `rpCost` and the node id appears in `researchUnlocked`
