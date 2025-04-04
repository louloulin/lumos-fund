'use server'

import { createLogger } from '@/lib/logger.server';
import { 
  strategyRecommendationAgent, 
  quantInvestingAgent,
  technicalAnalysisAgent
} from '@/mastra/agents';
import { MarketDataService } from '@/services/marketDataService';
import { revalidatePath } from 'next/cache';

const logger = createLogger('backtest-strategy');
const marketDataService = new MarketDataService();

// 确保市场数据服务已初始化
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await marketDataService.initialize();
    isInitialized = true;
  }
}

/**
 * 交易信号类型
 */
export type TradeSignal = 'buy' | 'sell' | 'hold';

/**
 * 交易日志条目
 */
export interface TradeLogEntry {
  date: string;
  ticker: string;
  action: 'buy' | 'sell';
  price: number;
  shares: number;
  value: number;
  cash: number;
  portfolioValue: number;
  reason: string;
}

/**
 * 回测结果接口
 */
export interface BacktestResult {
  strategy: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
  performance: {
    startDate: string;
    endDate: string;
    initialCapital: number;
    finalCapital: number;
    totalReturn: number;
    annualizedReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    volatility: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
  };
  tradeLog: TradeLogEntry[];
  equityCurve: Array<{ date: string; equity: number }>;
  monthlyReturns: Record<string, number>;
  comparisonToBenchmark?: {
    benchmarkReturn: number;
    outperformance: number;
    correlationToBenchmark: number;
    alpha: number;
    beta: number;
  };
  strategyAnalysis: string;
  optimizationSuggestions: string;
}

/**
 * 策略类型
 */
export type StrategyType = 
  'value' | 'growth' | 'momentum' | 'meanReversion' | 
  'breakout' | 'trendFollowing' | 'statisticalArbitrage' | 
  'custom';

/**
 * 回测策略
 * @param options 回测选项
 */
export async function backtestStrategy(options: {
  tickers: string[];
  startDate: string;
  endDate: string;
  initialCapital: number;
  strategyType: StrategyType;
  parameters: Record<string, any>;
  benchmarkTicker?: string;
  rebalanceFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  customStrategyCode?: string;
}): Promise<BacktestResult> {
  try {
    logger.info('开始策略回测', { 
      tickers: options.tickers, 
      strategyType: options.strategyType,
      startDate: options.startDate,
      endDate: options.endDate
    });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 获取股票历史数据
    const tickerData: Record<string, any[]> = {};
    for (const ticker of options.tickers) {
      tickerData[ticker] = await marketDataService.fetchStockPriceHistory(ticker);
    }
    
    // 如果有基准指数，获取基准数据
    let benchmarkData: any[] = [];
    if (options.benchmarkTicker) {
      benchmarkData = await marketDataService.fetchStockPriceHistory(options.benchmarkTicker);
    }
    
    // 创建回测模拟器
    const simulator = new BacktestSimulator({
      tickers: options.tickers,
      initialCapital: options.initialCapital,
      startDate: options.startDate,
      endDate: options.endDate,
      priceData: tickerData,
      rebalanceFrequency: options.rebalanceFrequency || 'monthly'
    });
    
    // 生成交易信号
    const tradeSignals = await generateTradeSignals(
      options.strategyType,
      options.parameters,
      tickerData,
      options.customStrategyCode
    );
    
    // 执行回测
    const result = await simulator.run(tradeSignals);
    
    // 如果有基准指数，计算相对基准的比较指标
    if (benchmarkData.length > 0) {
      const benchmarkReturn = calculateBenchmarkReturn(benchmarkData);
      result.comparisonToBenchmark = {
        benchmarkReturn,
        outperformance: result.performance.totalReturn - benchmarkReturn,
        correlationToBenchmark: calculateCorrelation(result.equityCurve, benchmarkData),
        alpha: 0, // 需要更复杂的计算
        beta: 0 // 需要更复杂的计算
      };
    }
    
    // 使用AI分析回测结果
    const strategyAnalysis = await analyzeBacktestResults(result, options);
    
    // 生成优化建议
    const optimizationSuggestions = await suggestOptimizations(
      result,
      options.strategyType,
      options.parameters
    );
    
    result.strategyAnalysis = strategyAnalysis;
    result.optimizationSuggestions = optimizationSuggestions;
    
    logger.info('策略回测完成', { 
      strategyType: options.strategyType,
      totalReturn: `${(result.performance.totalReturn * 100).toFixed(2)}%`,
      sharpeRatio: result.performance.sharpeRatio.toFixed(2)
    });
    
    return result;
    
  } catch (error) {
    logger.error('策略回测失败', { 
      tickers: options.tickers, 
      strategyType: options.strategyType,
      error
    });
    throw error;
  }
}

/**
 * 回测模拟器类
 */
class BacktestSimulator {
  private tickers: string[];
  private initialCapital: number;
  private startDate: string;
  private endDate: string;
  private priceData: Record<string, any[]>;
  private rebalanceFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  
  constructor(options: {
    tickers: string[];
    initialCapital: number;
    startDate: string;
    endDate: string;
    priceData: Record<string, any[]>;
    rebalanceFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  }) {
    this.tickers = options.tickers;
    this.initialCapital = options.initialCapital;
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.priceData = options.priceData;
    this.rebalanceFrequency = options.rebalanceFrequency;
  }
  
  /**
   * 执行回测
   */
  async run(tradeSignals: Record<string, Record<string, TradeSignal>>): Promise<BacktestResult> {
    // 初始化投资组合状态
    let cash = this.initialCapital;
    let positions: Record<string, { shares: number, cost: number }> = {};
    const tradeLog: TradeLogEntry[] = [];
    const equityCurve: Array<{ date: string; equity: number }> = [];
    const monthlyReturns: Record<string, number> = {};
    
    // 准备日期数组
    const allDates = this.getAllTradingDates();
    let previousMonthYear = '';
    let monthStartEquity = this.initialCapital;
    
    // 循环遍历每个交易日
    for (const date of allDates) {
      const currentMonthYear = date.substring(0, 7); // YYYY-MM
      
      // 月度收益率计算
      if (currentMonthYear !== previousMonthYear && previousMonthYear !== '') {
        const currentEquity = this.calculatePortfolioValue(date, positions, cash);
        const monthlyReturn = (currentEquity - monthStartEquity) / monthStartEquity;
        monthlyReturns[previousMonthYear] = monthlyReturn;
        monthStartEquity = currentEquity;
      }
      
      // 检查是否需要执行再平衡
      const shouldRebalance = this.shouldRebalanceOnDate(date);
      
      if (shouldRebalance) {
        // 获取当日的交易信号
        for (const ticker of this.tickers) {
          if (tradeSignals[ticker] && tradeSignals[ticker][date]) {
            const signal = tradeSignals[ticker][date];
            const price = this.getPriceForDate(ticker, date);
            
            if (!price) continue; // 如果没有价格数据，跳过
            
            // 执行交易
            if (signal === 'buy') {
              // 简单策略：每次买入使用10%的现有现金
              if (cash > 0) {
                const amount = cash * 0.1;
                const shares = Math.floor(amount / price);
                
                if (shares > 0) {
                  cash -= shares * price;
                  
                  if (!positions[ticker]) {
                    positions[ticker] = { shares: 0, cost: 0 };
                  }
                  
                  positions[ticker].shares += shares;
                  positions[ticker].cost += shares * price;
                  
                  tradeLog.push({
                    date,
                    ticker,
                    action: 'buy',
                    price,
                    shares,
                    value: shares * price,
                    cash,
                    portfolioValue: this.calculatePortfolioValue(date, positions, cash),
                    reason: `${signal.toUpperCase()} signal triggered`
                  });
                }
              }
            } else if (signal === 'sell') {
              // 如果持有该股票，卖出全部
              if (positions[ticker] && positions[ticker].shares > 0) {
                const shares = positions[ticker].shares;
                const value = shares * price;
                
                cash += value;
                positions[ticker].shares = 0;
                positions[ticker].cost = 0;
                
                tradeLog.push({
                  date,
                  ticker,
                  action: 'sell',
                  price,
                  shares,
                  value,
                  cash,
                  portfolioValue: this.calculatePortfolioValue(date, positions, cash),
                  reason: `${signal.toUpperCase()} signal triggered`
                });
              }
            }
            // 'hold' 信号不执行任何操作
          }
        }
      }
      
      // 记录当日资产净值
      equityCurve.push({
        date,
        equity: this.calculatePortfolioValue(date, positions, cash)
      });
      
      previousMonthYear = currentMonthYear;
    }
    
    // 计算性能指标
    const performance = this.calculatePerformanceMetrics(equityCurve, tradeLog);
    
    return {
      strategy: {
        name: this.getStrategyName(),
        description: this.getStrategyDescription(),
        parameters: {} // 需要传入策略参数
      },
      performance,
      tradeLog,
      equityCurve,
      monthlyReturns,
      strategyAnalysis: '',
      optimizationSuggestions: ''
    };
  }
  
  /**
   * 获取特定日期的价格
   */
  private getPriceForDate(ticker: string, date: string): number | null {
    const priceData = this.priceData[ticker];
    const priceObj = priceData.find(item => item.date === date);
    return priceObj ? priceObj.close : null;
  }
  
  /**
   * 计算投资组合价值
   */
  private calculatePortfolioValue(
    date: string,
    positions: Record<string, { shares: number, cost: number }>,
    cash: number
  ): number {
    let value = cash;
    
    for (const [ticker, position] of Object.entries(positions)) {
      const price = this.getPriceForDate(ticker, date);
      if (price) {
        value += position.shares * price;
      }
    }
    
    return value;
  }
  
  /**
   * 判断特定日期是否应该进行再平衡
   */
  private shouldRebalanceOnDate(date: string): boolean {
    // 根据再平衡频率决定
    const day = new Date(date).getDay();
    const dayOfMonth = new Date(date).getDate();
    const month = new Date(date).getMonth();
    
    switch (this.rebalanceFrequency) {
      case 'daily':
        return true;
      case 'weekly':
        return day === 1; // 每周一
      case 'monthly':
        return dayOfMonth === 1; // 每月第一天
      case 'quarterly':
        return dayOfMonth === 1 && (month === 0 || month === 3 || month === 6 || month === 9); // 每季度第一天
      default:
        return false;
    }
  }
  
  /**
   * 获取所有交易日期
   */
  private getAllTradingDates(): string[] {
    // 从价格数据中提取所有唯一日期
    const dateSet = new Set<string>();
    
    for (const ticker of this.tickers) {
      const priceData = this.priceData[ticker];
      priceData.forEach(item => dateSet.add(item.date));
    }
    
    // 将日期排序
    return Array.from(dateSet).sort();
  }
  
  /**
   * 计算性能指标
   */
  private calculatePerformanceMetrics(
    equityCurve: Array<{ date: string; equity: number }>,
    tradeLog: TradeLogEntry[]
  ): any {
    const initialCapital = this.initialCapital;
    const finalCapital = equityCurve[equityCurve.length - 1].equity;
    const totalReturn = (finalCapital - initialCapital) / initialCapital;
    
    // 计算最大回撤
    let maxDrawdown = 0;
    let peak = initialCapital;
    
    for (const point of equityCurve) {
      if (point.equity > peak) {
        peak = point.equity;
      }
      
      const drawdown = (peak - point.equity) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    // 计算年化收益率
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    const yearsElapsed = (endDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / yearsElapsed) - 1;
    
    // 计算波动率 (简化)
    const dailyReturns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn = (equityCurve[i].equity - equityCurve[i-1].equity) / equityCurve[i-1].equity;
      dailyReturns.push(dailyReturn);
    }
    
    const avgDailyReturn = dailyReturns.reduce((sum, val) => sum + val, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, val) => sum + Math.pow(val - avgDailyReturn, 2), 0) / dailyReturns.length;
    const dailyVolatility = Math.sqrt(variance);
    const annualVolatility = dailyVolatility * Math.sqrt(252); // 假设一年252个交易日
    
    // 计算夏普比率 (简化，假设无风险利率为2%)
    const riskFreeRate = 0.02;
    const sharpeRatio = (annualizedReturn - riskFreeRate) / annualVolatility;
    
    // 计算胜率
    const trades = tradeLog.filter(log => log.action === 'sell');
    const winningTrades = trades.filter(trade => {
      const buyTrade = tradeLog.find(log => 
        log.ticker === trade.ticker && 
        log.action === 'buy' && 
        new Date(log.date) < new Date(trade.date)
      );
      
      return buyTrade && (trade.price > buyTrade.price);
    });
    
    const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;
    
    // 计算平均盈利和平均亏损
    let totalWin = 0;
    let totalLoss = 0;
    let winCount = 0;
    let lossCount = 0;
    
    for (const trade of trades) {
      const buyTrade = tradeLog.find(log => 
        log.ticker === trade.ticker && 
        log.action === 'buy' && 
        new Date(log.date) < new Date(trade.date)
      );
      
      if (buyTrade) {
        const profitPercent = (trade.price - buyTrade.price) / buyTrade.price;
        
        if (profitPercent > 0) {
          totalWin += profitPercent;
          winCount++;
        } else {
          totalLoss += Math.abs(profitPercent);
          lossCount++;
        }
      }
    }
    
    const averageWin = winCount > 0 ? totalWin / winCount : 0;
    const averageLoss = lossCount > 0 ? totalLoss / lossCount : 0;
    
    return {
      startDate: this.startDate,
      endDate: this.endDate,
      initialCapital,
      finalCapital,
      totalReturn,
      annualizedReturn,
      maxDrawdown,
      sharpeRatio,
      volatility: annualVolatility,
      winRate,
      averageWin,
      averageLoss
    };
  }
  
  /**
   * 获取策略名称
   */
  private getStrategyName(): string {
    return '多资产回测策略';
  }
  
  /**
   * 获取策略描述
   */
  private getStrategyDescription(): string {
    return `基于${this.rebalanceFrequency}再平衡频率的多资产投资策略，涵盖${this.tickers.length}个股票/资产。`;
  }
}

/**
 * 生成交易信号
 */
async function generateTradeSignals(
  strategyType: StrategyType,
  parameters: Record<string, any>,
  tickerData: Record<string, any[]>,
  customStrategyCode?: string
): Promise<Record<string, Record<string, TradeSignal>>> {
  // 初始化结果
  const result: Record<string, Record<string, TradeSignal>> = {};
  
  for (const [ticker, priceData] of Object.entries(tickerData)) {
    result[ticker] = {};
    
    // 如果有自定义策略代码，使用其生成信号
    if (customStrategyCode) {
      try {
        // 警告：在实际生产环境中执行任意代码存在安全风险
        // 应该使用沙箱或更安全的方式执行策略
        const strategyFunction = new Function('priceData', 'parameters', customStrategyCode);
        const signals = strategyFunction(priceData, parameters);
        Object.assign(result[ticker], signals);
        continue;
      } catch (error) {
        logger.error('执行自定义策略代码失败', { error });
        // 如果自定义代码执行失败，回退到预定义策略
      }
    }
    
    // 使用AI代理生成交易信号
    const signalPrompt = `
      请为以下股票生成交易信号:
      
      股票代码: ${ticker}
      策略类型: ${strategyType}
      策略参数: ${JSON.stringify(parameters, null, 2)}
      
      价格历史数据:
      ${JSON.stringify(priceData, null, 2)}
      
      请为每个交易日生成"buy", "sell", 或 "hold"信号。
      回复必须是有效的JSON格式，键为日期，值为信号，例如:
      {
        "2023-01-01": "hold",
        "2023-01-02": "buy",
        "2023-01-03": "hold",
        "2023-01-04": "sell"
      }
    `;
    
    try {
      // 选择合适的代理进行分析
      let agentToUse;
      
      switch (strategyType) {
        case 'value':
        case 'growth':
          agentToUse = strategyRecommendationAgent;
          break;
        case 'momentum':
        case 'meanReversion':
        case 'breakout':
        case 'trendFollowing':
          agentToUse = technicalAnalysisAgent;
          break;
        case 'statisticalArbitrage':
          agentToUse = quantInvestingAgent;
          break;
        default:
          agentToUse = strategyRecommendationAgent;
      }
      
      const response = await agentToUse.run({
        messages: [{ role: 'user', content: signalPrompt }]
      });
      
      // 解析结果
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const signals = JSON.parse(jsonMatch[0]);
          Object.assign(result[ticker], signals);
        }
      } catch (parseError) {
        logger.error('解析交易信号失败', { ticker, error: parseError });
      }
    } catch (error) {
      logger.error('生成交易信号失败', { ticker, strategyType, error });
    }
  }
  
  return result;
}

/**
 * 计算基准收益率
 */
function calculateBenchmarkReturn(benchmarkData: any[]): number {
  if (benchmarkData.length < 2) return 0;
  
  const initialPrice = benchmarkData[0].close;
  const finalPrice = benchmarkData[benchmarkData.length - 1].close;
  
  return (finalPrice - initialPrice) / initialPrice;
}

/**
 * 计算相关系数
 */
function calculateCorrelation(equityCurve: Array<{ date: string; equity: number }>, benchmarkData: any[]): number {
  // 简化实现，实际应该匹配日期并计算相关系数
  return 0.5; // 返回一个占位值
}

/**
 * 分析回测结果
 */
async function analyzeBacktestResults(result: BacktestResult, options: any): Promise<string> {
  const analysisPrompt = `
    请分析以下量化交易策略的回测结果：
    
    策略类型: ${options.strategyType}
    策略参数: ${JSON.stringify(options.parameters, null, 2)}
    回测时间段: ${options.startDate} 至 ${options.endDate}
    
    性能指标:
    - 总收益率: ${(result.performance.totalReturn * 100).toFixed(2)}%
    - 年化收益率: ${(result.performance.annualizedReturn * 100).toFixed(2)}%
    - 最大回撤: ${(result.performance.maxDrawdown * 100).toFixed(2)}%
    - 夏普比率: ${result.performance.sharpeRatio.toFixed(2)}
    - 波动率: ${(result.performance.volatility * 100).toFixed(2)}%
    - 胜率: ${(result.performance.winRate * 100).toFixed(2)}%
    - 平均盈利: ${(result.performance.averageWin * 100).toFixed(2)}%
    - 平均亏损: ${(result.performance.averageLoss * 100).toFixed(2)}%
    
    ${options.benchmarkTicker ? `相对基准(${options.benchmarkTicker})表现:
    - 基准收益率: ${(result.comparisonToBenchmark?.benchmarkReturn || 0 * 100).toFixed(2)}%
    - 超额收益: ${(result.comparisonToBenchmark?.outperformance || 0 * 100).toFixed(2)}%` : ''}
    
    请提供全面的分析，包括:
    1. 策略整体表现评估
    2. 关键优势和不足
    3. 策略在不同市场环境下的表现
    4. 风险收益特征分析
    5. 对该策略未来表现的预期
    
    分析应简洁明了，不超过300字。
  `;
  
  try {
    const response = await strategyRecommendationAgent.run({
      messages: [{ role: 'user', content: analysisPrompt }]
    });
    
    return response.content;
  } catch (error) {
    logger.error('分析回测结果失败', { error });
    return '无法生成策略分析。';
  }
}

/**
 * 生成优化建议
 */
async function suggestOptimizations(
  result: BacktestResult,
  strategyType: StrategyType,
  parameters: Record<string, any>
): Promise<string> {
  const optimizationPrompt = `
    请为以下量化交易策略提供优化建议：
    
    策略类型: ${strategyType}
    策略参数: ${JSON.stringify(parameters, null, 2)}
    
    回测结果摘要:
    - 总收益率: ${(result.performance.totalReturn * 100).toFixed(2)}%
    - 年化收益率: ${(result.performance.annualizedReturn * 100).toFixed(2)}%
    - 最大回撤: ${(result.performance.maxDrawdown * 100).toFixed(2)}%
    - 夏普比率: ${result.performance.sharpeRatio.toFixed(2)}
    - 胜率: ${(result.performance.winRate * 100).toFixed(2)}%
    
    请提供3-5个具体的策略优化建议，包括:
    1. 参数调整建议
    2. 风险管理改进
    3. 交易规则优化
    4. 可能的策略组合或改进方向
    
    每个建议应包含预期改进点和实施方法。建议应简洁明了，总计不超过300字。
  `;
  
  try {
    const response = await strategyRecommendationAgent.run({
      messages: [{ role: 'user', content: optimizationPrompt }]
    });
    
    return response.content;
  } catch (error) {
    logger.error('生成优化建议失败', { error });
    return '无法生成优化建议。';
  }
} 