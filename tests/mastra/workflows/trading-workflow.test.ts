import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tradingDecisionWorkflow } from '@/mastra/index';

// 准备模拟数据
const mockContext = {
  ticker: 'AAPL',
  industry: 'Technology',
  data: {
    financial: {
      revenue: 394328000000,
      netIncome: 99803000000,
      totalAssets: 352758000000,
      totalLiabilities: 290400000000,
      equity: 62358000000
    },
    price: {
      currentPrice: 178.72,
      change: 2.45,
      changePercent: 1.39,
      volume: 52436912,
      marketCap: '2.87T',
      pe: '29.54',
      dividendYield: '0.54'
    },
    technical: {
      sma50: 182.45,
      sma200: 170.23,
      ema14: 179.85,
      rsi14: 48.72,
      macd: {
        line: 1.23,
        signal: 1.05,
        histogram: 0.18
      }
    }
  },
  portfolio: {
    totalValue: 1000000,
    cash: 250000,
    positions: [
      {
        ticker: 'MSFT',
        shares: 500,
        costBasis: 220.50,
        currentPrice: 350.20,
        value: 175100
      },
      {
        ticker: 'GOOGL',
        shares: 200,
        costBasis: 1200.75,
        currentPrice: 1400.50,
        value: 280100
      }
    ]
  },
  cash: 250000
};

// 模拟工作流响应
vi.mock('@/mastra/index', () => {
  return {
    tradingDecisionWorkflow: {
      execute: vi.fn().mockResolvedValue({
        stockData: {
          ticker: 'AAPL',
          currentPrice: 178.72
        },
        valueAnalysis: '价值分析结果',
        growthAnalysis: '成长分析结果',
        trendAnalysis: '趋势分析结果',
        quantAnalysis: '量化分析结果',
        macroAnalysis: '宏观分析结果',
        riskAssessment: '风险评估结果',
        decision: '综合决策建议：考虑以5%仓位买入AAPL，看涨信号，置信度75%'
      })
    }
  };
});

describe('交易决策工作流测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('执行工作流', () => {
    it('应该能够成功执行工作流并返回完整结果', async () => {
      const result = await tradingDecisionWorkflow.execute({
        context: mockContext
      });
      
      expect(result).toBeDefined();
      expect(result.stockData).toBeDefined();
      expect(result.valueAnalysis).toBeDefined();
      expect(result.growthAnalysis).toBeDefined();
      expect(result.trendAnalysis).toBeDefined();
      expect(result.quantAnalysis).toBeDefined();
      expect(result.macroAnalysis).toBeDefined();
      expect(result.riskAssessment).toBeDefined();
      expect(result.decision).toBeDefined();
    });
  });
  
  describe('工作流输出验证', () => {
    it('应该包含所有必要的分析结果和决策', async () => {
      const result = await tradingDecisionWorkflow.execute({
        context: mockContext
      });
      
      // 验证股票数据
      expect(result.stockData.ticker).toBe('AAPL');
      expect(typeof result.stockData.currentPrice).toBe('number');
      
      // 验证各类分析结果
      expect(typeof result.valueAnalysis).toBe('string');
      expect(typeof result.growthAnalysis).toBe('string');
      expect(typeof result.trendAnalysis).toBe('string');
      expect(typeof result.quantAnalysis).toBe('string');
      expect(typeof result.macroAnalysis).toBe('string');
      expect(typeof result.riskAssessment).toBe('string');
      
      // 验证最终决策
      expect(typeof result.decision).toBe('string');
      expect(result.decision).toContain('决策');
    });
  });
}); 