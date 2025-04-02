import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

// 模拟数据
interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockPriceResult {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: number;
  yearHigh: number;
  yearLow: number;
  avgVolume: number;
  pe: number;
  dividend: number;
  historical?: PriceData[];
}

// 模拟获取股票价格数据
async function fetchStockPrice(ticker: string, days?: number): Promise<StockPriceResult> {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 模拟当前价格 (50-500之间)
  const currentPrice = parseFloat((Math.random() * 450 + 50).toFixed(2));
  
  // 模拟涨跌幅 (-5%至+5%之间)
  const changePercent = parseFloat((Math.random() * 10 - 5).toFixed(2));
  const change = parseFloat((currentPrice * changePercent / 100).toFixed(2));
  
  // 模拟市值 (10亿-1万亿之间)
  const marketCap = parseFloat((Math.random() * 990 + 10).toFixed(2)) * 1e9;
  
  // 模拟52周高低点
  const yearHigh = parseFloat((currentPrice * (1 + Math.random() * 0.3)).toFixed(2));
  const yearLow = parseFloat((currentPrice * (1 - Math.random() * 0.3)).toFixed(2));
  
  // 模拟平均交易量
  const avgVolume = Math.floor(Math.random() * 10000000) + 500000;
  
  // 模拟PE和股息
  const pe = parseFloat((Math.random() * 40 + 10).toFixed(2));
  const dividend = parseFloat((Math.random() * 3).toFixed(2));
  
  // 生成公司名称
  const companies = {
    'AAPL': '苹果公司',
    'MSFT': '微软',
    'GOOGL': 'Alphabet A',
    'AMZN': '亚马逊',
    'META': 'Meta平台',
    'TSLA': '特斯拉',
    'NVDA': '英伟达',
    'JPM': '摩根大通',
    'V': 'Visa',
    'JNJ': '强生'
  };
  
  const name = (ticker in companies) ? companies[ticker as keyof typeof companies] : `${ticker} Inc.`;
  
  // 如果请求历史数据，则生成
  const historical: PriceData[] = [];
  if (days) {
    const daysToGenerate = Math.min(days, 365); // 最多一年数据
    const today = new Date();
    
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const basePrice = currentPrice * (1 - i / 365 * 0.2); // 假设有一定趋势
      const dayVolatility = 0.02; // 日波动率
      
      const dayOpen = parseFloat((basePrice * (1 + (Math.random() - 0.5) * dayVolatility)).toFixed(2));
      const dayHigh = parseFloat((dayOpen * (1 + Math.random() * dayVolatility)).toFixed(2));
      const dayLow = parseFloat((dayOpen * (1 - Math.random() * dayVolatility)).toFixed(2));
      const dayClose = parseFloat((dayLow + Math.random() * (dayHigh - dayLow)).toFixed(2));
      const dayVolume = Math.floor(avgVolume * (0.7 + Math.random() * 0.6));
      
      historical.push({
        date: date.toISOString().split('T')[0],
        open: dayOpen,
        high: dayHigh,
        low: dayLow,
        close: dayClose,
        volume: dayVolume
      });
    }
  }
  
  return {
    ticker,
    name,
    currentPrice,
    change,
    changePercent,
    marketCap,
    yearHigh,
    yearLow,
    avgVolume,
    pe,
    dividend,
    ...(days ? { historical } : {})
  };
}

export const stockPriceTool = createTool({
  name: 'stockPriceTool',
  description: '获取股票价格信息，包括当前价格、涨跌幅、市值和历史价格数据',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    days: z.number().optional().describe('需要的历史数据天数，不填则只返回当前价格')
  }),
  execute: async ({ ticker, days }: { ticker: string; days?: number }) => {
    try {
      const data = await fetchStockPrice(ticker, days);
      
      return {
        result: data,
        explanation: `成功获取 ${ticker} (${data.name}) 的价格数据。当前价格: $${data.currentPrice}, 涨跌: ${data.change > 0 ? '+' : ''}${data.change} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%)`
      };
    } catch (error) {
      console.error('Error fetching stock price:', error);
      throw new Error(`获取股票价格失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}); 