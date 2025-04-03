import { describe, it, expect, vi, beforeEach } from 'vitest';
import { statisticalArbitrageTool } from '@/mastra/tools/statisticalArbitrageTools';

// 模拟fetch函数
global.fetch = vi.fn();

describe('statisticalArbitrageTool', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // 模拟成功的API响应
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        prices: {
          'AAPL': [
            { date: '2023-01-01', close: 150 },
            { date: '2023-01-02', close: 152 }
          ],
          'MSFT': [
            { date: '2023-01-01', close: 250 },
            { date: '2023-01-02', close: 248 }
          ]
        }
      })
    });
  });

  it('应该分析股票的统计套利机会', async () => {
    // 执行工具
    const result = await statisticalArbitrageTool.execute({
      ticker: 'AAPL',
      peerStocks: ['MSFT', 'GOOGL'],
      lookbackPeriod: 90
    });

    // 验证函数调用
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://lumosfund-api.vercel.app/api/price-data')
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('AAPL,MSFT,GOOGL')
    );

    // 验证结果
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('ticker', 'AAPL');
    expect(result).toHaveProperty('opportunities');
    expect(result).toHaveProperty('overallSignal');
    expect(result).toHaveProperty('overallConfidence');
    
    // 验证机会数据
    expect(Array.isArray(result.opportunities)).toBe(true);
    expect(result.opportunities.length).toBe(2); // 两个同行业股票
    
    // 验证每个机会都包含必要的字段
    result.opportunities.forEach((opportunity: any) => {
      expect(opportunity).toHaveProperty('mainStock', 'AAPL');
      expect(opportunity).toHaveProperty('peerStock');
      expect(['MSFT', 'GOOGL']).toContain(opportunity.peerStock);
      
      expect(opportunity).toHaveProperty('correlation');
      expect(opportunity.correlation).toBeGreaterThanOrEqual(0);
      expect(opportunity.correlation).toBeLessThanOrEqual(1);
      
      expect(opportunity).toHaveProperty('isCointegrated');
      expect(typeof opportunity.isCointegrated).toBe('boolean');
      
      expect(opportunity).toHaveProperty('zScore');
      expect(opportunity).toHaveProperty('signal');
      expect(opportunity).toHaveProperty('confidence');
      expect(opportunity).toHaveProperty('sharpeRatio');
      
      // 验证信号字段
      expect([
        'long_main_short_peer', 
        'short_main_long_peer', 
        'long_main', 
        'short_main', 
        'neutral'
      ]).toContain(opportunity.signal);
      
      // 验证置信度值
      expect(opportunity.confidence).toBeGreaterThanOrEqual(50);
      expect(opportunity.confidence).toBeLessThanOrEqual(95);
    });
    
    // 验证整体信号
    expect([
      'long_main_short_peer', 
      'short_main_long_peer', 
      'long_main', 
      'short_main', 
      'neutral'
    ]).toContain(result.overallSignal);
    
    // 验证整体置信度
    expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
    expect(result.overallConfidence).toBeLessThanOrEqual(100);
  });

  it('应该为同一股票代码返回一致结果', async () => {
    // 多次执行相同参数
    const result1 = await statisticalArbitrageTool.execute({
      ticker: 'AAPL',
      peerStocks: ['MSFT']
    });
    
    const result2 = await statisticalArbitrageTool.execute({
      ticker: 'AAPL',
      peerStocks: ['MSFT']
    });
    
    // 验证结果一致性
    expect(result1.opportunities[0].correlation).toEqual(result2.opportunities[0].correlation);
    expect(result1.opportunities[0].zScore).toEqual(result2.opportunities[0].zScore);
    expect(result1.opportunities[0].signal).toEqual(result2.opportunities[0].signal);
    expect(result1.overallSignal).toEqual(result2.overallSignal);
  });

  it('应该提供不同的结果，取决于输入的股票代码', async () => {
    // 测试不同的股票
    const result1 = await statisticalArbitrageTool.execute({
      ticker: 'AAPL',
      peerStocks: ['MSFT']
    });
    
    const result2 = await statisticalArbitrageTool.execute({
      ticker: 'GOOGL',
      peerStocks: ['MSFT']
    });
    
    // 验证不同股票返回不同的数据
    expect(result1.opportunities[0].correlation).not.toEqual(result2.opportunities[0].correlation);
    expect(result1.opportunities[0].zScore).not.toEqual(result2.opportunities[0].zScore);
  });

  it('应该处理API错误', async () => {
    // 模拟API错误
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404
    });
    
    // 执行工具
    const result = await statisticalArbitrageTool.execute({
      ticker: 'INVALID',
      peerStocks: ['MSFT']
    });
    
    // 验证错误处理
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('获取价格数据失败');
  });

  it('应该处理执行过程中的异常', async () => {
    // 模拟抛出异常
    (global.fetch as any).mockRejectedValue(new Error('网络错误'));
    
    // 执行工具
    const result = await statisticalArbitrageTool.execute({
      ticker: 'AAPL',
      peerStocks: ['MSFT']
    });
    
    // 验证异常处理
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('统计套利分析失败');
  });

  it('应该处理空的同行业股票列表', async () => {
    // 执行工具，传入空数组
    const result = await statisticalArbitrageTool.execute({
      ticker: 'AAPL',
      peerStocks: []
    });
    
    // 验证结果
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('opportunities');
    expect(result.opportunities).toHaveLength(0);
    expect(result.overallSignal).toEqual('neutral');
    expect(result.overallConfidence).toEqual(0);
  });
}); 