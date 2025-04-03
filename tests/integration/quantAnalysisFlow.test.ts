import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { analyzeWithQuantInvestingAgent } from '../../src/mastra/agents/quantInvestingAgent';
import { analyzeStock } from '../../src/mastra/workflows/stockAnalysisWorkflow';

// Mock all dependencies
jest.mock('../../src/mastra/agents/quantInvestingAgent', () => ({
  analyzeWithQuantInvestingAgent: jest.fn().mockResolvedValue({
    ticker: 'AAPL',
    analysis: `
    投资信号: 看涨
    置信度: 78%
    估计夏普比率: 1.2
    关键因子暴露: 价值(0.8), 动量(1.2)
    
    交易建议:
    - 建立多头头寸，目标价格: 165
    - 止损设置在145以下
    
    量化分析:
    1. 技术指标显示中强度的看涨信号，RSI在上升趋势但未达超买区域
    2. 动量因子暴露度高，近期表现强劲
    3. 价值因子评分高于市场平均
    4. 与PEER1存在统计套利机会，Z-score为1.2，显示潜在回归机会
    `,
    data: {
      timeframe: 'medium',
      riskTolerance: 'medium',
      historicalPrices: [],
      technicalIndicators: {
        rsi: { value: 65, signal: 'neutral' },
        macd: { value: 2.1, signal: 'bullish' }
      },
      factorData: {
        value: 0.8,
        momentum: 1.2,
        quality: 0.9
      },
      arbitrageData: [
        {
          pairStock: 'MSFT',
          correlation: 0.85,
          zScore: 1.2,
          signal: 'buy_target_sell_pair',
          confidence: 0.75
        }
      ]
    },
    timestamp: new Date().toISOString()
  }),
  quantInvestingAgent: {
    name: 'Quantitative Investing Agent'
  }
}));

jest.mock('../../src/mastra/agents/valueInvestingAgent', () => ({
  analyzeWithValueInvestingAgent: jest.fn().mockResolvedValue({
    ticker: 'AAPL',
    recommendation: 'BUY',
    score: 8.5,
    reasoning: 'Strong economic moat and stable financials'
  })
}));

jest.mock('../../src/mastra/agents/growthInvestingAgent', () => ({
  analyzeWithGrowthInvestingAgent: jest.fn().mockResolvedValue({
    ticker: 'AAPL',
    recommendation: 'HOLD',
    score: 7.2,
    reasoning: 'Slowing growth but still potential'
  })
}));

jest.mock('../../src/mastra/agents/trendInvestingAgent', () => ({
  analyzeWithTrendInvestingAgent: jest.fn().mockResolvedValue({
    ticker: 'AAPL',
    recommendation: 'HOLD',
    score: 6.5,
    reasoning: 'Mixed technical signals'
  })
}));

jest.mock('../../src/mastra/agents/sentimentAgent', () => ({
  analyzeWithSentimentAgent: jest.fn().mockResolvedValue({
    ticker: 'AAPL',
    sentiment: 'POSITIVE',
    score: 7.5,
    newsHeadlines: []
  })
}));

jest.mock('../../src/mastra/agents/riskManagementAgent', () => ({
  analyzeWithRiskAgent: jest.fn().mockResolvedValue({
    ticker: 'AAPL',
    riskLevel: 'MEDIUM',
    score: 6.0,
    warnings: ['Market volatility ahead']
  })
}));

describe('量化分析流程集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应通过综合分析工作流正确处理量化投资分析', async () => {
    const result = await analyzeStock('AAPL');
    
    // 验证量化投资代理被调用
    expect(analyzeWithQuantInvestingAgent).toHaveBeenCalledWith('AAPL', expect.any(Object));
    
    // 验证结果包含量化投资建议
    expect(result).toHaveProperty('recommendationBreakdown.quant');
    expect(result.recommendationBreakdown.quant).toHaveProperty('score');
    expect(result.recommendationBreakdown.quant).toHaveProperty('recommendation');
    
    // 验证总体建议考虑了量化分析
    expect(result).toHaveProperty('aggregateRecommendation');
    expect(result).toHaveProperty('confidence');
    
    // 验证风险评估已集成
    expect(result).toHaveProperty('risks');
  });

  test('应处理传入的当前持仓信息', async () => {
    const currentPosition = {
      shares: 10,
      averagePrice: 150,
      entryDate: '2023-01-01'
    };

    const result = await analyzeStock('AAPL', { currentPosition });
    
    // 验证结果考虑了当前持仓
    expect(result).toHaveProperty('currentPosition');
    expect(result.currentPosition).toEqual(currentPosition);
    
    // 验证盈亏分析
    expect(result).toHaveProperty('profitLossAnalysis');
  });

  test('应优化不同时间框架和风险偏好的分析', async () => {
    // 测试短期低风险设置
    await analyzeStock('AAPL', { 
      timeframe: 'short',
      riskTolerance: 'low'
    });
    
    expect(analyzeWithQuantInvestingAgent).toHaveBeenCalledWith(
      'AAPL', 
      expect.objectContaining({ 
        timeframe: 'short',
        riskTolerance: 'low'
      })
    );
    
    // 测试长期高风险设置
    await analyzeStock('AAPL', { 
      timeframe: 'long',
      riskTolerance: 'high'
    });
    
    expect(analyzeWithQuantInvestingAgent).toHaveBeenCalledWith(
      'AAPL', 
      expect.objectContaining({ 
        timeframe: 'long',
        riskTolerance: 'high'
      })
    );
  });

  test('应在分析失败时优雅地处理错误', async () => {
    // 模拟量化分析失败
    const mockedAnalyzeWithQuantInvestingAgent = analyzeWithQuantInvestingAgent as jest.Mock;
    mockedAnalyzeWithQuantInvestingAgent.mockRejectedValueOnce(new Error('量化分析失败'));
    
    const result = await analyzeStock('AAPL');
    
    // 即使量化分析失败，仍然应该返回其他分析结果
    expect(result).toHaveProperty('recommendationBreakdown');
    expect(result.recommendationBreakdown).not.toHaveProperty('quant');
    
    // 应该记录错误
    expect(result).toHaveProperty('errors');
    expect(result.errors).toContainEqual(expect.objectContaining({
      agent: 'quantitative',
      message: expect.stringContaining('量化分析失败')
    }));
  });
}); 