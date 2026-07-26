export interface ImportedTrade {
  instrument: string;
  direction: "Long" | "Short";
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  fees: number;
  openedAt: string; // ISO
  closedAt: string; // ISO
}

// Mögliche Spaltenüberschriften je Feld — deckt gängige Exportformate von
// Rithmic-basierten Plattformen (VTT, R|Trader Pro, NinjaTrader) sowie
// Tradovate/generische Broker-Exporte ab. Bei Bedarf einfach ergänzen.
const HEADER_ALIASES: Record<string, string[]> = {
  instrument: ["symbol", "instrument", "product", "contract", "market"],
  side: ["side", "b/s", "buysell", "buy/sell", "direction", "action", "type"],
  quantity: ["qty", "quantity", "size", "contracts", "volume", "filled qty", "fillqty"],
  price: ["price", "fill price", "avg fill price", "execution price", "avg price"],
  time: ["time", "fill time", "exec time", "timestamp", "date/time", "transaction time", "datetime", "date"],
  entryPrice: ["entry price", "entry", "buy price", "avg entry price"],
  exitPrice: ["exit price", "exit", "sell price", "avg exit price"],
  openedAt: ["entry time", "open time", "opened at", "entry date"],
  closedAt: ["exit time", "close time", "closed at", "exit date"],
  fees: ["commission", "fees", "comm", "commissions"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumn(headers: string[], field: keyof typeof HEADER_ALIASES): number {
  const aliases = HEADER_ALIASES[field];
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseNumber(raw: string): number {
  // Entfernt Tausendertrennzeichen/Währungssymbole, wandelt Komma-Dezimal in Punkt um
  const cleaned = raw.replace(/[^0-9,.-]/g, "").replace(/\.(?=.*\.)/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function parseDirection(raw: string): "Long" | "Short" | null {
  const v = raw.trim().toLowerCase();
  if (["buy", "b", "long", "bot"].includes(v)) return "Long";
  if (["sell", "s", "short", "sld"].includes(v)) return "Short";
  return null;
}

export interface DetectedColumns {
  mode: "finished_trades" | "fills" | "unknown";
  columns: Record<string, number>;
}

export function detectColumns(headers: string[]): DetectedColumns {
  const entryPrice = findColumn(headers, "entryPrice");
  const exitPrice = findColumn(headers, "exitPrice");

  if (entryPrice !== -1 && exitPrice !== -1) {
    return {
      mode: "finished_trades",
      columns: {
        instrument: findColumn(headers, "instrument"),
        side: findColumn(headers, "side"),
        quantity: findColumn(headers, "quantity"),
        entryPrice,
        exitPrice,
        openedAt: findColumn(headers, "openedAt"),
        closedAt: findColumn(headers, "closedAt"),
        fees: findColumn(headers, "fees"),
      },
    };
  }

  const price = findColumn(headers, "price");
  const side = findColumn(headers, "side");
  if (price !== -1 && side !== -1) {
    return {
      mode: "fills",
      columns: {
        instrument: findColumn(headers, "instrument"),
        side,
        quantity: findColumn(headers, "quantity"),
        price,
        time: findColumn(headers, "time"),
        fees: findColumn(headers, "fees"),
      },
    };
  }

  return { mode: "unknown", columns: {} };
}

// Baut aus fertigen Trade-Zeilen (bereits Entry+Exit pro Zeile) die
// ImportedTrade-Liste.
export function buildFromFinishedTrades(rows: string[][], columns: Record<string, number>): ImportedTrade[] {
  const trades: ImportedTrade[] = [];
  for (const row of rows) {
    const instrument = columns.instrument !== -1 ? row[columns.instrument]?.trim() : "";
    const sideRaw = columns.side !== -1 ? row[columns.side] : "";
    const direction = parseDirection(sideRaw) ?? "Long";
    const contracts = columns.quantity !== -1 ? Math.abs(parseNumber(row[columns.quantity])) : 1;
    const entryPrice = parseNumber(row[columns.entryPrice]);
    const exitPrice = parseNumber(row[columns.exitPrice]);
    const openedAt = columns.openedAt !== -1 ? row[columns.openedAt] : "";
    const closedAt = columns.closedAt !== -1 ? row[columns.closedAt] : openedAt;
    const fees = columns.fees !== -1 ? Math.abs(parseNumber(row[columns.fees])) : 0;

    if (!instrument || !entryPrice || !exitPrice) continue;

    const openedDate = new Date(openedAt || closedAt);
    const closedDate = new Date(closedAt || openedAt);

    trades.push({
      instrument: instrument.toUpperCase(),
      direction,
      contracts,
      entryPrice,
      exitPrice,
      fees,
      openedAt: (isNaN(openedDate.getTime()) ? new Date() : openedDate).toISOString(),
      closedAt: (isNaN(closedDate.getTime()) ? new Date() : closedDate).toISOString(),
    });
  }
  return trades;
}

interface Fill {
  instrument: string;
  direction: "Long" | "Short";
  quantity: number;
  price: number;
  time: Date;
  fees: number;
}

// FIFO-Matching: fasst einzelne Kauf-/Verkaufs-Fills pro Instrument zu
// abgeschlossenen Round-Turn-Trades zusammen — genau wie ein Broker das
// beim Berechnen der P&L intern macht.
export function buildFromFills(rows: string[][], columns: Record<string, number>): ImportedTrade[] {
  const fills: Fill[] = [];

  for (const row of rows) {
    const instrument = columns.instrument !== -1 ? row[columns.instrument]?.trim() : "";
    const direction = parseDirection(row[columns.side]);
    const quantity = columns.quantity !== -1 ? Math.abs(parseNumber(row[columns.quantity])) : 1;
    const price = parseNumber(row[columns.price]);
    const time = new Date(columns.time !== -1 ? row[columns.time] : "");
    const fees = columns.fees !== -1 ? Math.abs(parseNumber(row[columns.fees])) : 0;

    if (!instrument || !direction || !quantity || !price || isNaN(time.getTime())) continue;

    fills.push({ instrument: instrument.toUpperCase(), direction, quantity, price, time, fees });
  }

  fills.sort((a, b) => a.time.getTime() - b.time.getTime());

  // Offene Positionslots je Instrument, FIFO-Warteschlange
  const openLots: Record<
    string,
    { direction: "Long" | "Short"; qty: number; originalQty: number; price: number; time: Date; fees: number }[]
  > = {};
  const trades: ImportedTrade[] = [];

  for (const fill of fills) {
    if (!openLots[fill.instrument]) openLots[fill.instrument] = [];
    const queue = openLots[fill.instrument];
    let remaining = fill.quantity;

    while (remaining > 0 && queue.length > 0 && queue[0].direction !== fill.direction) {
      const lot = queue[0];
      const matched = Math.min(lot.qty, remaining);
      const lotFeeShare = lot.fees * (matched / lot.originalQty);
      const fillFeeShare = fill.fees * (matched / fill.quantity);

      trades.push({
        instrument: fill.instrument,
        direction: lot.direction,
        contracts: matched,
        entryPrice: lot.price,
        exitPrice: fill.price,
        fees: lotFeeShare + fillFeeShare,
        openedAt: lot.time.toISOString(),
        closedAt: fill.time.toISOString(),
      });

      lot.qty -= matched;
      remaining -= matched;
      if (lot.qty <= 0) queue.shift();
    }

    if (remaining > 0) {
      const leftoverFeeShare = fill.fees * (remaining / fill.quantity);
      queue.push({
        direction: fill.direction,
        qty: remaining,
        originalQty: remaining,
        price: fill.price,
        time: fill.time,
        fees: leftoverFeeShare,
      });
    }
  }

  return trades;
}
