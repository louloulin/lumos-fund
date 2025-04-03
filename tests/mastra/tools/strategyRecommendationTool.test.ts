import { describe, it, expect, vi, beforeEach } from 'vitest';
import { strategyRecommendationTool } from '@/mastra/tools/strategyRecommendationTool';

describe('策略推荐工具', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应根据低风险偏好推荐价值和股息策略', async () => {
    const result = await strategyRecommendationTool.execute({
      ticker: 'AAPL',
      riskTolerance: 'low',
      investmentHorizon: 'long',
      marketCondition: 'neutral'
    });

    expect(result).toBeDefined();
    expect(result.ticker).toBe('AAPL');
    expect(result.recommendationDate).toBeDefined();
    
    // 验证风险配置
    expect(result.riskProfile).toEqual({
      tolerance: 'low',
      horizon: 'long',
      marketCondition: 'neutral'
    });
    
    // 验证推荐策略
    expect(result.recommendation).toBeDefined();
    expect(['value', 'dividend']).toContain(result.recommendation.primaryStrategy);
    
    // 验证交易规则
    expect(result.recommendation.tradingRules).toBeDefined();
    expect(result.recommendation.tradingRules.entrySignals).toBeInstanceOf(Array);
    expect(result.recommendation.tradingRules.exitSignals).toBeInstanceOf(Array);
    
    // 验证底层分数
    expect(result.strategyScores).toBeDefined();
    expect(result.strategyScores.value).toBeGreaterThan(0);
    expect(result.strategyScores.dividend).toBeGreaterThan(0);
    
    // 验证免责声明
    expect(result.disclaimer).toBeDefined();
    expect(result.disclaimer).toContain('投资有风险');
  });

  it('应根据高风险偏好推荐动量和成长策略', async () => {
    const result = await strategyRecommendationTool.execute({
      ticker: 'TSLA',
      riskTolerance: 'high',
      investmentHorizon: 'short',
      marketCondition: 'bull'
    });

    expect(result).toBeDefined();
    expect(result.ticker).toBe('TSLA');
    
    // 验证风险配置
    expect(result.riskProfile).toEqual({
      tolerance: 'high',
      horizon: 'short',
      marketCondition: 'bull'
    });
    
    // 验证推荐策略
    expect(['momentum', 'growth', 'trend']).toContain(result.recommendation.primaryStrategy);
    
    // 验证分数
    expect(result.strategyScores.momentum).toBeGreaterThan(0);
    expect(result.strategyScores.growth).toBeGreaterThan(0);
  });

  it('应根据市场状况调整策略推荐', async () => {
    const bullMarketResult = await strategyRecommendationTool.execute({
      ticker: 'AAPL',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketCondition: 'bull'
    });

    const bearMarketResult = await strategyRecommendationTool.execute({
      ticker: 'AAPL',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketCondition: 'bear'
    });

    // 牛市和熊市的推荐应有所不同
    expect(bullMarketResult.recommendation.primaryStrategy)
      .not.toBe(bearMarketResult.recommendation.primaryStrategy);
      
    // 牛市应该偏向动量和成长
    expect(bullMarketResult.strategyScores.momentum)
      .toBeGreaterThan(bearMarketResult.strategyScores.momentum);
      
    // 熊市应该偏向价值和股息
    expect(bearMarketResult.strategyScores.value)
      .toBeGreaterThan(bullMarketResult.strategyScores.value);
  });

  it('应包含详细的参数配置', async () => {
    const result = await strategyRecommendationTool.execute({
      ticker: 'MSFT',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketCondition: 'neutral'
    });

    // 验证参数
    expect(result.recommendation.parameters).toBeDefined();
    expect(result.recommendation.parameters.primaryParams).toBeDefined();
    expect(result.recommendation.parameters.secondaryParams).toBeDefined();
    expect(result.recommendation.parameters.riskManagement).toBeDefined();
    
    // 验证风险管理参数
    expect(result.recommendation.parameters.riskManagement.maxPositionSize).toBeDefined();
    expect(result.recommendation.parameters.riskManagement.stopLoss).toBeDefined();
    expect(result.recommendation.parameters.riskManagement.takeProfit).toBeDefined();
  });

  it('应处理基本面数据和技术指标', async () => {
    const fundamentalData = {
      pe: 12,
      pb: 1.2,
      dividendYield: 0.05,
      revenueGrowth: 0.2,
      epsGrowth: 0.25
    };
    
    const technicalData = {
      rsi: 65,
      macd: {
        histogram: 1.2
      },
      bollinger: {
        percentB: 0.8
      },
      adx: 30
    };

    const result = await strategyRecommendationTool.execute({
      ticker: 'GOOG',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketCondition: 'neutral',
      fundamentalData,
      technicalData
    });

    // 验证包含了基本面和技术面数据的影响
    expect(result.confidence).toBeGreaterThan(60);
    
    // 验证基本面数据对策略评分的影响
    // 低PE和高股息应该导致价值和股息策略得分更高
    expect(result.strategyScores.value).toBeGreaterThan(0);
    expect(result.strategyScores.dividend).toBeGreaterThan(0);
    
    // 强劲的动量指标应该提高动量策略得分
    expect(result.strategyScores.momentum).toBeGreaterThan(0);
  });

  it('应在出现错误时提供备用推荐', async () => {
    // 模拟错误情况
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // 故意传入无效值触发错误
    const result = await strategyRecommendationTool.execute({
      ticker: 'INVALID',
      riskTolerance: 'low' as any,
      investmentHorizon: 'long' as any,
      marketCondition: 'invalid' as any
    });

    // 验证有错误字段
    expect(result.error).toBeDefined();
    
    // 验证提供了备用推荐
    expect(result.fallbackRecommendation).toBeDefined();
    expect(result.fallbackRecommendation.primaryStrategy).toBeDefined();
    expect(result.fallbackRecommendation.allocation).toBeDefined();
    expect(result.fallbackRecommendation.explanation).toBeDefined();
  });
}); 