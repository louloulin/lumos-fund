import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('marketDataTools');

// 定义API返回数据类型
interface StockPriceData {
  '1. open': string;
  '2. high': string;
  '3. low': string;
  '4. close': string;
  '5. trading date': string;
  '6. change': string;
  '7. change percent': string;
}

interface VolumeData {
  volume: string;
  averageVolume: string;
  volumeRatio: string;
  date: string;
}

interface HistoricalPriceData {
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

/**
 * 获取股票价格数据
 * @param symbol 股票代码
 * @returns 股票价格数据
 */
const getStockPrice = async (symbol: string): Promise<StockPriceData> => {
  try {
    // 调用外部API获取股票价格数据
    const response = await fetch(
      `https://mastra-stock-data.vercel.app/api/stock-data?symbol=${symbol}`,
      { next: { revalidate: 300 } } // 5分钟缓存
    );
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data.prices;
  } catch (error: any) {
    logger.error('获取股票价格失败', { symbol, error });
    throw new Error(`获取股票价格失败: ${error.message}`);
  }
};

/**
 * 获取成交量数据
 * @param symbol 股票代码
 * @returns 成交量数据
 */
const getVolumeData = async (symbol: string): Promise<VolumeData> => {
  try {
    // 调用外部API获取成交量数据
    const response = await fetch(
      `https://mastra-stock-data.vercel.app/api/volume-data?symbol=${symbol}`,
      { next: { revalidate: 300 } } // 5分钟缓存
    );
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data.volume;
  } catch (error: any) {
    logger.error('获取成交量数据失败', { symbol, error });
    throw new Error(`获取成交量数据失败: ${error.message}`);
  }
};

/**
 * 获取历史价格数据
 * @param symbol 股票代码
 * @param days 获取天数
 * @returns 历史价格数据
 */
const getHistoricalData = async (symbol: string, days: number = 30): Promise<HistoricalPriceData[]> => {
  try {
    // 调用外部API获取历史价格数据
    const response = await fetch(
      `https://mastra-stock-data.vercel.app/api/historical-data?symbol=${symbol}&days=${days}`,
      { next: { revalidate: 1800 } } // 30分钟缓存
    );
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data.historicalPrices;
  } catch (error: any) {
    logger.error('获取历史数据失败', { symbol, days, error });
    throw new Error(`获取历史数据失败: ${error.message}`);
  }
};

/**
 * 股票价格工具
 * 获取股票当前价格和基本交易信息
 */
export const stockPriceTool = createTool({
  id: 'stockPriceTool',
  description: '获取股票当前价格和基本交易信息',
  schema: z.object({
    symbol: z.string().describe('股票代码')
  }),
  execute: async ({ symbol }: { symbol: string }) => {
    logger.info('获取股票价格数据', { symbol });
    
    try {
      const priceData = await getStockPrice(symbol);
      
      return {
        symbol,
        currentPrice: parseFloat(priceData['4. close']),
        openPrice: parseFloat(priceData['1. open']),
        highPrice: parseFloat(priceData['2. high']),
        lowPrice: parseFloat(priceData['3. low']),
        tradingDate: priceData['5. trading date'],
        change: parseFloat(priceData['6. change']),
        changePercent: parseFloat(priceData['7. change percent'].replace('%', '')) / 100,
        success: true
      };
    } catch (error: any) {
      logger.error('股票价格工具执行失败', { symbol, error });
      return {
        symbol,
        success: false,
        error: error.message
      };
    }
  }
});

/**
 * 成交量工具
 * 获取股票成交量数据
 */
export const volumeTool = createTool({
  id: 'volumeTool',
  description: '获取股票成交量数据',
  schema: z.object({
    symbol: z.string().describe('股票代码')
  }),
  execute: async ({ symbol }: { symbol: string }) => {
    logger.info('获取股票成交量数据', { symbol });
    
    try {
      const volumeData = await getVolumeData(symbol);
      
      return {
        symbol,
        volume: parseInt(volumeData.volume),
        averageVolume: parseInt(volumeData.averageVolume),
        volumeRatio: parseFloat(volumeData.volumeRatio),
        date: volumeData.date,
        success: true
      };
    } catch (error: any) {
      logger.error('成交量工具执行失败', { symbol, error });
      return {
        symbol,
        success: false,
        error: error.message
      };
    }
  }
});

/**
 * 历史价格工具
 * 获取股票历史价格数据，用于技术分析
 */
export const historicalPriceTool = createTool({
  id: 'historicalPriceTool',
  description: '获取股票历史价格数据，用于技术分析',
  schema: z.object({
    symbol: z.string().describe('股票代码'),
    days: z.number().min(1).max(365).optional().describe('获取天数(1-365)，默认30天')
  }),
  execute: async ({ symbol, days = 30 }: { symbol: string; days?: number }) => {
    logger.info('获取股票历史价格数据', { symbol, days });
    
    try {
      const historicalData = await getHistoricalData(symbol, days);
      
      return {
        symbol,
        days,
        historicalPrices: historicalData.map((day: HistoricalPriceData) => ({
          date: day.date,
          close: parseFloat(day.close),
          open: parseFloat(day.open),
          high: parseFloat(day.high),
          low: parseFloat(day.low),
          volume: parseInt(day.volume)
        })),
        success: true
      };
    } catch (error: any) {
      logger.error('历史价格工具执行失败', { symbol, days, error });
      return {
        symbol,
        days,
        success: false,
        error: error.message
      };
    }
  }
}); 