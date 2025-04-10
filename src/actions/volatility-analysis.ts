'use server';

import { VolatilityPredictionService } from "@/services/volatilityPredictionService";
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
    logger.info(`成功获取${symbol}的波动率预测`);
    
    return {
      success: true,
      symbol,
      days,
      prediction,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`获取${symbol}波动率预测失败:`, error);
    return {
      success: false,
      symbol,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    };
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
    
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const prediction = await service.predictVolatility(symbol, days);
          return {
            success: true,
            symbol,
            prediction
          };
        } catch (error) {
          logger.warn(`获取${symbol}波动率预测失败:`, error);
          return {
            success: false,
            symbol,
            error: error instanceof Error ? error.message : '未知错误'
          };
        }
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    logger.info(`批量波动率预测完成，成功: ${successCount}/${symbols.length}`);
    
    return {
      success: true,
      results,
      summary: {
        total: symbols.length,
        successful: successCount,
        failed: symbols.length - successCount
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`批量波动率预测操作失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    };
  }
} 