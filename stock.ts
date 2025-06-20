export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high52Week: number;
  low52Week: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PredictionData {
  date: string;
  actual: number;
  predicted: number;
  confidence: number;
}

export interface InvestmentRecommendation {
  symbol: string;
  name: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  targetPrice: number;
  confidence: number;
  reason: string;
}