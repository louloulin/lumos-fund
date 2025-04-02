'use server';

import { createLogger } from '@/lib/logger.server';
import { Backtester, BacktestOptions } from '@/lib/backtester';
import { 
  createValueStrategy, 
  createTechnicalStrategy, 
  createSentimentStrategy,
  createRiskManagedStrategy,
  createMixedStrategy
} from '@/lib/strategy-generator';
import { revalidatePath } from 'next/cache';

const logger = createLogger('backtestActions');

/**
 * 运行价值投资回测
 */
export async function runValueBacktest(options: {
  ticker: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
}) {
  logger.info(`运行价值投资回测: ${options.ticker}`);
  
  try {
    const backtester = new Backtester();
    
    // 创建价值投资策略
    const strategy = await createValueStrategy({
      name: '价值投资策略',
      type: 'value',
      agentName: 'valueInvestingAgent'
    });
    
    // 运行回测
    const result = await backtester.runBacktest({
      ...options,
      strategy
    });
    
    revalidatePath('/backtest');
    
    return { success: true, data: result };
  } catch (error) {
    logger.error('价值投资回测失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '回测失败'
    };
  }
}

/**
 * 运行技术分析回测
 */
export async function runTechnicalBacktest(options: {
  ticker: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
}) {
  logger.info(`运行技术分析回测: ${options.ticker}`);
  
  try {
    const backtester = new Backtester();
    
    // 创建技术分析策略
    const strategy = await createTechnicalStrategy({
      name: '技术分析策略',
      type: 'technical',
      agentName: 'technicalAnalysisAgent'
    });
    
    // 运行回测
    const result = await backtester.runBacktest({
      ...options,
      strategy
    });
    
    revalidatePath('/backtest');
    
    return { success: true, data: result };
  } catch (error) {
    logger.error('技术分析回测失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '回测失败'
    };
  }
}

/**
 * 运行情绪分析回测
 */
export async function runSentimentBacktest(options: {
  ticker: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
}) {
  logger.info(`运行情绪分析回测: ${options.ticker}`);
  
  try {
    const backtester = new Backtester();
    
    // 创建情绪分析策略
    const strategy = await createSentimentStrategy({
      name: '情绪分析策略',
      type: 'sentiment',
      agentName: 'sentimentAnalysisAgent'
    });
    
    // 运行回测
    const result = await backtester.runBacktest({
      ...options,
      strategy
    });
    
    revalidatePath('/backtest');
    
    return { success: true, data: result };
  } catch (error) {
    logger.error('情绪分析回测失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '回测失败'
    };
  }
}

/**
 * 运行风险管理回测
 */
export async function runRiskManagedBacktest(options: {
  ticker: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
}) {
  logger.info(`运行风险管理回测: ${options.ticker}`);
  
  try {
    const backtester = new Backtester();
    
    // 创建风险管理策略
    const strategy = await createRiskManagedStrategy({
      name: '风险管理策略',
      type: 'mixed',
      agentName: 'riskManagementAgent'
    });
    
    // 运行回测
    const result = await backtester.runBacktest({
      ...options,
      strategy
    });
    
    revalidatePath('/backtest');
    
    return { success: true, data: result };
  } catch (error) {
    logger.error('风险管理回测失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '回测失败'
    };
  }
}

/**
 * 运行混合策略回测
 */
export async function runMixedBacktest(options: {
  ticker: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
  weights?: {
    value?: number;
    technical?: number;
    sentiment?: number;
    risk?: number;
  }
}) {
  logger.info(`运行混合策略回测: ${options.ticker}`);
  
  try {
    const backtester = new Backtester();
    
    // 设置默认权重
    const weights = options.weights || {};
    
    // 创建混合策略
    const strategy = await createMixedStrategy({
      name: '混合策略',
      valueWeight: weights.value,
      technicalWeight: weights.technical,
      sentimentWeight: weights.sentiment,
      riskWeight: weights.risk
    });
    
    // 运行回测
    const result = await backtester.runBacktest({
      ticker: options.ticker,
      initialCapital: options.initialCapital,
      startDate: options.startDate,
      endDate: options.endDate,
      strategy
    });
    
    revalidatePath('/backtest');
    
    return { success: true, data: result };
  } catch (error) {
    logger.error('混合策略回测失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '回测失败'
    };
  }
}

// 定义一个结果接口，避免TypeScript错误
interface StrategyResults {
  [key: string]: {
    name: string;
    returns: number;
    finalValue: number;
    maxDrawdown: number;
    sharpeRatio: number;
    equityCurve: { date: string; value: number }[];
    trades: number;
  }
}

/**
 * 运行多策略比较回测
 */
export async function runStrategyComparisonBacktest(options: {
  ticker: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
  strategies: ('value' | 'technical' | 'sentiment' | 'risk' | 'mixed')[];
}) {
  logger.info(`运行多策略比较回测: ${options.ticker}`);
  
  try {
    const backtester = new Backtester();
    const results: StrategyResults = {};
    
    // 运行每个策略的回测
    for (const strategyType of options.strategies) {
      let strategy;
      
      switch (strategyType) {
        case 'value':
          strategy = await createValueStrategy({
            name: '价值投资策略',
            type: 'value',
            agentName: 'valueInvestingAgent'
          });
          break;
        case 'technical':
          strategy = await createTechnicalStrategy({
            name: '技术分析策略',
            type: 'technical',
            agentName: 'technicalAnalysisAgent'
          });
          break;
        case 'sentiment':
          strategy = await createSentimentStrategy({
            name: '情绪分析策略',
            type: 'sentiment',
            agentName: 'sentimentAnalysisAgent'
          });
          break;
        case 'risk':
          strategy = await createRiskManagedStrategy({
            name: '风险管理策略',
            type: 'mixed',
            agentName: 'riskManagementAgent'
          });
          break;
        case 'mixed':
          strategy = await createMixedStrategy({
            name: '混合策略'
          });
          break;
      }
      
      if (strategy) {
        const result = await backtester.runBacktest({
          ticker: options.ticker,
          initialCapital: options.initialCapital,
          startDate: options.startDate,
          endDate: options.endDate,
          strategy
        });
        
        results[strategyType] = {
          name: strategy.name,
          returns: result.returns,
          finalValue: result.finalValue,
          maxDrawdown: result.maxDrawdown,
          sharpeRatio: result.sharpeRatio,
          equityCurve: result.equityCurve,
          trades: result.trades.length
        };
      }
    }
    
    revalidatePath('/backtest');
    
    return { 
      success: true, 
      data: {
        ticker: options.ticker,
        initialCapital: options.initialCapital,
        startDate: options.startDate,
        endDate: options.endDate,
        results
      } 
    };
  } catch (error) {
    logger.error('多策略比较回测失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '回测失败'
    };
  }
} 