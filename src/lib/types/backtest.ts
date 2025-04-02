/**
 * 回测结果类型定义
 */
export interface BacktestResult {
  // 策略基本信息
  strategy: string;
  initialCapital: number;
  finalCapital: number;
  
  // 收益相关指标
  returns: number;
  annualizedReturns: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  
  // 交易相关数据
  trades: number;
  successfulTrades: number;
  
  // 每日收益数据
  dailyReturns: {
    date: string;
    value: number;
    benchmark: number;
  }[];
  
  // 交易记录
  positions: {
    date: string;
    symbol: string;
    action: string;
    price: number;
    shares: number;
    value: number;
    returnPct?: number;
  }[];
  
  // 统计指标
  statistics: {
    name: string;
    value: string | number;
  }[];
}

/**
 * 回测参数类型定义
 */
export interface BacktestParams {
  // 资产相关
  ticker: string;
  initialCapital: number;
  
  // 时间范围
  startDate: string;
  endDate: string;
  
  // 策略参数
  strategyType: 'value' | 'growth' | 'trend' | 'quant' | 'sentiment' | 'risk' | 'mixed' | 'comparison';
  
  // 可选参数
  stopLoss?: number;        // 止损百分比
  takeProfit?: number;      // 止盈百分比
  positionSizing?: number;  // 仓位大小百分比
  rebalanceDays?: number;   // 再平衡天数
}

/**
 * 回测标的资产类型
 */
export interface BacktestAsset {
  symbol: string;  // 资产代码
  name: string;    // 资产名称
  type: 'stock' | 'etf' | 'crypto' | 'forex';  // 资产类型
}

/**
 * 回测行情数据点
 */
export interface PriceDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

/**
 * 回测信号类型
 */
export type TradeSignal = 'buy' | 'sell' | 'hold'; 