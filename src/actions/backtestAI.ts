'use server'

import { Backtester, BacktestStrategyFactory } from '@/lib/backtester';
import { createLogger } from '@/lib/logger.server';
import { parseTrendAgentOutput } from '@/mastra/agents/trendInvestingAgent';

const logger = createLogger('backtestAI-action');

/**
 * 基于价值投资AI代理的回测
 */
export async function runValueAgentBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
) {
  try {
    logger.info('运行价值投资AI代理回测', { ticker, startDate, endDate });
    
    const backtester = new Backtester();
    const strategy = BacktestStrategyFactory.createValueStrategy(ticker);
    
    const result = await backtester.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy
    });
    
    return result;
  } catch (error) {
    logger.error('价值投资AI代理回测失败', { ticker, error });
    throw new Error(`回测失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 基于成长投资AI代理的回测
 */
export async function runGrowthAgentBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
) {
  try {
    logger.info('运行成长投资AI代理回测', { ticker, startDate, endDate });
    
    const backtester = new Backtester();
    const strategy = BacktestStrategyFactory.createGrowthStrategy(ticker);
    
    const result = await backtester.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy
    });
    
    return result;
  } catch (error) {
    logger.error('成长投资AI代理回测失败', { ticker, error });
    throw new Error(`回测失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 基于趋势投资AI代理的回测
 */
export async function runTrendAgentBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
) {
  try {
    logger.info('运行趋势投资AI代理回测', { ticker, startDate, endDate });
    
    const backtester = new Backtester();
    const strategy = BacktestStrategyFactory.createTrendStrategy(ticker);
    
    // 增强趋势投资策略的实现
    const originalGenerateSignal = strategy.generateSignal;
    strategy.generateSignal = async (data, date, portfolio) => {
      const signal = await originalGenerateSignal(data, date, portfolio);
      
      // 如果信号存在且有推理说明，则使用增强的解析功能
      if (signal && signal.reasoning) {
        try {
          const parsedOutput = parseTrendAgentOutput(signal.reasoning);
          return {
            ...signal,
            action: parsedOutput.action,
            confidence: parsedOutput.confidence,
            position: parsedOutput.position
          };
        } catch (error) {
          logger.warn('解析趋势代理输出失败，使用原始信号', { error });
          return signal;
        }
      }
      
      return signal;
    };
    
    const result = await backtester.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy
    });
    
    return result;
  } catch (error) {
    logger.error('趋势投资AI代理回测失败', { ticker, error });
    throw new Error(`回测失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 基于量化投资AI代理的回测
 */
export async function runQuantAgentBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
) {
  try {
    logger.info('运行量化投资AI代理回测', { ticker, startDate, endDate });
    
    const backtester = new Backtester();
    const strategy = BacktestStrategyFactory.createQuantStrategy(ticker);
    
    const result = await backtester.runBacktest({
      ticker,
      initialCapital,
      startDate,
      endDate,
      strategy
    });
    
    return result;
  } catch (error) {
    logger.error('量化投资AI代理回测失败', { ticker, error });
    throw new Error(`回测失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 运行AI代理的比较回测
 */
export async function runAgentComparisonBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  agentTypes: ('value' | 'growth' | 'trend' | 'quant')[]
) {
  try {
    logger.info('运行AI代理比较回测', { ticker, startDate, endDate, agentTypes });
    
    const results: Record<string, any> = {};
    const backtester = new Backtester();
    
    // 并行运行所有选定的AI代理回测
    const backTestPromises = agentTypes.map(async (type) => {
      let strategy;
      
      switch (type) {
        case 'value':
          strategy = BacktestStrategyFactory.createValueStrategy(ticker);
          break;
        case 'growth':
          strategy = BacktestStrategyFactory.createGrowthStrategy(ticker);
          break;
        case 'trend':
          strategy = BacktestStrategyFactory.createTrendStrategy(ticker);
          // 增强趋势策略，应用解析器
          if (type === 'trend') {
            const originalGenerateSignal = strategy.generateSignal;
            strategy.generateSignal = async (data, date, portfolio) => {
              const signal = await originalGenerateSignal(data, date, portfolio);
              
              // 如果信号存在且有推理说明，则使用增强的解析功能
              if (signal && signal.reasoning) {
                try {
                  const parsedOutput = parseTrendAgentOutput(signal.reasoning);
                  return {
                    ...signal,
                    action: parsedOutput.action,
                    confidence: parsedOutput.confidence,
                    position: parsedOutput.position
                  };
                } catch (error) {
                  logger.warn('解析趋势代理输出失败，使用原始信号', { error });
                  return signal;
                }
              }
              
              return signal;
            };
          }
          break;
        case 'quant':
          strategy = BacktestStrategyFactory.createQuantStrategy(ticker);
          break;
        default:
          throw new Error(`未支持的代理类型: ${type}`);
      }
      
      const result = await backtester.runBacktest({
        ticker,
        initialCapital,
        startDate,
        endDate,
        strategy
      });
      
      return { type, result };
    });
    
    // 等待所有回测完成
    const backTestResults = await Promise.all(backTestPromises);
    
    // 合并结果
    for (const { type, result } of backTestResults) {
      results[type] = {
        equityCurve: result.equityCurve,
        metrics: result.metrics,
        finalValue: result.finalValue,
        returns: result.returns,
        annualizedReturns: result.annualizedReturns,
        maxDrawdown: result.maxDrawdown,
        sharpeRatio: result.sharpeRatio
      };
    }
    
    // 返回统一格式的结果，包含所有AI代理的结果
    return {
      startDate,
      endDate,
      initialCapital,
      ticker,
      results
    };
  } catch (error) {
    logger.error('AI代理比较回测失败', { ticker, error });
    throw new Error(`比较回测失败: ${error instanceof Error ? error.message : String(error)}`);
  }
} 