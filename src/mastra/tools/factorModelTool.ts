import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('factorModelTool');

/**
 * 因子模型工具
 * 
 * 提供因子模型分析功能，包括以下因子：
 * - 价值因子（P/E、P/B、P/S比率）
 * - 质量因子（ROE、ROA、营业利润率）
 * - 动量因子（价格动量、盈利动量）
 * - 规模因子（市值大小）
 * - 波动性因子（波动率、贝塔系数）
 */
export const factorModelTool = createTool({
  name: 'factorModelTool',
  description: '计算并分析股票的多因子模型分析，包括价值、质量、动量、规模和波动性因子',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    factors: z.array(z.enum([
      'value', 'quality', 'momentum', 'size', 'volatility', 'all'
    ])).default(['all']).describe('需要分析的因子类型'),
    benchmark: z.string().optional().describe('基准指数，如S&P500（SPY）'),
    period: z.enum(['1m', '3m', '6m', '1y', '3y', '5y']).default('1y').describe('分析周期')
  }),
  execute: async ({ ticker, factors, benchmark, period }) => {
    try {
      logger.info('执行因子模型分析', { ticker, factors, benchmark, period });
      
      // 模拟获取股票数据的逻辑
      const stockData = await fetchStockData(ticker, period);
      
      // 如果指定了基准指数，获取基准数据
      let benchmarkData = null;
      if (benchmark) {
        benchmarkData = await fetchStockData(benchmark, period);
      }
      
      // 初始化结果对象
      const results: Record<string, any> = {};
      const allFactors = factors.includes('all');
      
      // 分析各类因子
      if (allFactors || factors.includes('value')) {
        results.value = calculateValueFactors(stockData);
      }
      
      if (allFactors || factors.includes('quality')) {
        results.quality = calculateQualityFactors(stockData);
      }
      
      if (allFactors || factors.includes('momentum')) {
        results.momentum = calculateMomentumFactors(stockData, benchmarkData);
      }
      
      if (allFactors || factors.includes('size')) {
        results.size = calculateSizeFactors(stockData);
      }
      
      if (allFactors || factors.includes('volatility')) {
        results.volatility = calculateVolatilityFactors(stockData, benchmarkData);
      }
      
      // 计算综合得分和分析
      const analysis = analyzeFactors(results);
      
      return {
        ticker,
        timestamp: new Date().toISOString(),
        period,
        factors: results,
        analysis
      };
    } catch (error) {
      logger.error('因子模型分析失败', { ticker, error });
      throw new Error(`因子模型分析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

/**
 * 模拟获取股票数据
 */
async function fetchStockData(ticker: string, period: string): Promise<any> {
  // 模拟数据 - 在实际应用中应替换为真实API调用
  return {
    ticker,
    price: 150 + Math.random() * 50,
    marketCap: 1000000000 + Math.random() * 1000000000,
    financials: {
      pe: 15 + Math.random() * 10,
      pb: 2 + Math.random() * 3,
      ps: 3 + Math.random() * 4,
      roe: 0.15 + Math.random() * 0.1,
      roa: 0.08 + Math.random() * 0.05,
      operatingMargin: 0.2 + Math.random() * 0.15,
      earningsGrowth: 0.1 + Math.random() * 0.2,
      revenueGrowth: 0.12 + Math.random() * 0.18
    },
    returns: {
      '1m': Math.random() * 0.1 - 0.05,
      '3m': Math.random() * 0.15 - 0.075,
      '6m': Math.random() * 0.2 - 0.1,
      '1y': Math.random() * 0.3 - 0.15
    },
    volatility: 0.2 + Math.random() * 0.15,
    beta: 0.8 + Math.random() * 0.6
  };
}

/**
 * 计算价值因子
 */
function calculateValueFactors(stockData: any) {
  const { pe, pb, ps } = stockData.financials;
  
  // 为每个因子计算得分 (1-10，10最好)
  const peScore = calculateReverseScore(pe, 5, 30); // 较低的P/E比率更好
  const pbScore = calculateReverseScore(pb, 0.5, 5); // 较低的P/B比率更好
  const psScore = calculateReverseScore(ps, 0.5, 10); // 较低的P/S比率更好
  
  const averageScore = (peScore + pbScore + psScore) / 3;
  
  let interpretation = '';
  if (averageScore >= 7) {
    interpretation = '价值因子得分高，可能被低估';
  } else if (averageScore >= 4) {
    interpretation = '价值因子得分适中，估值在合理范围内';
  } else {
    interpretation = '价值因子得分低，可能被高估';
  }
  
  return {
    metrics: {
      pe,
      pb,
      ps
    },
    scores: {
      peScore,
      pbScore,
      psScore,
      averageScore
    },
    interpretation,
    signal: averageScore >= 7 ? 'bullish' : averageScore <= 3 ? 'bearish' : 'neutral'
  };
}

/**
 * 计算质量因子
 */
function calculateQualityFactors(stockData: any) {
  const { roe, roa, operatingMargin } = stockData.financials;
  
  // 为每个因子计算得分 (1-10，10最好)
  const roeScore = calculateScore(roe, 0.05, 0.25); // 较高的ROE更好
  const roaScore = calculateScore(roa, 0.02, 0.15); // 较高的ROA更好
  const marginScore = calculateScore(operatingMargin, 0.1, 0.35); // 较高的利润率更好
  
  const averageScore = (roeScore + roaScore + marginScore) / 3;
  
  let interpretation = '';
  if (averageScore >= 7) {
    interpretation = '质量因子得分高，表明公司具有良好的盈利能力和运营效率';
  } else if (averageScore >= 4) {
    interpretation = '质量因子得分适中，公司盈利能力和运营效率处于平均水平';
  } else {
    interpretation = '质量因子得分低，表明公司盈利能力和运营效率相对较弱';
  }
  
  return {
    metrics: {
      roe,
      roa,
      operatingMargin
    },
    scores: {
      roeScore,
      roaScore,
      marginScore,
      averageScore
    },
    interpretation,
    signal: averageScore >= 7 ? 'bullish' : averageScore <= 3 ? 'bearish' : 'neutral'
  };
}

/**
 * 计算动量因子
 */
function calculateMomentumFactors(stockData: any, benchmarkData: any = null) {
  const { returns, financials } = stockData;
  const { earningsGrowth, revenueGrowth } = financials;
  
  // 为每个动量指标计算得分
  const priceReturn1m = returns['1m'];
  const priceReturn3m = returns['3m'];
  const priceReturn6m = returns['6m'];
  
  // 相对于基准的超额收益(如果有基准数据)
  let relativeReturn3m = priceReturn3m;
  let relativeReturn6m = priceReturn6m;
  
  if (benchmarkData) {
    relativeReturn3m = priceReturn3m - benchmarkData.returns['3m'];
    relativeReturn6m = priceReturn6m - benchmarkData.returns['6m'];
  }
  
  // 计算得分 (1-10，10最好)
  const return1mScore = calculateScore(priceReturn1m, -0.05, 0.1);
  const return3mScore = calculateScore(relativeReturn3m, -0.1, 0.2);
  const return6mScore = calculateScore(relativeReturn6m, -0.15, 0.3);
  const earningsGrowthScore = calculateScore(earningsGrowth, 0, 0.3);
  const revenueGrowthScore = calculateScore(revenueGrowth, 0, 0.25);
  
  // 加权平均得分(更注重长期动量)
  const averageScore = (
    return1mScore * 0.1 + 
    return3mScore * 0.2 + 
    return6mScore * 0.3 + 
    earningsGrowthScore * 0.25 + 
    revenueGrowthScore * 0.15
  );
  
  let interpretation = '';
  if (averageScore >= 7) {
    interpretation = '动量因子得分高，价格和基本面都显示强劲的正向动量';
  } else if (averageScore >= 4) {
    interpretation = '动量因子得分适中，价格或基本面动量中等';
  } else {
    interpretation = '动量因子得分低，价格和基本面动量较弱或为负';
  }
  
  return {
    metrics: {
      priceReturn1m,
      priceReturn3m,
      priceReturn6m,
      relativeReturn3m,
      relativeReturn6m,
      earningsGrowth,
      revenueGrowth
    },
    scores: {
      return1mScore,
      return3mScore,
      return6mScore,
      earningsGrowthScore,
      revenueGrowthScore,
      averageScore
    },
    interpretation,
    signal: averageScore >= 7 ? 'bullish' : averageScore <= 3 ? 'bearish' : 'neutral'
  };
}

/**
 * 计算规模因子
 */
function calculateSizeFactors(stockData: any) {
  const { marketCap } = stockData;
  
  // 规模分类
  let sizeCategory = '';
  if (marketCap >= 10000000000) {
    sizeCategory = 'large-cap';
  } else if (marketCap >= 2000000000) {
    sizeCategory = 'mid-cap';
  } else {
    sizeCategory = 'small-cap';
  }
  
  // 注意：规模因子是中性的，不给出明确的看涨/看跌信号
  // 但某些投资策略可能偏好特定规模的公司
  const interpretation = sizeCategory === 'large-cap' 
    ? '大盘股，通常波动性较低，但增长潜力相对较小'
    : sizeCategory === 'mid-cap'
      ? '中盘股，平衡了增长潜力和稳定性'
      : '小盘股，通常波动性较大，但增长潜力相对较高';
  
  return {
    metrics: {
      marketCap,
      sizeCategory
    },
    interpretation,
    signal: 'neutral' // 规模本身不提供交易信号
  };
}

/**
 * 计算波动性因子
 */
function calculateVolatilityFactors(stockData: any, benchmarkData: any = null) {
  const { volatility, beta } = stockData;
  
  // 波动性评分 (1-10，10表示波动性最低)
  const volatilityScore = calculateReverseScore(volatility, 0.1, 0.5);
  
  // 贝塔系数评分 (接近1的贝塔值得分最高，过高或过低都会降低得分)
  const betaScore = 10 - Math.abs(beta - 1) * 5; // 贝塔=1得10分，偏离越远分数越低
  
  const averageScore = (volatilityScore + betaScore) / 2;
  
  // 根据投资者偏好，波动性因子的解释可能不同
  // 这里假设偏好低波动性
  let interpretation = '';
  if (averageScore >= 7) {
    interpretation = '波动性因子得分高，表示相对低波动性和适中的市场敏感度';
  } else if (averageScore >= 4) {
    interpretation = '波动性因子得分适中，波动性和市场敏感度在可接受范围内';
  } else {
    interpretation = '波动性因子得分低，波动性较高或市场敏感度不理想';
  }
  
  return {
    metrics: {
      volatility,
      beta,
      relativeBeta: benchmarkData ? beta : null
    },
    scores: {
      volatilityScore,
      betaScore,
      averageScore
    },
    interpretation,
    signal: averageScore >= 7 ? 'bullish' : averageScore <= 3 ? 'bearish' : 'neutral'
  };
}

/**
 * 分析所有因子并提供综合评估
 */
function analyzeFactors(factors: Record<string, any>) {
  // 初始化因子权重 (可根据不同策略调整)
  const weights = {
    value: 0.25,
    quality: 0.2,
    momentum: 0.25,
    volatility: 0.15,
    size: 0.15
  };
  
  // 计算加权得分
  let weightedScore = 0;
  let totalWeight = 0;
  
  for (const factor in factors) {
    if (factor === 'size') continue; // 规模因子不计入加权得分
    
    if (factors[factor].scores && factors[factor].scores.averageScore !== undefined) {
      weightedScore += factors[factor].scores.averageScore * weights[factor as keyof typeof weights];
      totalWeight += weights[factor as keyof typeof weights];
    }
  }
  
  // 归一化得分
  const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 5;
  
  // 基于总分确定信号
  let signal = 'neutral';
  let confidence = 50;
  
  if (finalScore >= 7) {
    signal = 'bullish';
    confidence = Math.round(50 + (finalScore - 7) * 10); // 70-100
  } else if (finalScore <= 3) {
    signal = 'bearish';
    confidence = Math.round(50 + (3 - finalScore) * 10); // 70-100
  } else {
    confidence = Math.round(50 - Math.abs(finalScore - 5) * 10); // 40-50
  }
  
  // 限制置信度范围
  confidence = Math.max(30, Math.min(95, confidence));
  
  let summary = '';
  if (signal === 'bullish') {
    summary = `多因子模型综合评分为${finalScore.toFixed(1)}，显示看涨信号，置信度${confidence}%。`;
  } else if (signal === 'bearish') {
    summary = `多因子模型综合评分为${finalScore.toFixed(1)}，显示看跌信号，置信度${confidence}%。`;
  } else {
    summary = `多因子模型综合评分为${finalScore.toFixed(1)}，显示中性信号，置信度${confidence}%。`;
  }
  
  // 提取强势和弱势因子
  const factorScores: {factor: string, score: number}[] = [];
  
  for (const factor in factors) {
    if (factor === 'size') continue; // 规模因子不计入
    
    if (factors[factor].scores && factors[factor].scores.averageScore !== undefined) {
      factorScores.push({
        factor,
        score: factors[factor].scores.averageScore
      });
    }
  }
  
  // 按分数排序
  factorScores.sort((a, b) => b.score - a.score);
  
  const strongFactors = factorScores
    .filter(f => f.score >= 7)
    .map(f => f.factor);
    
  const weakFactors = factorScores
    .filter(f => f.score <= 3)
    .map(f => f.factor);
  
  return {
    score: finalScore,
    signal,
    confidence,
    summary,
    strongFactors,
    weakFactors,
    factorScores
  };
}

/**
 * 计算得分工具函数 (值越高，得分越高)
 * @param value 当前值
 * @param min 最小期望值 (得分为1)
 * @param max 最大期望值 (得分为10)
 * @returns 1-10的得分
 */
function calculateScore(value: number, min: number, max: number): number {
  if (value <= min) return 1;
  if (value >= max) return 10;
  
  // 线性插值
  return 1 + (value - min) * 9 / (max - min);
}

/**
 * 计算反向得分工具函数 (值越低，得分越高)
 * @param value 当前值
 * @param min 最小期望值 (得分为10)
 * @param max 最大期望值 (得分为1)
 * @returns 1-10的得分
 */
function calculateReverseScore(value: number, min: number, max: number): number {
  if (value <= min) return 10;
  if (value >= max) return 1;
  
  // 线性插值
  return 10 - (value - min) * 9 / (max - min);
} 