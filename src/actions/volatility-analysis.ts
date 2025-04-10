'use server';

import { VolatilityPredictionService, VolatilityPrediction, VolatilityForecast } from "@/services/volatilityPredictionService";
import { createLogger } from "@/lib/logger.server";

const logger = createLogger('volatility-analysis');

let volatilityService: VolatilityPredictionService | null = null;

/**
 * 初始化波动率预测服务
 */
const initializeService = async (): Promise<VolatilityPredictionService> => {
  if (!volatilityService) {
    logger.info('初始化波动率预测服务');
    volatilityService = new VolatilityPredictionService();
    await volatilityService.init();
  }
  return volatilityService;
};

/**
 * 将VolatilityPrediction转换为VolatilityForecast
 * @param prediction 原始预测结果
 * @param days 预测天数
 * @returns 转换后的预测结果
 */
const convertToForecast = (prediction: VolatilityPrediction, days: number): VolatilityForecast => {
  return {
    currentVolatility: prediction.current,
    predictedVolatility: prediction.predicted,
    confidenceInterval: [prediction.lowerBound, prediction.upperBound],
    forecastHorizon: days,
    volatilityTrend: prediction.trend,
    historicalVolatility: {
      daily: prediction.current / Math.sqrt(252),
      weekly: prediction.current / Math.sqrt(52),
      monthly: prediction.current / Math.sqrt(12)
    },
    modelType: 'GARCH(1,1)',
    modelParams: {
      omega: 0.00001,
      alpha: 0.05,
      beta: 0.94
    },
    timestamp: Date.now()
  };
};

/**
 * 获取资产波动率预测
 * @param symbol 资产代码
 * @param days 预测天数，默认为7天
 * @returns 波动率预测结果
 */
export async function getPrediction(symbol: string, days: number = 7) {
  try {
    const service = await initializeService();
    logger.info(`获取${symbol}的${days}天波动率预测`);
    
    const prediction = await service.predictVolatility(symbol, days);
    const forecast = convertToForecast(prediction, days);
    
    logger.info(`成功获取${symbol}的波动率预测`);
    
    return forecast;
  } catch (error) {
    logger.error(`获取${symbol}波动率预测失败:`, error);
    return null;
  }
}

/**
 * 批量获取多个资产的波动率预测
 * @param symbols 资产代码列表
 * @param days 预测天数，默认为7天
 * @returns 多个资产的波动率预测结果
 */
export async function batchPrediction(symbols: string[], days: number = 7) {
  try {
    const service = await initializeService();
    logger.info(`批量获取${symbols.length}个资产的${days}天波动率预测`);
    
    const results: Record<string, VolatilityForecast | null> = {};
    
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const prediction = await service.predictVolatility(symbol, days);
          results[symbol] = convertToForecast(prediction, days);
        } catch (error) {
          logger.warn(`获取${symbol}波动率预测失败:`, error);
          results[symbol] = null;
        }
      })
    );
    
    const successCount = Object.values(results).filter(r => r !== null).length;
    logger.info(`批量波动率预测完成，成功: ${successCount}/${symbols.length}`);
    
    return results;
  } catch (error) {
    logger.error(`批量波动率预测操作失败:`, error);
    return {};
  }
} 