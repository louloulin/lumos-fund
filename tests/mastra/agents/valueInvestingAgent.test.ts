import { describe, it, expect, vi, beforeEach } from 'vitest';
import { valueInvestingAgent } from '../../../src/mastra/agents/valueInvestingAgent';
import { createMockTool } from '../test-utils';

// 模拟代理依赖的工具
vi.mock('../../../src/mastra/tools/financialMetrics', () => {
  return {
    financialMetricsTool: createMockTool('financialMetricsTool', {
      ticker: 'AAPL',
      period: 'annual',
      metrics: {
        'return_on_equity': 0.245,
        'debt_to_equity': 1.2,
        'price_to_earnings': 18.5,
      }
    })
  };
});

vi.mock('../../../src/mastra/tools/stockPrice', () => {
  return {
    stockPriceTool: createMockTool('stockPriceTool', {
      ticker: 'AAPL',
      currentPrice: 185.92,
      historicalData: [
        { date: '2023-12-01', open: 184.20, high: 186.84, low: 183.57, close: 185.92 }
      ]
    })
  };
});

// 模拟LLM响应
vi.mock('@ai-sdk/openai', () => {
  return {
    openai: () => vi.fn().mockResolvedValue({
      text: '股票分析结果：AAPL看涨，置信度80%。理由：强劲基本面，合理估值。',
      toolCalls: []
    })
  };
});

describe('valueInvestingAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze a stock and return investment advice', async () => {
    // 模拟代理输入
    const input = {
      ticker: 'AAPL',
      data: {
        financial: {
          metrics: {
            'return_on_equity': 0.245,
            'debt_to_equity': 1.2
          }
        },
        price: {
          currentPrice: 185.92
        }
      }
    };

    // 调用代理
    const result = await valueInvestingAgent.generate({
      messages: [
        { role: 'user', content: `分析 ${input.ticker} 股票` }
      ],
      inputs: input
    });

    // 验证结果
    expect(result).toBeDefined();
    expect(result.text).toContain('AAPL');
  });
}); 