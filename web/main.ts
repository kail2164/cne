import {
  CALIBER_FAMILIES,
  GEARS,
  LOAD_SUBTYPES,
  LOAD_SUBTYPE_LABEL,
  NATION_LABEL,
  RESEARCH_CATALOG,
  RIFLES,
  caliberResearchId,
  companyReserveCount,
  companyTroopCount,
  countByDuty,
  createCampaign,
  currentRecruitUnitCost,
  BATTLE_COLS,
  BATTLE_ROWS,
  FACTORY_TIERS,
  battleOrder,
  beginBattle,
  buyFactory,
  describeBoard,
  describeTierEconomy,
  dismissSoldier,
  endTurn,
  equipSoldiers,
  finishBattleAction,
  formatFireLines,
  stackHasFullAuto,
  type FireMode,
  formatDate,
  getAmmo,
  getCaliberFamily,
  getFactoryTier,
  getGear,
  getContract,
  getQuantity,
  getRifle,
  getSelectedAmmo,
  getTierProgress,
  isFactoryTierUnlocked,
  isGearUnlocked,
  isLoadSubtypeUnlocked,
  isResearchUnlocked,
  isWeaponUnlocked,
  isArmed,
  listAvailableResearch,
  listBoardContracts,
  listBringableFormations,
  listManufacturable,
  moveBattleStack,
  nextTierPrice,
  livingPop,
  openBattle,
  placeBattleStack,
  playerNation,
  previewEnemyStacks,
  previewFormation,
  primaryRifleIdForFamily,
  projectedLabRp,
  quoteManufacture,
  quoteRecruitBatch,
  reachableHexes,
  recruitSoldiers,
  retreatBattle,
  selectCaliber,
  setFactorySlotProduct,
  shootBattleStack,
  splitBattleStack,
  spendResearch,
  stageOutputMult,
  upgradeCost,
  upgradeFactory,
  appointCommander,
  formFireTeam,
  formSquadFromTeams,
  unassignSoldiers,
  ECHELON_LABEL,
  FIRE_TEAM_SIZE,
  MAX_FACTORY_STAGE,
  type CaliberId,
  type FactoryProductKind,
  type FactoryTierId,
  type GameState,
  type LoadSubtype,
  type ResearchNode,
  type Soldier,
} from "../src/core/index.js";

type MainTab = "arsenal" | "barracks" | "production" | "research" | "contract";
type ArsenalTab = "caliber" | "weapons" | "equipment" | "accessories";
type BarracksTab = "reserve" | "composition" | "loadout";

let state: GameState = createCampaign("Browser Company");
let mainTab: MainTab = "arsenal";
let arsenalTab: ArsenalTab = "caliber";
let barracksTab: BarracksTab = "reserve";
let pendingCaliber: CaliberId = "762x54r";
let recruitCount = 10;
let detailSoldierId: string | null = null;
let teamCommanderId = "";
let squadCommanderId = "";
let loadoutTarget = "selected";
let equipWeaponId = "";
let equipAmmoId = "";
const equipGearIds = new Set<string>();
let battleFormation = "";
let battleStackId = "";
let selectedContractId = "";
let fireMode: FireMode = "aim";
const pickedSoldiers = new Set<string>();
const pickedTeams = new Set<string>();
const logLines: string[] = ["Campaign started. Choose a starting caliber and rifle."];

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

function money(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return `$${rounded}`;
  return `$${rounded.toFixed(2)}`;
}

function familyLabel(id: string): string {
  return (getCaliberFamily(id)?.name ?? id).replace(/ family$/, "");
}

function log(msg: string): void {
  logLines.unshift(msg);
  if (logLines.length > 80) logLines.length = 80;
  const el = document.getElementById("log");
  if (el) el.textContent = logLines.join("\n");
}

function apply<T>(
  result: { ok: boolean; state: GameState; message: string; data?: T },
): void {
  state = result.state;
  log(`${result.ok ? "✓" : "✗"} ${result.message}`);
  render();
}

function equippedWeaponCount(weaponId: string): number {
  return state.company.soldiers.filter(
    (soldier) => soldier.alive && soldier.loadout?.weaponId === weaponId,
  ).length;
}

function equippedGearCount(gearId: string): number {
  return state.company.soldiers.filter(
    (soldier) => soldier.alive && soldier.loadout?.gearIds?.includes(gearId),
  ).length;
}

function accessoryNodes(): ResearchNode[] {
  return RESEARCH_CATALOG.filter((node) =>
    node.effects.some((fx) => fx.type === "unlock_item" && fx.itemId.startsWith("acc-")),
  );
}

function renderStatus(): void {
  const el = document.getElementById("status");
  if (!el) return;
  const tier = getTierProgress(state);
  const load = getSelectedAmmo(state);
  const loadNote = state.selectedCaliberId
    ? ` · ${LOAD_SUBTYPE_LABEL[state.selectedLoadSubtype]}${load ? ` ${money(load.productionCost)}/rd` : ""}`
    : "";
  const mission = state.activeMission
    ? (() => {
        const contract = getContract(state.activeMission!.contractId);
        const name = contract?.name ?? state.activeMission!.contractId;
        return `<p class="meta">Mission: ${esc(name)} — ${state.activeMission!.turnsRemaining}/${state.activeMission!.turnsNeeded} mo · oppHP ${state.activeMission!.oppositionHp.toFixed(0)}</p>`;
      })()
    : "";
  el.innerHTML = `
    <p class="status-line">${formatDate(state)} · $${state.funds.toFixed(0)} · RP ${state.researchPoints} (${state.scientists.length} sci → ${projectedLabRp(state)}/mo)${loadNote}</p>
    <p class="meta">Tier ${tier.currentLabel} · wins ${tier.jobsCompletedTotal} · pop ${livingPop(state)}/${state.barracksPopSlots} · armed ${companyTroopCount(state)} · reserve ${companyReserveCount(state)}</p>
    <p class="meta">Hire ${money(currentRecruitUnitCost(state))}/ea · lifetime recruits ${state.lifetimeRecruitsHired}</p>
    ${mission}
  `;
}

function renderTabs(): void {
  document.querySelectorAll<HTMLButtonElement>("#main-tabs [data-tab]").forEach((button) => {
    const selected = button.dataset.tab === mainTab;
    button.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function caliberTable(): string {
  const families = CALIBER_FAMILIES.filter((family) =>
    isResearchUnlocked(state, caliberResearchId(family.id)),
  );
  if (families.length === 0) {
    return `<p class="meta">No calibers fielded yet.</p>`;
  }
  const rows = families
    .map((family) => {
      return LOAD_SUBTYPES.map((subtype, index) => {
        const ammo = getAmmo(family.id, subtype);
        if (!ammo) return "";
        const unlocked = isLoadSubtypeUnlocked(state, family.id, subtype);
        const stored = unlocked ? getQuantity(state.warehouse, "ammo", ammo.id) : "locked";
        const nameCell =
          index === 0
            ? `<td rowspan="${LOAD_SUBTYPES.length}">${esc(familyLabel(family.id))}</td>`
            : "";
        return `<tr class="${unlocked ? "" : "locked"}">
          ${nameCell}
          <td>${esc(LOAD_SUBTYPE_LABEL[subtype])}</td>
          <td class="num">${fmt(ammo.baseDamage)}</td>
          <td class="num">${fmt(ammo.basePenetration)}</td>
          <td class="num">${money(ammo.productionCost)}</td>
          <td class="num">${stored}</td>
        </tr>`;
      }).join("");
    })
    .join("");
  return `<div class="table-wrap"><table class="data">
    <thead>
      <tr>
        <th>Caliber</th>
        <th>Subtype</th>
        <th class="num">Dmg</th>
        <th class="num">Pen (mm)</th>
        <th class="num">Cost</th>
        <th class="num">Warehouse</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function weaponTable(): string {
  const weapons = RIFLES.filter((weapon) => isWeaponUnlocked(state, weapon.id));
  if (weapons.length === 0) {
    return `<p class="meta">No weapons fielded yet.</p>`;
  }
  const rows = weapons
    .map((weapon) => {
      return `<tr>
        <td>${esc(weapon.name)}</td>
        <td>${esc(familyLabel(weapon.caliberId))}</td>
        <td class="num">${fmt(weapon.weight)} kg</td>
        <td class="num">${weapon.ammoCapacity}</td>
        <td class="num">${weapon.effectiveRangeM80pct} m</td>
        <td class="num">${weapon.fireRateRpm}</td>
        <td class="num">${fmt(weapon.damage)}</td>
        <td class="num">${fmt(weapon.penetration)}</td>
        <td class="num">${equippedWeaponCount(weapon.id)}</td>
        <td class="num">${getQuantity(state.warehouse, "weapon", weapon.id)}</td>
      </tr>`;
    })
    .join("");
  return `<div class="table-wrap"><table class="data">
    <thead>
      <tr>
        <th>Name</th>
        <th>Caliber</th>
        <th class="num">Weight</th>
        <th class="num">Ammo</th>
        <th class="num">Range</th>
        <th class="num">RPM</th>
        <th class="num">Dmg</th>
        <th class="num">Pen (mm)</th>
        <th class="num">Equipped</th>
        <th class="num">Warehouse</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function equipmentTable(): string {
  const gear = GEARS.filter((item) => isGearUnlocked(state, item.id));
  if (gear.length === 0) {
    return `<p class="meta">No equipment unlocked.</p>`;
  }
  const rows = gear
    .map((item) => {
      return `<tr>
        <td>${esc(item.name)}</td>
        <td class="num">${fmt(item.weightKg)} kg</td>
        <td class="num">${item.ammoCapacityBonus}</td>
        <td class="num">${item.armorBonus}</td>
        <td class="num">${equippedGearCount(item.id)}</td>
        <td class="num">${getQuantity(state.warehouse, "gear", item.id)}</td>
      </tr>`;
    })
    .join("");
  return `<div class="table-wrap"><table class="data">
    <thead>
      <tr>
        <th>Name</th>
        <th class="num">Weight</th>
        <th class="num">Ammo bonus</th>
        <th class="num">Armor</th>
        <th class="num">Equipped</th>
        <th class="num">Warehouse</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function accessoryTable(): string {
  const owned = accessoryNodes().filter((node) => isResearchUnlocked(state, node.id));
  if (owned.length === 0) {
    return `<p class="meta">No accessories fielded. Bayonets, slings, and fittings are still to come.</p>`;
  }
  const rows = owned
    .map((node) => `<tr><td>${esc(node.name)}</td><td>${esc(node.blurb)}</td></tr>`)
    .join("");
  return `<div class="table-wrap"><table class="data">
    <thead><tr><th>Name</th><th>Notes</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderArsenal(): string {
  const tabs: { id: ArsenalTab; label: string; soon?: boolean }[] = [
    { id: "caliber", label: "Ammunition" },
    { id: "weapons", label: "Weapons" },
    { id: "equipment", label: "Equipment" },
    { id: "accessories", label: "Accessories", soon: true },
  ];
  const tabBar = tabs
    .map((tab) => {
      const soon = tab.soon ? `<span class="soon">to come</span>` : "";
      return `<button type="button" class="subtab" data-arsenal="${tab.id}" aria-selected="${tab.id === arsenalTab}">${tab.label}${soon ? ` ${soon}` : ""}</button>`;
    })
    .join("");
  const body =
    arsenalTab === "caliber"
      ? caliberTable()
      : arsenalTab === "weapons"
        ? weaponTable()
        : arsenalTab === "equipment"
          ? equipmentTable()
          : accessoryTable();
  return `<div class="subtabs" role="tablist">${tabBar}</div>${body}`;
}

function recruitButtonLabel(count: number): string {
  const n = Math.max(0, Math.floor(count));
  const quote = quoteRecruitBatch(state.lifetimeRecruitsHired, n, Number.POSITIVE_INFINITY);
  return `Recruit (${money(quote.cost)})`;
}

function livingSoldiers(): Soldier[] {
  return state.company.soldiers.filter((soldier) => soldier.alive);
}

function soldierById(id: string): Soldier | undefined {
  return state.company.soldiers.find((soldier) => soldier.id === id && soldier.alive);
}

function unitById(id: string | null | undefined) {
  if (!id) return undefined;
  return state.squads.find((unit) => unit.id === id);
}

function unitLabel(id: string | null): string {
  if (!id) return "—";
  const unit = unitById(id);
  if (!unit) return id;
  if (unit.id === "holding-1") return "Holding pool";
  return unit.name;
}

function isPoolSoldier(soldier: Soldier): boolean {
  return !soldier.squadId || soldier.squadId === "holding-1";
}

function statusLabel(soldier: Soldier): string {
  if (soldier.duty === "wounded") return "Wounded";
  if (isArmed(soldier)) return "Armed";
  return "Reserve";
}

function loadoutLabel(soldier: Soldier): string {
  if (!soldier.loadout?.weaponId) return "—";
  const rifle = getRifle(soldier.loadout.weaponId);
  const name = rifle?.name ?? soldier.loadout.weaponId;
  return `${name} · ${soldier.loadout.ammoRounds} rd`;
}

function gearLabel(soldier: Soldier): string {
  const ids = soldier.loadout?.gearIds ?? [];
  if (ids.length === 0) return "—";
  return ids.map((id) => getGear(id)?.name ?? id).join(", ");
}

function formationMembers(unitId: string): string[] {
  const unit = unitById(unitId);
  if (!unit) return [];
  const ids = new Set(unit.soldierIds);
  for (const childId of unit.childUnitIds) {
    const child = unitById(childId);
    for (const id of child?.soldierIds ?? []) ids.add(id);
  }
  return [...ids];
}

function prunePicks(): void {
  for (const id of [...pickedSoldiers]) {
    if (!soldierById(id)) pickedSoldiers.delete(id);
  }
  for (const id of [...pickedTeams]) {
    const unit = unitById(id);
    if (!unit || unit.echelon !== "fire_team" || unit.parentUnitId) pickedTeams.delete(id);
  }
  if (detailSoldierId && !soldierById(detailSoldierId)) detailSoldierId = null;
}

function releaseHolding(base: GameState, ids: string[]): GameState | null {
  const holding = ids.filter((id) => soldierById(id)?.squadId === "holding-1");
  if (holding.length === 0) return base;
  const released = unassignSoldiers(base, holding);
  if (!released.ok) {
    apply(released);
    return null;
  }
  return released.state;
}

function barracksTabs(): string {
  const tabs: { id: BarracksTab; label: string }[] = [
    { id: "reserve", label: "Reserve" },
    { id: "composition", label: "Composition" },
    { id: "loadout", label: "Loadout" },
  ];
  return `<div class="subtabs" role="tablist">${tabs
    .map(
      (tab) =>
        `<button type="button" class="subtab" data-barracks="${tab.id}" aria-selected="${tab.id === barracksTab}">${tab.label}</button>`,
    )
    .join("")}</div>`;
}

function headcount(): string {
  const living = livingSoldiers();
  const wounded = countByDuty(state, "wounded");
  const armed = living.filter((soldier) => soldier.duty !== "wounded" && isArmed(soldier)).length;
  const reserve = living.filter((soldier) => soldier.duty !== "wounded" && !isArmed(soldier)).length;
  return `<div class="counts">
    <span>Armed <strong>${armed}</strong></span>
    <span>Reserve <strong>${reserve}</strong></span>
    <span>Wounded <strong>${wounded}</strong></span>
    <span class="meta">Pop ${living.length}/${state.barracksPopSlots}</span>
  </div>`;
}

function soldierOptions(ids: string[], selected: string): string {
  return ids
    .map((id) => {
      const soldier = soldierById(id);
      if (!soldier) return "";
      const mark = id === selected ? " selected" : "";
      return `<option value="${esc(id)}"${mark}>${esc(soldier.name)}</option>`;
    })
    .join("");
}

function renderReserve(): string {
  const rows = livingSoldiers()
    .map((soldier) => {
      const checked = pickedSoldiers.has(soldier.id) ? " checked" : "";
      return `<tr>
        <td><input type="checkbox" data-pick="${esc(soldier.id)}"${checked} aria-label="Select ${esc(soldier.name)}" /></td>
        <td>${esc(soldier.name)}</td>
        <td class="num">${money(soldier.salary)}</td>
        <td class="num">${soldier.loyalty}</td>
        <td class="num">${soldier.loyalty}</td>
        <td>${statusLabel(soldier)}</td>
        <td>${esc(loadoutLabel(soldier))}</td>
        <td>${esc(unitLabel(soldier.squadId))}</td>
        <td class="actions">
          <button type="button" class="mini" data-act="details" data-soldier="${esc(soldier.id)}">Details</button>
          <button type="button" class="mini" data-act="assign" data-soldier="${esc(soldier.id)}">Assign</button>
          <button type="button" class="mini" data-act="promote" data-soldier="${esc(soldier.id)}">Promote</button>
          <button type="button" class="mini" data-act="dismiss" data-soldier="${esc(soldier.id)}">Dismiss</button>
        </td>
      </tr>`;
    })
    .join("");
  const detail = soldierById(detailSoldierId ?? "");
  const detailHtml = detail
    ? `<div class="detail">
        <p class="fact-name">${esc(detail.name)}</p>
        <p class="meta">HP ${detail.hp}/${detail.maxHp} · stamina ${detail.stamina}/${detail.maxStamina} · exp ${detail.experience}</p>
        <p class="meta">Accuracy ${detail.accuracy} · agility ${detail.agility} · strength ${detail.strength} · ${fmt(detail.weightKg)} kg</p>
        <p class="meta">Loadout ${esc(loadoutLabel(detail))} · gear ${esc(gearLabel(detail))}</p>
        <p class="meta">Morale and loyalty are one sheet value (${detail.loyalty}).</p>
      </div>`
    : "";
  return `
    ${headcount()}
    <p class="meta">Next unit ${money(currentRecruitUnitCost(state))} · +20% per 10 lifetime hires</p>
    <div class="field-row">
      <input type="number" id="rec-n" min="1" value="${recruitCount}" style="width:5rem" />
      <button type="button" class="primary" id="rec-go">${recruitButtonLabel(recruitCount)}</button>
    </div>
    ${
      rows
        ? `<div class="table-wrap"><table class="data">
            <thead><tr>
              <th></th><th>Name</th><th class="num">Salary</th><th class="num">Morale</th><th class="num">Loyalty</th>
              <th>Status</th><th>Loadout</th><th>Team</th><th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table></div>`
        : `<p class="meta">No soldiers yet.</p>`
    }
    ${detailHtml}
  `;
}

function renderComposition(): string {
  const available = livingSoldiers().filter(
    (soldier) => soldier.duty !== "wounded" && isPoolSoldier(soldier),
  );
  const checks = available
    .map((soldier) => {
      const checked = pickedSoldiers.has(soldier.id) ? " checked" : "";
      return `<label class="check"><input type="checkbox" data-pick="${esc(soldier.id)}"${checked} /> ${esc(soldier.name)} <span class="meta">${esc(statusLabel(soldier))}</span></label>`;
    })
    .join("");
  const freeTeams = state.squads.filter(
    (unit) => unit.echelon === "fire_team" && !unit.parentUnitId,
  );
  const teamChecks = freeTeams
    .map((unit) => {
      const checked = pickedTeams.has(unit.id) ? " checked" : "";
      const cdr = soldierById(unit.commanderSoldierId ?? "");
      return `<label class="check"><input type="checkbox" data-team="${esc(unit.id)}"${checked} /> ${esc(unit.name)} <span class="meta">${unit.soldierIds.length} · CDR ${esc(cdr?.name ?? "—")}</span></label>`;
    })
    .join("");
  const commanders = available.map((soldier) => soldier.id);
  const formations = state.squads
    .filter((unit) => unit.id !== "holding-1")
    .map((unit) => {
      const cdr = soldierById(unit.commanderSoldierId ?? "");
      const children = unit.childUnitIds
        .map((id) => unitById(id)?.name ?? id)
        .join(", ");
      const body = unit.childUnitIds.length
        ? children || "—"
        : unit.soldierIds.map((id) => soldierById(id)?.name ?? id).join(", ") || "—";
      return `<li><span class="fact-name">${esc(ECHELON_LABEL[unit.echelon])} · ${esc(unit.name)}</span><p class="meta">Commander ${esc(cdr?.name ?? "—")}</p><p class="meta">${esc(body)}</p></li>`;
    })
    .join("");
  return `
    <p class="meta">A fire team is ${FIRE_TEAM_SIZE.min}–${FIRE_TEAM_SIZE.max} soldiers. A squad is 2–3 fire teams plus a commander who is not already on a team.</p>
    <h2>Fire team</h2>
    <div class="checks">${checks || `<p class="meta">No unassigned soldiers.</p>`}</div>
    <div class="field-row">
      <label class="meta" for="team-cdr">Commander</label>
      <select id="team-cdr">
        <option value="">First selected</option>
        ${soldierOptions(commanders, teamCommanderId)}
      </select>
      <button type="button" class="primary" id="team-go">Form fire team</button>
    </div>
    <h2>Squad</h2>
    <div class="checks">${teamChecks || `<p class="meta">No free fire teams.</p>`}</div>
    <div class="field-row">
      <label class="meta" for="squad-cdr">Commander</label>
      <select id="squad-cdr">
        <option value="">—</option>
        ${soldierOptions(commanders, squadCommanderId)}
      </select>
      <button type="button" class="primary" id="squad-go">Form squad</button>
    </div>
    <h2>Formations</h2>
    <ul class="list">${formations || "<li>None yet.</li>"}</ul>
  `;
}

function equipItem(
  group: string,
  value: string,
  label: string,
  detail: string,
  stock: number,
  selected: boolean,
): string {
  const unavailable = stock <= 0;
  const checked = !unavailable && selected ? " checked" : "";
  const disabled = unavailable ? " disabled" : "";
  const kind = group === "equip-gear" ? "checkbox" : "radio";
  const name = group === "equip-gear" ? "" : ` name="${group}"`;
  const gear = group === "equip-gear" ? ` data-equip-gear="${esc(value)}"` : "";
  return `<label class="check">
    <input type="${kind}"${name}${gear} value="${esc(value)}"${checked}${disabled} />
    <span>${esc(label)}</span>
    <span class="meta">${esc(detail)}${unavailable ? " · none in warehouse" : ` · ${stock} in warehouse`}</span>
  </label>`;
}

function renderEquipList(): string {
  const weaponPick =
    equipWeaponId && getQuantity(state.warehouse, "weapon", equipWeaponId) > 0 ? equipWeaponId : "";
  const ammoPick =
    equipAmmoId && getQuantity(state.warehouse, "ammo", equipAmmoId) > 0 ? equipAmmoId : "";
  const weaponRows = RIFLES.filter((weapon) => isWeaponUnlocked(state, weapon.id))
    .map((weapon) =>
      equipItem(
        "equip-weapon",
        weapon.id,
        weapon.name,
        familyLabel(weapon.caliberId),
        getQuantity(state.warehouse, "weapon", weapon.id),
        weaponPick === weapon.id,
      ),
    )
    .join("");
  const ammoRows = CALIBER_FAMILIES.flatMap((family) =>
    LOAD_SUBTYPES.map((subtype) => {
      if (!isLoadSubtypeUnlocked(state, family.id, subtype)) return "";
      const ammo = getAmmo(family.id, subtype);
      if (!ammo) return "";
      return equipItem(
        "equip-ammo",
        ammo.id,
        ammo.name,
        `${money(ammo.productionCost)}/rd`,
        getQuantity(state.warehouse, "ammo", ammo.id),
        ammoPick === ammo.id,
      );
    }),
  ).join("");
  const gearRows = GEARS.filter((gear) => isGearUnlocked(state, gear.id))
    .map((gear) => {
      const bonus = gear.ammoCapacityBonus > 0 ? `+${gear.ammoCapacityBonus} rd` : `armor ${gear.armorBonus}`;
      return equipItem(
        "equip-gear",
        gear.id,
        gear.name,
        `${fmt(gear.weightKg)} kg · ${bonus}`,
        getQuantity(state.warehouse, "gear", gear.id),
        equipGearIds.has(gear.id),
      );
    })
    .join("");
  const none = (group: string, selected: string) =>
    `<label class="check"><input type="radio" name="${group}" value=""${selected ? "" : " checked"} /> <span class="meta">No change</span></label>`;
  return `
    <h2>Weapons</h2>
    <div class="checks">${none("equip-weapon", weaponPick)}${weaponRows || `<p class="meta">No weapons unlocked.</p>`}</div>
    <h2>Ammunition</h2>
    <p class="meta">Fills each soldier up to one magazine.</p>
    <div class="checks">${none("equip-ammo", ammoPick)}${ammoRows || `<p class="meta">No ammunition unlocked.</p>`}</div>
    <h2>Equipment</h2>
    <div class="checks">${gearRows || `<p class="meta">No equipment unlocked.</p>`}</div>
  `;
}

function renderLoadout(): string {
  const people = livingSoldiers().filter((soldier) => soldier.duty !== "wounded");
  const checks = people
    .map((soldier) => {
      const checked = pickedSoldiers.has(soldier.id) ? " checked" : "";
      return `<label class="check"><input type="checkbox" data-pick="${esc(soldier.id)}"${checked} /> ${esc(soldier.name)} <span class="meta">${esc(loadoutLabel(soldier))} · ${esc(gearLabel(soldier))} · ${esc(unitLabel(soldier.squadId))}</span></label>`;
    })
    .join("");
  const groups = state.squads
    .filter((unit) => unit.id !== "holding-1")
    .map((unit) => {
      const mark = loadoutTarget === unit.id ? " selected" : "";
      return `<option value="${esc(unit.id)}"${mark}>${esc(ECHELON_LABEL[unit.echelon])} · ${esc(unit.name)}</option>`;
    })
    .join("");
  return `
    <p class="meta">Choose weapons, ammunition, and equipment from the warehouse, then equip them on the soldiers below.</p>
    ${renderEquipList()}
    <h2>Soldiers</h2>
    <div class="field-row">
      <label class="meta" for="loadout-target">Apply to</label>
      <select id="loadout-target">
        <option value="selected"${loadoutTarget === "selected" ? " selected" : ""}>Checked soldiers</option>
        ${groups}
      </select>
    </div>
    <div class="checks">${checks || `<p class="meta">No soldiers.</p>`}</div>
    <div class="field-row">
      <button type="button" class="primary" id="btn-equip">Equip selected</button>
    </div>
  `;
}

function renderBarracks(): string {
  prunePicks();
  const body =
    barracksTab === "reserve"
      ? renderReserve()
      : barracksTab === "composition"
        ? renderComposition()
        : renderLoadout();
  return `${barracksTabs()}${body}`;
}

function productOptions(tierId: FactoryTierId, stage: number, selected: string): string {
  const groups = [
    ["ammo", "Ammunition"],
    ["weapons", "Weapons"],
    ["gears", "Equipment"],
    ["grenades", "Grenades"],
  ] as const;
  return groups
    .map(([kind, label]) => {
      const options = listManufacturable(state, kind)
        .map((item) => {
          const quote = quoteManufacture(state, tierId, stage, item.kind, item.itemId);
          const detail = quote
            ? ` — ${quote.quantity} · ${money(quote.unitCost)} each · ${money(quote.funds)}/mo`
            : "";
          const value = `${item.kind}:${item.itemId}`;
          const mark = value === selected ? " selected" : "";
          return `<option value="${esc(value)}"${mark}>${esc(item.name + detail)}</option>`;
        })
        .join("");
      return options ? `<optgroup label="${label}">${options}</optgroup>` : "";
    })
    .join("");
}

function buyOptions(): string {
  return FACTORY_TIERS.map((tier) => {
    const locked = !isFactoryTierUnlocked(state, tier.id);
    const price = nextTierPrice(state, tier.id);
    const note =
      tier.id === "blacksmith" ? "cheapest unit cost" : "2× output, 2.5× funds vs previous";
    return `<option value="${tier.id}"${locked ? " disabled" : ""}>${esc(tier.name)} — ${money(price)} · unit ×${tier.unitCostMult.toFixed(2)} · ${esc(note)}</option>`;
  }).join("");
}

function renderFactory(): string {
  const lines = state.factories.map((factory) => {
    const tier = getFactoryTier(factory.tierId);
    const mult = stageOutputMult(factory.stage);
    const name = tier?.name ?? factory.tierId;
    const unit = tier ? tier.unitCostMult.toFixed(2) : "?";
    const slots = factory.slots
      .map((slot, index) => {
        const locked = Boolean(slot.locked && slot.product);
        const selected = slot.product && slot.itemId ? `${slot.product}:${slot.itemId}` : "";
        const assigned =
          slot.product && slot.itemId
            ? quoteManufacture(state, factory.tierId, factory.stage, slot.product, slot.itemId)
            : null;
        const status = !slot.product
          ? "Idle"
          : slot.product === "vehicles"
            ? "Vehicles are not produced yet"
            : assigned
              ? `${assigned.name} · ${assigned.quantity} · ${money(assigned.unitCost)} each · ${money(assigned.funds)}/mo`
              : slot.product;
        return `<div class="field">
          <p class="meta">Line ${index + 1}${locked ? " · locked this month" : ""} · ${esc(status)}</p>
          <div class="field-row">
            <select id="fac-item-${esc(factory.id)}-${index}"${locked ? " disabled" : ""}>
              <option value="">Choose a product</option>
              ${productOptions(factory.tierId, factory.stage, selected)}
            </select>
            <button type="button" data-fac-set="${esc(factory.id)}" data-slot="${index}"${locked ? " disabled" : ""}>Set</button>
          </div>
        </div>`;
      })
      .join("");
    const cost = upgradeCost(factory);
    const upgrade =
      cost == null
        ? `<p class="meta">Stage ${MAX_FACTORY_STAGE}. Both lines are open.</p>`
        : `<button type="button" data-fac-up="${esc(factory.id)}">Upgrade to stage ${factory.stage + 1} (${money(cost)})</button>`;
    return `<li>
      <p class="fact-name">${esc(name)}</p>
      <p class="meta">Stage ${factory.stage}/${MAX_FACTORY_STAGE} · output ×${mult} · unit cost ×${unit}</p>
      <p class="meta">${esc(describeTierEconomy(factory.tierId))}</p>
      ${slots}
      <div class="fact-actions">${upgrade}</div>
    </li>`;
  });
  return `
    <p class="meta">A blacksmith at stage 1 is the cheapest way to make goods. Upgrading a stage doubles what it makes and doubles what that month costs. The next factory tier makes twice as much and spends 2.5× the funds, so a larger plant costs more per unit.</p>
    <ul class="list">${lines.join("") || "<li>(none)</li>"}</ul>
    <div class="field">
      <label class="meta" for="fac-buy">Buy a factory</label>
      <div class="field-row">
        <select id="fac-buy">${buyOptions()}</select>
        <button type="button" class="primary" id="fac-buy-go">Buy</button>
      </div>
    </div>
  `;
}

function renderResearch(): string {
  const avail = listAvailableResearch(state);
  const opts = avail
    .map((node) => `<option value="${esc(node.id)}">${esc(node.name)} (${node.rpCost} RP)</option>`)
    .join("");
  const cards = avail
    .map((node) => {
      const ready = state.researchPoints >= node.rpCost ? " ready" : "";
      return `<li class="res-card${ready}">
        <div class="res-head">
          <span class="res-name">${esc(node.name)}</span>
          <span class="res-cost">${node.rpCost} RP</span>
        </div>
        <p class="meta"><span class="tag">${esc(node.kind)}</span>${esc(node.blurb)}</p>
      </li>`;
    })
    .join("");
  return `
    <div class="res-layout">
      <ul class="list scroll-list">${cards || "<li>(none available)</li>"}</ul>
      <div class="field">
        <p class="meta">RP ${state.researchPoints} · unlocked ${state.researchUnlocked.length}${playerNation(state) ? ` · ${NATION_LABEL[playerNation(state)!]} line` : ""}</p>
        <select id="res-sel">${opts || '<option value="">—</option>'}</select>
        <button type="button" id="res-go">Spend RP</button>
      </div>
    </div>
  `;
}

function renderBattleBoard(): string {
  const battle = state.battle;
  if (!battle) return "";
  const active = battle.stacks.find((stack) => stack.id === battle.activeStackId);
  const moves =
    battle.phase === "fight" && active?.side === "friendly" && !active.moved
      ? new Set(reachableHexes(battle, active.id).map((hex) => `${hex.col},${hex.row}`))
      : new Set<string>();
  const rows: string[] = [];
  for (let row = 0; row < BATTLE_ROWS; row++) {
    const cells: string[] = [];
    for (let col = 0; col < BATTLE_COLS; col++) {
      const stack = battle.stacks.find((entry) => entry.count > 0 && entry.col === col && entry.row === row);
      const key = `${col},${row}`;
      const classes = ["hex"];
      if (stack?.side === "friendly") classes.push("friend");
      if (stack?.side === "enemy") classes.push("enemy");
      if (stack && stack.id === battle.activeStackId) classes.push("active");
      if (stack && battleStackId === stack.id) classes.push("picked");
      if (moves.has(key)) classes.push("move");
      const label = stack ? String(stack.count) : "";
      const title = stack
        ? `${stack.name}${stack.side === "enemy" ? ` · ${stack.doctrine}` : ""} · spd ${stack.speed} · rng ${stack.range} · ${formatFireLines(stack.groups)}`
        : `Column ${col + 1}, row ${row + 1}`;
      cells.push(
        `<button type="button" class="${classes.join(" ")}" data-hex="${key}" title="${esc(title)}">${label}</button>`,
      );
    }
    rows.push(`<div class="hexrow${row % 2 === 1 ? " odd" : ""}">${cells.join("")}</div>`);
  }
  return `<div class="hexboard">${rows.join("")}</div>`;
}

function renderBattle(): string {
  const battle = state.battle;
  if (!battle) return "";
  const contract = getContract(battle.contractId);
  const friendlies = battle.stacks.filter((stack) => stack.side === "friendly");
  const order = battle.phase === "fight" ? battleOrder(battle) : [];
  const active = battle.stacks.find((stack) => stack.id === battle.activeStackId);
  const stackButtons = friendlies
    .map((stack) => {
      const mark = battleStackId === stack.id ? " primary" : "";
      return `<button type="button" class="${mark.trim()}" data-stack="${esc(stack.id)}">${esc(stack.name)} · ${stack.count} · spd ${stack.speed} · rng ${stack.range} · ${esc(formatFireLines(stack.groups))}</button>`;
    })
    .join("");
  const queue = order
    .map((stack) => {
      const mark = stack.id === battle.activeStackId ? "queue-active" : "";
      const stance = stack.side === "enemy" ? ` ${stack.doctrine}` : "";
      return `<span class="${mark}">${esc(stack.name)}${stance} ${stack.speed}</span>`;
    })
    .join("");
  const log = battle.log.slice(-6).map((line) => `<li>${esc(line)}</li>`).join("");
  const enemyTurn = active?.side === "enemy";
  const aims =
    battle.phase === "fight" && active?.side === "friendly"
      ? battle.stacks
          .filter((stack) => stack.side === "enemy" && stack.parts.filter((part) => part.count > 0).length > 1)
          .flatMap((stack) =>
            stack.parts
              .filter((part) => part.count > 0)
              .map(
                (part) =>
                  `<button type="button" data-aim="${esc(stack.id)}" data-part="${esc(part.id)}">${esc(stack.name)} · ${esc(part.name)} ${part.armor}mm</button>`,
              ),
          )
          .join("")
      : "";
  if (fireMode === "auto" && active?.side === "friendly" && !stackHasFullAuto(active.groups)) {
    fireMode = "aim";
  }
  const canAuto = active?.side === "friendly" ? stackHasFullAuto(active.groups) : false;
  const modeButtons =
    battle.phase === "fight" && active?.side === "friendly"
      ? `<button type="button" class="${fireMode === "aim" ? "primary" : ""}" data-fire="aim">Take aim</button>
         <button type="button" class="${fireMode === "burst" ? "primary" : ""}" data-fire="burst">Burst</button>
         <button type="button" class="${fireMode === "auto" ? "primary" : ""}" data-fire="auto"${canAuto ? "" : " disabled"}>Full auto</button>`
      : "";
  const modeHint =
    battle.phase === "fight" && active?.side === "friendly"
      ? `<p class="meta">Take aim uses 15% of the weapon's fire rate, out to 125% of effective range. Burst uses 35% of the weapon's fire rate and is strongest at effective range. Full auto is a minute at the gun's own rate, and only an automatic weapon can use it: full damage inside half range, then less as the target nears the effective range. A round at or above the armor always penetrates. From 75% of that thickness up to the armor, it penetrates one time in four. Thinner than that, it does nothing.</p>`
      : "";
  const actions =
    battle.phase === "prepare"
      ? `<button type="button" id="battle-split">Split</button>
         <button type="button" class="primary" id="battle-begin">Begin</button>
         <button type="button" id="battle-cancel">Cancel</button>`
      : `<button type="button" class="primary" id="battle-act">${enemyTurn ? "Resolve enemy" : "End action"}</button>
         <button type="button" id="battle-retreat">Retreat</button>`;
  return `
    <p class="fact-name">${esc(contract?.name ?? "Battle")}</p>
    <p class="meta">${battle.phase === "prepare" ? "Select a stack, then a hex on the two left columns. Split breaks a composition into the formations inside it, and a fire team into soldiers. Speed is the average of everyone in the stack and decides who acts next, so a fast scout belongs in his own stack." : `Round ${battle.round}. The higher speed acts next. That number is the average of the men in the stack, and it is also how far the stack can move.`}</p>
    ${battle.phase === "fight" ? `<p class="queue">${queue}</p>` : ""}
    ${renderBattleBoard()}
    <div class="fact-actions">${stackButtons}</div>
    ${modeHint}
    ${modeButtons ? `<div class="fact-actions">${modeButtons}</div>` : ""}
    ${aims ? `<div class="fact-actions">${aims}</div>` : ""}
    <div class="field-row">${actions}</div>
    <ul class="list">${log}</ul>
  `;
}

function renderBoard(): string {
  if (state.battle && state.battle.phase !== "done") return renderBattle();
  const board = listBoardContracts(state);
  if (!board.some((contract) => contract.id === selectedContractId)) {
    selectedContractId = board[0]?.id ?? "";
  }
  const formations = listBringableFormations(state)
    .map((unit) => {
      const preview = previewFormation(state, unit.id);
      if (!preview) return "";
      const checked = battleFormation === unit.id ? " checked" : "";
      const fireText =
        preview.lines.map((line) => `${line.pen}mm ${Math.round(line.damage)}`).join(" · ") || "no guns";
      return `<label class="check"><input type="radio" name="bring" data-bring="${esc(unit.id)}"${checked} /> ${esc(preview.echelon)} · ${esc(preview.name)} <span class="meta">${preview.soldiers} soldiers · ${preview.armed} armed · rng ${preview.range} · spd ${preview.speed} · arm ${preview.defense} · ${esc(fireText)}</span></label>`;
    })
    .join("");
  const opposition = previewEnemyStacks(selectedContractId, state.year)
    .map((stack) => {
      const auto = stackHasFullAuto(stack.groups) ? " · full auto" : "";
      return `<li>${esc(stack.name)} · ${stack.count} · ${esc(stack.doctrine)} · spd ${stack.speed} · rng ${stack.range} · arm ${stack.defense}mm · ${esc(formatFireLines(stack.groups))}${auto}</li>`;
    })
    .join("");
  return `
    <p class="meta">Choose a contract and one composition. The opposition is listed under the contract. Preparation lets you split that composition into smaller stacks and arrange them on the near edge. Speed is the average of everyone in a stack and decides who acts next, so a fast scout belongs in his own stack.</p>
    <ul class="list scroll-list">${describeBoard(state).map((line) => `<li>${esc(line)}</li>`).join("") || "<li>(empty)</li>"}</ul>
    <div class="field-row">
      <select id="job-sel">
        ${board.map((contract, index) => `<option value="${esc(contract.id)}"${contract.id === selectedContractId ? " selected" : ""}>${index + 1}. ${esc(contract.name)}</option>`).join("")}
      </select>
    </div>
    <h2>Opposition</h2>
    <ul class="list">${opposition || "<li>No opposition on this contract.</li>"}</ul>
    <h2>Bring</h2>
    <div class="checks">${formations || `<p class="meta">Form fire teams in the barracks before taking a contract.</p>`}</div>
    <div class="field-row">
      <button type="button" class="primary" id="job-go">Prepare</button>
    </div>
  `;
}

function loadoutIds(): string[] {
  if (loadoutTarget !== "selected") return formationMembers(loadoutTarget);
  return [...pickedSoldiers];
}

function wireView(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-arsenal]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.dataset.arsenal;
      if (next === "caliber" || next === "weapons" || next === "equipment" || next === "accessories") {
        arsenalTab = next;
        render();
      }
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-barracks]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.dataset.barracks;
      if (next === "reserve" || next === "composition" || next === "loadout") {
        barracksTab = next;
        render();
      }
    });
  });
  document.querySelectorAll<HTMLInputElement>("[data-pick]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.dataset.pick;
      if (!id) return;
      if (input.checked) pickedSoldiers.add(id);
      else pickedSoldiers.delete(id);
      render();
    });
  });
  document.querySelectorAll<HTMLInputElement>("[data-team]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.dataset.team;
      if (!id) return;
      if (input.checked) pickedTeams.add(id);
      else pickedTeams.delete(id);
      render();
    });
  });
  document.getElementById("rec-n")?.addEventListener("input", () => {
    const input = document.getElementById("rec-n") as HTMLInputElement | null;
    const button = document.getElementById("rec-go");
    recruitCount = Math.max(0, Math.floor(Number(input?.value) || 0));
    if (button) button.textContent = recruitButtonLabel(recruitCount);
  });
  document.getElementById("rec-go")?.addEventListener("click", () => {
    const n = Number((document.getElementById("rec-n") as HTMLInputElement).value) || 0;
    recruitCount = Math.max(0, Math.floor(n));
    apply(recruitSoldiers(state, recruitCount));
  });
  document.getElementById("team-cdr")?.addEventListener("change", () => {
    teamCommanderId = (document.getElementById("team-cdr") as HTMLSelectElement).value;
  });
  document.getElementById("squad-cdr")?.addEventListener("change", () => {
    squadCommanderId = (document.getElementById("squad-cdr") as HTMLSelectElement).value;
  });
  document.getElementById("loadout-target")?.addEventListener("change", () => {
    loadoutTarget = (document.getElementById("loadout-target") as HTMLSelectElement).value;
  });
  document.getElementById("team-go")?.addEventListener("click", () => {
    const ids = [...pickedSoldiers].filter((id) => {
      const soldier = soldierById(id);
      return soldier && soldier.duty !== "wounded" && isPoolSoldier(soldier);
    });
    const commander = teamCommanderId && ids.includes(teamCommanderId) ? teamCommanderId : undefined;
    const working = releaseHolding(state, commander ? [...ids, commander] : ids);
    if (!working) return;
    const formed = formFireTeam(working, ids, undefined, commander);
    if (formed.ok) pickedSoldiers.clear();
    apply(formed);
  });
  document.getElementById("squad-go")?.addEventListener("click", () => {
    const teams = [...pickedTeams];
    if (!squadCommanderId) {
      log("✗ Pick a squad commander who is not already on a fire team.");
      return;
    }
    const working = releaseHolding(state, [squadCommanderId]);
    if (!working) return;
    const formed = formSquadFromTeams(working, teams, squadCommanderId);
    if (formed.ok) pickedTeams.clear();
    apply(formed);
  });
  document.querySelectorAll<HTMLInputElement>('input[name="equip-weapon"]').forEach((input) => {
    input.addEventListener("change", () => {
      equipWeaponId = input.value;
    });
  });
  document.querySelectorAll<HTMLInputElement>('input[name="equip-ammo"]').forEach((input) => {
    input.addEventListener("change", () => {
      equipAmmoId = input.value;
    });
  });
  document.querySelectorAll<HTMLInputElement>("[data-equip-gear]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.value;
      if (!id) return;
      if (input.checked) equipGearIds.add(id);
      else equipGearIds.delete(id);
    });
  });
  document.getElementById("btn-equip")?.addEventListener("click", () => {
    const ids = loadoutIds();
    if (ids.length === 0) {
      log("✗ Choose soldiers or a formation to equip.");
      return;
    }
    const weaponId =
      document.querySelector<HTMLInputElement>('input[name="equip-weapon"]:checked')?.value ?? "";
    const ammoId =
      document.querySelector<HTMLInputElement>('input[name="equip-ammo"]:checked')?.value ?? "";
    const gearIds = [
      ...document.querySelectorAll<HTMLInputElement>("[data-equip-gear]:checked"),
    ].map((input) => input.value);
    equipWeaponId = weaponId;
    equipAmmoId = ammoId;
    equipGearIds.clear();
    for (const id of gearIds) equipGearIds.add(id);
    apply(equipSoldiers(state, ids, { weaponId, ammoId, gearIds }));
  });
  document.querySelectorAll<HTMLButtonElement>("[data-fac-set]").forEach((button) => {
    button.addEventListener("click", () => {
      const factoryId = button.dataset.facSet;
      const slot = Number(button.dataset.slot);
      if (!factoryId || !Number.isFinite(slot)) return;
      const select = document.getElementById(`fac-item-${factoryId}-${slot}`) as HTMLSelectElement | null;
      const raw = select?.value ?? "";
      const split = raw.indexOf(":");
      if (split <= 0) {
        log("✗ Choose ammunition, a weapon, equipment, or a grenade.");
        return;
      }
      const kind = raw.slice(0, split) as FactoryProductKind;
      const itemId = raw.slice(split + 1);
      apply(setFactorySlotProduct(state, factoryId, slot, kind, itemId));
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-fac-up]").forEach((button) => {
    button.addEventListener("click", () => {
      const factoryId = button.dataset.facUp;
      if (!factoryId) return;
      apply(upgradeFactory(state, factoryId));
    });
  });
  document.getElementById("fac-buy-go")?.addEventListener("click", () => {
    const tierId = (document.getElementById("fac-buy") as HTMLSelectElement | null)?.value;
    if (!tierId) return;
    apply(buyFactory(state, tierId as FactoryTierId));
  });
  document.getElementById("res-go")?.addEventListener("click", () => {
    const id = (document.getElementById("res-sel") as HTMLSelectElement).value;
    if (!id) return;
    apply(spendResearch(state, id));
  });
  document.querySelectorAll<HTMLInputElement>("[data-bring]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.dataset.bring;
      if (!id || !input.checked) return;
      battleFormation = id;
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-stack]").forEach((button) => {
    button.addEventListener("click", () => {
      battleStackId = button.dataset.stack ?? "";
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-fire]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.dataset.fire;
      if (next === "aim" || next === "burst" || next === "auto") {
        fireMode = next;
        render();
      }
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-aim]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.aim;
      const part = button.dataset.part;
      const active = state.battle?.activeStackId;
      if (!target || !part || !active) return;
      apply(shootBattleStack(state, active, target, part, fireMode));
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-hex]").forEach((button) => {
    button.addEventListener("click", () => {
      const raw = button.dataset.hex ?? "";
      const [col, row] = raw.split(",").map((part) => Number(part));
      if (!Number.isFinite(col) || !Number.isFinite(row) || !state.battle) return;
      if (state.battle.phase === "prepare") {
        if (!battleStackId) {
          log("✗ Select one of your stacks, then a hex on the left edge.");
          return;
        }
        apply(placeBattleStack(state, battleStackId, col, row));
        return;
      }
      const occupant = state.battle.stacks.find(
        (stack) => stack.count > 0 && stack.col === col && stack.row === row,
      );
      const active = state.battle.activeStackId;
      if (occupant?.side === "enemy" && active) {
        apply(shootBattleStack(state, active, occupant.id, undefined, fireMode));
        return;
      }
      if (active) apply(moveBattleStack(state, active, col, row));
    });
  });
  document.getElementById("battle-begin")?.addEventListener("click", () => {
    apply(beginBattle(state));
  });
  document.getElementById("battle-cancel")?.addEventListener("click", () => {
    battleStackId = "";
    apply(retreatBattle(state));
  });
  document.getElementById("battle-retreat")?.addEventListener("click", () => {
    battleStackId = "";
    apply(retreatBattle(state));
  });
  document.getElementById("battle-act")?.addEventListener("click", () => {
    apply(finishBattleAction(state, fireMode));
  });
  document.getElementById("battle-split")?.addEventListener("click", () => {
    if (!battleStackId) {
      log("✗ Select a stack to split.");
      return;
    }
    const result = splitBattleStack(state, battleStackId);
    if (result.ok && result.data) battleStackId = result.data.stackId;
    apply(result);
  });
  document.getElementById("job-sel")?.addEventListener("change", () => {
    selectedContractId = (document.getElementById("job-sel") as HTMLSelectElement).value;
    render();
  });
  document.getElementById("job-go")?.addEventListener("click", () => {
    const id = (document.getElementById("job-sel") as HTMLSelectElement).value;
    if (!id) return;
    if (!battleFormation) {
      log("✗ Choose a composition to bring.");
      return;
    }
    apply(openBattle(state, id, battleFormation));
  });
}

function renderView(): void {
  const el = document.getElementById("view");
  if (!el) return;
  el.innerHTML =
    mainTab === "arsenal"
      ? renderArsenal()
      : mainTab === "barracks"
        ? renderBarracks()
        : mainTab === "production"
          ? renderFactory()
          : mainTab === "research"
            ? renderResearch()
            : renderBoard();
  wireView();
}

function kitCard(familyId: CaliberId): string {
  const ammo = getAmmo(familyId, "fmj" satisfies LoadSubtype);
  const rifle = getRifle(primaryRifleIdForFamily(familyId) ?? "");
  const pressed = familyId === pendingCaliber;
  const ammoStats = ammo
    ? ["FMJ", `dmg ${fmt(ammo.baseDamage)}`, `pen ${fmt(ammo.basePenetration)} mm`, `${money(ammo.productionCost)}/rd`]
    : [];
  const rifleStats = rifle
    ? [
        `${rifle.ammoCapacity} rd`,
        `${rifle.effectiveRangeM80pct} m`,
        `${rifle.fireRateRpm} rpm`,
        `dmg ${fmt(rifle.damage)}`,
        `pen ${fmt(rifle.penetration)} mm`,
      ]
    : [];
  const stats = (parts: string[]) =>
    `<span class="kit-stats">${parts.map((part) => `<span>${esc(part)}</span>`).join("")}</span>`;
  const family = getCaliberFamily(familyId);
  const nation = family ? NATION_LABEL[family.nation] : "";
  return `<button type="button" class="kit" data-kit="${esc(familyId)}" aria-pressed="${pressed}">
    <span class="kit-name">${esc(familyLabel(familyId))}</span>
    <span class="kit-stats"><span>${esc(nation)}</span></span>
    ${stats(ammoStats)}
    <span class="kit-weapon">${esc(rifle?.name ?? "Rifle")}</span>
    ${stats(rifleStats)}
  </button>`;
}

function renderGate(): void {
  const gate = document.getElementById("start-gate");
  if (!gate) return;
  if (state.selectedCaliberId) {
    gate.hidden = true;
    gate.innerHTML = "";
    return;
  }
  const rifle = getRifle(primaryRifleIdForFamily(pendingCaliber) ?? "");
  gate.hidden = false;
  gate.innerHTML = `
    <div class="gate-card">
      <h2>Choose a starting caliber and rifle</h2>
      <p class="meta">This locks the company to that nation. Later guns and cartridges stay on its line. Other nations stay off the research list, though an enemy stack can still carry them.</p>
      <div class="kit-grid">
        ${CALIBER_FAMILIES.filter((family) => family.starter).map((family) => kitCard(family.id)).join("")}
      </div>
      <button type="button" class="primary" id="kit-go">Field ${esc(rifle?.name ?? "this kit")}</button>
    </div>
  `;
  document.querySelectorAll<HTMLButtonElement>("[data-kit]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.kit;
      if (!id) return;
      pendingCaliber = id as CaliberId;
      render();
    });
  });
  document.getElementById("kit-go")?.addEventListener("click", () => {
    mainTab = "arsenal";
    arsenalTab = "caliber";
    apply(selectCaliber(state, pendingCaliber));
  });
}

function render(): void {
  renderStatus();
  renderTabs();
  renderView();
  renderGate();
  const logEl = document.getElementById("log");
  if (logEl && logEl.textContent !== logLines.join("\n")) {
    logEl.textContent = logLines.join("\n");
  }
}

document.getElementById("view")?.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-act]");
  if (!button) return;
  const id = button.dataset.soldier;
  const act = button.dataset.act;
  if (!id || !act) return;
  if (act === "details") {
    detailSoldierId = detailSoldierId === id ? null : id;
    render();
    return;
  }
  if (act === "dismiss") {
    if (detailSoldierId === id) detailSoldierId = null;
    pickedSoldiers.delete(id);
    apply(dismissSoldier(state, id));
    return;
  }
  if (act === "promote") {
    apply(appointCommander(state, id));
    return;
  }
  if (act === "assign") {
    const soldier = soldierById(id);
    if (!soldier) return;
    if (soldier.squadId && soldier.squadId !== "holding-1") {
      log(`${soldier.name} is already in ${unitLabel(soldier.squadId)}.`);
    } else {
      pickedSoldiers.add(id);
    }
    barracksTab = "composition";
    render();
  }
});

document.getElementById("main-tabs")?.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-tab]");
  const next = button?.dataset.tab;
  if (
    next === "arsenal" ||
    next === "barracks" ||
    next === "production" ||
    next === "research" ||
    next === "contract"
  ) {
    mainTab = next;
    render();
  }
});

document.getElementById("btn-end")?.addEventListener("click", () => {
  const ended = endTurn(state);
  state = ended.state;
  log(ended.message);
  if (ended.data?.missionResolved) {
    log(`Mission: ${ended.data.missionResolved.summary}`);
    for (const entry of ended.data.missionResolved.log) {
      log(`  M${entry.month}: ${entry.note}`);
    }
  }
  render();
});

render();
