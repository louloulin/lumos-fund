"use server";

import { createLogger } from "@/lib/logger.server";
import { innovationAssessmentTool } from "@/mastra/tools/innovationTools";
import { revenueGrowthTool } from "@/mastra/tools/revenueTools";

const logger = createLogger("testFinancialTools");

/**
 * 测试创新评估工具
 */
export async function testInnovationTool(ticker: string) {
  try {
    logger.info(`测试创新评估工具: ${ticker}`);
    
    // 执行创新评估工具
    const result = await innovationAssessmentTool.execute({
      ticker
    });
    
    logger.info(`创新评估完成: ${ticker}`, {
      score: result.score,
      timestamp: result.timestamp
    });
    
    return result;
  } catch (error: any) {
    logger.error(`创新评估失败: ${ticker}`, { error });
    throw new Error(`创新评估失败: ${error.message}`);
  }
}

/**
 * 测试收入增长工具
 */
export async function testRevenueTool(ticker: string, years: number = 5) {
  try {
    logger.info(`测试收入增长工具: ${ticker}`, { years });
    
    // 执行收入增长工具
    const result = await revenueGrowthTool.execute({
      ticker,
      years
    });
    
    logger.info(`收入增长分析完成: ${ticker}`, {
      score: result.score,
      timestamp: result.timestamp
    });
    
    return result;
  } catch (error: any) {
    logger.error(`收入增长分析失败: ${ticker}`, { error });
    throw new Error(`收入增长分析失败: ${error.message}`);
  }
} 