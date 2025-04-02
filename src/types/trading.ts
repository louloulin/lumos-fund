/**
 * 交易记录类型定义
 */
export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'dividend';
  ticker?: string;
  shares?: number;
  price?: number;
  amount?: number;
  timestamp: string;
}

/**
 * 持仓信息类型定义
 */
export interface Position {
  ticker: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
}

/**
 * 投资组合类型定义
 */
export interface Portfolio {
  id: string;
  name: string;
  cash: number;
  totalValue: number;
  lastUpdated: string;
  positions: Position[];
  performance: {
    day: number;
    week: number;
    month: number;
    year: number;
    total: number;
  };
  transactions: Transaction[];
}

/**
 * 交易操作类型定义
 */
export interface TradeOperation {
  userId: string;
  action: 'buy' | 'sell' | 'addCash' | 'withdraw';
  data: {
    ticker?: string;
    name?: string;
    shares?: number;
    price?: number;
    amount?: number;
  };
}

/**
 * 交易结果类型定义
 */
export interface TradeResult {
  success: boolean;
  message: string;
  portfolio?: Portfolio;
  error?: string;
} 