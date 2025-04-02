import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('valueAnalysisTools');

/**
 * 分析公司经济护城河的工具
 * 
 * 经济护城河是指公司的持久竞争优势，是巴菲特投资理念的核心
 */
export const analyzeMoatTool = createTool({
  name: 'analyzeMoatTool',
  description: '分析公司的经济护城河(竞争优势)',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    financialData: z.any().describe('公司财务数据')
  }),
  execute: async ({ ticker, financialData }) => {
    logger.info('分析公司护城河', { ticker });
    
    try {
      const score = analyzeMoatScore(financialData);
      const moatType = determineMoatType(financialData);
      const durability = assessMoatDurability(financialData);
      
      return {
        score,
        moatType,
        durability,
        reasoning: generateMoatReasoning(financialData, score, moatType)
      };
    } catch (error) {
      logger.error('护城河分析失败', error);
      return {
        score: 0,
        moatType: 'unknown',
        durability: 'unknown',
        reasoning: '无法分析护城河，数据不足'
      };
    }
  }
});

/**
 * 分析护城河评分 (0-5分)
 */
function analyzeMoatScore(financialData: any): number {
  let score = 0;
  
  // 1. 利润率稳定性和水平 (0-2分)
  if (financialData && financialData.profitMargins) {
    const margins = financialData.profitMargins;
    
    // 计算平均利润率
    const avgMargin = margins.reduce((sum: number, margin: number) => sum + margin, 0) / margins.length;
    
    // 计算利润率标准差
    const stdDev = calculateStandardDeviation(margins);
    
    // 高利润率 + 低波动 = 强护城河
    if (avgMargin > 0.20 && stdDev < 0.03) {
      score += 2; // 高利润、低波动
    } else if (avgMargin > 0.15 || (avgMargin > 0.10 && stdDev < 0.05)) {
      score += 1; // 中等利润或中等波动
    }
  }
  
  // 2. ROE和ROIC评估 (0-2分)
  if (financialData && financialData.roe && financialData.roic) {
    const roeAvg = calculateAverage(financialData.roe);
    const roicAvg = calculateAverage(financialData.roic);
    
    if (roeAvg > 0.20 && roicAvg > 0.15) {
      score += 2; // 高回报率
    } else if (roeAvg > 0.15 || roicAvg > 0.12) {
      score += 1; // 中等回报率
    }
  }
  
  // 3. 行业地位评估 (0-1分)
  if (financialData && financialData.marketShare) {
    if (financialData.marketShare > 0.25) {
      score += 1; // 行业领先
    }
  }
  
  return score;
}

/**
 * 确定护城河类型
 */
function determineMoatType(financialData: any): string {
  // 根据财务特征确定护城河类型
  if (!financialData) return 'unknown';
  
  const types = [];
  
  // 1. 检查品牌价值
  if (financialData.grossMargin > 0.40) {
    types.push('品牌价值');
  }
  
  // 2. 检查网络效应
  if (financialData.userGrowthRate > 0.15 && financialData.revenuePerUser > 0) {
    types.push('网络效应');
  }
  
  // 3. 检查成本优势
  if (financialData.operatingMargin > financialData.industryAverageMargin * 1.5) {
    types.push('成本优势');
  }
  
  // 4. 检查规模经济
  if (financialData.marketShare > 0.30 && financialData.operatingMargin > 0.15) {
    types.push('规模经济');
  }
  
  // 5. 检查转换成本
  if (financialData.customerRetentionRate > 0.90) {
    types.push('高转换成本');
  }
  
  return types.length > 0 ? types.join('、') : '无明显护城河';
}

/**
 * 评估护城河持久性
 */
function assessMoatDurability(financialData: any): string {
  if (!financialData) return 'unknown';
  
  // 根据行业变化速度、技术替代风险和历史表现评估持久性
  const industryDisruptionRisk = financialData.industryDisruptionRisk || 'medium';
  const historicalAdvantage = financialData.yearsOfAdvantage || 0;
  
  if (industryDisruptionRisk === 'low' && historicalAdvantage > 10) {
    return '极高 (10年以上)';
  } else if (industryDisruptionRisk === 'low' || historicalAdvantage > 5) {
    return '高 (5-10年)';
  } else if (industryDisruptionRisk === 'medium') {
    return '中等 (3-5年)';
  } else {
    return '低 (小于3年)';
  }
}

/**
 * 生成护城河分析理由
 */
function generateMoatReasoning(financialData: any, score: number, moatType: string): string {
  if (!financialData) return '数据不足，无法分析';
  
  if (score >= 4) {
    return `公司拥有强大的${moatType}护城河。利润率稳定且高于行业平均，资本回报率突出，行业地位稳固。`;
  } else if (score >= 2) {
    return `公司拥有一定的${moatType}竞争优势。财务指标表现良好，但优势程度或持久性有待观察。`;
  } else {
    return `公司缺乏明显护城河。财务表现波动或低于理想水平，竞争优势不明显。`;
  }
}

// 辅助函数：计算标准差
function calculateStandardDeviation(values: number[]): number {
  const average = calculateAverage(values);
  const squareDiffs = values.map(value => {
    const diff = value - average;
    return diff * diff;
  });
  const avgSquareDiff = calculateAverage(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

// 辅助函数：计算平均值
function calculateAverage(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}