// Best-effort Zuordnung von rohen Instrument-Codes (wie sie aus manueller
// Eingabe oder CSV-Import kommen, z. B. "ES", "MES", "NQ") zu einem
// TradingView-Symbol, das im kostenlosen Chart-Widget funktioniert. Wie
// beim Marktmonitor gilt: reine CME-Futures-Symbole brauchen bei
// TradingView ein Login/Datenabo, deshalb hier auf frei zugängliche
// CFD-/Kontinuierliche-Symbole ausweichen, wo möglich.
const INSTRUMENT_MAP: Record<string, string> = {
  ES: "FOREXCOM:SPXUSD",
  MES: "FOREXCOM:SPXUSD",
  NQ: "FOREXCOM:NSXUSD",
  MNQ: "FOREXCOM:NSXUSD",
  YM: "FOREXCOM:DJI",
  MYM: "FOREXCOM:DJI",
  RTY: "FOREXCOM:US2000USD",
  M2K: "FOREXCOM:US2000USD",
  CL: "TVC:USOIL",
  MCL: "TVC:USOIL",
  GC: "TVC:GOLD",
  MGC: "TVC:GOLD",
  SI: "TVC:SILVER",
  "6E": "FX:EURUSD",
  M6E: "FX:EURUSD",
  "6B": "FX:GBPUSD",
  "6J": "FX:USDJPY",
};

export function mapInstrumentToTradingViewSymbol(rawInstrument: string): string {
  // Instrument-Codes aus Exporten enthalten oft einen Kontrakt-Zusatz,
  // z. B. "ES-202609-CME" oder "ESZ26" — den Kern-Code davor extrahieren.
  const core = rawInstrument.split(/[-\s]/)[0].replace(/[0-9]+$/, "").toUpperCase();
  return INSTRUMENT_MAP[core] ?? rawInstrument;
}
