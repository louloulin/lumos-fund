import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

// 模拟数据获取函数，实际应用中应对接真实API
async function fetchFinancialData(ticker: string, period: string) {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 生成示例数据
  const getRandomMetric = (min: number, max: number) => 
    parseFloat((Math.random() * (max - min) + min).toFixed(2));
  
  return {
    ticker,
    period,
    metrics: {
      // 盈利能力
      roe: getRandomMetric(5, 25),              // 股本回报率
      roa: getRandomMetric(2, 12),              // 资产回报率
      profitMargin: getRandomMetric(5, 30),     // 利润率
      operatingMargin: getRandomMetric(8, 35),  // 营业利润率
      
      // 估值指标
      pe: getRandomMetric(10, 40),              // 市盈率
      pb: getRandomMetric(1, 10),               // 市净率
      ps: getRandomMetric(1, 8),                // 市销率
      evToEbitda: getRandomMetric(5, 20),       // EV/EBITDA
      
      // 财务健康
      currentRatio: getRandomMetric(1, 3),      // 流动比率
      quickRatio: getRandomMetric(0.5, 2.5),    // 速动比率
      debtToEquity: getRandomMetric(0.2, 1.5),  // 债务股本比
      interestCoverage: getRandomMetric(3, 15), // 利息覆盖率
      
      // 增长指标
      revenueGrowth: getRandomMetric(-5, 40),   // 收入增长
      earningsGrowth: getRandomMetric(-10, 50), // 盈利增长
      fcfGrowth: getRandomMetric(-8, 45),       // 自由现金流增长
      
      // 股息指标
      dividendYield: getRandomMetric(0, 5),     // 股息收益率
      payoutRatio: getRandomMetric(0, 80),      // 派息比率
      
      // 效率指标
      assetTurnover: getRandomMetric(0.3, 2),   // 资产周转率
      inventoryTurnover: getRandomMetric(4, 15) // 存货周转率
    }
  };
}

export const financialMetricsTool = createTool({
  name: 'financialMetricsTool',
  description: '获取公司的财务指标和比率，包括盈利能力、估值、财务健康和增长指标等',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    period: z.enum(['quarterly', 'annual', 'ttm']).describe('报告周期：季度、年度或过去十二个月')
  }),
  execute: async ({ ticker, period }: { ticker: string; period: string }) => {
    try {
      const data = await fetchFinancialData(ticker, period);
      
      return {
        result: data,
        explanation: `成功获取 ${ticker} 的${period === 'quarterly' ? '季度' : period === 'annual' ? '年度' : '过去十二个月'}财务指标。`
      };
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      throw new Error(`获取财务指标失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}); 