import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('financialDataTools');

// 定义API返回数据类型
interface FinancialMetricsData {
  ticker: string;
  period: string;
  metrics: {
    // 盈利能力
    grossMargin?: number;          // 毛利率
    operatingMargin?: number;      // 营业利润率
    netProfitMargin?: number;      // 净利润率
    returnOnEquity?: number;       // 股本回报率
    returnOnAssets?: number;       // 资产回报率
    returnOnInvestedCapital?: number; // 投入资本回报率
    
    // 增长指标
    revenueGrowth?: number;        // 营收增长率
    earningsGrowth?: number;       // 盈利增长率
    dividendGrowth?: number;       // 股息增长率
    
    // 估值指标
    priceToEarnings?: number;      // 市盈率
    priceToSales?: number;         // 市销率
    priceToBook?: number;          // 市净率
    enterpriseValueToEbitda?: number; // EV/EBITDA
    priceToCashFlow?: number;      // 市现率
    pegRatio?: number;             // PEG比率
    
    // 流动性指标
    currentRatio?: number;         // 流动比率
    quickRatio?: number;           // 速动比率
    cashRatio?: number;            // 现金比率
    
    // 偿债能力
    debtToEquity?: number;         // 债务权益比
    debtToAssets?: number;         // 债务资产比
    interestCoverage?: number;     // 利息覆盖率
    
    // 效率指标
    assetTurnover?: number;        // 资产周转率
    inventoryTurnover?: number;    // 存货周转率
    receivablesTurnover?: number;  // 应收账款周转率
    
    // 现金流指标
    operatingCashFlowToSales?: number; // 营业现金流/销售额
    freeCashFlowYield?: number;    // 自由现金流收益率
    cashConversionCycle?: number;  // 现金转换周期
  };
}

interface IncomeStatementData {
  ticker: string;
  currency: string;
  period: string;
  data: {
    revenue: number;               // 营业收入
    costOfRevenue: number;         // 营业成本
    grossProfit: number;           // 毛利润
    operatingExpenses: number;     // 营业费用
    operatingIncome: number;       // 营业利润
    netIncome: number;             // 净利润
    eps: number;                   // 每股收益
    sharesOutstanding: number;     // 流通股数
  };
}

interface BalanceSheetData {
  ticker: string;
  currency: string;
  period: string;
  data: {
    totalAssets: number;           // 总资产
    totalLiabilities: number;      // 总负债
    totalEquity: number;           // 股东权益
    cashAndEquivalents: number;    // 现金及等价物
    shortTermInvestments: number;  // 短期投资
    inventory: number;             // 存货
    accountsReceivable: number;    // 应收账款
    propertyPlantEquipment: number; // 固定资产
    longTermDebt: number;          // 长期债务
    shortTermDebt: number;         // 短期债务
  };
}

interface CashFlowData {
  ticker: string;
  currency: string;
  period: string;
  data: {
    operatingCashFlow: number;     // 经营活动现金流
    capitalExpenditures: number;   // 资本支出
    freeCashFlow: number;          // 自由现金流
    dividendsPaid: number;         // 已付股息
    netBorrowings: number;         // 借款净额
    cashFromFinancing: number;     // 融资活动现金流
    cashFromInvesting: number;     // 投资活动现金流
  };
}

interface FinancialHistoryData {
  ticker: string;
  years: Array<{
    year: string;
    revenue: number;
    netIncome: number;
    operatingCashFlow: number;
    grossMargin: number;
    netMargin: number;
    roe: number;
  }>;
}

/**
 * 获取公司财务指标
 * @param ticker 股票代码
 * @param period 报告期间 (quarterly, annual, ttm)
 * @returns 财务指标数据
 */
const getFinancialMetrics = async (ticker: string, period: string = 'ttm'): Promise<FinancialMetricsData> => {
  try {
    // 调用外部API获取财务指标数据
    const response = await fetch(
      `https://lumosfund-api.vercel.app/api/financial-metrics?ticker=${ticker}&period=${period}`,
      { next: { revalidate: 86400 } } // 24小时缓存
    );
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.error('获取财务指标失败', { ticker, period, error });
    throw new Error(`获取财务指标失败: ${error.message}`);
  }
};

/**
 * 获取公司利润表
 * @param ticker 股票代码
 * @param period 报告期间 (quarterly, annual)
 * @returns 利润表数据
 */
const getIncomeStatement = async (ticker: string, period: string = 'annual'): Promise<IncomeStatementData> => {
  try {
    // 调用外部API获取利润表数据
    const response = await fetch(
      `https://lumosfund-api.vercel.app/api/income-statement?ticker=${ticker}&period=${period}`,
      { next: { revalidate: 86400 } } // 24小时缓存
    );
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.error('获取利润表失败', { ticker, period, error });
    throw new Error(`获取利润表失败: ${error.message}`);
  }
};

/**
 * 获取公司资产负债表
 * @param ticker 股票代码
 * @param period 报告期间 (quarterly, annual)
 * @returns 资产负债表数据
 */
const getBalanceSheet = async (ticker: string, period: string = 'annual'): Promise<BalanceSheetData> => {
  try {
    // 调用外部API获取资产负债表数据
    const response = await fetch(
      `https://lumosfund-api.vercel.app/api/balance-sheet?ticker=${ticker}&period=${period}`,
      { next: { revalidate: 86400 } } // 24小时缓存
    );
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.error('获取资产负债表失败', { ticker, period, error });
    throw new Error(`获取资产负债表失败: ${error.message}`);
  }
};

/**
 * 获取公司现金流量表
 * @param ticker 股票代码
 * @param period 报告期间 (quarterly, annual)
 * @returns 现金流量表数据
 */
const getCashFlowStatement = async (ticker: string, period: string = 'annual'): Promise<CashFlowData> => {
  try {
    // 调用外部API获取现金流量表数据
    const response = await fetch(
      `https://lumosfund-api.vercel.app/api/cash-flow?ticker=${ticker}&period=${period}`,
      { next: { revalidate: 86400 } } // 24小时缓存
    );
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.error('获取现金流量表失败', { ticker, period, error });
    throw new Error(`获取现金流量表失败: ${error.message}`);
  }
};

/**
 * 获取公司财务历史数据
 * @param ticker 股票代码
 * @param years 获取年数
 * @returns 财务历史数据
 */
const getFinancialHistory = async (ticker: string, years: number = 5): Promise<FinancialHistoryData> => {
  try {
    // 调用外部API获取财务历史数据
    const response = await fetch(
      `https://lumosfund-api.vercel.app/api/financial-history?ticker=${ticker}&years=${years}`,
      { next: { revalidate: 86400 } } // 24小时缓存
    );
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.error('获取财务历史数据失败', { ticker, years, error });
    throw new Error(`获取财务历史数据失败: ${error.message}`);
  }
};

/**
 * 财务指标工具
 * 获取公司关键财务指标，用于基本面分析
 */
export const financialMetricsTool = createTool({
  id: 'financialMetricsTool',
  description: '获取公司关键财务指标，用于基本面分析',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    period: z.enum(['quarterly', 'annual', 'ttm']).optional().describe('报告期间 (quarterly, annual, ttm)')
  }),
  execute: async ({ ticker, period = 'ttm' }: { ticker: string; period?: 'quarterly' | 'annual' | 'ttm' }) => {
    logger.info('获取财务指标数据', { ticker, period });
    
    try {
      const metricsData = await getFinancialMetrics(ticker, period);
      
      return {
        ticker,
        period,
        metrics: metricsData.metrics,
        success: true
      };
    } catch (error: any) {
      logger.error('财务指标工具执行失败', { ticker, period, error });
      return {
        ticker,
        period,
        success: false,
        error: error.message
      };
    }
  }
});

/**
 * 财务报表工具
 * 获取公司完整财务报表（利润表、资产负债表、现金流量表）
 */
export const financialStatementsTool = createTool({
  id: 'financialStatementsTool',
  description: '获取公司完整财务报表（利润表、资产负债表、现金流量表）',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    period: z.enum(['quarterly', 'annual']).optional().describe('报告期间 (quarterly, annual)')
  }),
  execute: async ({ ticker, period = 'annual' }: { ticker: string; period?: 'quarterly' | 'annual' }) => {
    logger.info('获取财务报表数据', { ticker, period });
    
    try {
      // 并行获取三张财务报表
      const [incomeStatement, balanceSheet, cashFlow] = await Promise.all([
        getIncomeStatement(ticker, period),
        getBalanceSheet(ticker, period),
        getCashFlowStatement(ticker, period)
      ]);
      
      return {
        ticker,
        period,
        currency: incomeStatement.currency,
        incomeStatement: incomeStatement.data,
        balanceSheet: balanceSheet.data,
        cashFlow: cashFlow.data,
        success: true
      };
    } catch (error: any) {
      logger.error('财务报表工具执行失败', { ticker, period, error });
      return {
        ticker,
        period,
        success: false,
        error: error.message
      };
    }
  }
});

/**
 * 财务历史数据工具
 * 获取公司多年财务数据，用于分析趋势和一致性
 */
export const financialHistoryTool = createTool({
  id: 'financialHistoryTool',
  description: '获取公司多年财务数据，用于分析趋势和一致性',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    years: z.number().min(1).max(10).optional().describe('获取年数(1-10)，默认5年')
  }),
  execute: async ({ ticker, years = 5 }: { ticker: string; years?: number }) => {
    logger.info('获取财务历史数据', { ticker, years });
    
    try {
      const historyData = await getFinancialHistory(ticker, years);
      
      return {
        ticker,
        years,
        financialHistory: historyData.years,
        success: true
      };
    } catch (error: any) {
      logger.error('财务历史数据工具执行失败', { ticker, years, error });
      return {
        ticker,
        years,
        success: false,
        error: error.message
      };
    }
  }
}); 