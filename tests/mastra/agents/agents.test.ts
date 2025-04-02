import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  valueInvestingAgent, 
  growthInvestingAgent, 
  trendInvestingAgent, 
  quantInvestingAgent, 
  macroAnalysisAgent 
} from '@/mastra/index';

// 准备模拟数据
const mockStockData = {
  ticker: 'AAPL',
  currentPrice: 178.72,
  change: 2.45,
  changePercent: 1.39,
  volume: 52436912,
  marketCap: '2.87T',
  pe: '29.54',
  dividendYield: '0.54',
  high52: 199.62,
  low52: 143.90,
};

// 模拟代理响应函数
vi.mock('@mastra/core/agent', () => {
  return {
    Agent: vi.fn().mockImplementation(() => {
      return {
        generate: vi.fn().mockResolvedValue({
          text: '模拟AI代理响应',
          raw: {}
        })
      };
    })
  };
});

describe('Mastra AI代理测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('价值投资代理', () => {
    it('应该能够分析股票并提供价值投资观点', async () => {
      const prompt = `分析 AAPL 的价值投资潜力，基于以下数据：${JSON.stringify(mockStockData)}`;
      
      const result = await valueInvestingAgent.generate(prompt);
      
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
    });
  });
  
  describe('成长投资代理', () => {
    it('应该能够分析股票并提供成长投资观点', async () => {
      const prompt = `分析 AAPL 的成长投资潜力，基于以下数据：${JSON.stringify(mockStockData)}`;
      
      const result = await growthInvestingAgent.generate(prompt);
      
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
    });
  });
  
  describe('趋势投资代理', () => {
    it('应该能够分析股票并提供趋势投资观点', async () => {
      const prompt = `分析 AAPL 的技术趋势，基于以下数据：${JSON.stringify(mockStockData)}`;
      
      const result = await trendInvestingAgent.generate(prompt);
      
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
    });
  });
  
  describe('量化投资代理', () => {
    it('应该能够分析股票并提供量化投资观点', async () => {
      const prompt = `分析 AAPL 的量化因子表现，基于以下数据：${JSON.stringify(mockStockData)}`;
      
      const result = await quantInvestingAgent.generate(prompt);
      
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
    });
  });
  
  describe('宏观分析代理', () => {
    it('应该能够分析宏观经济环境对股票的影响', async () => {
      const prompt = `分析当前宏观经济环境对 AAPL 所在行业的影响`;
      
      const result = await macroAnalysisAgent.generate(prompt);
      
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
    });
  });
}); 