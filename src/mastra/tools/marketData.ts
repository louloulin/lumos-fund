import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 数据获取函数
const fetchMarketData = async (symbol: string, dataType: string) => {
  const baseUrl = 'https://mastra-stock-data.vercel.app/api';
  
  switch (dataType) {
    case 'price':
      const priceData = await fetch(`${baseUrl}/stock-data?symbol=${symbol}`);
      return priceData.json();
    case 'fundamental':
      const fundamentalData = await fetch(`${baseUrl}/fundamental?symbol=${symbol}`);
      return fundamentalData.json();
    case 'technical':
      const technicalData = await fetch(`${baseUrl}/technical?symbol=${symbol}`);
      return technicalData.json();
    default:
      throw new Error(`Unsupported data type: ${dataType}`);
  }
};

// 技术指标计算
const calculateIndicators = (prices: number[]) => {
  // 简单移动平均线 (SMA)
  const sma = (period: number) => {
    const result = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  };

  // 相对强弱指标 (RSI)
  const rsi = (period: number = 14) => {
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.map(change => Math.max(change, 0));
    const losses = changes.map(change => Math.abs(Math.min(change, 0)));
    
    const avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
    const avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  return {
    sma5: sma(5),
    sma20: sma(20),
    sma50: sma(50),
    rsi: rsi()
  };
};

// 创建市场数据工具
export const marketDataTool = createTool({
  id: 'Market Data Tool',
  description: '获取和分析市场数据，包括价格、交易量、技术指标和基本面数据',
  inputSchema: z.object({
    symbol: z.string().describe('股票代码'),
    dataType: z.enum(['price', 'fundamental', 'technical']).describe('数据类型'),
    period: z.string().optional().describe('数据周期，如 1d, 5d, 1mo 等'),
  }),
  execute: async ({ context: { symbol, dataType, period = '1mo' } }) => {
    console.log(`Fetching ${dataType} data for ${symbol} over ${period}`);
    
    try {
      const data = await fetchMarketData(symbol, dataType);
      
      // 根据数据类型处理返回结果
      switch (dataType) {
        case 'price':
          const prices = data.prices.map((p: any) => parseFloat(p['4. close']));
          const indicators = calculateIndicators(prices);
          return {
            symbol,
            currentPrice: prices[prices.length - 1],
            priceHistory: prices,
            indicators,
            period
          };
          
        case 'fundamental':
          return {
            symbol,
            fundamentalData: data,
            period
          };
          
        case 'technical':
          return {
            symbol,
            technicalData: data,
            period
          };
          
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }
    } catch (error) {
      console.error(`Error fetching market data: ${error}`);
      throw error;
    }
  }
}); 