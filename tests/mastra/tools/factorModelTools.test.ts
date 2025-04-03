import { describe, it, expect, vi, beforeEach } from 'vitest';
import { factorModelTool } from '@/mastra/tools/factorModelTools';

// 模拟fetch函数
global.fetch = vi.fn();

describe('factorModelTool', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // 模拟成功的API响应
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ticker: 'AAPL',
        factorData: {
          value: { score: 0.65 },
          momentum: { score: 0.72 },
          quality: { score: 0.80 },
          size: { marketCap: 2500000000000 },
          volatility: { score: 0.68 }
        }
      })
    });
  });

  it('应该分析股票的多因子暴露度', async () => {
    // 执行工具
    const result = await factorModelTool.execute({
      ticker: 'AAPL',
      factors: ['value', 'momentum', 'quality', 'size', 'volatility'],
      benchmark: 'SPY',
      period: '1y'
    });

    // 验证函数调用
    expect(global.fetch).toHaveBeenCalledWith(
      `https://lumosfund-api.vercel.app/api/factor-data?ticker=AAPL&benchmark=SPY&period=1y`
    );

    // 验证结果
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('ticker', 'AAPL');
    expect(result).toHaveProperty('factorExposures');
    expect(result).toHaveProperty('overallScore');
    
    // 验证返回的因子暴露度
    const { factorExposures } = result;
    expect(factorExposures).toHaveProperty('value');
    expect(factorExposures).toHaveProperty('momentum');
    expect(factorExposures).toHaveProperty('quality');
    expect(factorExposures).toHaveProperty('size');
    expect(factorExposures).toHaveProperty('volatility');
    
    // 验证每个因子都有分数和解释
    Object.values(factorExposures).forEach((factor: any) => {
      expect(factor).toHaveProperty('score');
      expect(factor).toHaveProperty('interpretation');
      
      // 验证分数在合理范围内
      if ('score' in factor && typeof factor.score === 'number') {
        expect(factor.score).toBeGreaterThanOrEqual(-1);
        expect(factor.score).toBeLessThanOrEqual(1);
      }
    });
    
    // 验证整体评分
    expect(result.overallScore).toHaveProperty('score');
    expect(result.overallScore).toHaveProperty('interpretation');
    expect(result.overallScore).toHaveProperty('investment_view');
    expect(result.overallScore.score).toBeGreaterThanOrEqual(0);
    expect(result.overallScore.score).toBeLessThanOrEqual(1);
  });

  it('应该提供不同的因子数据，取决于输入的股票代码', async () => {
    // 测试不同的股票
    const result1 = await factorModelTool.execute({
      ticker: 'AAPL',
      factors: ['value', 'momentum']
    });
    
    const result2 = await factorModelTool.execute({
      ticker: 'MSFT',
      factors: ['value', 'momentum']
    });
    
    // 验证不同股票返回不同的数据
    expect(result1.factorExposures.value.score).not.toEqual(result2.factorExposures.value.score);
    expect(result1.factorExposures.momentum.score).not.toEqual(result2.factorExposures.momentum.score);
  });

  it('应该处理API错误', async () => {
    // 模拟API错误
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404
    });
    
    // 执行工具
    const result = await factorModelTool.execute({
      ticker: 'INVALID',
      factors: ['value']
    });
    
    // 验证错误处理
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('获取因子数据失败');
  });

  it('应该处理执行过程中的异常', async () => {
    // 模拟抛出异常
    (global.fetch as any).mockRejectedValue(new Error('网络错误'));
    
    // 执行工具
    const result = await factorModelTool.execute({
      ticker: 'AAPL',
      factors: ['value']
    });
    
    // 验证异常处理
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('因子分析失败');
  });

  it('返回的整体评分应该基于加权因子分数', async () => {
    // 执行工具，只分析部分因子
    const result = await factorModelTool.execute({
      ticker: 'AAPL',
      factors: ['value', 'quality'] // 只分析价值和质量因子
    });
    
    // 验证整体评分存在
    expect(result).toHaveProperty('overallScore');
    expect(result.overallScore).toHaveProperty('score');
    expect(result.overallScore).toHaveProperty('interpretation');
    expect(result.overallScore).toHaveProperty('investment_view');
    
    // 验证投资观点格式
    expect(['强烈买入', '买入', '持有偏买入', '持有', '持有偏卖出', '卖出']).toContain(
      result.overallScore.investment_view
    );
  });
}); 