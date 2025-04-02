import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('consistencyTools');

/**
 * 分析公司财务一致性的工具
 * 
 * 基于巴菲特的投资理念，优质公司应该有稳定且可预测的财务表现
 */
export const analyzeConsistencyTool = createTool({
  name: 'analyzeConsistencyTool',
  description: '分析公司的财务一致性和增长模式',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    financialHistory: z.any().describe('公司历史财务数据')
  }),
  execute: async ({ ticker, financialHistory }: { ticker: string, financialHistory: any }) => {
    logger.info('分析公司财务一致性', { ticker });
    
    try {
      if (!financialHistory || financialHistory.length < 3) {
        throw new Error('历史财务数据不足，至少需要3个周期的数据');
      }
      
      // 分析收益一致性
      const earningsConsistency = analyzeEarningsConsistency(financialHistory);
      
      // 分析收入增长一致性
      const revenueConsistency = analyzeRevenueConsistency(financialHistory);
      
      // 分析利润率一致性
      const marginConsistency = analyzeMarginConsistency(financialHistory);
      
      // 分析现金流一致性
      const cashFlowConsistency = analyzeCashFlowConsistency(financialHistory);
      
      // 计算总一致性得分 (0-5分)
      const totalScore = 
        earningsConsistency.score + 
        revenueConsistency.score + 
        marginConsistency.score + 
        cashFlowConsistency.score;
      
      return {
        score: Math.min(5, totalScore), // 最高5分
        analysis: {
          earnings: earningsConsistency,
          revenue: revenueConsistency,
          margins: marginConsistency,
          cashFlow: cashFlowConsistency
        },
        reasoning: generateConsistencyReasoning(
          totalScore,
          earningsConsistency,
          revenueConsistency,
          marginConsistency,
          cashFlowConsistency
        )
      };
    } catch (error) {
      logger.error('一致性分析失败', error);
      return {
        score: 0,
        analysis: {
          earnings: { score: 0, details: '数据不足' },
          revenue: { score: 0, details: '数据不足' },
          margins: { score: 0, details: '数据不足' },
          cashFlow: { score: 0, details: '数据不足' }
        },
        reasoning: '无法分析财务一致性，历史数据不足'
      };
    }
  }
});

/**
 * 分析收益一致性 (0-1.5分)
 */
function analyzeEarningsConsistency(financialHistory: any[]): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 提取收益数据
  const earningsData = financialHistory.map(period => period.netIncome).filter(Boolean);
  
  if (earningsData.length < 3) {
    return {
      score: 0,
      details: '收益历史数据不足'
    };
  }
  
  // 检查收益增长趋势
  const earningsGrowth = checkConsistentGrowth(earningsData);
  if (earningsGrowth) {
    score += 0.75;
    reasoning.push('收益呈稳定增长趋势');
  } else if (isIncreasingMostly(earningsData, 0.75)) {
    score += 0.5;
    reasoning.push('收益整体增长但有波动');
  } else {
    reasoning.push('收益增长不稳定');
  }
  
  // 计算收益波动性 (使用变异系数)
  const earningsCV = calculateCoefficientOfVariation(earningsData);
  if (earningsCV < 0.15) {
    score += 0.75;
    reasoning.push('收益极其稳定，波动性低');
  } else if (earningsCV < 0.30) {
    score += 0.5;
    reasoning.push('收益相对稳定，波动性中等');
  } else if (earningsCV < 0.50) {
    score += 0.25;
    reasoning.push('收益有一定波动性');
  } else {
    reasoning.push(`收益波动性高 (CV: ${earningsCV.toFixed(2)})`);
  }
  
  return {
    score: Math.min(1.5, score),
    details: reasoning.join('；')
  };
}

/**
 * 分析收入一致性 (0-1.25分)
 */
function analyzeRevenueConsistency(financialHistory: any[]): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 提取收入数据
  const revenueData = financialHistory.map(period => period.revenue).filter(Boolean);
  
  if (revenueData.length < 3) {
    return {
      score: 0,
      details: '收入历史数据不足'
    };
  }
  
  // 检查收入增长趋势
  const revenueGrowth = checkConsistentGrowth(revenueData);
  if (revenueGrowth) {
    score += 0.75;
    reasoning.push('收入呈稳定增长趋势');
  } else if (isIncreasingMostly(revenueData, 0.8)) {
    score += 0.5;
    reasoning.push('收入整体增长但有少量波动');
  } else {
    reasoning.push('收入增长不稳定');
  }
  
  // 计算收入波动性
  const revenueCV = calculateCoefficientOfVariation(revenueData);
  if (revenueCV < 0.10) {
    score += 0.5;
    reasoning.push('收入极其稳定，波动性极低');
  } else if (revenueCV < 0.20) {
    score += 0.25;
    reasoning.push('收入相对稳定，波动性较低');
  } else {
    reasoning.push(`收入波动性较高 (CV: ${revenueCV.toFixed(2)})`);
  }
  
  return {
    score: Math.min(1.25, score),
    details: reasoning.join('；')
  };
}

/**
 * 分析利润率一致性 (0-1.25分)
 */
function analyzeMarginConsistency(financialHistory: any[]): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 提取毛利率和净利率数据
  const grossMarginData = financialHistory.map(period => period.grossMargin).filter(Boolean);
  const netMarginData = financialHistory.map(period => period.netProfitMargin).filter(Boolean);
  
  if (grossMarginData.length < 3 || netMarginData.length < 3) {
    return {
      score: 0,
      details: '利润率历史数据不足'
    };
  }
  
  // 计算毛利率波动性
  const grossMarginCV = calculateCoefficientOfVariation(grossMarginData);
  if (grossMarginCV < 0.05) {
    score += 0.5;
    reasoning.push('毛利率极其稳定');
  } else if (grossMarginCV < 0.10) {
    score += 0.3;
    reasoning.push('毛利率相对稳定');
  } else {
    reasoning.push(`毛利率波动较大 (CV: ${grossMarginCV.toFixed(2)})`);
  }
  
  // 计算净利率波动性
  const netMarginCV = calculateCoefficientOfVariation(netMarginData);
  if (netMarginCV < 0.10) {
    score += 0.5;
    reasoning.push('净利率极其稳定');
  } else if (netMarginCV < 0.20) {
    score += 0.3;
    reasoning.push('净利率相对稳定');
  } else {
    reasoning.push(`净利率波动较大 (CV: ${netMarginCV.toFixed(2)})`);
  }
  
  // 检查利润率趋势
  if (isIncreasingMostly(grossMarginData, 0.7) && isIncreasingMostly(netMarginData, 0.7)) {
    score += 0.25;
    reasoning.push('毛利率和净利率呈上升趋势');
  } else if (isStable(grossMarginData, 0.03) && isStable(netMarginData, 0.05)) {
    score += 0.25;
    reasoning.push('毛利率和净利率保持稳定');
  }
  
  return {
    score: Math.min(1.25, score),
    details: reasoning.join('；')
  };
}

/**
 * 分析现金流一致性 (0-1分)
 */
function analyzeCashFlowConsistency(financialHistory: any[]): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 提取经营现金流和净收入数据
  const operatingCashFlowData = financialHistory.map(period => period.operatingCashFlow).filter(Boolean);
  const netIncomeData = financialHistory.map(period => period.netIncome).filter(Boolean);
  
  if (operatingCashFlowData.length < 3 || netIncomeData.length < 3 || 
      operatingCashFlowData.length !== netIncomeData.length) {
    return {
      score: 0,
      details: '现金流或净收入历史数据不足'
    };
  }
  
  // 计算现金流质量 (经营现金流/净收入)
  const cashFlowQuality = operatingCashFlowData.map((ocf, i) => ocf / netIncomeData[i]);
  
  // 现金流质量评估
  const avgCFQuality = calculateAverage(cashFlowQuality);
  if (avgCFQuality > 1.1) {
    score += 0.5;
    reasoning.push(`优秀的现金流质量 (平均${avgCFQuality.toFixed(2)})`);
  } else if (avgCFQuality > 0.9) {
    score += 0.3;
    reasoning.push(`良好的现金流质量 (平均${avgCFQuality.toFixed(2)})`);
  } else {
    reasoning.push(`现金流质量不足 (平均${avgCFQuality.toFixed(2)})`);
  }
  
  // 检查现金流稳定性
  const cfQualityCV = calculateCoefficientOfVariation(cashFlowQuality);
  if (cfQualityCV < 0.15) {
    score += 0.5;
    reasoning.push('现金流质量非常稳定');
  } else if (cfQualityCV < 0.25) {
    score += 0.3;
    reasoning.push('现金流质量相对稳定');
  } else {
    reasoning.push(`现金流质量波动较大 (CV: ${cfQualityCV.toFixed(2)})`);
  }
  
  return {
    score: Math.min(1, score),
    details: reasoning.join('；')
  };
}

// =============== 辅助函数 ===============

/**
 * 检查数据是否呈一致增长趋势
 */
function checkConsistentGrowth(data: number[]): boolean {
  if (data.length < 3) return false;
  
  // 检查每个时期是否都增长
  for (let i = 1; i < data.length; i++) {
    if (data[i] <= data[i - 1]) {
      return false;
    }
  }
  
  return true;
}

/**
 * 检查数据是否大部分时间在增长
 */
function isIncreasingMostly(data: number[], threshold: number): boolean {
  if (data.length < 3) return false;
  
  let increasingCount = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i] > data[i - 1]) {
      increasingCount++;
    }
  }
  
  return increasingCount / (data.length - 1) >= threshold;
}

/**
 * 检查数据是否在一定范围内稳定
 */
function isStable(data: number[], maxDeviation: number): boolean {
  if (data.length < 3) return false;
  
  const avg = calculateAverage(data);
  for (const value of data) {
    if (Math.abs(value - avg) / avg > maxDeviation) {
      return false;
    }
  }
  
  return true;
}

/**
 * 计算变异系数 (标准差/平均值)
 */
function calculateCoefficientOfVariation(data: number[]): number {
  if (data.length < 2) return 0;
  
  const mean = calculateAverage(data);
  if (mean === 0) return 0; // 避免除以零
  
  const squaredDifferences = data.map(value => Math.pow(value - mean, 2));
  const variance = calculateAverage(squaredDifferences);
  const stdDev = Math.sqrt(variance);
  
  return stdDev / mean;
}

/**
 * 计算平均值
 */
function calculateAverage(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, value) => sum + value, 0) / data.length;
}

/**
 * 生成一致性分析综合评价
 */
function generateConsistencyReasoning(
  totalScore: number,
  earnings: { score: number; details: string },
  revenue: { score: number; details: string },
  margins: { score: number; details: string },
  cashFlow: { score: number; details: string }
): string {
  const maxScore = 5;
  
  // 基于总分评价公司财务一致性
  let overallAssessment = '';
  if (totalScore >= 4) {
    overallAssessment = '公司财务表现极为一致稳定，符合巴菲特追求的可预测性特征。';
  } else if (totalScore >= 3) {
    overallAssessment = '公司财务表现相当稳定，具有良好的可预测性。';
  } else if (totalScore >= 2) {
    overallAssessment = '公司财务表现有一定的稳定性，但存在一些波动。';
  } else {
    overallAssessment = '公司财务表现波动较大，缺乏一致性，可预测性较低。';
  }
  
  // 汇总各维度分析
  const details = [
    `收益一致性: ${earnings.details}`,
    `收入一致性: ${revenue.details}`,
    `利润率一致性: ${margins.details}`,
    `现金流一致性: ${cashFlow.details}`
  ];
  
  return `${overallAssessment} 一致性得分: ${totalScore}/${maxScore}。\n${details.join('\n')}`;
} 