'use server';

// Export all actions for server components to use
export * from './quantitative-analysis';
export * from './portfolio-optimization';
export * from './portfolio-analysis';
export { 
  scheduleRebalance, 
  cancelScheduledRebalance,
  rebalancePortfolio as aiRebalancePortfolio
} from './portfolio-rebalance';
export * from './testPortfolioAnalysis';
export * from './ai-strategy-evaluation';
export * from './test-strategy-evaluation';
export * from './ai-factor-analysis';
export * from './test-factor-analysis';
export * from './test-portfolio-rebalance';
export * from './risk-assessment';
export * from './test-risk-assessment';
export * from './trading-simulation';
export * from './test-trading-simulation';
export * from './performance-dashboard';
export * from './test-performance-dashboard';

// Rename BacktestResult from backtest-strategy to avoid conflicts
export { 
  backtestStrategy,
  type TradeSignal,
  type TradeLogEntry,
  type StrategyType
} from './backtest-strategy';
export * from './testFinancialTools';
export * from './runAIAgentAnalysis';
export * from './testAIAgent';
export * from './backtestAI';
export * from './quantitative';
export * from './trading';
export * from './strategy';
export * from './backtest'; 