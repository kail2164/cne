# Spec Delta

## Purpose

Defines researched weapon mods that factories build into cheaper or better rifle variants, and how those variants are stored, issued, and fought.

## ADDED Requirements

### Requirement: Shared mod catalog
The catalog MUST define these mods, each in exactly one slot: sling (carry), bayonet (melee), shortened buttstock (stock), barebone kit (furniture), hardened bolt (bolt), cleaning kit (upkeep), aperture sight (sight), 2× scope (sight), and 2–8× scope (sight). Every unlocked rifle MUST accept every mod. An empty slot MUST mean the service pattern.

#### Scenario: Nine shared mods
- **WHEN** the mod catalog is read
- **THEN** those nine mods exist, the two scopes share the sight slot with the aperture sight, and none is limited to a single rifle

### Requirement: Mod research replaces per-rifle stubs
Each mod MUST unlock for every rifle once its research node is bought. The 2× scope MUST require the aperture sight. The 2–8× scope MUST require the 2× scope and MUST NOT be researchable before 1924. The hardened bolt MUST require workshop factory plans. Research node ids `acc-{rifleId}-bayonet` and `acc-{rifleId}-sling` MUST NOT exist. Helmet liner, armor plate, and kit lamp research MUST remain.

#### Scenario: Sling fits every rifle
- **WHEN** the sling is researched
- **THEN** any unlocked rifle, including a second weapon on the same caliber, may be built with that sling

#### Scenario: Variable scope is late
- **WHEN** the campaign year is before 1924
- **THEN** the 2–8× scope cannot be researched

#### Scenario: Stub accessory nodes are gone
- **WHEN** the research catalog is listed
- **THEN** no node id is `acc-{rifleId}-bayonet` or `acc-{rifleId}-sling`, and the three gear-accessory nodes are still present

### Requirement: One mod per slot
A variant MUST include at most one mod from each slot. A variant that includes an unresearched mod MUST be rejected. A rifle with no mods MUST stay legal without any mod research.

#### Scenario: Two sights rejected
- **WHEN** a variant is requested with both the aperture sight and the 2× scope
- **THEN** the variant is rejected

#### Scenario: Unresearched mod rejected
- **WHEN** a variant is requested with the barebone kit and that mod is not researched
- **THEN** the variant is rejected and the plain rifle can still be manufactured

### Requirement: Cheaper mods are worse
Resolving the barebone kit or the shortened buttstock alone MUST lower that rifle's manufacture funds and material cost. The barebone kit MUST worsen reliability or handling. The shortened buttstock MUST worsen accuracy or effective range.

#### Scenario: Barebone costs less
- **WHEN** the same rifle is resolved plain and with only the barebone kit
- **THEN** funds and material cost are lower and reliability or handling is worse

#### Scenario: Short stock loses reach
- **WHEN** the same rifle is resolved plain and with only the shortened buttstock
- **THEN** funds are lower and accuracy or effective range is worse

### Requirement: Costlier mods are better
Resolving the sling, hardened bolt, cleaning kit, aperture sight, 2× scope, or 2–8× scope alone MUST raise manufacture funds above the plain rifle. Each of those MUST improve at least one of handling, reliability, wear, accuracy, or effective range. The bayonet alone MUST raise funds, worsen handling, and increase ammo-out bayonet damage. The 2× and 2–8× scopes MUST worsen handling. Resolved reliability MUST stay within 50–99 and handling within 20–95.

#### Scenario: Scope costs more and groups tighter
- **WHEN** the same rifle is resolved plain and with only the 2× scope
- **THEN** funds are higher, accuracy or effective range is better, and handling is worse

#### Scenario: Bolt is tougher
- **WHEN** the same rifle is resolved plain and with only the hardened bolt
- **THEN** funds are higher and reliability is higher or wear per magazine is lower

### Requirement: Stacked mods compose
Mods in different slots MUST apply together on one rifle. The resolved funds cost MUST differ from the plain rifle in the combined direction of those mods. Each included mod's stat change MUST still be present after stacking.

#### Scenario: Sling plus bolt
- **WHEN** a rifle is resolved with the sling and the hardened bolt
- **THEN** funds exceed either mod alone and both the handling change and the reliability or wear change are present

### Requirement: Variant stock identity
Each mod set MUST be a separate weapon warehouse row. The unmodified rifle MUST keep its existing catalog id. Producing or withdrawing one variant MUST NOT change another variant's quantity.

#### Scenario: Plain and sling are different piles
- **WHEN** the factory delivers one plain rifle and one rifle with a sling
- **THEN** the warehouse has two weapon rows, and withdrawing the sling rifle leaves the plain quantity unchanged

### Requirement: Factory builds the chosen variant
A weapon slot MUST accept one legal variant of an unlocked rifle and, on month resolve, MUST spend that variant's resolved funds cost times the factory tier multiplier and add that variant to the warehouse. An illegal variant MUST be rejected. No mods MUST keep producing the plain rifle id at its catalog cost.

#### Scenario: Scoped month
- **WHEN** a slot is set to a researched rifle plus a researched 2× scope and the month resolves with enough funds
- **THEN** that scoped variant's warehouse quantity increases and funds spent per gun exceed the plain rifle catalog cost

#### Scenario: Plain pattern unchanged
- **WHEN** a slot is set to an unlocked rifle with no mods
- **THEN** output uses that rifle's existing id and catalog funds cost

### Requirement: Issue a chosen variant
Arming and equipping MUST withdraw the chosen in-stock variant onto the chosen living soldiers. A formation MUST be issuable a different variant from other soldiers in the same month. A replaced rifle MUST return to the warehouse under its own variant id. If stock runs out, remaining soldiers MUST be left unchanged and a different variant MUST NOT be substituted.

#### Scenario: Formation and reserves differ
- **WHEN** stock holds a scoped rifle and a barebone rifle, a formation is equipped with the scoped stock, and other unarmed soldiers are armed with the barebone stock
- **THEN** the formation carries the scoped variant and the other soldiers carry the barebone variant

#### Scenario: No silent substitution
- **WHEN** one scoped rifle is in stock and two soldiers are equipped with it
- **THEN** one soldier receives it and the other soldier's weapon is unchanged

### Requirement: Combat uses the resolved variant
Fire MUST use the variant's damage, rate of fire, reliability, accuracy, range, and wear. Different variants MUST NOT share those stats. On an ammo-out tick, opposition damage MUST rise with the share of living armed soldiers whose variant includes the bayonet. A force with no bayonet mod MUST keep the current ammo-out penalty.

#### Scenario: Scoped fire hits more
- **WHEN** two otherwise identical forces differ only by 2× scopes on their rifles
- **THEN** the scoped force has a higher hit chance at the same range

#### Scenario: Bayonets hit harder out of ammo
- **WHEN** an ammo-out tick is fought with bayonets on every rifle, and again with the same force and no bayonet mod
- **THEN** the bayonet force deals more opposition damage on that tick

### Requirement: Arsenal, factory, and loadout show variants
The arsenal MUST list each researched mod with its slot and whether it raises or lowers cost. The factory weapon control MUST let the player pick an unlocked rifle and at most one researched mod per slot. The loadout weapon list MUST show warehouse weapon rows with variant name and quantity, and MUST NOT list unbuilt mod combinations.

#### Scenario: Accessories leave the placeholder
- **WHEN** the sling is researched and the arsenal accessories view is opened
- **THEN** the sling is listed on the carry slot as a higher cost, and the view is not a placeholder

#### Scenario: Factory cannot stack sights
- **WHEN** the aperture sight and the 2× scope are both researched
- **THEN** the weapon slot can select the rifle with the 2× scope and cannot select both sights

#### Scenario: Loadout lists only stock
- **WHEN** the warehouse holds a barebone rifle and no scoped rifle
- **THEN** the loadout list includes the barebone row with its quantity and does not offer the unbuilt scoped combination
