# Spec Delta

## Purpose

Recruit hire cost scales +20% compound for every 10 lifetime recruits hired.

## ADDED Requirements

### Requirement: Lifetime recruit counter
Campaign state MUST track `lifetimeRecruitsHired`, starting at 0 and increasing by the number successfully recruited (not decreased by casualties).

#### Scenario: Fresh campaign
- **WHEN** a campaign is created
- **THEN** `lifetimeRecruitsHired` is 0

### Requirement: Compound unit price
The next recruit’s unit cost MUST equal `round(base × (1.2)^floor(lifetimeRecruitsHired / 10))` where base is the catalog recruit cost.

#### Scenario: After 10 hires
- **WHEN** `lifetimeRecruitsHired` is 10 and base is 25
- **THEN** the next unit cost is 30

### Requirement: Progressive batch pricing
Recruiting multiple soldiers in one action MUST charge each recruit at the rate for their position in the lifetime sequence and then advance the counter.

#### Scenario: First 20 recruits
- **WHEN** recruiting 20 from lifetime 0 with base 25
- **THEN** total cost is 550 (10×25 + 10×30) and lifetime becomes 20
