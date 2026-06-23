export type TradeDirection = "long" | "short";
export type TradeOutcome = "win" | "loss" | "breakeven";

export interface Trade {
  id: string;
  date: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  setup: string;
  notes: string;
  emotions: string;
  mistakes: string;
  lessons: string;
  outcome: TradeOutcome;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  marketNotes: string;
  pnlNotes: string;
  mood: string;
  goals: string;
  reflections: string;
  createdAt: string;
}

export interface CoachReview {
  id: string;
  date: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
  encouragement: string;
  createdAt: string;
}

export interface EmbeddingChunk {
  id: string;
  type: "trade" | "journal";
  refId: string;
  date: string;
  text: string;
  embedding: number[];
}

export interface Settings {
  openaiModel: string;
  embeddingModel: string;
}

export interface Database {
  trades: Trade[];
  journals: JournalEntry[];
  reviews: CoachReview[];
  embeddings: EmbeddingChunk[];
  settings: Settings;
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
}

export interface DayStats extends TradeStats {
  date: string;
}
