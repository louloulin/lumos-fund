import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stockPriceTool } from '../../../src/mastra/tools/stockPrice';

// 模拟全局fetch
global.fetch = vi.fn();

describe('stockPriceTool', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return stock price data for a given ticker', async () => {
    // 模拟执行工具
    const result = await stockPriceTool.execute({
      ticker: 'AAPL',
      startDate: '2023-01-01',
      endDate: '2023-01-07',
    });

    // 验证结果包含预期的数据结构
    expect(result).toHaveProperty('ticker', 'AAPL');
    expect(result).toHaveProperty('currentPrice');
    expect(result).toHaveProperty('historicalData');
    expect(result).toHaveProperty('metadata');
    
    // 验证历史数据是一个数组
    expect(Array.isArray(result.historicalData)).toBe(true);
  });

  it('should handle default parameters correctly', async () => {
    // 只提供必需的参数
    const result = await stockPriceTool.execute({
      ticker: 'MSFT',
    });

    expect(result).toHaveProperty('ticker', 'MSFT');
    expect(result).toHaveProperty('currentPrice');
  });
}); 