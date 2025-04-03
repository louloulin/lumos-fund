import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { getInvestmentStrategy, saveStrategyPreferences, getStrategyHistory } from '../../src/actions/strategy';
import { getStrategyRecommendation } from '../../src/mastra/agents/strategyRecommendationAgent';

// Mock依赖
jest.mock('../../src/mastra/agents/strategyRecommendationAgent', () => ({
  getStrategyRecommendation: jest.fn().mockResolvedValue({
    agentResponse: `
    # 投资策略推荐: AAPL

    ## 策略组合推荐
    - 主要策略: 价值投资 (60%)
    - 次要策略: 动量策略 (40%)

    ## 策略解释
    基于您平衡型的风险承受能力和中期(6-18个月)的投资期限，在当前中性市场环境下，价值投资和动量策略的组合能够提供适当的风险收益平衡。

    ## 交易规则
    - 入场信号:
      1. 股票市盈率低于行业平均
      2. 价格突破20日均线
      3. 价格在50日均线之上
    `,
    strategyData: {
      ticker: 'AAPL',
      recommendationDate: new Date().toISOString(),
      riskProfile: {
        tolerance: 'moderate',
        horizon: 'medium',
        marketCondition: 'neutral'
      },
      recommendation: {
        primaryStrategy: 'value',
        secondaryStrategy: 'momentum',
        allocation: { value: 60, momentum: 40 },
        parameters: {
          primaryParams: { peRatio: 20, pbRatio: 2.0 },
          riskManagement: { maxPositionSize: 0.1 }
        },
        tradingRules: {
          entrySignals: ['股票AAPL的市盈率低于20'],
          exitSignals: ['股票AAPL的市盈率高于30']
        }
      }
    },
    timestamp: new Date().toISOString()
  })
}));

// Mock logger
jest.mock('../../src/lib/logger.server', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  })
}));

describe('策略推荐流程集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应能获取投资策略推荐', async () => {
    const result = await getInvestmentStrategy({
      ticker: 'AAPL',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketCondition: 'neutral'
    });
    
    // 验证结果成功
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // 验证调用了策略推荐服务
    expect(getStrategyRecommendation).toHaveBeenCalledWith(
      'AAPL',
      'moderate',
      'medium',
      'neutral'
    );
    
    // 验证结果内容
    expect(result.data.agentResponse).toContain('投资策略推荐');
    expect(result.data.agentResponse).toContain('价值投资');
    expect(result.data.strategyData.ticker).toBe('AAPL');
    expect(result.data.strategyData.recommendation.primaryStrategy).toBe('value');
  });

  test('应能处理获取策略失败的情况', async () => {
    // 模拟失败情况
    (getStrategyRecommendation as jest.Mock).mockRejectedValueOnce(
      new Error('策略生成失败')
    );
    
    const result = await getInvestmentStrategy({
      ticker: 'INVALID',
      riskTolerance: 'low',
      investmentHorizon: 'short'
    });
    
    // 验证结果失败
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('策略生成失败');
  });

  test('应能保存用户策略偏好', async () => {
    const preferences = {
      userId: 'user123',
      riskTolerance: 'high' as const,
      investmentHorizon: 'long' as const,
      marketView: 'bull' as const,
      preferredStrategies: ['growth', 'momentum']
    };
    
    const result = await saveStrategyPreferences(preferences);
    
    // 验证结果成功
    expect(result.success).toBe(true);
    expect(result.message).toContain('策略偏好保存成功');
    expect(result.timestamp).toBeDefined();
  });

  test('应能获取历史策略推荐', async () => {
    const result = await getStrategyHistory('user123', 5);
    
    // 验证结果成功
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(5);
    
    // 验证历史记录格式
    if (result.data.length > 0) {
      const firstRecord = result.data[0];
      expect(firstRecord.id).toBeDefined();
      expect(firstRecord.ticker).toBeDefined();
      expect(firstRecord.timestamp).toBeDefined();
      expect(firstRecord.primaryStrategy).toBeDefined();
    }
  });

  test('应能检索不同风险水平的策略', async () => {
    // 保守型投资者
    await getInvestmentStrategy({
      ticker: 'AAPL',
      riskTolerance: 'low',
      investmentHorizon: 'long',
      marketCondition: 'bear'
    });
    
    expect(getStrategyRecommendation).toHaveBeenLastCalledWith(
      'AAPL',
      'low',
      'long',
      'bear'
    );
    
    // 积极型投资者
    await getInvestmentStrategy({
      ticker: 'TSLA',
      riskTolerance: 'high',
      investmentHorizon: 'short',
      marketCondition: 'bull'
    });
    
    expect(getStrategyRecommendation).toHaveBeenLastCalledWith(
      'TSLA',
      'high',
      'short',
      'bull'
    );
  });

  test('应能处理不同市场状况', async () => {
    // 指定市场状况
    await getInvestmentStrategy({
      ticker: 'MSFT',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketCondition: 'volatile'
    });
    
    expect(getStrategyRecommendation).toHaveBeenLastCalledWith(
      'MSFT',
      'moderate',
      'medium',
      'volatile'
    );
    
    // 不指定市场状况 (应该使用默认值)
    await getInvestmentStrategy({
      ticker: 'GOOG',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium'
    });
    
    // 验证最后一个参数可以是undefined
    expect(getStrategyRecommendation).toHaveBeenLastCalledWith(
      'GOOG',
      'moderate',
      'medium',
      undefined
    );
  });
}); 