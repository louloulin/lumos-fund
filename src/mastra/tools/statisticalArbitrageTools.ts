import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * 统计套利工具 - 分析股票配对交易和统计套利机会
 */
export const statisticalArbitrageTool = createTool({
  id: 'statisticalArbitrageTool',
  description: '分析股票与同行业股票的统计套利机会，包括相关性、协整性和Z-Score分析',
  inputSchema: z.object({
    ticker: z.string().describe('主要股票代码'),
    peerStocks: z.array(z.string()).describe('同行业股票代码列表'),
    lookbackPeriod: z.number().optional().describe('回溯期（天数）'),
    confidenceThreshold: z.number().optional().describe('置信度阈值（百分比）')
  }),
  execute: async ({ 
    ticker, 
    peerStocks, 
    lookbackPeriod = 90, 
    confidenceThreshold = 70 
  }: {
    ticker: string;
    peerStocks: string[];
    lookbackPeriod?: number;
    confidenceThreshold?: number;
  }) => {
    console.log(`分析股票 ${ticker} 的统计套利机会`, { peerStocks, lookbackPeriod, confidenceThreshold });

    try {
      // 在实际项目中应该调用价格数据API并计算统计指标
      // 这里使用模拟数据实现
      const response = await fetch(
        `https://lumosfund-api.vercel.app/api/price-data?tickers=${[ticker, ...peerStocks].join(',')}&days=${lookbackPeriod}`
      );

      if (!response.ok) {
        return {
          ticker,
          success: false,
          error: `获取价格数据失败: ${response.status}`
        };
      }

      // 生成统计套利机会数据
      const opportunities = generateArbitrageOpportunities(ticker, peerStocks);
      
      // 生成整体信号
      const { overallSignal, overallConfidence } = calculateOverallSignal(opportunities);

      return {
        ticker,
        peerStocks,
        lookbackPeriod,
        opportunities,
        overallSignal,
        overallConfidence,
        timestamp: new Date().toISOString(),
        success: true
      };
    } catch (error) {
      console.error(`分析股票 ${ticker} 的统计套利机会时出错:`, error);
      return {
        ticker,
        success: false,
        error: `统计套利分析失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
});

/**
 * 生成模拟统计套利机会
 */
function generateArbitrageOpportunities(
  mainStock: string, 
  peerStocks: string[]
): Array<{
  mainStock: string;
  peerStock: string;
  correlation: number;
  isCointegrated: boolean;
  zScore: number;
  signal: string;
  confidence: number;
  sharpeRatio: number;
  expectedReturn?: number;
  maxDrawdown?: number;
  successRate?: number;
  historicalTrades?: number;
}> {
  // 确保结果的稳定性
  const mainStockSeed = sumChars(mainStock);
  
  return peerStocks.map(peerStock => {
    const peerSeed = sumChars(peerStock);
    const combinedSeed = (mainStockSeed + peerSeed) % 100;
    
    // 使用种子生成相对稳定的"随机"值
    const correlation = 0.5 + (Math.sin(combinedSeed) * 0.3) + (Math.random() * 0.2);
    
    // 股票对有70%概率协整
    const isCointegrated = combinedSeed % 10 < 7;
    
    // Z-Score表示当前价格的偏离程度
    const zScore = (Math.sin(combinedSeed * 3) * 3) + (Math.random() * 0.5 - 0.25);
    
    // 根据Z-Score确定信号
    let signal: string;
    if (zScore < -2) {
      signal = 'long_main_short_peer'; // 做多主股票，做空同行业股票
    } else if (zScore > 2) {
      signal = 'short_main_long_peer'; // 做空主股票，做多同行业股票
    } else if (zScore < -1) {
      signal = 'long_main'; // 偏向做多主股票
    } else if (zScore > 1) {
      signal = 'short_main'; // 偏向做空主股票
    } else {
      signal = 'neutral'; // 中性
    }
    
    // 计算置信度
    const rawConfidence = 100 - Math.abs(zScore * 10);
    const confidence = Math.max(50, Math.min(95, rawConfidence + (combinedSeed % 30))); // 50-95之间
    
    // 计算夏普比率
    const sharpeRatio = 1 + (Math.sin(combinedSeed * 2) * 0.8) + (Math.random() * 0.4);
    
    // 其他统计指标
    const expectedReturn = Math.abs(zScore) * 3 + (Math.random() * 2);
    const maxDrawdown = 5 + (Math.random() * 10);
    const successRate = 50 + (Math.random() * 30) + (isCointegrated ? 10 : 0);
    const historicalTrades = 10 + Math.floor(Math.random() * 30);
    
    return {
      mainStock,
      peerStock,
      correlation: parseFloat(correlation.toFixed(2)),
      isCointegrated,
      zScore: parseFloat(zScore.toFixed(2)),
      signal,
      confidence: parseFloat(confidence.toFixed(1)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      expectedReturn: parseFloat(expectedReturn.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      successRate: parseFloat(successRate.toFixed(1)),
      historicalTrades
    };
  });
}

/**
 * 计算整体信号和置信度
 */
function calculateOverallSignal(opportunities: any[]): { overallSignal: string; overallConfidence: number } {
  if (opportunities.length === 0) {
    return { overallSignal: 'neutral', overallConfidence: 0 };
  }
  
  // 根据置信度加权的信号计数
  const signalCounts: Record<string, number> = {
    long_main: 0,
    short_main: 0,
    long_main_short_peer: 0,
    short_main_long_peer: 0,
    neutral: 0
  };
  
  let totalConfidence = 0;
  
  // 累计各信号的加权计数
  opportunities.forEach(opp => {
    const weight = opp.confidence / 100;
    signalCounts[opp.signal] += weight;
    totalConfidence += weight;
  });
  
  // 找出最强的信号
  let strongestSignal = 'neutral';
  let highestCount = 0;
  
  for (const [signal, count] of Object.entries(signalCounts)) {
    if (count > highestCount) {
      highestCount = count;
      strongestSignal = signal;
    }
  }
  
  // 计算整体置信度
  const overallConfidence = opportunities.length > 0
    ? (highestCount / totalConfidence) * 100
    : 0;
  
  return {
    overallSignal: strongestSignal,
    overallConfidence: parseFloat(overallConfidence.toFixed(1))
  };
}

/**
 * 辅助函数：将字符串转换为数值
 */
function sumChars(str: string): number {
  return str.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
} 