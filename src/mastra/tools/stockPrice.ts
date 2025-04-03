import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { marketDataService } from '@/services/marketDataService';

export const stockPriceTool = createTool({
  id: 'stockPriceTool',
  description: '获取股票的当前和历史价格数据',
  inputSchema: z.object({
    ticker: z.string().describe('股票代码'),
    startDate: z.string().optional().describe('开始日期 (YYYY-MM-DD 格式)'),
    endDate: z.string().optional().describe('结束日期 (YYYY-MM-DD 格式)'),
    interval: z.enum(['daily', 'weekly', 'monthly']).optional().describe('数据间隔'),
  }),
  execute: async ({ context }: { 
    context: { 
      ticker: string; 
      startDate?: string; 
      endDate?: string; 
      interval?: 'daily' | 'weekly' | 'monthly'; 
    } 
  }) => {
    const { ticker, startDate, endDate, interval = 'daily' } = context;
    
    try {
      // 确保市场数据服务已初始化
      await marketDataService.initialize();
      
      // 获取实时股票数据
      const stockData = await marketDataService.fetchStockData(ticker);
      
      // 获取实时股票报价
      const stockQuote = await marketDataService.fetchStockQuote(ticker);
      
      return {
        ticker,
        currentPrice: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        volume: stockData.volume,
        marketCap: stockData.marketCap,
        pe: stockData.pe,
        dividendYield: stockData.dividendYield,
        high52: stockData.high52,
        low52: stockData.low52,
        historicalData: [
          { 
            date: new Date().toISOString().split('T')[0], 
            open: stockData.open, 
            high: stockData.high, 
            low: stockData.low, 
            close: stockData.price, 
            volume: stockData.volume 
          }
        ],
        metadata: {
          currency: 'USD',
          exchange: 'NASDAQ',
          lastUpdated: stockData.timestamp,
        },
        quote: stockQuote
      };
    } catch (error: unknown) {
      console.error(`获取股票价格数据失败:`, error);
      throw new Error(`获取股票价格数据失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}); 