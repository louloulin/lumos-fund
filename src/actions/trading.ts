import 'server-only';
import { createLogger } from '@/lib/logger.server';
import { executeTradeAnalysis } from '@/mastra/workflows/tradingDecisionWorkflow';
import { getStrategyRecommendation } from '@/mastra/agents/strategyRecommendationAgent';

const logger = createLogger('tradingActions');

// 交易决策类型
export type TradingAction = 'buy' | 'sell' | 'hold';

/**
 * 获取交易分析和决策
 * 
 * 根据股票代码、风险承受能力、投资期限和市场状况，提供综合分析和交易决策
 * 
 * @param params 交易分析参数
 * @returns 交易分析结果
 */
export async function getTradingDecision(params: {
  ticker: string;
  analysisTypes?: ('fundamental' | 'technical' | 'sentiment' | 'quantitative')[];
  riskTolerance: 'low' | 'moderate' | 'high';
  investmentHorizon: 'short' | 'medium' | 'long';
  marketCondition?: 'bull' | 'bear' | 'neutral' | 'volatile';
  portfolioData?: any;
  userId?: string;
}) {
  try {
    logger.info('获取交易决策', params);
    
    // 执行交易分析工作流
    const result = await executeTradeAnalysis(params);
    
    // 返回结果
    return {
      success: true,
      data: {
        runId: result.runId,
        ticker: params.ticker,
        analysis: {
          fundamental: result.results.fundamentalAnalysis,
          technical: result.results.technicalAnalysis,
          sentiment: result.results.sentimentAnalysis,
          risk: result.results.riskAssessment,
          strategy: result.results.strategyRecommendation
        },
        decision: result.finalDecision,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('获取交易决策失败', { params, error });
    
    return {
      success: false,
      error: `获取交易决策失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 获取特定类型的投资分析
 * 
 * 只执行指定类型的分析，而不是完整的决策流程
 * 
 * @param params 分析参数
 * @returns 分析结果
 */
export async function getInvestmentAnalysis(params: {
  ticker: string;
  analysisType: 'fundamental' | 'technical' | 'sentiment' | 'strategy';
  riskTolerance: 'low' | 'moderate' | 'high';
  investmentHorizon: 'short' | 'medium' | 'long';
  marketCondition?: 'bull' | 'bear' | 'neutral' | 'volatile';
  userId?: string;
}) {
  try {
    logger.info('获取投资分析', params);
    
    const { ticker, analysisType, riskTolerance, investmentHorizon, marketCondition, userId } = params;
    
    // 如果是策略分析，使用现有的策略推荐功能
    if (analysisType === 'strategy') {
      const recommendation = await getStrategyRecommendation(
        ticker,
        riskTolerance,
        investmentHorizon,
        marketCondition
      );
      
      return {
        success: true,
        data: {
          ticker,
          analysisType,
          result: recommendation,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // 对于其他类型的分析，执行工作流但只请求特定分析类型
    const analysisTypes = [analysisType] as ('fundamental' | 'technical' | 'sentiment' | 'quantitative')[];
    
    const result = await executeTradeAnalysis({
      ticker,
      analysisTypes,
      riskTolerance,
      investmentHorizon,
      marketCondition,
      userId
    });
    
    // 提取对应的分析结果
    const analysisResult = analysisType === 'fundamental' ? result.results.fundamentalAnalysis :
                          analysisType === 'technical' ? result.results.technicalAnalysis :
                          analysisType === 'sentiment' ? result.results.sentimentAnalysis : null;
    
    return {
      success: true,
      data: {
        ticker,
        analysisType,
        result: analysisResult,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('获取投资分析失败', { params, error });
    
    return {
      success: false,
      error: `获取投资分析失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 模拟执行交易
 * 
 * 根据交易决策执行模拟交易
 * 
 * @param params 交易参数
 * @returns 交易结果
 */
export async function executeTrade(params: {
  userId: string;
  ticker: string;
  action: TradingAction;
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
}) {
  try {
    logger.info('执行交易', params);
    
    // 在真实系统中，这里应该调用交易API或数据库操作
    // 这里只是模拟一个交易结果
    
    const { ticker, action, quantity, price } = params;
    const executionPrice = price || 100; // 模拟价格
    
    // 模拟交易执行
    const tradeResult = {
      tradeId: `trade-${Date.now()}`,
      userId: params.userId,
      ticker,
      action,
      quantity,
      executionPrice,
      amount: quantity * executionPrice,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      status: 'completed',
      executedAt: new Date().toISOString(),
      notes: params.notes || ''
    };
    
    return {
      success: true,
      data: tradeResult
    };
  } catch (error) {
    logger.error('执行交易失败', { params, error });
    
    return {
      success: false,
      error: `执行交易失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 获取历史交易记录
 * 
 * @param userId 用户ID
 * @param limit 返回记录数量限制
 * @returns 历史交易记录
 */
export async function getTradeHistory(userId: string, limit: number = 10) {
  try {
    logger.info('获取交易历史', { userId, limit });
    
    // 模拟从数据库获取历史记录
    // 在真实系统中，应从数据库查询
    
    // 生成一些模拟数据
    const mockHistory = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      tradeId: `trade-${Date.now() - i * 86400000}`,
      userId,
      ticker: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'][i % 5],
      action: ['buy', 'sell', 'buy', 'sell', 'buy'][i % 5] as TradingAction,
      quantity: Math.floor(Math.random() * 10) + 1,
      executionPrice: Math.floor(Math.random() * 1000) + 100,
      amount: (Math.floor(Math.random() * 10) + 1) * (Math.floor(Math.random() * 1000) + 100),
      status: 'completed',
      executedAt: new Date(Date.now() - i * 86400000).toISOString()
    }));
    
    return {
      success: true,
      data: mockHistory
    };
  } catch (error) {
    logger.error('获取交易历史失败', { userId, error });
    
    return {
      success: false,
      error: `获取交易历史失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 