'use server'

import { createLogger } from '@/lib/logger.server';
import { backtestStrategy } from './backtest-strategy';
import { evaluateStrategy, compareStrategyEvaluations } from './ai-strategy-evaluation';

const logger = createLogger('test-strategy-evaluation');

/**
 * 测试单个策略的评估功能
 */
export async function testStrategyEvaluation(
  ticker: string = 'AAPL',
  strategyType: 'value' | 'growth' | 'momentum' | 'meanReversion' = 'value',
  period: string = '1y'
): Promise<any> {
  try {
    logger.info('开始测试策略评估', { ticker, strategyType });
    
    // 设置回测参数
    const startDate = period === '1y' 
      ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : period === '6m'
        ? new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const endDate = new Date().toISOString().split('T')[0];
    
    // 根据策略类型配置参数
    const parameters = getStrategyParameters(strategyType);
    
    // 执行回测
    const backtestResult = await backtestStrategy({
      tickers: [ticker],
      startDate,
      endDate,
      initialCapital: 10000,
      strategyType,
      parameters,
      benchmarkTicker: 'SPY'
    });
    
    // 执行策略评估
    const evaluationResult = await evaluateStrategy(
      backtestResult,
      strategyType,
      parameters,
      'neutral'
    );
    
    logger.info('策略评估测试完成', { 
      ticker, 
      strategyType, 
      overallScore: evaluationResult.performance.overallScore 
    });
    
    return {
      success: true,
      backtestResult: {
        performance: backtestResult.performance,
        strategy: backtestResult.strategy,
        tradeCount: backtestResult.tradeLog.length
      },
      evaluationResult
    };
    
  } catch (error) {
    logger.error('策略评估测试失败', { ticker, strategyType, error });
    return {
      success: false,
      error: `测试失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 测试多个策略的比较功能
 */
export async function testStrategyComparison(
  ticker: string = 'MSFT',
  period: string = '1y'
): Promise<any> {
  try {
    logger.info('开始测试策略比较', { ticker });
    
    // 要比较的策略类型
    const strategyTypes = ['value', 'growth', 'momentum', 'meanReversion'] as const;
    
    // 并行执行多个策略评估
    const evaluationPromises = strategyTypes.map(strategyType => 
      testStrategyEvaluation(ticker, strategyType, period)
        .then(result => result.success ? result.evaluationResult : null)
    );
    
    // 等待所有评估完成
    const evaluationResults = (await Promise.all(evaluationPromises)).filter(Boolean);
    
    if (evaluationResults.length < 2) {
      throw new Error('至少需要两个成功的策略评估才能进行比较');
    }
    
    // 执行策略比较
    const comparisonResult = await compareStrategyEvaluations(evaluationResults);
    
    logger.info('策略比较测试完成', { 
      ticker, 
      strategiesCount: evaluationResults.length,
      bestOverall: comparisonResult.recommendations.bestOverallStrategy 
    });
    
    return {
      success: true,
      evaluatedStrategies: strategyTypes
        .filter((_, i) => evaluationResults[i])
        .map(type => ({
          type,
          score: evaluationResults.find(r => r.strategyType === type)?.performance.overallScore || 0
        })),
      bestStrategies: comparisonResult.recommendations,
      comparisonReport: comparisonResult.comparisonReport
    };
    
  } catch (error) {
    logger.error('策略比较测试失败', { ticker, error });
    return {
      success: false,
      error: `测试失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 根据策略类型获取测试参数
 */
function getStrategyParameters(strategyType: string): Record<string, any> {
  switch (strategyType) {
    case 'value':
      return {
        peRatio: 20,
        pbRatio: 3,
        dividendYield: 1.5,
        debtToEquity: 1.0,
        profitMargin: 15
      };
    case 'growth':
      return {
        revenueGrowth: 15,
        earningsGrowth: 20,
        cashFlowGrowth: 10,
        priceToSales: 5,
        priceToEarningsGrowth: 1.5
      };
    case 'momentum':
      return {
        shortPeriod: 20,
        longPeriod: 50,
        signalPeriod: 9,
        oversoldThreshold: 30,
        overboughtThreshold: 70
      };
    case 'meanReversion':
      return {
        lookbackPeriod: 20,
        stdDevMultiplier: 2,
        holdingPeriod: 10,
        stopLoss: 5,
        profitTarget: 10
      };
    default:
      return {
        movingAveragePeriod: 20,
        signalThreshold: 0.02,
        stopLoss: 5,
        profitTarget: 10
      };
  }
}

/**
 * 测试所有可用的策略评估功能
 */
export async function testAllStrategyFunctions(ticker: string = 'AAPL'): Promise<any> {
  logger.info('开始全面测试策略函数', { ticker });
  
  // 1. 测试单个策略评估
  const evaluationTestResult = await testStrategyEvaluation(ticker);
  
  // 2. 测试策略比较
  const comparisonTestResult = await testStrategyComparison(ticker);
  
  return {
    success: evaluationTestResult.success && comparisonTestResult.success,
    evaluationTest: evaluationTestResult,
    comparisonTest: comparisonTestResult,
    timestamp: new Date().toISOString()
  };
} 