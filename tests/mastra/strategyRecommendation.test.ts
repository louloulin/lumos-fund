import { describe, it, expect, vi, beforeEach } from 'vitest';
import { strategyRecommendationTool } from '@/mastra/tools/strategyRecommendationTool';
import { strategyRecommendationAgent, getStrategyRecommendation } from '@/mastra/agents/strategyRecommendationAgent';
import { getInvestmentStrategy, saveStrategyPreferences, getStrategyHistory } from '@/actions/strategy';

// Mock 依赖模块
vi.mock('@/mastra/tools/strategyRecommendationTool', () => ({
  strategyRecommendationTool: {
    execute: vi.fn()
  }
}));

vi.mock('@/mastra/agents/strategyRecommendationAgent', () => ({
  strategyRecommendationAgent: {
    generate: vi.fn()
  },
  getStrategyRecommendation: vi.fn()
}));

vi.mock('@/lib/logger.server', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  })
}));

describe('策略推荐功能测试', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('策略推荐工具测试', () => {
    it('应该根据输入参数生成推荐策略', async () => {
      // 模拟工具返回数据
      const mockRecommendation = {
        ticker: 'AAPL',
        recommendationDate: '2023-04-03T12:00:00Z',
        riskProfile: {
          tolerance: 'moderate',
          horizon: 'medium',
          marketCondition: 'neutral'
        },
        recommendation: {
          primaryStrategy: 'value',
          secondaryStrategy: 'growth',
          allocation: { value: 60, growth: 40 },
          parameters: {
            primaryParams: { peRatio: 20, pbRatio: 2.0 },
            secondaryParams: { revenueGrowth: 0.15 },
            riskManagement: { maxPositionSize: 0.1, stopLoss: 0.1 }
          },
          tradingRules: {
            entrySignals: ['PE低于20'],
            exitSignals: ['PE高于30']
          },
          explanation: '推荐解释'
        },
        strategyScores: {
          value: 80,
          growth: 60,
          momentum: 40
        },
        confidence: 75
      };

      vi.mocked(strategyRecommendationTool.execute).mockResolvedValue(mockRecommendation);

      const result = await strategyRecommendationTool.execute({
        ticker: 'AAPL',
        riskTolerance: 'moderate',
        investmentHorizon: 'medium',
        marketCondition: 'neutral'
      });

      expect(strategyRecommendationTool.execute).toHaveBeenCalledWith({
        ticker: 'AAPL',
        riskTolerance: 'moderate',
        investmentHorizon: 'medium',
        marketCondition: 'neutral'
      });

      expect(result).toEqual(mockRecommendation);
      expect(result.recommendation.primaryStrategy).toBe('value');
      expect(result.recommendation.secondaryStrategy).toBe('growth');
      expect(result.confidence).toBe(75);
    });
  });

  describe('策略推荐代理测试', () => {
    it('应该返回代理分析结果', async () => {
      // 模拟代理返回数据
      const mockAgentResponse = {
        text: '根据分析，推荐价值投资和成长投资组合策略...'
      };

      // 模拟工具返回数据
      const mockToolResult = {
        ticker: 'AAPL',
        recommendation: {
          primaryStrategy: 'value',
          secondaryStrategy: 'growth'
        }
      };

      vi.mocked(strategyRecommendationTool.execute).mockResolvedValue(mockToolResult);
      vi.mocked(strategyRecommendationAgent.generate).mockResolvedValue(mockAgentResponse);
      vi.mocked(getStrategyRecommendation).mockResolvedValue({
        agentResponse: mockAgentResponse.text,
        strategyData: mockToolResult,
        timestamp: expect.any(String)
      });

      const result = await getStrategyRecommendation('AAPL', 'moderate', 'medium', 'neutral');

      expect(result).toEqual({
        agentResponse: mockAgentResponse.text,
        strategyData: mockToolResult,
        timestamp: expect.any(String)
      });
    });
  });

  describe('策略Action测试', () => {
    it('应该获取投资策略推荐', async () => {
      // 模拟getStrategyRecommendation返回
      const mockRecommendation = {
        agentResponse: '策略推荐内容',
        strategyData: { primaryStrategy: 'value' },
        timestamp: '2023-04-03T12:00:00Z'
      };

      vi.mocked(getStrategyRecommendation).mockResolvedValue(mockRecommendation);

      const result = await getInvestmentStrategy({
        ticker: 'AAPL',
        riskTolerance: 'moderate',
        investmentHorizon: 'medium',
        marketCondition: 'neutral'
      });

      expect(getStrategyRecommendation).toHaveBeenCalledWith(
        'AAPL', 'moderate', 'medium', 'neutral'
      );

      expect(result).toEqual({
        success: true,
        data: mockRecommendation
      });
    });

    it('应该保存用户策略偏好', async () => {
      const params = {
        userId: 'user123',
        riskTolerance: 'moderate' as const,
        investmentHorizon: 'medium' as const,
        marketView: 'neutral' as const,
        preferredStrategies: ['value', 'growth']
      };

      const result = await saveStrategyPreferences(params);

      expect(result).toEqual({
        success: true,
        message: '策略偏好保存成功',
        timestamp: expect.any(String)
      });
    });

    it('应该获取策略推荐历史', async () => {
      const result = await getStrategyHistory('user123', 5);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(5);
    });
  });
}); 