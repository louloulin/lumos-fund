import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('fundamentalTools');

/**
 * 分析公司基本面的工具
 * 
 * 基于巴菲特/格雷厄姆的价值投资理念，分析公司的财务健康度、盈利能力和估值
 */
export const analyzeFundamentalsTool = createTool({
  name: 'analyzeFundamentalsTool',
  description: '分析公司的基本面财务数据',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    metrics: z.any().describe('公司财务指标数据')
  }),
  execute: async ({ ticker, metrics }: { ticker: string, metrics: any }) => {
    logger.info('分析公司基本面', { ticker });
    
    try {
      if (!metrics || metrics.length === 0) {
        throw new Error('缺少财务指标数据');
      }
      
      // 获取最近的财务指标数据
      const latestMetrics = metrics[0];
      
      // 分析各个财务维度
      const profitabilityResult = analyzeProfitability(latestMetrics);
      const liquidityResult = analyzeLiquidity(latestMetrics);
      const solvencyResult = analyzeSolvency(latestMetrics);
      const efficiencyResult = analyzeEfficiency(latestMetrics);
      
      // 计算总基本面得分 (0-10分)
      const totalScore = 
        profitabilityResult.score + 
        liquidityResult.score + 
        solvencyResult.score + 
        efficiencyResult.score;
      
      return {
        score: totalScore,
        analysis: {
          profitability: profitabilityResult,
          liquidity: liquidityResult,
          solvency: solvencyResult,
          efficiency: efficiencyResult
        },
        metrics: latestMetrics,
        reasoning: generateFundamentalReasoning(
          totalScore, 
          profitabilityResult, 
          liquidityResult, 
          solvencyResult,
          efficiencyResult
        )
      };
    } catch (error) {
      logger.error('基本面分析失败', error);
      return {
        score: 0,
        analysis: {
          profitability: { score: 0, details: '数据不足' },
          liquidity: { score: 0, details: '数据不足' },
          solvency: { score: 0, details: '数据不足' },
          efficiency: { score: 0, details: '数据不足' }
        },
        metrics: null,
        reasoning: '无法分析基本面，数据不足'
      };
    }
  }
});

/**
 * 分析盈利能力 (0-4分)
 */
function analyzeProfitability(metrics: any): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 检查ROE (股本回报率)
  if (metrics.returnOnEquity !== undefined) {
    if (metrics.returnOnEquity > 0.15) {
      score += 1.5;
      reasoning.push(`强劲的ROE: ${(metrics.returnOnEquity * 100).toFixed(1)}%`);
    } else if (metrics.returnOnEquity > 0.10) {
      score += 1;
      reasoning.push(`良好的ROE: ${(metrics.returnOnEquity * 100).toFixed(1)}%`);
    } else if (metrics.returnOnEquity > 0) {
      score += 0.5;
      reasoning.push(`ROE偏低: ${(metrics.returnOnEquity * 100).toFixed(1)}%`);
    } else {
      reasoning.push(`负ROE: ${(metrics.returnOnEquity * 100).toFixed(1)}%`);
    }
  } else {
    reasoning.push('ROE数据不可用');
  }
  
  // 检查利润率
  if (metrics.netProfitMargin !== undefined) {
    if (metrics.netProfitMargin > 0.15) {
      score += 1.5;
      reasoning.push(`出色的净利润率: ${(metrics.netProfitMargin * 100).toFixed(1)}%`);
    } else if (metrics.netProfitMargin > 0.08) {
      score += 1;
      reasoning.push(`良好的净利润率: ${(metrics.netProfitMargin * 100).toFixed(1)}%`);
    } else if (metrics.netProfitMargin > 0) {
      score += 0.5;
      reasoning.push(`净利润率偏低: ${(metrics.netProfitMargin * 100).toFixed(1)}%`);
    } else {
      reasoning.push(`负净利润率: ${(metrics.netProfitMargin * 100).toFixed(1)}%`);
    }
  } else {
    reasoning.push('净利润率数据不可用');
  }
  
  // 检查营业利润率
  if (metrics.operatingMargin !== undefined) {
    if (metrics.operatingMargin > 0.15) {
      score += 1;
      reasoning.push(`强劲的营业利润率: ${(metrics.operatingMargin * 100).toFixed(1)}%`);
    } else if (metrics.operatingMargin > 0.08) {
      score += 0.5;
      reasoning.push(`良好的营业利润率: ${(metrics.operatingMargin * 100).toFixed(1)}%`);
    } else if (metrics.operatingMargin > 0) {
      score += 0.25;
      reasoning.push(`营业利润率偏低: ${(metrics.operatingMargin * 100).toFixed(1)}%`);
    } else {
      reasoning.push(`负营业利润率: ${(metrics.operatingMargin * 100).toFixed(1)}%`);
    }
  } else {
    reasoning.push('营业利润率数据不可用');
  }
  
  return {
    score: Math.min(4, score), // 最高4分
    details: reasoning.join('；')
  };
}

/**
 * 分析流动性 (0-2分)
 */
function analyzeLiquidity(metrics: any): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 检查流动比率
  if (metrics.currentRatio !== undefined) {
    if (metrics.currentRatio > 2) {
      score += 1;
      reasoning.push(`优秀的流动比率: ${metrics.currentRatio.toFixed(2)}`);
    } else if (metrics.currentRatio > 1.5) {
      score += 0.75;
      reasoning.push(`良好的流动比率: ${metrics.currentRatio.toFixed(2)}`);
    } else if (metrics.currentRatio > 1) {
      score += 0.5;
      reasoning.push(`可接受的流动比率: ${metrics.currentRatio.toFixed(2)}`);
    } else {
      reasoning.push(`流动比率不足: ${metrics.currentRatio.toFixed(2)}`);
    }
  } else {
    reasoning.push('流动比率数据不可用');
  }
  
  // 检查速动比率
  if (metrics.quickRatio !== undefined) {
    if (metrics.quickRatio > 1.5) {
      score += 1;
      reasoning.push(`优秀的速动比率: ${metrics.quickRatio.toFixed(2)}`);
    } else if (metrics.quickRatio > 1) {
      score += 0.75;
      reasoning.push(`良好的速动比率: ${metrics.quickRatio.toFixed(2)}`);
    } else if (metrics.quickRatio > 0.8) {
      score += 0.5;
      reasoning.push(`可接受的速动比率: ${metrics.quickRatio.toFixed(2)}`);
    } else {
      reasoning.push(`速动比率不足: ${metrics.quickRatio.toFixed(2)}`);
    }
  } else {
    reasoning.push('速动比率数据不可用');
  }
  
  return {
    score: Math.min(2, score), // 最高2分
    details: reasoning.join('；')
  };
}

/**
 * 分析偿债能力 (0-2分)
 */
function analyzeSolvency(metrics: any): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 检查负债比率
  if (metrics.debtToEquity !== undefined) {
    if (metrics.debtToEquity < 0.3) {
      score += 1;
      reasoning.push(`极低的负债权益比: ${metrics.debtToEquity.toFixed(2)}`);
    } else if (metrics.debtToEquity < 0.5) {
      score += 0.75;
      reasoning.push(`良好的负债权益比: ${metrics.debtToEquity.toFixed(2)}`);
    } else if (metrics.debtToEquity < 1) {
      score += 0.5;
      reasoning.push(`可接受的负债权益比: ${metrics.debtToEquity.toFixed(2)}`);
    } else {
      reasoning.push(`负债权益比偏高: ${metrics.debtToEquity.toFixed(2)}`);
    }
  } else {
    reasoning.push('负债权益比数据不可用');
  }
  
  // 检查利息保障倍数
  if (metrics.interestCoverage !== undefined) {
    if (metrics.interestCoverage > 10) {
      score += 1;
      reasoning.push(`出色的利息保障倍数: ${metrics.interestCoverage.toFixed(2)}倍`);
    } else if (metrics.interestCoverage > 5) {
      score += 0.75;
      reasoning.push(`良好的利息保障倍数: ${metrics.interestCoverage.toFixed(2)}倍`);
    } else if (metrics.interestCoverage > 2) {
      score += 0.5;
      reasoning.push(`可接受的利息保障倍数: ${metrics.interestCoverage.toFixed(2)}倍`);
    } else {
      reasoning.push(`利息保障倍数不足: ${metrics.interestCoverage.toFixed(2)}倍`);
    }
  } else {
    reasoning.push('利息保障倍数数据不可用');
  }
  
  return {
    score: Math.min(2, score), // 最高2分
    details: reasoning.join('；')
  };
}

/**
 * 分析效率/运营效率 (0-2分)
 */
function analyzeEfficiency(metrics: any): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 检查资产周转率
  if (metrics.assetTurnover !== undefined) {
    if (metrics.assetTurnover > 1) {
      score += 1;
      reasoning.push(`高资产周转率: ${metrics.assetTurnover.toFixed(2)}`);
    } else if (metrics.assetTurnover > 0.7) {
      score += 0.75;
      reasoning.push(`良好的资产周转率: ${metrics.assetTurnover.toFixed(2)}`);
    } else if (metrics.assetTurnover > 0.4) {
      score += 0.5;
      reasoning.push(`中等资产周转率: ${metrics.assetTurnover.toFixed(2)}`);
    } else {
      reasoning.push(`低资产周转率: ${metrics.assetTurnover.toFixed(2)}`);
    }
  } else {
    reasoning.push('资产周转率数据不可用');
  }
  
  // 检查应收账款周转率
  if (metrics.receivablesTurnover !== undefined) {
    if (metrics.receivablesTurnover > 8) {
      score += 0.5;
      reasoning.push(`优秀的应收账款周转率: ${metrics.receivablesTurnover.toFixed(2)}`);
    } else if (metrics.receivablesTurnover > 5) {
      score += 0.3;
      reasoning.push(`良好的应收账款周转率: ${metrics.receivablesTurnover.toFixed(2)}`);
    } else {
      reasoning.push(`低应收账款周转率: ${metrics.receivablesTurnover.toFixed(2)}`);
    }
  } else {
    reasoning.push('应收账款周转率数据不可用');
  }
  
  // 检查存货周转率
  if (metrics.inventoryTurnover !== undefined) {
    if (metrics.inventoryTurnover > 8) {
      score += 0.5;
      reasoning.push(`优秀的存货周转率: ${metrics.inventoryTurnover.toFixed(2)}`);
    } else if (metrics.inventoryTurnover > 5) {
      score += 0.3;
      reasoning.push(`良好的存货周转率: ${metrics.inventoryTurnover.toFixed(2)}`);
    } else {
      reasoning.push(`低存货周转率: ${metrics.inventoryTurnover.toFixed(2)}`);
    }
  } else {
    reasoning.push('存货周转率数据不可用');
  }
  
  return {
    score: Math.min(2, score), // 最高2分
    details: reasoning.join('；')
  };
}

/**
 * 生成基本面分析综合评价
 */
function generateFundamentalReasoning(
  totalScore: number,
  profitability: { score: number; details: string },
  liquidity: { score: number; details: string },
  solvency: { score: number; details: string },
  efficiency: { score: number; details: string }
): string {
  const maxScore = 10;
  
  // 基于总分评价公司基本面
  let overallAssessment = '';
  if (totalScore >= 8) {
    overallAssessment = '公司基本面极其强劲，财务状况优异，符合价值投资标准。';
  } else if (totalScore >= 6) {
    overallAssessment = '公司基本面良好，财务状况健康，具有投资价值。';
  } else if (totalScore >= 4) {
    overallAssessment = '公司基本面一般，部分财务指标表现不佳，投资需谨慎。';
  } else {
    overallAssessment = '公司基本面较弱，财务状况存在隐忧，不符合价值投资标准。';
  }
  
  // 汇总各维度分析
  const details = [
    `盈利能力: ${profitability.details}`,
    `流动性: ${liquidity.details}`,
    `偿债能力: ${solvency.details}`,
    `运营效率: ${efficiency.details}`
  ];
  
  return `${overallAssessment} 总分: ${totalScore}/${maxScore}。\n${details.join('\n')}`;
} 