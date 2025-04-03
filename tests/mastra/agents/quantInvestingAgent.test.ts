import { describe, it, expect, vi, beforeEach } from 'vitest';
import { quantInvestingAgent, analyzeWithQuantInvestingAgent } from '@/mastra/agents/quantInvestingAgent';
import { createMockTool } from '../test-utils';

// 模拟代理依赖的工具
vi.mock('@/mastra/tools/marketDataTools', () => {
  return {
    historicalPriceTool: createMockTool('historicalPriceTool', {
      symbol: 'AAPL',
      days: 180,
      historicalPrices: [
        { date: '2023-04-01', open: 150, high: 155, low: 148, close: 153, volume: 1000000 },
        { date: '2023-03-31', open: 148, high: 152, low: 147, close: 149, volume: 900000 }
      ],
      success: true
    })
  };
});

vi.mock('@/mastra/tools/financialDataTools', () => {
  return {
    financialMetricsTool: createMockTool('financialMetricsTool', {
      ticker: 'AAPL',
      period: 'ttm',
      metrics: {
        grossMargin: 0.45,
        operatingMargin: 0.32,
        netProfitMargin: 0.25,
        returnOnEquity: 0.42,
        returnOnAssets: 0.19,
        debtToEquity: 1.2,
        currentRatio: 1.4
      },
      success: true
    }),
    financialHistoryTool: createMockTool('financialHistoryTool', {
      ticker: 'AAPL',
      years: 3,
      financialHistory: [
        {
          year: '2023',
          revenue: 365000000000,
          netIncome: 95000000000,
          operatingCashFlow: 110000000000,
          grossMargin: 0.45,
          netMargin: 0.26,
          roe: 0.42
        },
        {
          year: '2022',
          revenue: 350000000000,
          netIncome: 90000000000,
          operatingCashFlow: 105000000000,
          grossMargin: 0.44,
          netMargin: 0.25,
          roe: 0.40
        }
      ],
      success: true
    })
  };
});

vi.mock('@/mastra/tools/technicalIndicatorTools', () => {
  return {
    technicalIndicatorsTool: createMockTool('technicalIndicatorsTool', {
      ticker: 'AAPL',
      indicators: {
        rsi: {
          current: 58.2,
          interpretation: '看涨'
        },
        macd: {
          current: {
            macd: 1.25,
            signal: 0.75,
            histogram: 0.5
          },
          interpretation: '看涨'
        },
        bollinger: {
          current: {
            middle: 153,
            upper: 165,
            lower: 141,
            bandWidth: 0.157,
            percentB: 0.67
          },
          interpretation: '看涨'
        }
      },
      success: true
    })
  };
});

vi.mock('@/mastra/tools/factorModelTools', () => {
  return {
    factorModelTool: createMockTool('factorModelTool', {
      ticker: 'AAPL',
      factorExposures: {
        value: {
          score: 0.65,
          interpretation: '价值被低估'
        },
        momentum: {
          score: 0.72,
          interpretation: '强劲上升动量'
        },
        quality: {
          score: 0.80,
          interpretation: '优秀质量'
        },
        size: {
          marketCap: 2500000000000,
          category: '超大型股',
          score: 0.1,
          interpretation: '大型股特征'
        },
        volatility: {
          score: 0.68,
          interpretation: '良好风险回报'
        }
      },
      overallScore: {
        score: 0.71,
        interpretation: '极具吸引力',
        investment_view: '强烈买入'
      },
      success: true
    })
  };
});

vi.mock('@/mastra/tools/statisticalArbitrageTools', () => {
  return {
    statisticalArbitrageTool: createMockTool('statisticalArbitrageTool', {
      ticker: 'AAPL',
      peerStocks: ['MSFT', 'GOOGL'],
      opportunities: [
        {
          mainStock: 'AAPL',
          peerStock: 'MSFT',
          correlation: 0.82,
          isCointegrated: true,
          zScore: -2.3,
          signal: 'long_main_short_peer',
          confidence: 76.7,
          sharpeRatio: 1.85
        }
      ],
      overallSignal: 'long_main',
      overallConfidence: 76.7,
      success: true
    })
  };
});

// 模拟LLM响应
vi.mock('@ai-sdk/openai', () => {
  return {
    openai: () => vi.fn().mockResolvedValue({
      text: `
投资信号: 看涨
置信度: 85%
估计夏普比率: 1.72
关键因子暴露:
- 价值: 0.65 (价值被低估)
- 质量: 0.80 (优秀质量)
- 动量: 0.72 (强劲上升动量)

量化分析结果：AAPL显示出良好的投资机会，具有较高的质量分数和正向动量。技术指标显示超买趋势尚未达到极端水平。统计套利分析显示与MSFT有配对交易机会。

建议操作：买入AAPL，目标价格区间170-175美元，止损位145美元。
`,
      toolCalls: []
    })
  };
});

describe('quantInvestingAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该分析股票并返回投资建议', async () => {
    // 模拟代理输入
    const ticker = 'AAPL';
    const options = {
      timeframe: 'medium' as const,
      riskTolerance: 'medium' as const,
      peerStocks: ['MSFT', 'GOOGL']
    };

    // 调用分析函数
    const result = await analyzeWithQuantInvestingAgent(ticker, options);

    // 验证结果
    expect(result).toBeDefined();
    expect(result.ticker).toBe(ticker);
    expect(result.analysis).toContain('投资信号: 看涨');
    expect(result.analysis).toContain('置信度: 85%');
    expect(result.analysis).toContain('估计夏普比率: 1.72');
    expect(result.data).toBeDefined();
    expect(result.data.ticker).toBe(ticker);
    expect(result.data.timeframe).toBe('medium');
    expect(result.data.riskTolerance).toBe('medium');
  });

  it('应该处理不同的时间框架', async () => {
    // 调用短期分析
    await analyzeWithQuantInvestingAgent('AAPL', {
      timeframe: 'short',
      riskTolerance: 'medium'
    });

    // 验证调用了正确的参数
    const historicalPriceToolMock = await import('@/mastra/tools/marketDataTools');
    expect(historicalPriceToolMock.historicalPriceTool.execute).toHaveBeenCalledWith({
      symbol: 'AAPL',
      days: 30
    });

    // 清除之前的模拟调用
    vi.clearAllMocks();

    // 调用长期分析
    await analyzeWithQuantInvestingAgent('AAPL', {
      timeframe: 'long',
      riskTolerance: 'low'
    });

    // 验证调用了正确的参数
    expect(historicalPriceToolMock.historicalPriceTool.execute).toHaveBeenCalledWith({
      symbol: 'AAPL',
      days: 365
    });
  });

  it('应该处理错误情况', async () => {
    // 模拟historicalPriceTool抛出错误
    const historicalPriceToolMock = await import('@/mastra/tools/marketDataTools');
    historicalPriceToolMock.historicalPriceTool.execute.mockRejectedValueOnce(new Error('API错误'));

    // 验证错误处理
    await expect(analyzeWithQuantInvestingAgent('AAPL')).rejects.toThrow('量化分析失败');
  });
});

describe('quantInvestingAgent直接调用', () => {
  it('应该返回完整的分析结果', async () => {
    const result = await quantInvestingAgent.generate(`分析股票 AAPL 的量化投资机会`);
    
    expect(result).toBeDefined();
    expect(result.text).toContain('投资信号: 看涨');
    expect(result.text).toContain('置信度: 85%');
    expect(result.text).toContain('估计夏普比率');
    expect(result.text).toContain('关键因子暴露');
  });
}); 