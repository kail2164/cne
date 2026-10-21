import {
  LOCAL_CONTRACT,
  LOAD_SUBTYPE_LABEL,
  armSoldiers,
  companyPower,
  companyReserveCount,
  companyTroopCount,
  createCampaign,
  currentRecruitUnitCost,
  describeAvailableResearch,
  describeBoard,
  describeFactories,
  endTurn,
  formatDate,
  getContract,
  getSelectedAmmo,
  getTierProgress,
  issueCompanyAmmo,
  listAvailableResearch,
  listBoardContracts,
  listStartingCalibers,
  livingPop,
  projectedLabRp,
  recruitSoldiers,
  selectCaliber,
  setFactoryProduct,
  spendResearch,
  startContract,
  type CaliberId,
  type FactoryProductKind,
  type GameState,
} from "../src/core/index.js";

let state: GameState = createCampaign("Browser Company");
const logLines: string[] = ["Campaign started. Pick a caliber to begin."];

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

function renderStatus(): void {
  const el = document.getElementById("status");
  if (!el) return;
  const tier = getTierProgress(state);
  const load = getSelectedAmmo(state);
  const loadNote = state.selectedCaliberId
    ? ` · ${LOAD_SUBTYPE_LABEL[state.selectedLoadSubtype]}${load ? ` $${load.productionCost}/rd` : ""}`
    : "";
  const mission = state.activeMission
    ? (() => {
        const c = getContract(state.activeMission!.contractId);
        return `<p class="meta">Mission: ${c?.name ?? state.activeMission!.contractId} — ${state.activeMission!.turnsRemaining}/${state.activeMission!.turnsNeeded} mo · oppHP ${state.activeMission!.oppositionHp.toFixed(0)}</p>`;
      })()
    : "";
  el.innerHTML = `
    <p class="status-line">${formatDate(state)} · $${state.funds.toFixed(0)} · RP ${state.researchPoints} (${state.scientists.length} sci → ${projectedLabRp(state)}/mo)${loadNote}</p>
    <p class="meta">Tier ${tier.currentLabel} · wins ${tier.jobsCompletedTotal} · pop ${livingPop(state)}/${state.barracksPopSlots} · armed ${companyTroopCount(state)} · reserve ${companyReserveCount(state)} · power ${companyPower(state).toFixed(0)}</p>
    <p class="meta">Hire $${currentRecruitUnitCost(state)}/ea · lifetime recruits ${state.lifetimeRecruitsHired}</p>
    ${mission}
  `;
}

function renderCaliber(): void {
  const el = document.getElementById("caliber");
  if (!el) return;
  if (state.selectedCaliberId) {
    el.innerHTML = `<p class="meta">Locked: <strong>${state.selectedCaliberId}</strong></p>`;
    return;
  }
  const opts = listStartingCalibers()
    .map(
      (c) =>
        `<option value="${c.id}">${c.name} → ${c.rifle} (FMJ $${c.productionCost})</option>`,
    )
    .join("");
  el.innerHTML = `
    <select id="cal-select">${opts}</select>
    <div class="row"><button type="button" class="primary" id="cal-go">Lock caliber</button></div>
  `;
  document.getElementById("cal-go")?.addEventListener("click", () => {
    const sel = document.getElementById("cal-select") as HTMLSelectElement;
    apply(selectCaliber(state, sel.value as CaliberId));
  });
}

function renderRecruit(): void {
  const el = document.getElementById("recruit");
  if (!el) return;
  el.innerHTML = `
    <p class="meta">Next unit $${currentRecruitUnitCost(state)} · +20% per 10 lifetime hires</p>
    <div class="row">
      <input type="number" id="rec-n" min="1" value="10" style="width:4.5rem" />
      <button type="button" class="primary" id="rec-go">Recruit</button>
    </div>
  `;
  document.getElementById("rec-go")?.addEventListener("click", () => {
    const n = Number((document.getElementById("rec-n") as HTMLInputElement).value) || 0;
    apply(recruitSoldiers(state, Math.max(0, Math.floor(n))));
  });
}

function renderFactory(): void {
  const el = document.getElementById("factory");
  if (!el) return;
  const lines = describeFactories(state);
  el.innerHTML = `
    <ul class="list">${lines.map((l) => `<li>${l}</li>`).join("") || "<li>(none)</li>"}</ul>
    <div class="row">
      <select id="fac-prod">
        <option value="ammo">ammo</option>
        <option value="weapons">weapons</option>
        <option value="gears">gears</option>
        <option value="grenades">grenades</option>
      </select>
      <button type="button" id="fac-go">Set product</button>
    </div>
  `;
  document.getElementById("fac-go")?.addEventListener("click", () => {
    const raw = (document.getElementById("fac-prod") as HTMLSelectElement).value;
    apply(setFactoryProduct(state, raw as FactoryProductKind));
  });
}

function renderResearch(): void {
  const el = document.getElementById("research");
  if (!el) return;
  const avail = listAvailableResearch(state);
  const opts = avail
    .map((n) => `<option value="${n.id}">${n.name} (${n.rpCost} RP)</option>`)
    .join("");
  el.innerHTML = `
    <p class="meta">RP ${state.researchPoints} · unlocked ${state.researchUnlocked.length}</p>
    <ul class="list">${describeAvailableResearch(state)
      .slice(0, 6)
      .map((l) => `<li>${l}</li>`)
      .join("") || "<li>(none available)</li>"}</ul>
    <div class="row">
      <select id="res-sel">${opts || '<option value="">—</option>'}</select>
      <button type="button" id="res-go">Spend RP</button>
    </div>
  `;
  document.getElementById("res-go")?.addEventListener("click", () => {
    const id = (document.getElementById("res-sel") as HTMLSelectElement).value;
    if (!id) return;
    apply(spendResearch(state, id));
  });
}

function renderBoard(): void {
  const el = document.getElementById("board");
  if (!el) return;
  const board = listBoardContracts(state);
  el.innerHTML = `
    <ul class="list">${describeBoard(state).map((l) => `<li>${l}</li>`).join("") || "<li>(empty)</li>"}</ul>
    <div class="row">
      <select id="job-sel">
        ${board.map((c, i) => `<option value="${c.id}">${i + 1}. ${c.name}</option>`).join("")}
      </select>
      <button type="button" class="primary" id="job-go">Accept job</button>
    </div>
  `;
  document.getElementById("job-go")?.addEventListener("click", () => {
    const id = (document.getElementById("job-sel") as HTMLSelectElement).value;
    if (!id) return;
    apply(startContract(state, id));
  });
}

function render(): void {
  renderStatus();
  renderCaliber();
  renderRecruit();
  renderFactory();
  renderResearch();
  renderBoard();
  const logEl = document.getElementById("log");
  if (logEl) logEl.textContent = logLines.join("\n");
}

function wireActions(): void {
  document.getElementById("btn-end")?.addEventListener("click", () => {
    const ended = endTurn(state);
    state = ended.state;
    log(ended.message);
    if (ended.data?.missionResolved) {
      log(`Mission: ${ended.data.missionResolved.summary}`);
      for (const e of ended.data.missionResolved.log) {
        log(`  M${e.month}: ${e.note}`);
      }
    }
    render();
  });
  document.getElementById("btn-arm")?.addEventListener("click", () => {
    apply(armSoldiers(state));
  });
  document.getElementById("btn-ammo")?.addEventListener("click", () => {
    apply(issueCompanyAmmo(state, LOCAL_CONTRACT.recommendedAmmoPerSoldier));
  });
}

wireActions();
render();
