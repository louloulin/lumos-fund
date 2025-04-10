'use server';

import { createLogger } from '@/lib/logger.server';
import { volatilityPredictionService, VolatilityPrediction, VolatilityForecast } from './volatilityPredictionService';
import { marketDataService } from './marketDataService';

const logger = createLogger('test-volatility-prediction');

/**
 * 测试波动率预测服务
 */
export async function testVolatilityPrediction(): Promise<{
  success: boolean;
  results: {
    basicPrediction: boolean;
    detailedForecast: boolean;
    multipleAssets: boolean;
    errorHandling: boolean;
  };
  executionTime: number;
  predictions?: {
    basic: VolatilityPrediction | null;
    detailed: VolatilityForecast | null;
  };
}> {
  const startTime = Date.now();
  logger.info('开始测试波动率预测服务');
  
  // 初始化测试结果
  const results = {
    basicPrediction: false,
    detailedForecast: false,
    multipleAssets: false,
    errorHandling: false
  };
  
  const predictions = {
    basic: null as VolatilityPrediction | null,
    detailed: null as VolatilityForecast | null
  };
  
  try {
    // 初始化服务
    await volatilityPredictionService.init();
    
    // 测试基础预测功能
    results.basicPrediction = await testBasicPrediction();
    if (results.basicPrediction) {
      logger.info('基础预测功能测试通过');
    } else {
      logger.error('基础预测功能测试失败');
    }
    
    // 测试详细预测功能
    results.detailedForecast = await testDetailedForecast();
    if (results.detailedForecast) {
      logger.info('详细预测功能测试通过');
    } else {
      logger.error('详细预测功能测试失败');
    }
    
    // 测试多资产预测
    results.multipleAssets = await testMultipleAssets();
    if (results.multipleAssets) {
      logger.info('多资产预测测试通过');
    } else {
      logger.error('多资产预测测试失败');
    }
    
    // 测试错误处理
    results.errorHandling = await testErrorHandling();
    if (results.errorHandling) {
      logger.info('错误处理测试通过');
    } else {
      logger.error('错误处理测试失败');
    }
    
    const executionTime = Date.now() - startTime;
    logger.info(`波动率预测服务测试完成，耗时: ${executionTime}ms`);
    
    return {
      success: Object.values(results).every(result => result),
      results,
      executionTime,
      predictions
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('波动率预测服务测试失败', error);
    
    return {
      success: false,
      results,
      executionTime
    };
  }
  
  /**
   * 测试基础预测功能
   */
  async function testBasicPrediction(): Promise<boolean> {
    try {
      logger.info('测试基础预测功能');
      
      // 测试不同的预测天数
      const forecastDays = [5, 10, 30, 90];
      
      for (const days of forecastDays) {
        logger.info(`测试${days}天预测`);
        
        const prediction = await volatilityPredictionService.predictVolatility('AAPL', days);
        
        // 保存30天预测供参考
        if (days === 30) {
          predictions.basic = prediction;
        }
        
        // 验证预测结果
        if (
          typeof prediction.current !== 'number' ||
          typeof prediction.predicted !== 'number' ||
          typeof prediction.lowerBound !== 'number' ||
          typeof prediction.upperBound !== 'number' ||
          typeof prediction.changePercent !== 'number' ||
          prediction.forecastDays !== days ||
          !['increasing', 'decreasing', 'stable'].includes(prediction.trend) ||
          !['low', 'medium', 'high', 'extreme'].includes(prediction.volatilityLevel)
        ) {
          logger.error(`${days}天预测结果验证失败`);
          return false;
        }
        
        // 基本有效性检查
        if (
          prediction.current <= 0 ||
          prediction.predicted <= 0 ||
          prediction.lowerBound < 0 ||
          prediction.upperBound <= prediction.lowerBound
        ) {
          logger.error(`${days}天预测结果值无效`);
          return false;
        }
        
        logger.info(`${days}天预测测试通过`);
      }
      
      return true;
    } catch (error) {
      logger.error('基础预测功能测试失败', error);
      return false;
    }
  }
  
  /**
   * 测试详细预测功能
   */
  async function testDetailedForecast(): Promise<boolean> {
    try {
      logger.info('测试详细预测功能');
      
      // 获取30天的详细预测
      const forecast = await volatilityPredictionService.generateDetailedForecast('AAPL', 30);
      
      // 保存详细预测供参考
      predictions.detailed = forecast;
      
      // 验证预测结果
      if (
        typeof forecast.currentVolatility !== 'number' ||
        typeof forecast.predictedVolatility !== 'number' ||
        !Array.isArray(forecast.confidenceInterval) ||
        forecast.confidenceInterval.length !== 2 ||
        forecast.forecastHorizon !== 30 ||
        !['increasing', 'decreasing', 'stable'].includes(forecast.volatilityTrend) ||
        typeof forecast.historicalVolatility !== 'object' ||
        typeof forecast.historicalVolatility.daily !== 'number' ||
        typeof forecast.historicalVolatility.weekly !== 'number' ||
        typeof forecast.historicalVolatility.monthly !== 'number' ||
        typeof forecast.modelType !== 'string' ||
        typeof forecast.modelParams !== 'object' ||
        typeof forecast.modelParams.omega !== 'number' ||
        typeof forecast.modelParams.alpha !== 'number' ||
        typeof forecast.modelParams.beta !== 'number' ||
        typeof forecast.timestamp !== 'number'
      ) {
        logger.error('详细预测结果验证失败');
        return false;
      }
      
      // 基本有效性检查
      if (
        forecast.currentVolatility <= 0 ||
        forecast.predictedVolatility <= 0 ||
        forecast.confidenceInterval[0] < 0 ||
        forecast.confidenceInterval[1] <= forecast.confidenceInterval[0] ||
        forecast.historicalVolatility.daily <= 0 ||
        forecast.historicalVolatility.weekly <= 0 ||
        forecast.historicalVolatility.monthly <= 0 ||
        forecast.modelParams.omega < 0 ||
        forecast.modelParams.alpha < 0 ||
        forecast.modelParams.beta < 0 ||
        forecast.modelParams.alpha + forecast.modelParams.beta >= 1 // GARCH稳定性条件
      ) {
        logger.error('详细预测结果值无效');
        return false;
      }
      
      logger.info('详细预测功能测试通过');
      return true;
    } catch (error) {
      logger.error('详细预测功能测试失败', error);
      return false;
    }
  }
  
  /**
   * 测试多资产预测
   */
  async function testMultipleAssets(): Promise<boolean> {
    try {
      logger.info('测试多资产预测');
      
      const assets = ['MSFT', 'GOOGL', 'AMZN', 'TSLA'];
      
      for (const asset of assets) {
        logger.info(`测试${asset}的预测`);
        
        const prediction = await volatilityPredictionService.predictVolatility(asset, 30);
        
        // 基本验证
        if (
          typeof prediction.current !== 'number' ||
          typeof prediction.predicted !== 'number' ||
          prediction.current <= 0 ||
          prediction.predicted <= 0
        ) {
          logger.error(`${asset}的预测结果无效`);
          return false;
        }
        
        logger.info(`${asset}的预测测试通过`);
      }
      
      return true;
    } catch (error) {
      logger.error('多资产预测测试失败', error);
      return false;
    }
  }
  
  /**
   * 测试错误处理
   */
  async function testErrorHandling(): Promise<boolean> {
    try {
      logger.info('测试错误处理');
      
      // 测试无效的股票代码
      try {
        await volatilityPredictionService.predictVolatility('INVALID_SYMBOL', 30);
        logger.error('对无效股票代码的错误处理测试失败 - 应该抛出错误');
        return false;
      } catch (error) {
        logger.info('对无效股票代码正确抛出错误');
      }
      
      // 测试无效的预测天数
      try {
        // @ts-ignore - 故意传入无效值测试错误处理
        await volatilityPredictionService.predictVolatility('AAPL', -10);
        
        // 即使没有抛出错误，也应该返回有效结果
        const prediction = await volatilityPredictionService.predictVolatility('AAPL', -10);
        if (prediction.forecastDays <= 0) {
          logger.error('对无效预测天数的错误处理测试失败 - 返回了无效的预测期');
          return false;
        }
      } catch (error) {
        // 抛出错误也是可接受的处理方式
        logger.info('对无效预测天数正确处理');
      }
      
      logger.info('错误处理测试通过');
      return true;
    } catch (error) {
      logger.error('错误处理测试失败', error);
      return false;
    }
  }
} 