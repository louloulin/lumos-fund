import { z } from "zod";
import { generateHistoricalPrices, generateFinancialMetrics } from "@/lib/mocks";

// 创建工具函数模拟
type ToolOptions<T extends z.ZodType> = {
  name: string;
  description: string;
  schema: T;
  execute: (input: z.infer<T>) => Promise<any>;
};

function createTool<T extends z.ZodType>(options: ToolOptions<T>) {
  return options;
}

/**
 * 股票价格查询工具
 * 允许AI代理获取股票的历史价格数据
 */
export const stockPriceTool = createTool({
  name: "stockPriceTool",
  description: "获取股票的历史价格数据",
  schema: z.object({
    ticker: z.string().describe("股票代码，例如AAPL"),
    startDate: z.string().describe("开始日期，格式为YYYY-MM-DD"),
    endDate: z.string().describe("结束日期，格式为YYYY-MM-DD"),
  }),
  execute: async (input) => {
    const { ticker, startDate, endDate } = input;
    try {
      console.log(`获取${ticker}从${startDate}到${endDate}的历史价格数据`);
      
      // 使用模拟数据生成器获取价格数据
      const priceData = generateHistoricalPrices(ticker, startDate, endDate);
      
      if (priceData.length === 0) {
        return {
          success: false,
          error: "未找到历史价格数据"
        };
      }
      
      return {
        success: true,
        data: {
          ticker,
          timeframe: `${startDate} 至 ${endDate}`,
          priceData,
          latestPrice: priceData[priceData.length - 1].close,
          percentChange: calculatePercentChange(priceData)
        }
      };
    } catch (error) {
      console.error(`获取股票价格数据失败:`, error);
      return {
        success: false,
        error: "获取股票价格数据失败"
      };
    }
  }
});

/**
 * 财务指标查询工具
 * 允许AI代理获取股票的财务指标数据
 */
export const financialMetricsTool = createTool({
  name: "financialMetricsTool",
  description: "获取股票的财务指标数据",
  schema: z.object({
    ticker: z.string().describe("股票代码，例如AAPL"),
  }),
  execute: async (input) => {
    const { ticker } = input;
    try {
      console.log(`获取${ticker}的财务指标数据`);
      
      // 使用模拟数据生成器获取财务指标
      const financialData = generateFinancialMetrics(ticker);
      
      return {
        success: true,
        data: {
          ticker,
          metrics: financialData,
          summary: generateMetricsSummary(financialData)
        }
      };
    } catch (error) {
      console.error(`获取财务指标数据失败:`, error);
      return {
        success: false,
        error: "获取财务指标数据失败"
      };
    }
  }
});

/**
 * 计算百分比变化
 */
function calculatePercentChange(priceData: any[]): number {
  if (priceData.length < 2) return 0;
  
  const firstPrice = priceData[0].close;
  const lastPrice = priceData[priceData.length - 1].close;
  
  return ((lastPrice - firstPrice) / firstPrice) * 100;
}

/**
 * 生成财务指标摘要描述
 */
function generateMetricsSummary(metrics: any): string {
  const summaries = [];
  
  // PE比率评估
  if (metrics.pe_ratio < 15) {
    summaries.push(`PE比率为${metrics.pe_ratio.toFixed(2)}，低于市场平均水平，可能被低估。`);
  } else if (metrics.pe_ratio > 25) {
    summaries.push(`PE比率为${metrics.pe_ratio.toFixed(2)}，高于市场平均水平，估值偏高。`);
  } else {
    summaries.push(`PE比率为${metrics.pe_ratio.toFixed(2)}，处于合理范围。`);
  }
  
  // PB比率评估
  if (metrics.pb_ratio < 1.5) {
    summaries.push(`PB比率为${metrics.pb_ratio.toFixed(2)}，低于市场平均水平，可能存在投资价值。`);
  } else if (metrics.pb_ratio > 3) {
    summaries.push(`PB比率为${metrics.pb_ratio.toFixed(2)}，高于市场平均水平。`);
  } else {
    summaries.push(`PB比率为${metrics.pb_ratio.toFixed(2)}，处于中等水平。`);
  }
  
  // 利润率评估
  if (metrics.profit_margin > 0.15) {
    summaries.push(`利润率为${(metrics.profit_margin * 100).toFixed(2)}%，盈利能力强。`);
  } else if (metrics.profit_margin < 0.05) {
    summaries.push(`利润率为${(metrics.profit_margin * 100).toFixed(2)}%，盈利能力较弱。`);
  } else {
    summaries.push(`利润率为${(metrics.profit_margin * 100).toFixed(2)}%，处于行业平均水平。`);
  }
  
  // 市值评估
  const marketCapInBillions = metrics.market_cap / 1e9;
  if (marketCapInBillions > 100) {
    summaries.push(`市值为${marketCapInBillions.toFixed(2)}十亿，属于大型公司。`);
  } else if (marketCapInBillions > 10) {
    summaries.push(`市值为${marketCapInBillions.toFixed(2)}十亿，属于中型公司。`);
  } else {
    summaries.push(`市值为${marketCapInBillions.toFixed(2)}十亿，属于小型公司。`);
  }
  
  return summaries.join(' ');
} 