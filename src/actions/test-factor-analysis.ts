'use server'

import { createLogger } from '@/lib/logger.server';
import { analyzeStockFactors, rankStocksByFactors } from './ai-factor-analysis';

const logger = createLogger('test-factor-analysis');

/**
 * 测试单只股票的多因子分析
 * @param ticker 股票代码
 */
export async function testSingleStockFactorAnalysis(ticker: string = 'AAPL'): Promise<any> {
  try {
    logger.info('开始测试单只股票多因子分析', { ticker });
    
    const startTime = Date.now();
    const result = await analyzeStockFactors(ticker);
    const duration = Date.now() - startTime;
    
    logger.info('多因子分析测试完成', { 
      ticker, 
      duration: `${duration}ms`,
      overallScore: result.factorScores.overall 
    });
    
    return {
      success: true,
      ticker,
      duration,
      factorScores: result.factorScores,
      topFactors: result.factorRankings.topFactors,
      bottomFactors: result.factorRankings.bottomFactors,
      investmentSuitability: result.investmentImplications.suitability,
      timeHorizon: result.investmentImplications.timeHorizon,
      recommendations: result.investmentImplications.recommendations.slice(0, 2)
    };
    
  } catch (error) {
    logger.error('多因子分析测试失败', { ticker, error });
    return {
      success: false,
      ticker,
      error: `测试失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 测试多只股票的因子排名功能
 * @param tickers 股票代码列表
 * @param factor 排名使用的主要因子
 */
export async function testStockFactorRanking(
  tickers: string[] = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'],
  factor: 'value' | 'growth' | 'quality' | 'momentum' | 'volatility' | 'overall' = 'overall'
): Promise<any> {
  try {
    logger.info('开始测试多股票因子排名', { 
      tickersCount: tickers.length, 
      factor 
    });
    
    const startTime = Date.now();
    const result = await rankStocksByFactors(tickers, factor);
    const duration = Date.now() - startTime;
    
    logger.info('因子排名测试完成', { 
      tickersCount: tickers.length, 
      duration: `${duration}ms`,
      topStock: result.topStock,
      bottomStock: result.bottomStock
    });
    
    return {
      success: true,
      tickers,
      factor,
      duration,
      rankings: result.rankings,
      topStock: result.topStock,
      bottomStock: result.bottomStock,
      factorDescription: result.factorDescription
    };
    
  } catch (error) {
    logger.error('因子排名测试失败', { 
      tickersCount: tickers.length, 
      factor,
      error 
    });
    return {
      success: false,
      tickers,
      factor,
      error: `测试失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 测试特定因子表现最好的股票
 * @param factor 要测试的因子
 */
export async function testBestStockForFactor(
  factor: 'value' | 'growth' | 'quality' | 'momentum' | 'volatility' = 'value'
): Promise<any> {
  try {
    logger.info('开始测试特定因子最佳股票', { factor });
    
    // 测试股票列表
    const testStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
    
    // 执行排名
    const rankingResult = await testStockFactorRanking(testStocks, factor);
    
    if (!rankingResult.success) {
      throw new Error(`排名分析失败: ${rankingResult.error}`);
    }
    
    // 获取排名第一的股票
    const topStock = rankingResult.topStock;
    
    // 对最佳股票进行详细分析
    const analysisResult = await testSingleStockFactorAnalysis(topStock);
    
    if (!analysisResult.success) {
      throw new Error(`详细分析失败: ${analysisResult.error}`);
    }
    
    logger.info('特定因子最佳股票测试完成', { 
      factor, 
      topStock,
      score: rankingResult.rankings[0].score
    });
    
    return {
      success: true,
      factor,
      factorDescription: rankingResult.factorDescription,
      topStock,
      score: rankingResult.rankings[0].score,
      detailedAnalysis: {
        factorScores: analysisResult.factorScores,
        recommendations: analysisResult.recommendations
      },
      allRankings: rankingResult.rankings
    };
    
  } catch (error) {
    logger.error('特定因子最佳股票测试失败', { factor, error });
    return {
      success: false,
      factor,
      error: `测试失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 测试多因子综合表现最好的投资组合
 * @param stockCount 要包含在投资组合中的股票数量
 */
export async function testOptimalFactorPortfolio(stockCount: number = 3): Promise<any> {
  try {
    logger.info('开始测试最优因子投资组合', { stockCount });
    
    // 测试股票列表
    const candidateStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM', 'V', 'JNJ'];
    
    if (stockCount > candidateStocks.length) {
      stockCount = candidateStocks.length;
    }
    
    // 获取每个股票的多因子分析
    const analysisPromises = candidateStocks.map(ticker => 
      analyzeStockFactors(ticker)
        .then(result => ({
          ticker,
          overallScore: result.factorScores.overall,
          factorScores: result.factorScores,
          suitability: result.investmentImplications.suitability,
          timeHorizon: result.investmentImplications.timeHorizon
        }))
        .catch(error => {
          logger.error('获取股票因子分析失败', { ticker, error });
          return null;
        })
    );
    
    // 等待所有分析完成
    const analysisResults = (await Promise.all(analysisPromises)).filter(Boolean);
    
    // 按综合得分排序
    const sortedStocks = analysisResults
      .sort((a, b) => b.overallScore - a.overallScore);
    
    // 选择前N只股票作为投资组合
    const portfolioStocks = sortedStocks.slice(0, stockCount);
    
    // 计算投资组合平均得分
    const portfolioScore = Math.round(
      portfolioStocks.reduce((sum, stock) => sum + stock.overallScore, 0) / portfolioStocks.length
    );
    
    // 分析投资组合因子特性
    const portfolioFactors = {
      value: Math.round(portfolioStocks.reduce((sum, stock) => sum + stock.factorScores.value, 0) / portfolioStocks.length),
      growth: Math.round(portfolioStocks.reduce((sum, stock) => sum + stock.factorScores.growth, 0) / portfolioStocks.length),
      quality: Math.round(portfolioStocks.reduce((sum, stock) => sum + stock.factorScores.quality, 0) / portfolioStocks.length),
      momentum: Math.round(portfolioStocks.reduce((sum, stock) => sum + stock.factorScores.momentum, 0) / portfolioStocks.length),
      volatility: Math.round(portfolioStocks.reduce((sum, stock) => sum + stock.factorScores.volatility, 0) / portfolioStocks.length)
    };
    
    // 确定投资组合的最强和最弱因子
    const sortedFactors = Object.entries(portfolioFactors)
      .sort((a, b) => b[1] - a[1]);
    
    const strongestFactors = sortedFactors.slice(0, 2).map(([name]) => name);
    const weakestFactors = sortedFactors.slice(-2).map(([name]) => name);
    
    logger.info('最优因子投资组合测试完成', { 
      stockCount, 
      portfolioScore,
      portfolioStocks: portfolioStocks.map(s => s.ticker).join(', '),
      strongestFactors: strongestFactors.join(', ')
    });
    
    return {
      success: true,
      portfolioStocks: portfolioStocks.map(stock => ({
        ticker: stock.ticker,
        overallScore: stock.overallScore
      })),
      portfolioScore,
      factorProfile: portfolioFactors,
      strongestFactors,
      weakestFactors,
      allCandidates: sortedStocks.map(stock => ({
        ticker: stock.ticker,
        overallScore: stock.overallScore
      }))
    };
    
  } catch (error) {
    logger.error('最优因子投资组合测试失败', { stockCount, error });
    return {
      success: false,
      stockCount,
      error: `测试失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 