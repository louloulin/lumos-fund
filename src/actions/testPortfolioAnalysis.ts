'use server'

import { createLogger } from '@/lib/logger.server';
import { analyzePortfolio } from './portfolio-analysis';

const logger = createLogger('testPortfolioAnalysis');

/**
 * 测试投资组合分析功能
 * 运行AI代理分析一个测试投资组合并返回结果
 */
export async function testPortfolioAnalysis(portfolioId: string = 'test-portfolio') {
  try {
    logger.info('开始测试投资组合分析', { portfolioId });
    
    // 计时开始
    const startTime = Date.now();
    
    // 运行投资组合分析
    const analysisResult = await analyzePortfolio(portfolioId);
    
    // 计时结束
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    logger.info('投资组合分析测试完成', { 
      portfolioId, 
      executionTime: `${executionTime.toFixed(2)}秒`,
      holdingsAnalyzed: Object.keys(analysisResult.holdingsAnalysis).length
    });
    
    // 生成摘要报告
    const summary = {
      portfolioName: analysisResult.portfolio.name,
      totalValue: analysisResult.portfolio.totalValue,
      holdingsCount: analysisResult.portfolio.positions.length,
      diversificationScore: analysisResult.overallAssessment.diversification,
      riskLevel: analysisResult.overallAssessment.riskLevel,
      topStrengths: analysisResult.overallAssessment.strengths.slice(0, 3),
      topWeaknesses: analysisResult.overallAssessment.weaknesses.slice(0, 3),
      immediateRecommendation: analysisResult.recommendations.immediate,
      executionTime: `${executionTime.toFixed(2)}秒`,
      timestamp: new Date().toISOString()
    };
    
    return {
      success: true,
      summary,
      fullAnalysis: analysisResult
    };
    
  } catch (error) {
    logger.error('投资组合分析测试失败', { error });
    return {
      success: false,
      error: `测试失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 