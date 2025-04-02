import { Tool } from '@mastra/core/tool';
import { createLogger } from '@/lib/logger.server';
import { z } from 'zod';

const logger = createLogger('marketDataTool');

/**
 * 市场数据工具 - 获取实时和历史市场数据
 */
export const marketDataTool = new Tool({
  name: 'marketData',
  description: '获取股票市场数据，包括价格、交易量、财务指标等',
  schema: z.object({
    symbol: z.string().describe('股票代码'),
    dataType: z.enum(['price', 'volume', 'financials', 'all']).describe('数据类型'),
    startDate: z.string().optional().describe('开始日期 (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('结束日期 (YYYY-MM-DD)'),
  }),
  async run({ symbol, dataType, startDate, endDate }) {
    try {
      logger.info('获取市场数据', { symbol, dataType, startDate, endDate });

      // 这里应该集成实际的市场数据API
      // 目前使用模拟数据进行测试
      const data = await fetchMarketData(symbol, dataType, startDate, endDate);
      
      logger.info('成功获取市场数据');
      return data;
    } catch (error) {
      logger.error('获取市场数据失败', error);
      throw error;
    }
  }
});

/**
 * 模拟获取市场数据
 * 在实际应用中，这里应该调用真实的市场数据API
 */
async function fetchMarketData(
  symbol: string,
  dataType: 'price' | 'volume' | 'financials' | 'all',
  startDate?: string,
  endDate?: string
) {
  // 生成模拟数据
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

  let basePrice = 100 + Math.random() * 50;
  const data = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // 跳过周末

    const priceChange = (Math.random() - 0.48) * basePrice * 0.03;
    const newPrice = basePrice + priceChange;

    const dataPoint: any = {
      date: date.toISOString().split('T')[0],
      price: {
        open: basePrice,
        high: Math.max(basePrice, newPrice) + Math.random() * Math.abs(priceChange) * 0.5,
        low: Math.min(basePrice, newPrice) - Math.random() * Math.abs(priceChange) * 0.5,
        close: newPrice,
        adjustedClose: newPrice * (1 + (Math.random() - 0.5) * 0.001)
      },
      volume: Math.floor(Math.random() * 1000000) + 500000
    };

    if (dataType === 'all' || dataType === 'financials') {
      dataPoint.financials = {
        pe: 15 + Math.random() * 10,
        pb: 2 + Math.random() * 3,
        ps: 3 + Math.random() * 4,
        roe: 0.15 + Math.random() * 0.1,
        roa: 0.08 + Math.random() * 0.05,
        debtToEquity: 0.5 + Math.random() * 0.5,
        currentRatio: 1.5 + Math.random() * 1,
        quickRatio: 1.2 + Math.random() * 0.8,
        grossMargin: 0.4 + Math.random() * 0.2,
        operatingMargin: 0.2 + Math.random() * 0.15,
        netMargin: 0.1 + Math.random() * 0.1
      };
    }

    data.push(dataPoint);
    basePrice = newPrice;
  }

  return {
    symbol,
    dataType,
    data
  };
} 