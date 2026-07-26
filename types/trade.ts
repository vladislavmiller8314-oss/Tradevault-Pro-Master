export type AccountType = "Prop" | "Live" | "Demo" | "Evaluation";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export type Direction = "Long" | "Short";

export interface Trade {
  id: string;
  accountId: string;
  instrument: string;
  direction: Direction;
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  stopPrice: number;
  targetPrice: number;
  fees: number;
  pnl: number;
  setup: string;
  emotion: string;
  ruleAdherence?: "eingehalten" | "teilweise" | "gebrochen";
  improvementNote?: string;
  preTradeEmotion?: string;
  screenshotUrl?: string;
  notes?: string;
  openedAt: string;
  closedAt: string;
}

export interface EquityPoint {
  date: string;
  equity: number;
}
