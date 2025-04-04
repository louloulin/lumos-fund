'use server';

import { createLogger } from '@/lib/logger.server';
import { mockTradingService } from '@/services/mockTradingService';
import {
  calculatePortfolioPerformance, 
  generatePerformanceInsights,
  calculateAttributionAnalysis,
  getHistoricalPerformance
} from './performance-dashboard';

const logger = createLogger('test-performance-dashboard');

/**
 * 测试投资组合绩效仪表板功能
 */
export async function testPerformanceDashboard(): Promise<{
  success: boolean;
  results: {
    metricsTest: boolean;
    insightsTest: boolean;
    attributionTest: boolean;
    historicalTest: boolean;
  };
  executionTime: number;
}> {
  logger.info('开始测试投资组合绩效仪表板功能');
  const startTime = Date.now();
  
  try {
    // 初始化交易服务，获取测试投资组合ID
    await mockTradingService.initialize();
    const portfolios = mockTradingService.getAllPortfolios();
    
    if (!portfolios.length) {
      logger.error('没有可用的测试投资组合');
      return {
        success: false,
        results: {
          metricsTest: false,
          insightsTest: false,
          attributionTest: false,
          historicalTest: false
        },
        executionTime: Date.now() - startTime
      };
    }
    
    const testPortfolioId = portfolios[0].id;
    logger.info(`使用投资组合ID: ${testPortfolioId}`);
    
    // 测试性能指标计算
    const metricsResult = await testPerformanceMetrics(testPortfolioId);
    
    // 测试AI分析洞察
    const insightsResult = await testPerformanceInsights(testPortfolioId);
    
    // 测试归因分析
    const attributionResult = await testAttributionAnalysis(testPortfolioId);
    
    // 测试历史性能数据
    const historicalResult = await testHistoricalPerformance(testPortfolioId);
    
    const executionTime = Date.now() - startTime;
    logger.info(`投资组合绩效仪表板测试完成，耗时: ${executionTime}ms`);
    
    return {
      success: metricsResult && insightsResult && attributionResult && historicalResult,
      results: {
        metricsTest: metricsResult,
        insightsTest: insightsResult,
        attributionTest: attributionResult,
        historicalTest: historicalResult
      },
      executionTime
    };
  } catch (error) {
    logger.error('投资组合绩效仪表板测试失败', error);
    
    return {
      success: false,
      results: {
        metricsTest: false,
        insightsTest: false,
        attributionTest: false,
        historicalTest: false
      },
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * 测试性能指标计算
 */
async function testPerformanceMetrics(portfolioId: string): Promise<boolean> {
  logger.info('测试性能指标计算');
  
  try {
    // 测试不同的时间范围
    const timeframes = ['week', 'month', 'quarter', 'year'] as const;
    
    for (const timeframe of timeframes) {
      logger.info(`测试时间范围: ${timeframe}`);
      
      const result = await calculatePortfolioPerformance(portfolioId, {
        timeframe,
        includeForwardLooking: true,
        includeStressTests: true
      });
      
      if (!result.success || !result.metrics) {
        logger.error(`${timeframe}时间范围的性能指标计算失败`, result.error);
        return false;
      }
      
      // 验证结果
      const metrics = result.metrics;
      
      // 基本验证
      if (
        typeof metrics.totalReturn !== 'number' ||
        typeof metrics.sharpeRatio !== 'number' ||
        !metrics.equityCurve.length
      ) {
        logger.error(`${timeframe}时间范围的指标结果验证失败`);
        return false;
      }
      
      logger.info(`${timeframe}时间范围的性能指标测试通过`);
    }
    
    // 测试不同的基准
    const benchmarks = ['SPY', 'QQQ', 'IWM'];
    
    for (const benchmark of benchmarks) {
      logger.info(`测试基准: ${benchmark}`);
      
      const result = await calculatePortfolioPerformance(portfolioId, {
        benchmark,
        timeframe: 'month'
      });
      
      if (!result.success) {
        logger.error(`基准${benchmark}的性能指标计算失败`, result.error);
        return false;
      }
      
      logger.info(`基准${benchmark}的性能指标测试通过`);
    }
    
    return true;
  } catch (error) {
    logger.error('性能指标测试失败', error);
    return false;
  }
}

/**
 * 测试AI分析洞察
 */
async function testPerformanceInsights(portfolioId: string): Promise<boolean> {
  logger.info('测试AI分析洞察');
  
  try {
    // 获取性能指标
    const metricsResult = await calculatePortfolioPerformance(portfolioId);
    
    if (!metricsResult.success || !metricsResult.metrics) {
      logger.error('无法获取用于AI分析的性能指标');
      return false;
    }
    
    // 测试提供指标的情况
    const withMetricsResult = await generatePerformanceInsights(
      portfolioId,
      metricsResult.metrics
    );
    
    if (!withMetricsResult.success || !withMetricsResult.insights) {
      logger.error('提供指标的AI分析失败', withMetricsResult.error);
      return false;
    }
    
    // 验证结果
    const insights = withMetricsResult.insights;
    
    if (
      typeof insights.summary !== 'string' ||
      !Array.isArray(insights.recommendations) ||
      !insights.recommendations.length
    ) {
      logger.error('AI分析结果验证失败');
      return false;
    }
    
    logger.info('提供指标的AI分析测试通过');
    
    // 测试不提供指标的情况
    const withoutMetricsResult = await generatePerformanceInsights(portfolioId);
    
    if (!withoutMetricsResult.success || !withoutMetricsResult.insights) {
      logger.error('不提供指标的AI分析失败', withoutMetricsResult.error);
      return false;
    }
    
    logger.info('不提供指标的AI分析测试通过');
    
    return true;
  } catch (error) {
    logger.error('AI分析洞察测试失败', error);
    return false;
  }
}

/**
 * 测试归因分析
 */
async function testAttributionAnalysis(portfolioId: string): Promise<boolean> {
  logger.info('测试归因分析');
  
  try {
    // 测试不同的归因级别
    const levels = ['asset', 'sector', 'factor'] as const;
    
    for (const level of levels) {
      logger.info(`测试归因级别: ${level}`);
      
      const result = await calculateAttributionAnalysis(portfolioId, {
        level,
        timeframe: 'month'
      });
      
      if (!result.success || !result.attribution) {
        logger.error(`${level}级别的归因分析失败`, result.error);
        return false;
      }
      
      // 验证结果
      const attribution = result.attribution;
      
      if (
        typeof attribution.totalReturn !== 'number' ||
        !Array.isArray(attribution.components) ||
        !attribution.components.length
      ) {
        logger.error(`${level}级别的归因分析结果验证失败`);
        return false;
      }
      
      logger.info(`${level}级别的归因分析测试通过`);
    }
    
    // 测试不同的时间范围
    const timeframes = ['week', 'month', 'quarter', 'year'] as const;
    
    for (const timeframe of timeframes) {
      logger.info(`测试时间范围: ${timeframe}`);
      
      const result = await calculateAttributionAnalysis(portfolioId, {
        level: 'sector',
        timeframe
      });
      
      if (!result.success) {
        logger.error(`${timeframe}时间范围的归因分析失败`, result.error);
        return false;
      }
      
      logger.info(`${timeframe}时间范围的归因分析测试通过`);
    }
    
    return true;
  } catch (error) {
    logger.error('归因分析测试失败', error);
    return false;
  }
}

/**
 * 测试历史性能数据
 */
async function testHistoricalPerformance(portfolioId: string): Promise<boolean> {
  logger.info('测试历史性能数据');
  
  try {
    // 测试不同的时间范围
    const timeframes = ['day', 'week', 'month', 'quarter', 'year', 'all'] as const;
    
    for (const timeframe of timeframes) {
      logger.info(`测试时间范围: ${timeframe}`);
      
      const result = await getHistoricalPerformance(
        portfolioId,
        timeframe,
        true, // 包含基准
        'SPY'
      );
      
      if (!result.success || !result.data) {
        logger.error(`${timeframe}时间范围的历史性能数据获取失败`, result.error);
        return false;
      }
      
      // 验证结果
      const data = result.data;
      
      if (
        !Array.isArray(data.portfolio) ||
        !data.portfolio.length ||
        !Array.isArray(data.benchmark) ||
        !data.benchmark.length
      ) {
        logger.error(`${timeframe}时间范围的历史性能数据验证失败`);
        return false;
      }
      
      logger.info(`${timeframe}时间范围的历史性能数据测试通过`);
    }
    
    // 测试不包含基准的情况
    const withoutBenchmarkResult = await getHistoricalPerformance(
      portfolioId,
      'month',
      false
    );
    
    if (!withoutBenchmarkResult.success || !withoutBenchmarkResult.data) {
      logger.error('不包含基准的历史性能数据获取失败', withoutBenchmarkResult.error);
      return false;
    }
    
    if (withoutBenchmarkResult.data.benchmark) {
      logger.error('不包含基准的历史性能数据仍然包含基准数据');
      return false;
    }
    
    logger.info('不包含基准的历史性能数据测试通过');
    
    // 测试不同的基准
    const benchmarks = ['SPY', 'QQQ', 'IWM'];
    
    for (const benchmark of benchmarks) {
      logger.info(`测试基准: ${benchmark}`);
      
      const result = await getHistoricalPerformance(
        portfolioId,
        'month',
        true,
        benchmark
      );
      
      if (!result.success) {
        logger.error(`基准${benchmark}的历史性能数据获取失败`, result.error);
        return false;
      }
      
      logger.info(`基准${benchmark}的历史性能数据测试通过`);
    }
    
    return true;
  } catch (error) {
    logger.error('历史性能数据测试失败', error);
    return false;
  }
}

/**
 * 比较不同时间段的绩效表现
 */
export async function comparePerformanceOverTime(
  portfolioId: string,
  periods: ('week' | 'month' | 'quarter' | 'year')[] = ['week', 'month', 'quarter', 'year']
): Promise<{
  success: boolean;
  comparison?: {
    period: string;
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    alpha: number;
    beta: number;
  }[];
  error?: string;
}> {
  logger.info('比较不同时间段的绩效表现', { portfolioId, periods });
  
  try {
    const comparison = [];
    
    for (const period of periods) {
      const result = await calculatePortfolioPerformance(portfolioId, {
        timeframe: period
      });
      
      if (!result.success || !result.metrics) {
        return {
          success: false,
          error: `计算${period}时间段的绩效指标失败: ${result.error}`
        };
      }
      
      const metrics = result.metrics;
      
      comparison.push({
        period,
        totalReturn: metrics.totalReturn,
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdown: metrics.maxDrawdown,
        alpha: metrics.alpha,
        beta: metrics.beta
      });
    }
    
    return {
      success: true,
      comparison
    };
  } catch (error) {
    logger.error('比较不同时间段的绩效表现失败', { portfolioId, error });
    
    return {
      success: false,
      error: `比较绩效表现失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
