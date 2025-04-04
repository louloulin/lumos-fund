'use server';

// Export all actions for server components to use
export * from './quantitative-analysis';
export * from './portfolio-optimization';
export * from './portfolio-analysis';
export * from './testPortfolioAnalysis';
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