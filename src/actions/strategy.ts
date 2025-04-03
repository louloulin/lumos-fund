import { createLogger } from '@/lib/logger.server';
import { getStrategyRecommendation } from '@/mastra/agents/strategyRecommendationAgent';

const logger = createLogger('strategyActions');

/**
 * 获取投资策略推荐
 * 
 * 根据股票代码、风险承受能力、投资期限和市场状况，提供个性化的投资策略推荐
 * 
 * @param params 查询参数
 * @returns 策略推荐结果
 */
export async function getInvestmentStrategy(params: {
  ticker: string;
  riskTolerance: 'low' | 'moderate' | 'high';
  investmentHorizon: 'short' | 'medium' | 'long';
  marketCondition?: 'bull' | 'bear' | 'neutral' | 'volatile';
}) {
  const { ticker, riskTolerance, investmentHorizon, marketCondition } = params;
  
  try {
    logger.info('获取投资策略推荐', { ticker, riskTolerance, investmentHorizon, marketCondition });
    
    const recommendation = await getStrategyRecommendation(
      ticker,
      riskTolerance,
      investmentHorizon,
      marketCondition
    );
    
    return {
      success: true,
      data: recommendation,
    };
  } catch (error) {
    logger.error('获取投资策略推荐失败', { ticker, error });
    
    return {
      success: false,
      error: `获取策略推荐失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 保存用户策略偏好
 * 
 * 保存用户的风险承受能力、投资期限和市场观点等偏好设置
 * 
 * @param params 用户偏好参数
 * @returns 保存结果
 */
export async function saveStrategyPreferences(params: {
  userId: string;
  riskTolerance: 'low' | 'moderate' | 'high';
  investmentHorizon: 'short' | 'medium' | 'long';
  marketView?: 'bull' | 'bear' | 'neutral' | 'volatile';
  preferredStrategies?: string[];
}) {
  const { userId, riskTolerance, investmentHorizon, marketView, preferredStrategies } = params;
  
  try {
    logger.info('保存用户策略偏好', { userId, riskTolerance, investmentHorizon, marketView, preferredStrategies });
    
    // 这里应该实现保存到数据库的逻辑
    // 当前仅返回模拟成功
    
    return {
      success: true,
      message: '策略偏好保存成功',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('保存用户策略偏好失败', { userId, error });
    
    return {
      success: false,
      error: `保存策略偏好失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 获取历史策略推荐
 * 
 * 获取用户历史查询的策略推荐列表
 * 
 * @param userId 用户ID
 * @param limit 返回记录数量限制
 * @returns 历史策略推荐列表
 */
export async function getStrategyHistory(userId: string, limit: number = 10) {
  try {
    logger.info('获取用户策略推荐历史', { userId, limit });
    
    // 这里应该实现从数据库获取历史记录的逻辑
    // 当前仅返回模拟数据
    
    const mockHistory = [
      {
        id: '1',
        ticker: 'AAPL',
        timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        riskTolerance: 'moderate',
        investmentHorizon: 'medium',
        primaryStrategy: 'value',
        secondaryStrategy: 'growth',
        allocation: { value: 60, growth: 40 }
      },
      {
        id: '2',
        ticker: 'MSFT',
        timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        riskTolerance: 'high',
        investmentHorizon: 'long',
        primaryStrategy: 'growth',
        secondaryStrategy: 'momentum',
        allocation: { growth: 70, momentum: 30 }
      }
    ];
    
    return {
      success: true,
      data: mockHistory.slice(0, limit)
    };
  } catch (error) {
    logger.error('获取用户策略推荐历史失败', { userId, error });
    
    return {
      success: false,
      error: `获取策略历史失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 