import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import { createQwen } from 'qwen-ai-provider';

// 初始化Qwen
const qwen = createQwen({
  apiKey: process.env.QWEN_API_KEY || "sk-bc977c4e31e542f1a34159cb42478198",
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

// 导入相关工具
import { historicalPriceTool } from '../tools/marketDataTools';
import { financialMetricsTool, financialHistoryTool } from '../tools/financialDataTools';
import { technicalIndicatorsTool } from '../tools/technicalIndicatorTools';
import { factorModelTool } from '../tools/factorModelTools';
import { statisticalArbitrageTool } from '../tools/statisticalArbitrageTools';

// 定义量化投资代理输入的Zod模式
const QuantInputSchema = z.object({
  ticker: z.string().describe('股票代码'),
  data: z.object({
    historicalPrices: z.array(z.any()).optional().describe('历史价格数据'),
    factorData: z.any().optional().describe('因子模型数据'),
    financialData: z.any().optional().describe('财务数据'),
    technicalIndicators: z.any().optional().describe('技术指标数据'),
    peerStocks: z.array(z.string()).optional().describe('同行业股票列表')
  }).optional(),
  timeframe: z.enum(['short', 'medium', 'long']).optional().describe('投资时间框架'),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional().describe('风险承受能力')
});

/**
 * 量化投资代理 - 使用统计套利和因子模型进行投资决策
 */
export const quantInvestingAgent = new Agent({
  name: 'Quantitative Investing Agent',
  description: '量化投资代理，使用统计套利和因子模型分析股票',
  schema: QuantInputSchema,
  model: qwen('qwen-plus-2024-12-20'),
  instructions: `
    你是一个专业的量化投资分析师，专注于统计套利和多因子模型分析。

    分析股票时，你会重点关注：
    1. 统计套利机会（价格偏离、回归机会、配对交易）
    2. 因子暴露度（价值、动量、规模、质量、波动性）
    3. 技术指标信号（动量、超买/超卖、趋势强度）
    4. 风险调整收益率
    5. 统计显著性和置信区间

    使用提供的工具进行定量分析，寻找统计上显著的投资机会。
    
    你的输出必须包含：
    1. 投资信号（看涨/看跌/中性）
    2. 置信度（0-100%）
    3. 估计的夏普比率
    4. 关键因子暴露
    5. 可执行的交易建议
    6. 详细的量化分析过程
  `,
  tools: {
    historicalPriceTool,
    financialMetricsTool,
    financialHistoryTool,
    technicalIndicatorsTool,
    factorModelTool,
    statisticalArbitrageTool
  },
});

/**
 * 使用量化投资代理分析股票并提供投资建议
 * @param ticker 股票代码
 * @param options 可选参数
 * @returns 分析结果和投资建议
 */
export async function analyzeWithQuantInvestingAgent(
  ticker: string, 
  options?: {
    timeframe?: 'short' | 'medium' | 'long',
    riskTolerance?: 'low' | 'medium' | 'high',
    peerStocks?: string[]
  }
) {
  // 设置默认值
  const timeframe = options?.timeframe || 'medium';
  const riskTolerance = options?.riskTolerance || 'medium';
  const peerStocks = options?.peerStocks || [];

  try {
    console.log(`开始量化分析股票: ${ticker}`, { timeframe, riskTolerance });

    // 获取历史价格数据
    const historicalData = await historicalPriceTool.execute({
      symbol: ticker,
      days: timeframe === 'short' ? 30 : timeframe === 'medium' ? 180 : 365
    });

    // 获取技术指标
    const technicalData = await technicalIndicatorsTool.execute({
      ticker,
      indicators: ['rsi', 'macd', 'bollinger', 'atr', 'obv']
    });

    // 获取财务指标
    const financialData = await financialMetricsTool.execute({
      ticker,
      period: 'ttm'
    });

    // 获取因子模型数据
    const factorData = await factorModelTool.execute({
      ticker,
      factors: ['value', 'momentum', 'quality', 'size', 'volatility']
    });

    // 如果有同行业股票，获取统计套利机会
    let arbitrageData = null;
    if (peerStocks.length > 0) {
      arbitrageData = await statisticalArbitrageTool.execute({
        ticker,
        peerStocks,
        lookbackPeriod: timeframe === 'short' ? 30 : timeframe === 'medium' ? 90 : 180
      });
    }

    // 整合数据
    const inputData = {
      ticker,
      data: {
        historicalPrices: historicalData.historicalPrices,
        technicalIndicators: technicalData.indicators,
        financialData: financialData.metrics,
        factorData: factorData.factorExposures,
        arbitrageData: arbitrageData?.opportunities || null,
        peerStocks
      },
      timeframe,
      riskTolerance
    };

    // 使用量化投资代理分析数据
    const result = await quantInvestingAgent.generate(
      `分析股票 ${ticker} 的量化投资机会，基于以下数据：${JSON.stringify(inputData)}`
    );

    return {
      ticker,
      analysis: result.text,
      data: inputData,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`量化分析股票 ${ticker} 时出错:`, error);
    throw new Error(`量化分析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
} 