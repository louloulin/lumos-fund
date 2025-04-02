import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

export const technicalIndicatorsTool = createTool({
  name: 'technicalIndicatorsTool',
  description: '计算并返回股票的技术指标',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    indicators: z.array(z.string()).optional().describe('需要计算的指标列表，例如 ["RSI", "MACD", "SMA"]'),
    period: z.number().optional().describe('计算指标的周期，默认为14天'),
  }),
  execute: async ({ ticker, indicators = ["RSI", "MACD", "SMA", "EMA"], period = 14 }) => {
    try {
      // 实际项目中会基于历史价格数据计算技术指标
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 550));
      
      // 返回模拟技术指标数据
      return {
        ticker,
        period,
        indicators: {
          RSI: 62.5, // 相对强弱指数
          MACD: {
            value: 2.35,
            signal: 1.92,
            histogram: 0.43
          },
          SMA: { // 简单移动平均线
            '20': 181.25,
            '50': 175.83,
            '200': 162.47
          },
          EMA: { // 指数移动平均线
            '12': 182.95,
            '26': 178.56
          },
          BollingerBands: {
            upper: 192.37,
            middle: 181.25,
            lower: 170.13
          },
          ATR: 3.25, // 平均真实范围
        },
        trends: {
          short: 'bullish',
          medium: 'bullish',
          long: 'bullish'
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
        }
      };
    } catch (error) {
      throw new Error(`Failed to calculate technical indicators: ${error.message}`);
    }
  }
}); 