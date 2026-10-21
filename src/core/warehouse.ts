import type { ActionResult, GameState, StockEntry, StockKind, Warehouse } from "./types.js";

export function stockWeight(stocks: StockEntry[]): number {
  return stocks.reduce((s, e) => s + e.quantity * e.weightPerUnit, 0);
}

export function stockVolume(stocks: StockEntry[]): number {
  return stocks.reduce((s, e) => s + e.quantity * e.volumePerUnit, 0);
}

export function remainingCapacity(wh: Warehouse): { weight: number; volume: number } {
  return {
    weight: wh.maxWeight - stockWeight(wh.stocks),
    volume: wh.maxVolume - stockVolume(wh.stocks),
  };
}

export function findStock(
  wh: Warehouse,
  kind: StockKind,
  itemId: string,
): StockEntry | undefined {
  return wh.stocks.find((s) => s.kind === kind && s.itemId === itemId);
}

export function getQuantity(wh: Warehouse, kind: StockKind, itemId: string): number {
  return findStock(wh, kind, itemId)?.quantity ?? 0;
}

function cloneWarehouse(wh: Warehouse): Warehouse {
  return {
    ...wh,
    stocks: wh.stocks.map((s) => ({ ...s })),
  };
}

export function canStore(
  wh: Warehouse,
  entry: Omit<StockEntry, "quantity"> & { quantity: number },
): boolean {
  if (entry.quantity <= 0) return true;
  const rem = remainingCapacity(wh);
  const addW = entry.quantity * entry.weightPerUnit;
  const addV = entry.quantity * entry.volumePerUnit;
  return addW <= rem.weight + 1e-9 && addV <= rem.volume + 1e-9;
}

export function storeItems(
  state: GameState,
  kind: StockKind,
  itemId: string,
  quantity: number,
  weightPerUnit: number,
  volumePerUnit: number,
): ActionResult<{ stored: number }> {
  if (quantity <= 0) {
    return { ok: true, state, message: "Nothing to store.", data: { stored: 0 } };
  }

  const proposed = { kind, itemId, quantity, weightPerUnit, volumePerUnit };
  if (!canStore(state.warehouse, proposed)) {
    return {
      ok: false,
      state,
      message: `Warehouse cannot hold ${quantity}× ${kind}:${itemId} (weight/volume limit).`,
      data: { stored: 0 },
    };
  }

  const wh = cloneWarehouse(state.warehouse);
  const existing = findStock(wh, kind, itemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    wh.stocks.push({ kind, itemId, quantity, weightPerUnit, volumePerUnit });
  }

  return {
    ok: true,
    state: { ...state, warehouse: wh },
    message: `Stored ${quantity}× ${kind}:${itemId}.`,
    data: { stored: quantity },
  };
}

/** Store as many as fit; returns how many were stored. */
export function storeAsMany(
  state: GameState,
  kind: StockKind,
  itemId: string,
  quantity: number,
  weightPerUnit: number,
  volumePerUnit: number,
): ActionResult<{ stored: number }> {
  if (quantity <= 0) {
    return { ok: true, state, message: "Nothing to store.", data: { stored: 0 } };
  }
  const rem = remainingCapacity(state.warehouse);
  const maxByW = weightPerUnit > 0 ? Math.floor(rem.weight / weightPerUnit) : quantity;
  const maxByV = volumePerUnit > 0 ? Math.floor(rem.volume / volumePerUnit) : quantity;
  const fit = Math.max(0, Math.min(quantity, maxByW, maxByV));
  if (fit === 0) {
    return {
      ok: false,
      state,
      message: `No warehouse space for ${kind}:${itemId}.`,
      data: { stored: 0 },
    };
  }
  return storeItems(state, kind, itemId, fit, weightPerUnit, volumePerUnit);
}

export function withdrawItems(
  state: GameState,
  kind: StockKind,
  itemId: string,
  quantity: number,
): ActionResult<{ withdrawn: number }> {
  if (quantity <= 0) {
    return { ok: true, state, message: "Nothing to withdraw.", data: { withdrawn: 0 } };
  }
  const available = getQuantity(state.warehouse, kind, itemId);
  if (available < quantity) {
    return {
      ok: false,
      state,
      message: `Need ${quantity} ${kind}:${itemId}, have ${available}.`,
      data: { withdrawn: 0 },
    };
  }

  const wh = cloneWarehouse(state.warehouse);
  const stock = findStock(wh, kind, itemId)!;
  stock.quantity -= quantity;
  if (stock.quantity === 0) {
    wh.stocks = wh.stocks.filter((s) => !(s.kind === kind && s.itemId === itemId));
  }

  return {
    ok: true,
    state: { ...state, warehouse: wh },
    message: `Withdrew ${quantity}× ${kind}:${itemId}.`,
    data: { withdrawn: quantity },
  };
}
