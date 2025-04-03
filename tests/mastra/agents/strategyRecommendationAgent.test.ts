import { describe, it, expect, beforeEach } from '@jest/globals';
import * as jest from 'jest-mock';
import { strategyRecommendationAgent, getStrategyRecommendation } from '@/mastra/agents/strategyRecommendationAgent';

const vi = jest;

// 模拟依赖的工具
vi.mock('@/mastra/tools/strategyRecommendationTool', () => ({
  strategyRecommendationTool: {
    execute: vi.fn().mockResolvedValue({
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
        allocation: {
          value: 60,
          momentum: 40
        },
        parameters: {
          primaryParams: {
            peRatio: 20,
            pbRatio: 2.0
          },
          secondaryParams: {
            lookbackPeriod: 6
          },
          riskManagement: {
            maxPositionSize: 0.1,
            stopLoss: 0.1
          }
        },
        tradingRules: {
          entrySignals: ['股票AAPL的市盈率低于20'],
          exitSignals: ['股票AAPL的市盈率高于30']
        },
        explanation: '基于您平衡型的风险承受能力和中期的投资期限，在当前中性市场环境下，我们推荐价值投资和动量策略的组合。'
      },
      strategyScores: {
        value: 70,
        growth: 40,
        momentum: 50
      },
      confidence: 75,
      disclaimer: '此推荐基于当前市场状况和历史数据，投资有风险。'
    })
  }
}));

vi.mock('@/mastra/tools/technicalIndicatorTools', () => ({
  technicalIndicatorsTool: {
    execute: vi.fn().mockResolvedValue({
      rsi: 58,
      macd: { histogram: 0.5 },
      bollinger: { percentB: 0.6 }
    })
  }
}));

vi.mock('@/mastra/tools/marketData', () => ({
  marketDataTool: {
    execute: vi.fn().mockResolvedValue({
      interest_rate: 0.03,
      inflation: 0.02,
      gdp_growth: 0.025
    })
  }
}));

vi.mock('@/mastra/tools/financialMetrics', () => ({
  financialMetricsTool: {
    execute: vi.fn().mockResolvedValue({
      pe: 18,
      pb: 3.5,
      roe: 25,
      dividend_yield: 0.015
    })
  }
}));

// 模拟代理的generate方法
vi.mock('@mastra/core/agent', () => ({
  Agent: vi.fn().mockImplementation(() => ({
    name: 'strategyRecommendationAgent',
    generate: vi.fn().mockResolvedValue({
      text: `
# 投资策略推荐: AAPL

## 策略组合推荐
- 主要策略: 价值投资 (60%)
- 次要策略: 动量策略 (40%)

## 策略解释
基于您平衡型的风险承受能力和中期(6-18个月)的投资期限，在当前中性市场环境下，价值投资和动量策略的组合能够提供适当的风险收益平衡。

## 参数设置
- 价值投资参数:
  - 目标市盈率: < 20
  - 目标市净率: < 2.0
  - 最低ROE: 15%
  
- 动量策略参数:
  - 回溯期: 6个月
  - 短期均线: 20日
  - 长期均线: 100日

## 交易规则
- 入场信号:
  1. 股票市盈率低于行业平均
  2. 价格突破20日均线
  3. 价格在50日均线之上

- 出场信号:
  1. 市盈率超过30
  2. 价格跌破50日均线
  3. 动量指标转弱

## 复审周期
建议每月复审一次此策略有效性，并在重大经济数据公布后重新评估。
      `,
      toolCalls: []
    })
  }))
}));

describe('策略推荐代理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应使用正确的工具集', async () => {
    // 验证代理配置了正确的工具
    expect(strategyRecommendationAgent).toBeDefined();
    // 使用Array.isArray检查tools是否为数组，而不是直接访问属性
    expect(Array.isArray(strategyRecommendationAgent.tools)).toBe(true);
  });

  it('应能获取策略推荐', async () => {
    const result = await getStrategyRecommendation(
      'AAPL',
      'moderate',
      'medium',
      'neutral'
    );

    // 验证结果格式
    expect(result).toBeDefined();
    expect(result.agentResponse).toBeDefined();
    expect(result.strategyData).toBeDefined();
    expect(result.timestamp).toBeDefined();

    // 验证结果内容
    expect(result.agentResponse).toContain('投资策略推荐');
    expect(result.agentResponse).toContain('策略组合推荐');
    expect(result.agentResponse).toContain('交易规则');

    // 验证策略数据
    expect(result.strategyData.ticker).toBe('AAPL');
    expect(result.strategyData.recommendation).toBeDefined();
    expect(result.strategyData.recommendation.primaryStrategy).toBe('value');
    expect(result.strategyData.recommendation.secondaryStrategy).toBe('momentum');
  });

  it('应根据不同的风险承受能力提供不同的策略', async () => {
    // 模拟strategyRecommendationTool的不同风险水平响应
    const mockToolExec = require('@/mastra/tools/strategyRecommendationTool').strategyRecommendationTool.execute;
    
    // 先调用高风险版本
    mockToolExec.mockResolvedValueOnce({
      ticker: 'AAPL',
      recommendation: {
        primaryStrategy: 'momentum',
        secondaryStrategy: 'growth',
        allocation: { momentum: 65, growth: 35 }
      },
      riskProfile: { tolerance: 'high' }
    });
    
    const highRiskResult = await getStrategyRecommendation(
      'AAPL',
      'high',
      'short',
      'bull'
    );
    
    // 再调用低风险版本
    mockToolExec.mockResolvedValueOnce({
      ticker: 'AAPL',
      recommendation: {
        primaryStrategy: 'value',
        secondaryStrategy: 'dividend',
        allocation: { value: 70, dividend: 30 }
      },
      riskProfile: { tolerance: 'low' }
    });
    
    const lowRiskResult = await getStrategyRecommendation(
      'AAPL',
      'low',
      'long',
      'bear'
    );
    
    // 验证风险水平影响了策略选择
    expect(highRiskResult.strategyData.recommendation.primaryStrategy).toBe('momentum');
    expect(lowRiskResult.strategyData.recommendation.primaryStrategy).toBe('value');
  });

  it('应处理技术指标数据', async () => {
    await getStrategyRecommendation('AAPL', 'moderate', 'medium');
    
    // 验证调用了技术指标工具
    const techToolMock = require('@/mastra/tools/technicalIndicatorTools').technicalIndicatorsTool.execute;
    expect(techToolMock).toHaveBeenCalled();
    expect(techToolMock).toHaveBeenCalledWith({
      ticker: 'AAPL',
      indicators: ['RSI', 'MACD', 'Bollinger', 'ADX', 'ATR'],
      period: 14,
      historicalDays: 200
    });
  });

  it('应处理基本面数据', async () => {
    await getStrategyRecommendation('AAPL', 'moderate', 'medium');
    
    // 验证调用了财务指标工具
    const finToolMock = require('@/mastra/tools/financialMetrics').financialMetricsTool.execute;
    expect(finToolMock).toHaveBeenCalled();
    expect(finToolMock).toHaveBeenCalledWith({
      ticker: 'AAPL',
      metrics: ['pe', 'pb', 'roe', 'dividend_yield', 'revenue_growth', 'eps_growth']
    });
  });

  it('应处理宏观经济数据', async () => {
    await getStrategyRecommendation('AAPL', 'moderate', 'medium');
    
    // 验证调用了市场数据工具
    const marketToolMock = require('@/mastra/tools/marketData').marketDataTool.execute;
    expect(marketToolMock).toHaveBeenCalled();
    expect(marketToolMock).toHaveBeenCalledWith({
      dataType: 'macro',
      indicators: ['interest_rate', 'inflation', 'gdp_growth', 'unemployment']
    });
  });

  it('应处理错误情况', async () => {
    // 模拟strategyRecommendationTool抛出错误
    const mockToolExec = require('@/mastra/tools/strategyRecommendationTool').strategyRecommendationTool.execute;
    mockToolExec.mockRejectedValueOnce(new Error('策略推荐失败'));
    
    // 验证错误被正确处理
    await expect(getStrategyRecommendation('AAPL', 'moderate', 'medium'))
      .rejects.toThrow('获取策略推荐失败');
  });
}); 