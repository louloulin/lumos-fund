import 'server-only';
import { createLogger } from '@/lib/logger.server';
import { getStrategyRecommendation } from '@/mastra/agents/strategyRecommendationAgent';

const logger = createLogger('strategyActions');

// 内存缓存，用于存储用户偏好
const userPreferences = new Map<string, any>();

// 内存缓存，用于存储策略历史
// 实际项目中应使用数据库存储
const strategyHistory = new Map<string, Array<any>>();

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
  userId?: string;
}) {
  const { ticker, riskTolerance, investmentHorizon, marketCondition, userId } = params;
  
  try {
    logger.info('获取投资策略推荐', { ticker, riskTolerance, investmentHorizon, marketCondition });
    
    const recommendation = await getStrategyRecommendation(
      ticker,
      riskTolerance,
      investmentHorizon,
      marketCondition
    );
    
    // 如果提供了用户ID，保存到历史记录
    if (userId) {
      saveToHistory(userId, recommendation);
    }
    
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
    logger.info('保存用户策略偏好', { userId, riskTolerance, investmentHorizon, marketView });
    
    // 保存用户偏好到存储
    // 实际项目中应保存到数据库
    userPreferences.set(userId, {
      riskTolerance,
      investmentHorizon,
      marketView,
      preferredStrategies,
      lastUpdated: new Date().toISOString()
    });
    
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
    
    // 从存储获取历史记录
    // 实际项目中应从数据库查询
    const history = strategyHistory.get(userId) || [];
    
    // 限制返回数量并按时间倒序排序
    const limitedHistory = history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return {
      success: true,
      data: limitedHistory
    };
  } catch (error) {
    logger.error('获取用户策略推荐历史失败', { userId, error });
    
    return {
      success: false,
      error: `获取策略历史失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 获取用户策略偏好
 */
export async function getUserPreferences(userId: string) {
  try {
    logger.info('获取用户策略偏好', { userId });
    
    // 从存储获取用户偏好
    // 实际项目中应从数据库查询
    const preferences = userPreferences.get(userId);
    
    if (!preferences) {
      return {
        success: false,
        error: '未找到用户偏好'
      };
    }
    
    return {
      success: true,
      data: preferences
    };
  } catch (error) {
    logger.error('获取用户策略偏好失败', error);
    return {
      success: false,
      error: `获取用户偏好失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 保存策略推荐到历史记录
 */
function saveToHistory(userId: string, recommendation: any) {
  // 获取现有历史记录或创建新数组
  const userHistory = strategyHistory.get(userId) || [];
  
  // 添加新记录
  userHistory.unshift({
    ...recommendation,
    savedAt: new Date().toISOString()
  });
  
  // 限制历史记录数量，保留最近的50条
  if (userHistory.length > 50) {
    userHistory.length = 50;
  }
  
  // 更新存储
  strategyHistory.set(userId, userHistory);
} 