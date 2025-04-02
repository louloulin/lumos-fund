import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

export const stockPriceTool = createTool({
  name: 'stockPriceTool',
  description: '获取股票的当前和历史价格数据',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    startDate: z.string().optional().describe('开始日期 (YYYY-MM-DD 格式)'),
    endDate: z.string().optional().describe('结束日期 (YYYY-MM-DD 格式)'),
    interval: z.enum(['daily', 'weekly', 'monthly']).optional().describe('数据间隔'),
  }),
  execute: async ({ ticker, startDate, endDate, interval = 'daily' }) => {
    try {
      // 实际项目中会调用API或Rust后端
      // 这里使用模拟数据
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 返回模拟数据
      return {
        ticker,
        currentPrice: 185.92,
        historicalData: [
          { date: '2023-12-01', open: 184.20, high: 186.84, low: 183.57, close: 185.92, volume: 58324156 },
          { date: '2023-11-30', open: 182.96, high: 184.12, low: 182.04, close: 183.92, volume: 54892345 },
          { date: '2023-11-29', open: 181.54, high: 183.87, low: 181.33, close: 182.96, volume: 51234789 },
          // 更多历史数据...
        ],
        metadata: {
          currency: 'USD',
          exchange: 'NASDAQ',
          lastUpdated: new Date().toISOString(),
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch stock price data: ${error.message}`);
    }
  }
}); 