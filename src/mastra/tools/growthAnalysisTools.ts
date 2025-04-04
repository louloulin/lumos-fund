import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('growthAnalysisTools');

/**
 * 财务增长分析工具
 * 
 * 分析公司的财务增长指标，包括收入增长、利润增长、EPS增长等，
 * 用于评估公司的成长性。
 */
export const financialGrowthTool = createTool({
  name: 'financialGrowthTool',
  description: '分析公司的财务增长指标',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    period: z.enum(['quarterly', 'annual', 'ttm']).default('ttm').describe('报告周期'),
    years: z.number().int().min(1).max(10).default(5).describe('分析年数')
  }),
  execute: async ({ ticker, period, years }) => {
    logger.info('执行财务增长分析', { ticker, period, years });
    
    try {
      // 模拟API调用或数据计算
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成模拟数据
      const growthData = generateMockGrowthData(ticker, years);
      
      // 计算PEG比率
      const pegRatio = calculatePEGRatio(growthData);
      
      // 分析增长稳定性
      const growthStability = analyzeGrowthStability(growthData);
      
      // 评分和分析
      const { score, analysis } = evaluateGrowthProfile(growthData, pegRatio, growthStability);
      
      return {
        ticker,
        timestamp: new Date().toISOString(),
        metrics: growthData,
        pegRatio,
        growthStability,
        score, // 0-10分
        analysis
      };
    } catch (error) {
      logger.error('财务增长分析失败', { ticker, error });
      throw new Error(`财务增长分析失败: ${error.message}`);
    }
  }
});

/**
 * 生成模拟增长数据
 */
function generateMockGrowthData(ticker: string, years: number) {
  // 为不同股票设置不同的基础增长率
  let baseRevenueGrowth, baseEpsGrowth, baseProfitGrowth;
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      baseRevenueGrowth = 0.15; // 15%
      baseEpsGrowth = 0.18;     // 18%
      baseProfitGrowth = 0.17;  // 17%
      break;
    case 'MSFT':
      baseRevenueGrowth = 0.22; // 22%
      baseEpsGrowth = 0.25;     // 25%
      baseProfitGrowth = 0.24;  // 24%
      break;
    case 'AMZN':
      baseRevenueGrowth = 0.27; // 27%
      baseEpsGrowth = 0.30;     // 30%
      baseProfitGrowth = 0.25;  // 25%
      break;
    case 'GOOGL':
      baseRevenueGrowth = 0.20; // 20%
      baseEpsGrowth = 0.22;     // 22%
      baseProfitGrowth = 0.21;  // 21%
      break;
    case 'TSLA':
      baseRevenueGrowth = 0.35; // 35%
      baseEpsGrowth = 0.40;     // 40%
      baseProfitGrowth = 0.30;  // 30%
      break;
    case 'META':
      baseRevenueGrowth = 0.25; // 25%
      baseEpsGrowth = 0.28;     // 28%
      baseProfitGrowth = 0.27;  // 27%
      break;
    default:
      // 随机生成一个适中的增长率
      baseRevenueGrowth = 0.10 + Math.random() * 0.20; // 10-30%
      baseEpsGrowth = baseRevenueGrowth + (Math.random() * 0.10 - 0.05); // 基础增长率±5%
      baseProfitGrowth = baseRevenueGrowth + (Math.random() * 0.10 - 0.05); // 基础增长率±5%
  }
  
  const yearlyData = [];
  
  // 生成过去几年的数据
  for (let i = 0; i < years; i++) {
    // 添加一些随机波动
    const yearFactor = 1 + (Math.random() * 0.4 - 0.2); // ±20%的随机因子
    
    // 计算当年增长率
    const revenueGrowth = baseRevenueGrowth * yearFactor;
    const epsGrowth = baseEpsGrowth * yearFactor;
    const profitGrowth = baseProfitGrowth * yearFactor;
    
    // 计算每股收益增长率（同比）
    const epsYoY = epsGrowth + (Math.random() * 0.06 - 0.03); // 基础增长率±3%
    
    yearlyData.push({
      year: new Date().getFullYear() - (years - i),
      revenueGrowth,
      epsGrowth: epsYoY,
      profitGrowth,
      revenueYoY: revenueGrowth,
      profitYoY: profitGrowth,
      quarterlyGrowth: revenueGrowth * (1 + (Math.random() * 0.4 - 0.2)) // 年增长率±20%
    });
  }
  
  // 计算平均增长率
  const avgRevenueGrowth = yearlyData.reduce((sum, data) => sum + data.revenueGrowth, 0) / years;
  const avgEpsGrowth = yearlyData.reduce((sum, data) => sum + data.epsGrowth, 0) / years;
  const avgProfitGrowth = yearlyData.reduce((sum, data) => sum + data.profitGrowth, 0) / years;
  
  // 获取当前市盈率
  const currentPE = generateMockPE(ticker);
  
  return {
    yearly: yearlyData,
    fiveYearAvg: {
      revenueGrowth: avgRevenueGrowth,
      epsGrowth: avgEpsGrowth,
      profitGrowth: avgProfitGrowth
    },
    currentPE,
    latestQuarterGrowth: yearlyData[yearlyData.length - 1].quarterlyGrowth
  };
}

/**
 * 生成模拟市盈率
 */
function generateMockPE(ticker: string): number {
  // 为不同股票设置不同的基础市盈率
  let basePE;
  
  switch (ticker.toUpperCase()) {
    case 'AAPL': basePE = 28; break;
    case 'MSFT': basePE = 32; break;
    case 'AMZN': basePE = 38; break;
    case 'GOOGL': basePE = 25; break;
    case 'TSLA': basePE = 45; break;
    case 'META': basePE = 22; break;
    default:
      // 随机生成一个适中的市盈率
      basePE = 15 + Math.random() * 25; // 15-40
  }
  
  // 添加一些随机波动
  return basePE * (1 + (Math.random() * 0.2 - 0.1)); // ±10%
}

/**
 * 计算PEG比率
 */
function calculatePEGRatio(growthData: any): number {
  const pe = growthData.currentPE;
  const epsGrowth = growthData.fiveYearAvg.epsGrowth;
  
  // PEG = PE / (EPS增长率 * 100)
  return pe / (epsGrowth * 100);
}

/**
 * 分析增长稳定性
 */
function analyzeGrowthStability(growthData: any): {
  stability: 'high' | 'medium' | 'low';
  standardDeviation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
} {
  const yearlyGrowth = growthData.yearly.map(year => year.revenueGrowth);
  
  // 计算标准差
  const avg = yearlyGrowth.reduce((sum, val) => sum + val, 0) / yearlyGrowth.length;
  const squareDiffs = yearlyGrowth.map(val => Math.pow(val - avg, 2));
  const standardDeviation = Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / yearlyGrowth.length);
  
  // 确定稳定性等级
  let stability: 'high' | 'medium' | 'low';
  if (standardDeviation < 0.05) {
    stability = 'high';
  } else if (standardDeviation < 0.15) {
    stability = 'medium';
  } else {
    stability = 'low';
  }
  
  // 确定趋势
  const firstHalf = yearlyGrowth.slice(0, Math.ceil(yearlyGrowth.length / 2));
  const secondHalf = yearlyGrowth.slice(Math.ceil(yearlyGrowth.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (secondAvg > firstAvg * 1.1) {
    trend = 'increasing';
  } else if (secondAvg < firstAvg * 0.9) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }
  
  return {
    stability,
    standardDeviation,
    trend
  };
}

/**
 * 评估增长特征
 */
function evaluateGrowthProfile(growthData: any, pegRatio: number, growthStability: any): {
  score: number;
  analysis: string;
} {
  // 基于PEG评分 (0-3分)
  let pegScore = 0;
  if (pegRatio < 0.75) pegScore = 3;
  else if (pegRatio < 1) pegScore = 2.5;
  else if (pegRatio < 1.5) pegScore = 2;
  else if (pegRatio < 2) pegScore = 1;
  else pegScore = 0;
  
  // 基于增长率评分 (0-4分)
  const avgGrowth = growthData.fiveYearAvg.revenueGrowth;
  let growthScore = 0;
  if (avgGrowth > 0.3) growthScore = 4;
  else if (avgGrowth > 0.2) growthScore = 3;
  else if (avgGrowth > 0.15) growthScore = 2;
  else if (avgGrowth > 0.1) growthScore = 1;
  else growthScore = 0;
  
  // 基于增长稳定性评分 (0-3分)
  let stabilityScore = 0;
  if (growthStability.stability === 'high') stabilityScore = 3;
  else if (growthStability.stability === 'medium') stabilityScore = 2;
  else stabilityScore = 1;
  
  // 总得分 (0-10分)
  const totalScore = pegScore + growthScore + stabilityScore;
  
  // 分析评价
  let analysis = '';
  if (totalScore >= 8) {
    analysis = `优秀的成长型股票。PEG比率为${pegRatio.toFixed(2)}，5年平均收入增长${(avgGrowth * 100).toFixed(2)}%，增长稳定性${
      growthStability.stability === 'high' ? '高' : growthStability.stability === 'medium' ? '中等' : '低'
    }。增长趋势${
      growthStability.trend === 'increasing' ? '向上' : growthStability.trend === 'decreasing' ? '向下' : '稳定'
    }。`;
  } else if (totalScore >= 6) {
    analysis = `良好的成长型股票。PEG比率为${pegRatio.toFixed(2)}，5年平均收入增长${(avgGrowth * 100).toFixed(2)}%，但增长稳定性${
      growthStability.stability === 'high' ? '很好' : growthStability.stability === 'medium' ? '一般' : '较差'
    }。`;
  } else if (totalScore >= 4) {
    analysis = `一般的成长型股票。PEG比率为${pegRatio.toFixed(2)}，5年平均收入增长${(avgGrowth * 100).toFixed(2)}%，增长稳定性有限。`;
  } else {
    analysis = `较弱的成长特征。PEG比率为${pegRatio.toFixed(2)}，5年平均收入增长仅${(avgGrowth * 100).toFixed(2)}%，增长稳定性差。`;
  }
  
  return {
    score: totalScore,
    analysis
  };
} 