'use server'

import { createLogger } from '@/lib/logger.server';
import { 
  valueInvestingAgent, 
  growthInvestingAgent, 
  quantInvestingAgent,
  technicalAnalysisAgent,
  sentimentAnalysisAgent,
  riskManagementAgent
} from '@/mastra/agents';
import { MarketDataService } from '@/services/marketDataService';
import { revalidatePath } from 'next/cache';

const logger = createLogger('quantitative-analysis');
const marketDataService = new MarketDataService();

// 确保市场数据服务已初始化
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await marketDataService.initialize();
    isInitialized = true;
  }
}

/**
 * 量化分析结果接口
 */
export interface QuantitativeAnalysisResult {
  ticker: string;
  date: string;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number; // 0-100
  priceTarget?: {
    low: number;
    base: number;
    high: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
  summary: string;
  analysis: {
    fundamental: string;
    technical: string;
    sentiment: string;
    risk: string;
  };
  scorecard: {
    value: number; // 0-100
    growth: number; // 0-100
    momentum: number; // 0-100
    quality: number; // 0-100
    sentiment: number; // 0-100
    overall: number; // 0-100
  };
}

/**
 * 执行综合量化分析
 * @param ticker 股票代码
 */
export async function runQuantitativeAnalysis(ticker: string): Promise<QuantitativeAnalysisResult> {
  try {
    logger.info('开始综合量化分析', { ticker });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 获取基础市场数据
    const [stockData, financialData, newsData] = await Promise.all([
      marketDataService.fetchStockPriceHistory(ticker, '1y'),
      marketDataService.fetchFinancialData(ticker),
      marketDataService.fetchNewsData(ticker, 30)
    ]);
    
    // 1. 执行基本面分析（价值+成长）
    const fundamentalPrompt = `
      请对${ticker}进行全面的基本面分析。以下是可用的财务数据和市场信息：
      
      财务数据:
      ${JSON.stringify(financialData, null, 2)}
      
      股价历史:
      ${JSON.stringify(stockData.slice(-30), null, 2)}
      
      分析应包括:
      1. 估值水平评估（P/E, P/B, P/S等）
      2. 财务健康状况（利润率, 债务水平, 现金流等）
      3. 增长潜力分析（收入增长, 利润增长, 市场扩张等）
      4. 竞争地位评估
      5. 管理团队质量
      
      请给出基本面评分(0-100)，并明确说明投资建议(买入/卖出/持有)及置信度(0-100)。
    `;
    
    // 2. 执行技术分析
    const technicalPrompt = `
      请对${ticker}进行全面的技术分析。以下是可用的价格历史数据：
      
      价格历史:
      ${JSON.stringify(stockData, null, 2)}
      
      分析应包括:
      1. 趋势分析（主要趋势方向、强度）
      2. 支撑位和阻力位识别
      3. 移动平均线分析（50日/200日均线关系）
      4. 动量指标（RSI、MACD等）
      5. 成交量分析
      6. 图表形态识别（如有）
      
      请给出技术面评分(0-100)，并明确说明投资建议(买入/卖出/持有)及置信度(0-100)。
    `;
    
    // 3. 执行情绪分析
    const sentimentPrompt = `
      请对${ticker}进行市场情绪分析。以下是可用的新闻数据：
      
      新闻数据:
      ${JSON.stringify(newsData, null, 2)}
      
      分析应包括:
      1. 总体情绪评估（积极/消极/中性）
      2. 主要情绪驱动因素
      3. 分析师情绪和预期
      4. 社交媒体情绪（如数据可用）
      5. 机构投资者行为（如可获取）
      
      请给出情绪评分(0-100)，并明确说明投资建议(买入/卖出/持有)及置信度(0-100)。
    `;
    
    // 4. 执行风险分析
    const riskPrompt = `
      请对${ticker}进行全面的风险评估。以下是可用数据：
      
      财务数据:
      ${JSON.stringify(financialData, null, 2)}
      
      价格历史:
      ${JSON.stringify(stockData, null, 2)}
      
      新闻数据:
      ${JSON.stringify(newsData, null, 2)}
      
      分析应包括:
      1. 市场风险评估（波动性、系统性风险）
      2. 财务风险评估（负债水平、流动性、破产风险）
      3. 业务风险评估（竞争威胁、行业变化）
      4. 监管风险评估
      5. 其他特定风险
      
      请给出整体风险水平（低/中/高），并明确说明最重要的风险因素和缓解建议。
    `;
    
    // 并行执行所有分析
    const [fundamentalResult, technicalResult, sentimentResult, riskResult] = await Promise.all([
      valueInvestingAgent.run({ messages: [{ role: 'user', content: fundamentalPrompt }] }),
      technicalAnalysisAgent.run({ messages: [{ role: 'user', content: technicalPrompt }] }),
      sentimentAnalysisAgent.run({ messages: [{ role: 'user', content: sentimentPrompt }] }),
      riskManagementAgent.run({ messages: [{ role: 'user', content: riskPrompt }] })
    ]);
    
    // 5. 综合分析结果
    const integrationPrompt = `
      请对${ticker}进行综合投资分析，整合以下各方面的分析结果：
      
      基本面分析:
      ${fundamentalResult.content}
      
      技术分析:
      ${technicalResult.content}
      
      情绪分析:
      ${sentimentResult.content}
      
      风险分析:
      ${riskResult.content}
      
      综合这些分析，请提供：
      1. 明确的投资信号（买入/卖出/持有）
      2. 整体置信度评分(0-100)
      3. 价格目标区间（低/基准/高）
      4. 建议投资时间范围（短期/中期/长期）
      5. 总体评分(0-100)
      6. 具体评分明细:
         - 价值评分(0-100)
         - 成长评分(0-100)
         - 动量评分(0-100)
         - 质量评分(0-100)
         - 情绪评分(0-100)
      7. 简洁的总结（不超过150字）
      
      回复必须采用以下JSON格式（包含所有请求的字段）：
      {
        "signal": "buy|sell|hold",
        "confidence": 75,
        "priceTarget": {
          "low": 100,
          "base": 120,
          "high": 140
        },
        "timeHorizon": "short|medium|long",
        "scorecard": {
          "value": 80,
          "growth": 70,
          "momentum": 60,
          "quality": 85,
          "sentiment": 65,
          "overall": 75
        },
        "riskLevel": "low|medium|high",
        "summary": "简要总结..."
      }
    `;
    
    const integrationResult = await quantInvestingAgent.run({
      messages: [{ role: 'user', content: integrationPrompt }]
    });
    
    // 解析综合结果
    let parsedResult;
    try {
      const jsonMatch = integrationResult.content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法从结果中解析JSON');
      }
    } catch (parseError) {
      logger.error('解析综合分析结果失败', { error: parseError });
      throw new Error('解析综合分析结果失败: ' + (parseError as Error).message);
    }
    
    // 构建最终分析结果
    const result: QuantitativeAnalysisResult = {
      ticker,
      date: new Date().toISOString(),
      signal: parsedResult.signal as 'buy' | 'sell' | 'hold',
      confidence: parsedResult.confidence,
      priceTarget: parsedResult.priceTarget,
      riskLevel: parsedResult.riskLevel as 'low' | 'medium' | 'high',
      timeHorizon: parsedResult.timeHorizon as 'short' | 'medium' | 'long',
      summary: parsedResult.summary,
      analysis: {
        fundamental: fundamentalResult.content,
        technical: technicalResult.content,
        sentiment: sentimentResult.content,
        risk: riskResult.content
      },
      scorecard: parsedResult.scorecard
    };
    
    logger.info('综合量化分析完成', { 
      ticker, 
      signal: result.signal, 
      confidence: result.confidence,
      overallScore: result.scorecard.overall
    });
    
    // 刷新路径缓存
    revalidatePath(`/stocks/${ticker}`);
    
    return result;
    
  } catch (error) {
    logger.error('综合量化分析失败', { ticker, error });
    throw error;
  }
}

/**
 * 执行批量量化分析
 * @param tickers 股票代码列表
 */
export async function runBatchQuantitativeAnalysis(tickers: string[]): Promise<Record<string, QuantitativeAnalysisResult>> {
  try {
    logger.info('开始批量量化分析', { tickerCount: tickers.length });
    
    // 串行执行分析以避免API速率限制问题
    const results: Record<string, QuantitativeAnalysisResult> = {};
    
    for (const ticker of tickers) {
      try {
        results[ticker] = await runQuantitativeAnalysis(ticker);
        // 添加延迟以避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`分析${ticker}失败`, { error });
        // 继续处理其他股票
      }
    }
    
    logger.info('批量量化分析完成', { 
      analyzedCount: Object.keys(results).length,
      failedCount: tickers.length - Object.keys(results).length
    });
    
    return results;
    
  } catch (error) {
    logger.error('批量量化分析失败', { error });
    throw error;
  }
} 