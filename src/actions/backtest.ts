'use server'

import { generateHistoricalPrices, generateFinancialMetrics, generateNewsData, calculateTechnicalIndicators, type StockData } from '../lib/mocks';
import { createLogger } from '@/lib/logger.server';
import { backtestService } from '@/services/backtestService';
import { strategies } from '@/services/backtestStrategies';
import { revalidatePath } from 'next/cache';
import type { BacktestResult as ServiceBacktestResult } from '@/services/backtestService';

// 创建日志记录器
const logger = createLogger('backtest-actions');

// 回测结果类型
export interface BacktestResult {
  equityCurve: { date: string; value: number }[];
  metrics: {
    totalReturn: number;
    annualizedReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    profitFactor: number;
  };
  trades: {
    date: string;
    type: 'buy' | 'sell';
    price: number;
    shares: number;
    profit?: number;
  }[];
  // 比较模式会有多个结果
  results?: {
    [key: string]: {
      equityCurve: { date: string; value: number }[];
      metrics: {
        totalReturn: number;
        annualizedReturn: number;
        maxDrawdown: number;
        sharpeRatio: number;
        winRate: number;
        profitFactor: number;
      };
    }
  };
  // AI分析字段
  analysis?: string;
  optimizationSuggestions?: string;
}

// 基础回测功能
async function runBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  strategy: (data: StockData[]) => { signal: 'buy' | 'sell' | 'hold' }
): Promise<BacktestResult> {
  try {
    // 获取历史价格数据
    const priceData = generateHistoricalPrices(ticker, startDate, endDate);
    
    if (priceData.length === 0) {
      throw new Error('没有找到足够的历史数据进行回测');
    }
    
    // 运行策略回测
    let cash = initialCapital;
    let shares = 0;
    let equity = initialCapital;
    const equityCurve: { date: string; value: number }[] = [];
    const trades: { date: string; type: 'buy' | 'sell'; price: number; shares: number; profit?: number }[] = [];
    
    // 记录绩效指标的变量
    let maxEquity = initialCapital;
    let maxDrawdown = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let winCount = 0;
    let lossCount = 0;
    
    // 对每个交易日应用策略
    for (let i = 20; i < priceData.length; i++) { // 从第20天开始，给指标计算留出空间
      const currentData = priceData.slice(0, i + 1);
      const currentDay = currentData[i];
      
      // 运行策略获取信号
      const { signal } = strategy(currentData);
      
      // 执行交易
      if (signal === 'buy' && cash > 0) {
        const sharesToBuy = Math.floor(cash / currentDay.close);
        if (sharesToBuy > 0) {
          trades.push({
            date: currentDay.date,
            type: 'buy',
            price: currentDay.close,
            shares: sharesToBuy
          });
          
          shares += sharesToBuy;
          cash -= sharesToBuy * currentDay.close;
        }
      } else if (signal === 'sell' && shares > 0) {
        const saleProceeds = shares * currentDay.close;
        const costBasis = trades
          .filter(t => t.type === 'buy')
          .reduce((sum, t) => sum + (t.price * t.shares), 0);
        
        const profit = saleProceeds - costBasis;
        
        trades.push({
          date: currentDay.date,
          type: 'sell',
          price: currentDay.close,
          shares,
          profit
        });
        
        // 更新绩效指标
        if (profit > 0) {
          totalProfit += profit;
          winCount++;
        } else {
          totalLoss += Math.abs(profit);
          lossCount++;
        }
        
        cash += saleProceeds;
        shares = 0;
      }
      
      // 计算当前权益
      equity = cash + (shares * currentDay.close);
      
      // 更新最大回撤
      if (equity > maxEquity) {
        maxEquity = equity;
      } else {
        const drawdown = (maxEquity - equity) / maxEquity;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
      
      // 记录权益曲线
      equityCurve.push({
        date: currentDay.date,
        value: equity
      });
    }
    
    // 计算回测绩效指标
    const totalDays = priceData.length;
    const annualizedReturn = Math.pow(equity / initialCapital, 252 / totalDays) - 1;
    const totalReturn = (equity / initialCapital) - 1;
    
    // 计算夏普比率 (简化版，使用无风险利率0%)
    const dailyReturns = equityCurve.map((point, i, arr) => {
      if (i === 0) return 0;
      return (point.value / arr[i - 1].value) - 1;
    }).slice(1);
    
    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const stdDailyReturn = Math.sqrt(
      dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length
    );
    
    const sharpeRatio = stdDailyReturn === 0 ? 0 : (avgDailyReturn * Math.sqrt(252)) / stdDailyReturn;
    
    // 计算胜率
    const winRate = (winCount + lossCount) === 0 ? 0 : winCount / (winCount + lossCount);
    
    // 计算盈亏比
    const profitFactor = totalLoss === 0 ? totalProfit : totalProfit / totalLoss;
    
    return {
      equityCurve,
      metrics: {
        totalReturn,
        annualizedReturn,
        maxDrawdown,
        sharpeRatio,
        winRate,
        profitFactor
      },
      trades
    };
  } catch (error) {
    console.error('回测失败:', error);
    throw error;
  }
}

/**
 * 将服务返回的BacktestResult转换为前端使用的BacktestResult格式
 */
function convertBacktestResult(
  serviceResult: ServiceBacktestResult,
  analysis?: string,
  optimizationSuggestions?: string
): BacktestResult {
  return {
    equityCurve: serviceResult.equityCurve,
    metrics: {
      totalReturn: serviceResult.returns,
      annualizedReturn: serviceResult.annualizedReturns,
      maxDrawdown: serviceResult.maxDrawdown,
      sharpeRatio: serviceResult.sharpeRatio,
      winRate: serviceResult.metrics.winRate || 0,
      profitFactor: serviceResult.metrics.profitFactor || 0
    },
    trades: serviceResult.trades.map(trade => ({
      date: trade.date,
      type: trade.action === 'buy' ? 'buy' : 'sell',
      price: trade.price,
      shares: trade.quantity,
      profit: trade.profit
    })),
    analysis,
    optimizationSuggestions
  };
}

/**
 * 运行价值投资策略回测
 */
export async function runValueBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  options?: {
    peRatio?: number;
    pbRatio?: number;
    dividendYield?: number;
  }
): Promise<BacktestResult> {
  try {
    logger.info(`开始价值投资回测: ${ticker} (${startDate} - ${endDate})`);
    
    const result = await backtestService.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy: strategies.value
    });
    
    // 添加AI分析报告
    const analysis = await backtestService.getBacktestAnalysis(result);
    const optimizationSuggestions = await backtestService.getOptimizationSuggestions(strategies.value, result);
    
    // 扩展结果对象，添加AI分析
    const enhancedResult = {
      ...result,
      analysis,
      optimizationSuggestions
    };
    
    revalidatePath('/backtest');
    revalidatePath('/dashboard/backtest');
    
    return enhancedResult;
  } catch (error) {
    logger.error(`价值投资回测失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`价值投资回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 运行趋势跟踪策略回测
 */
export async function runTrendFollowingBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  options?: {
    maShortPeriod?: number;
    maLongPeriod?: number;
    rsiPeriod?: number;
  }
): Promise<BacktestResult> {
  try {
    logger.info(`开始趋势跟踪回测: ${ticker} (${startDate} - ${endDate})`);
    
    const result = await backtestService.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy: strategies.trendFollowing
    });
    
    // 添加AI分析报告
    const analysis = await backtestService.getBacktestAnalysis(result);
    const optimizationSuggestions = await backtestService.getOptimizationSuggestions(strategies.trendFollowing, result);
    
    // 扩展结果对象
    const enhancedResult = {
      ...result,
      analysis,
      optimizationSuggestions
    };
    
    revalidatePath('/backtest');
    revalidatePath('/dashboard/backtest');
    
    return enhancedResult;
  } catch (error) {
    logger.error(`趋势跟踪回测失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`趋势跟踪回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 运行均值回归策略回测
 */
export async function runMeanReversionBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  options?: {
    bollingerPeriod?: number;
    bollingerDeviation?: number;
    rsiOverbought?: number;
    rsiOversold?: number;
  }
): Promise<BacktestResult> {
  try {
    logger.info(`开始均值回归回测: ${ticker} (${startDate} - ${endDate})`);
    
    const result = await backtestService.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy: strategies.meanReversion
    });
    
    // 添加AI分析报告
    const analysis = await backtestService.getBacktestAnalysis(result);
    const optimizationSuggestions = await backtestService.getOptimizationSuggestions(strategies.meanReversion, result);
    
    // 扩展结果对象
    const enhancedResult = {
      ...result,
      analysis,
      optimizationSuggestions
    };
    
    revalidatePath('/backtest');
    revalidatePath('/dashboard/backtest');
    
    return enhancedResult;
  } catch (error) {
    logger.error(`均值回归回测失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`均值回归回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 运行风险管理策略回测
 */
export async function runRiskManagementBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
): Promise<BacktestResult> {
  try {
    logger.info(`开始风险管理回测: ${ticker} (${startDate} - ${endDate})`);
    
    const result = await backtestService.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy: strategies.riskManagement
    });
    
    // 添加AI分析报告
    const analysis = await backtestService.getBacktestAnalysis(result);
    const optimizationSuggestions = await backtestService.getOptimizationSuggestions(strategies.riskManagement, result);
    
    // 扩展结果对象
    const enhancedResult = {
      ...result,
      analysis,
      optimizationSuggestions
    };
    
    revalidatePath('/backtest');
    revalidatePath('/dashboard/backtest');
    
    return enhancedResult;
  } catch (error) {
    logger.error(`风险管理回测失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`风险管理回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 运行混合策略回测
 */
export async function runHybridBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
): Promise<BacktestResult> {
  try {
    logger.info(`开始混合策略回测: ${ticker} (${startDate} - ${endDate})`);
    
    const result = await backtestService.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy: strategies.hybrid
    });
    
    // 添加AI分析报告
    const analysis = await backtestService.getBacktestAnalysis(result);
    const optimizationSuggestions = await backtestService.getOptimizationSuggestions(strategies.hybrid, result);
    
    // 扩展结果对象
    const enhancedResult = {
      ...result,
      analysis,
      optimizationSuggestions
    };
    
    revalidatePath('/backtest');
    revalidatePath('/dashboard/backtest');
    
    return enhancedResult;
  } catch (error) {
    logger.error(`混合策略回测失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`混合策略回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 运行多策略比较回测
 */
export async function runComparisonBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  strategyTypes: string[],
  strategyOptions?: {
    value?: {
      peRatio?: number;
      pbRatio?: number;
      dividendYield?: number;
    },
    momentum?: {
      maShortPeriod?: number;
      maLongPeriod?: number;
      rsiPeriod?: number;
      rsiOverbought?: number;
      rsiOversold?: number;
    },
    meanReversion?: {
      bollingerPeriod?: number;
      bollingerDeviation?: number;
    }
  }
): Promise<Record<string, BacktestResult>> {
  try {
    logger.info(`开始多策略比较回测: ${ticker} (${startDate} - ${endDate}), 策略: ${strategyTypes.join(', ')}`);
    
    const results: Record<string, BacktestResult> = {};
    
    // 并行运行多个策略回测
    await Promise.all(
      strategyTypes.map(async (strategyType) => {
        let result: BacktestResult;
        
        switch (strategyType) {
          case 'value':
            result = await runValueBacktest(ticker, initialCapital, startDate, endDate, strategyOptions?.value);
            break;
          case 'trend':
            result = await runTrendFollowingBacktest(ticker, initialCapital, startDate, endDate, strategyOptions?.momentum);
            break;
          case 'meanreversion':
            result = await runMeanReversionBacktest(ticker, initialCapital, startDate, endDate, strategyOptions?.meanReversion);
            break;
          case 'risk':
            result = await runRiskManagementBacktest(ticker, initialCapital, startDate, endDate);
            break;
          case 'hybrid':
            result = await runHybridBacktest(ticker, initialCapital, startDate, endDate);
            break;
          default:
            throw new Error(`未知策略类型: ${strategyType}`);
        }
        
        results[strategyType] = result;
      })
    );
    
    revalidatePath('/backtest');
    revalidatePath('/dashboard/backtest');
    
    return results;
  } catch (error) {
    logger.error(`多策略比较回测失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`多策略比较回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取回测分析和优化建议
 */
export async function getBacktestAnalysis(
  result: BacktestResult,
  strategyName: string
): Promise<{ analysis: string; optimizationSuggestions: string }> {
  try {
    const analysis = await backtestService.getBacktestAnalysis(result);
    
    // 查找对应的策略以获取优化建议
    let strategy = strategies.hybrid;
    if (strategyName === 'value') strategy = strategies.value;
    else if (strategyName === 'trend') strategy = strategies.trendFollowing;
    else if (strategyName === 'meanreversion') strategy = strategies.meanReversion;
    else if (strategyName === 'risk') strategy = strategies.riskManagement;
    
    const optimizationSuggestions = await backtestService.getOptimizationSuggestions(strategy, result);
    
    return {
      analysis,
      optimizationSuggestions
    };
  } catch (error) {
    logger.error(`获取回测分析失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`获取回测分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 辅助函数：计算移动平均线
function calculateMA(data: StockData[], period: number): number[] {
  const ma: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ma.push(0);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    
    ma.push(sum / period);
  }
  
  return ma;
}

// 辅助函数：计算RSI
function calculateRSI(data: StockData[], period: number): number {
  if (data.length <= period) {
    return 50; // 默认返回中性值
  }
  
  const prices = data.map(d => d.close);
  const changes = [];
  
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const changesForRSI = changes.slice(-period);
  
  let gains = 0;
  let losses = 0;
  
  changesForRSI.forEach(change => {
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  });
  
  if (losses === 0) {
    return 100;
  }
  
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

// 辅助函数：计算布林带
function calculateBollingerBands(data: StockData[], period: number, deviation: number): { 
  middle: number[]; 
  upper: number[]; 
  lower: number[]; 
} {
  const middle = calculateMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(0);
      lower.push(0);
      continue;
    }
    
    // 计算标准差
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += Math.pow(data[i - j].close - middle[i], 2);
    }
    
    const stdDev = Math.sqrt(sum / period);
    
    upper.push(middle[i] + deviation * stdDev);
    lower.push(middle[i] - deviation * stdDev);
  }
  
  return { middle, upper, lower };
}

// 辅助函数：获取策略显示名称
function getStrategyDisplayName(strategy: string): string {
  switch (strategy) {
    case 'value':
      return '价值投资';
    case 'momentum':
      return '动量策略';
    case 'meanReversion':
      return '均值回归';
    default:
      return strategy;
  }
}

/**
 * 运行技术分析策略回测
 */
export async function runTechnicalBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  options?: {
    maPeriod?: number;
    rsiPeriod?: number;
    macdFast?: number;
    macdSlow?: number;
    macdSignal?: number;
  }
): Promise<BacktestResult> {
  try {
    logger.info(`开始技术分析回测: ${ticker} (${startDate} - ${endDate})`);
    
    const result = await backtestService.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy: strategies.trendFollowing
    });
    
    // 添加AI分析报告
    const analysis = await backtestService.getBacktestAnalysis(result);
    const optimizationSuggestions = await backtestService.getOptimizationSuggestions(strategies.trendFollowing, result);
    
    // 转换并返回结果
    return convertBacktestResult(result, analysis, optimizationSuggestions);
  } catch (error) {
    logger.error(`技术分析回测失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`技术分析回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 运行情绪分析策略回测
 */
export async function runSentimentBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  options?: {
    sentimentThreshold?: number;
    newsWeight?: number;
    socialMediaWeight?: number;
  }
): Promise<BacktestResult> {
  try {
    logger.info(`开始情绪分析回测: ${ticker} (${startDate} - ${endDate})`);
    
    // 目前使用均值回归策略作为情绪分析的近似替代
    const result = await backtestService.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy: strategies.meanReversion
    });
    
    // 添加AI分析报告
    const analysis = await backtestService.getBacktestAnalysis(result);
    const optimizationSuggestions = await backtestService.getOptimizationSuggestions(strategies.meanReversion, result);
    
    // 转换并返回结果
    return convertBacktestResult(result, analysis, optimizationSuggestions);
  } catch (error) {
    logger.error(`情绪分析回测失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`情绪分析回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 运行风险管理策略回测
 */
export async function runRiskBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  options?: {
    maxDrawdown?: number;
    stopLoss?: number;
    takeProfit?: number;
    positionSizing?: number;
  }
): Promise<BacktestResult> {
  try {
    logger.info(`开始风险管理回测: ${ticker} (${startDate} - ${endDate})`);
    
    const result = await backtestService.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy: strategies.riskManagement
    });
    
    // 添加AI分析报告
    const analysis = await backtestService.getBacktestAnalysis(result);
    const optimizationSuggestions = await backtestService.getOptimizationSuggestions(strategies.riskManagement, result);
    
    // 转换并返回结果
    return convertBacktestResult(result, analysis, optimizationSuggestions);
  } catch (error) {
    logger.error(`风险管理回测失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`风险管理回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 运行混合策略回测
 */
export async function runMixedBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  options?: {
    technicalWeight?: number;
    fundamentalWeight?: number;
    sentimentWeight?: number;
    riskWeight?: number;
  }
): Promise<BacktestResult> {
  try {
    logger.info(`开始混合策略回测: ${ticker} (${startDate} - ${endDate})`);
    
    const result = await backtestService.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy: strategies.hybrid
    });
    
    // 添加AI分析报告
    const analysis = await backtestService.getBacktestAnalysis(result);
    const optimizationSuggestions = await backtestService.getOptimizationSuggestions(strategies.hybrid, result);
    
    // 转换并返回结果
    return convertBacktestResult(result, analysis, optimizationSuggestions);
  } catch (error) {
    logger.error(`混合策略回测失败: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`混合策略回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
} 