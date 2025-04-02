import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

export const financialMetricsTool = createTool({
  name: 'financialMetricsTool',
  description: '获取公司的财务指标和比率',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    period: z.enum(['quarterly', 'annual', 'ttm']).describe('报告周期'),
    metrics: z.array(z.string()).optional().describe('需要的指标列表'),
  }),
  execute: async ({ ticker, period, metrics }) => {
    try {
      // 实际项目中会调用金融数据API或Rust后端
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // 返回模拟财务数据
      return {
        ticker,
        period,
        metrics: {
          'return_on_equity': 0.245,
          'return_on_assets': 0.178,
          'debt_to_equity': 1.2,
          'current_ratio': 1.8,
          'quick_ratio': 1.5,
          'operating_margin': 0.21,
          'net_margin': 0.185,
          'price_to_earnings': 18.5,
          'price_to_book': 3.2,
          'price_to_sales': 1.9,
          'revenue_growth': 0.15,
          'earnings_growth': 0.12,
        },
        metadata: {
          currency: 'USD',
          fiscalYear: 2023,
          lastUpdated: new Date().toISOString(),
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch financial metrics: ${error.message}`);
    }
  }
}); 