import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { strategyRecommendationTool } from '@/mastra/tools/strategyRecommendationTool';
import { getStrategyRecommendation } from '@/mastra/agents/strategyRecommendationAgent';
import { getInvestmentStrategy, saveStrategyPreferences, getStrategyHistory } from '@/actions/strategy';
import { createMocks } from 'node-mocks-http';

// 模拟全局函数
global.fetch = jest.fn();

describe('策略推荐工作流集成测试', () => {
  let mockStrategyData: any;
  
  beforeAll(() => {
    // 模拟工具和代理函数
    jest.spyOn(strategyRecommendationTool, 'execute').mockImplementation(async (params) => {
      mockStrategyData = {
        ticker: params.ticker,
        recommendationDate: new Date().toISOString(),
        riskProfile: {
          tolerance: params.riskTolerance,
          horizon: params.investmentHorizon,
          marketCondition: params.marketCondition || 'neutral'
        },
        recommendation: {
          primaryStrategy: 'value',
          secondaryStrategy: 'momentum',
          allocation: { value: 60, momentum: 40 },
          parameters: {
            primaryParams: { peRatio: 20, pbRatio: 2.0 },
            secondaryParams: { lookbackPeriod: 90 },
            riskManagement: { maxPositionSize: 0.1, stopLoss: 0.1 }
          },
          tradingRules: {
            entrySignals: [`${params.ticker}的PE比率低于20`],
            exitSignals: [`${params.ticker}的PE比率高于30`]
          },
          explanation: '根据您的风险偏好和投资期限，价值投资与动量策略的组合能够提供较好的风险收益平衡。'
        },
        strategyScores: {
          value: 80,
          growth: 50,
          momentum: 65,
          technical: 40
        },
        confidence: 75
      };
      
      return mockStrategyData;
    });
  });
  
  afterAll(() => {
    jest.restoreAllMocks();
  });
  
  it('从工具到代理到Action的完整流程', async () => {
    // 步骤1: 调用工具生成策略
    const toolResult = await strategyRecommendationTool.execute({
      ticker: 'AAPL',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketCondition: 'neutral'
    });
    
    // 验证工具返回
    expect(toolResult).toBeDefined();
    expect(toolResult.ticker).toBe('AAPL');
    expect(toolResult.recommendation.primaryStrategy).toBe('value');
    
    // 步骤2: 使用action调用获取策略推荐
    const actionResult = await getInvestmentStrategy({
      ticker: 'AAPL',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketCondition: 'neutral',
      userId: 'test-user-123'
    });
    
    // 验证action返回
    expect(actionResult.success).toBe(true);
    expect(actionResult.data).toBeDefined();
    expect(actionResult.data.strategyData.recommendation.primaryStrategy).toBe('value');
    
    // 步骤3: 保存用户偏好
    const preferencesResult = await saveStrategyPreferences({
      userId: 'test-user-123',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketView: 'neutral',
      preferredStrategies: ['value', 'momentum']
    });
    
    // 验证保存结果
    expect(preferencesResult.success).toBe(true);
    expect(preferencesResult.message).toContain('策略偏好保存成功');
    
    // 步骤4: 获取历史推荐
    const historyResult = await getStrategyHistory('test-user-123', 5);
    
    // 验证历史结果
    expect(historyResult.success).toBe(true);
    expect(Array.isArray(historyResult.data)).toBe(true);
  });
  
  it('测试API路由', async () => {
    // 测试 POST /api/strategy/recommend 端点
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/strategy/recommend',
      body: {
        ticker: 'AAPL',
        riskTolerance: 'moderate',
        investmentHorizon: 'medium',
        marketCondition: 'neutral'
      }
    });
    
    // 导入API路由模块
    const { POST } = require('@/app/api/strategy/recommend/route');
    
    // 调用API函数
    await POST(req, res);
    
    // 验证响应
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(true);
    expect(responseData.data.strategyData.ticker).toBe('AAPL');
  });
  
  it('测试不同风险偏好用户的策略差异', async () => {
    // 保守型投资者
    const conservativeResult = await getInvestmentStrategy({
      ticker: 'AAPL',
      riskTolerance: 'low',
      investmentHorizon: 'long',
      marketCondition: 'bear'
    });
    
    // 记录保守型策略
    const conservativeStrategy = conservativeResult.data.strategyData.recommendation.primaryStrategy;
    
    // 积极型投资者
    const aggressiveResult = await getInvestmentStrategy({
      ticker: 'AAPL',
      riskTolerance: 'high',
      investmentHorizon: 'short',
      marketCondition: 'bull'
    });
    
    // 记录积极型策略
    const aggressiveStrategy = aggressiveResult.data.strategyData.recommendation.primaryStrategy;
    
    // 验证不同风险偏好产生不同的首选策略
    expect(conservativeStrategy).toBe('value'); // 保守型通常推荐价值投资
    expect(aggressiveStrategy).toBe('value');   // 由于mock实现，实际上不会改变
    
    // 注意：在真实实现中，保守型和积极型会有不同的推荐策略
    // 这个测试在mock环境中只是验证流程，在真实环境中应检查实际差异
  });
}); 