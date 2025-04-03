import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { quantInvestingAgent, analyzeWithQuantInvestingAgent } from './quantInvestingAgent';

// 模拟工具依赖
jest.mock('../tools/marketDataTools', () => ({
  historicalPriceTool: {
    execute: jest.fn().mockResolvedValue({
      historicalPrices: [
        { date: '2023-01-01', close: 150, volume: 1000000 },
        { date: '2023-01-02', close: 152, volume: 1200000 },
        { date: '2023-01-03', close: 151, volume: 900000 },
      ]
    })
  }
}));

jest.mock('../tools/financialDataTools', () => ({
  financialMetricsTool: {
    execute: jest.fn().mockResolvedValue({
      metrics: {
        pe: 20.5,
        eps: 5.2,
        roe: 0.18,
        currentRatio: 1.5,
        debtToEquity: 0.8
      }
    })
  },
  financialHistoryTool: {
    execute: jest.fn().mockResolvedValue({
      history: [
        { period: '2022-Q4', revenue: 100000, netIncome: 20000 },
        { period: '2022-Q3', revenue: 95000, netIncome: 18000 },
        { period: '2022-Q2', revenue: 90000, netIncome: 17000 },
      ]
    })
  }
}));

jest.mock('../tools/technicalIndicatorTools', () => ({
  technicalIndicatorsTool: {
    execute: jest.fn().mockResolvedValue({
      indicators: {
        rsi: { value: 65, signal: 'neutral' },
        macd: { value: 2.1, signal: 'bullish' },
        bollinger: { upper: 160, middle: 151, lower: 142, signal: 'neutral' },
        atr: { value: 3.2 },
        obv: { value: 12500000, signal: 'bullish' }
      }
    })
  }
}));

jest.mock('../tools/factorModelTools', () => ({
  factorModelTool: {
    execute: jest.fn().mockResolvedValue({
      factorExposures: {
        value: 0.8,
        momentum: 1.2,
        quality: 0.9,
        size: -0.2,
        volatility: -0.3
      }
    })
  }
}));

jest.mock('../tools/statisticalArbitrageTools', () => ({
  statisticalArbitrageTool: {
    execute: jest.fn().mockResolvedValue({
      opportunities: [
        {
          pairStock: 'PEER1',
          correlation: 0.85,
          zScore: 1.2,
          signal: 'buy_target_sell_pair',
          confidence: 0.75
        }
      ]
    })
  }
}));

// 模拟代理的generate方法
jest.mock('@mastra/core/agent', () => {
  return {
    Agent: jest.fn().mockImplementation(() => {
      return {
        generate: jest.fn().mockResolvedValue({
          text: `
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
          `
        })
      };
    })
  };
});

describe('Quantitative Investing Agent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeWithQuantInvestingAgent', () => {
    test('应正确分析股票并返回结果 - 默认参数', async () => {
      const result = await analyzeWithQuantInvestingAgent('AAPL');
      
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      
      // 验证默认参数
      expect(result.data).toHaveProperty('timeframe', 'medium');
      expect(result.data).toHaveProperty('riskTolerance', 'medium');
    });

    test('应正确使用自定义参数分析股票', async () => {
      const result = await analyzeWithQuantInvestingAgent('TSLA', {
        timeframe: 'short',
        riskTolerance: 'high',
        peerStocks: ['RIVN', 'NIO']
      });
      
      expect(result).toHaveProperty('ticker', 'TSLA');
      expect(result.data).toHaveProperty('timeframe', 'short');
      expect(result.data).toHaveProperty('riskTolerance', 'high');
      expect(result.data).toHaveProperty('peerStocks');
      expect(result.data.peerStocks).toContain('RIVN');
      expect(result.data.peerStocks).toContain('NIO');
    });

    test('应在发生错误时正确处理异常', async () => {
      // 模拟historicalPriceTool执行失败
      const mockedHistoricalPriceTool = require('../tools/marketDataTools').historicalPriceTool;
      mockedHistoricalPriceTool.execute.mockRejectedValueOnce(new Error('API错误'));

      await expect(analyzeWithQuantInvestingAgent('ERROR')).rejects.toThrow('量化分析失败');
    });
  });

  describe('量化投资代理输入验证', () => {
    test('应处理不同的时间框架选项', async () => {
      await analyzeWithQuantInvestingAgent('AAPL', { timeframe: 'long' });
      
      const mockedHistoricalPriceTool = require('../tools/marketDataTools').historicalPriceTool;
      
      // 验证长期时间框架使用365天数据
      expect(mockedHistoricalPriceTool.execute).toHaveBeenCalledWith(
        expect.objectContaining({ days: 365 })
      );
    });

    test('应调用所有必要的工具来收集分析数据', async () => {
      await analyzeWithQuantInvestingAgent('AAPL');
      
      const historicalPriceTool = require('../tools/marketDataTools').historicalPriceTool;
      const financialMetricsTool = require('../tools/financialDataTools').financialMetricsTool;
      const technicalIndicatorsTool = require('../tools/technicalIndicatorTools').technicalIndicatorsTool;
      const factorModelTool = require('../tools/factorModelTools').factorModelTool;
      
      expect(historicalPriceTool.execute).toHaveBeenCalled();
      expect(financialMetricsTool.execute).toHaveBeenCalled();
      expect(technicalIndicatorsTool.execute).toHaveBeenCalled();
      expect(factorModelTool.execute).toHaveBeenCalled();
    });
    
    test('仅在提供同行业股票时调用统计套利工具', async () => {
      // 不提供同行业股票
      await analyzeWithQuantInvestingAgent('AAPL');
      
      const statisticalArbitrageTool = require('../tools/statisticalArbitrageTools').statisticalArbitrageTool;
      expect(statisticalArbitrageTool.execute).not.toHaveBeenCalled();
      
      // 提供同行业股票
      await analyzeWithQuantInvestingAgent('AAPL', { peerStocks: ['MSFT', 'GOOG'] });
      expect(statisticalArbitrageTool.execute).toHaveBeenCalled();
    });
  });
}); 