import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('managementTools');

/**
 * 分析公司管理层质量的工具
 * 
 * 巴菲特高度重视管理层的质量和诚信度，这是其投资决策的关键因素之一
 */
export const analyzeManagementTool = createTool({
  name: 'analyzeManagementTool',
  description: '分析公司管理层质量',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    managementData: z.any().describe('公司管理层和资本分配数据')
  }),
  execute: async ({ ticker, managementData }: { ticker: string, managementData: any }) => {
    logger.info('分析公司管理层质量', { ticker });
    
    try {
      if (!managementData) {
        throw new Error('缺少管理层相关数据');
      }
      
      // 分析资本分配能力
      const capitalAllocationResult = analyzeCapitalAllocation(managementData);
      
      // 分析股东回报
      const shareholderReturnsResult = analyzeSharholderReturns(managementData);
      
      // 分析管理层薪酬
      const executiveCompensationResult = analyzeExecutiveCompensation(managementData);
      
      // 分析管理层持股
      const insiderOwnershipResult = analyzeInsiderOwnership(managementData);
      
      // 计算总管理层评分 (0-5分)
      const totalScore = 
        capitalAllocationResult.score + 
        shareholderReturnsResult.score + 
        executiveCompensationResult.score + 
        insiderOwnershipResult.score;
      
      return {
        score: Math.min(5, totalScore), // 最高5分
        analysis: {
          capitalAllocation: capitalAllocationResult,
          shareholderReturns: shareholderReturnsResult,
          executiveCompensation: executiveCompensationResult,
          insiderOwnership: insiderOwnershipResult
        },
        reasoning: generateManagementReasoning(
          totalScore,
          capitalAllocationResult,
          shareholderReturnsResult,
          executiveCompensationResult,
          insiderOwnershipResult
        )
      };
    } catch (error) {
      logger.error('管理层质量分析失败', error);
      return {
        score: 0,
        analysis: {
          capitalAllocation: { score: 0, details: '数据不足' },
          shareholderReturns: { score: 0, details: '数据不足' },
          executiveCompensation: { score: 0, details: '数据不足' },
          insiderOwnership: { score: 0, details: '数据不足' }
        },
        reasoning: '无法分析管理层质量，数据不足'
      };
    }
  }
});

/**
 * 分析资本分配能力 (0-2分)
 */
function analyzeCapitalAllocation(managementData: any): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 分析投资回报率
  if (managementData.roic !== undefined) {
    const roicAvg = Array.isArray(managementData.roic) 
      ? calculateAverage(managementData.roic) 
      : managementData.roic;
    
    if (roicAvg > 0.15) {
      score += 0.75;
      reasoning.push(`优秀的投资回报率 (ROIC: ${(roicAvg * 100).toFixed(1)}%)`);
    } else if (roicAvg > 0.10) {
      score += 0.5;
      reasoning.push(`良好的投资回报率 (ROIC: ${(roicAvg * 100).toFixed(1)}%)`);
    } else if (roicAvg > 0.07) {
      score += 0.25;
      reasoning.push(`一般的投资回报率 (ROIC: ${(roicAvg * 100).toFixed(1)}%)`);
    } else {
      reasoning.push(`较差的投资回报率 (ROIC: ${(roicAvg * 100).toFixed(1)}%)`);
    }
  } else {
    reasoning.push('缺少ROIC数据');
  }
  
  // 分析并购表现
  if (managementData.acquisitionPerformance !== undefined) {
    if (managementData.acquisitionPerformance === 'excellent') {
      score += 0.5;
      reasoning.push('并购决策表现出色');
    } else if (managementData.acquisitionPerformance === 'good') {
      score += 0.3;
      reasoning.push('并购决策表现良好');
    } else if (managementData.acquisitionPerformance === 'poor') {
      reasoning.push('并购决策表现不佳');
    }
  }
  
  // 分析研发投资效率
  if (managementData.rndEfficiency !== undefined) {
    if (managementData.rndEfficiency > 0.2) {
      score += 0.5;
      reasoning.push('研发投资效率高');
    } else if (managementData.rndEfficiency > 0.1) {
      score += 0.25;
      reasoning.push('研发投资效率一般');
    } else {
      reasoning.push('研发投资效率低');
    }
  }
  
  // 分析资本支出质量
  if (managementData.capexQuality !== undefined) {
    if (managementData.capexQuality === 'excellent') {
      score += 0.25;
      reasoning.push('资本支出决策明智');
    } else if (managementData.capexQuality === 'good') {
      score += 0.15;
      reasoning.push('资本支出决策良好');
    } else {
      reasoning.push('资本支出决策平庸');
    }
  }
  
  return {
    score: Math.min(2, score), // 最高2分
    details: reasoning.join('；')
  };
}

/**
 * 分析股东回报 (0-1.5分)
 */
function analyzeSharholderReturns(managementData: any): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 分析股息政策
  if (managementData.dividendHistory !== undefined) {
    if (managementData.dividendGrowth && managementData.dividendGrowth > 0.07) {
      score += 0.5;
      reasoning.push(`持续增长的股息 (年增长率: ${(managementData.dividendGrowth * 100).toFixed(1)}%)`);
    } else if (managementData.dividendGrowth && managementData.dividendGrowth > 0) {
      score += 0.25;
      reasoning.push(`稳定的股息 (年增长率: ${(managementData.dividendGrowth * 100).toFixed(1)}%)`);
    } else if (managementData.dividendHistory === 'stable') {
      score += 0.15;
      reasoning.push('稳定的股息支付');
    } else {
      reasoning.push('波动或缺乏股息');
    }
  }
  
  // 分析股票回购
  if (managementData.shareRepurchases !== undefined) {
    if (managementData.shareRepurchases === 'intelligent') {
      score += 0.5;
      reasoning.push('明智的股票回购（在估值低时回购）');
    } else if (managementData.shareRepurchases === 'consistent') {
      score += 0.25;
      reasoning.push('持续的股票回购');
    } else if (managementData.shareRepurchases === 'poor') {
      reasoning.push('不明智的股票回购（在估值高时回购）');
    }
  }
  
  // 分析总股东回报
  if (managementData.totalShareholderReturn !== undefined) {
    if (managementData.totalShareholderReturn > 0.15) {
      score += 0.5;
      reasoning.push(`出色的总股东回报 (${(managementData.totalShareholderReturn * 100).toFixed(1)}%)`);
    } else if (managementData.totalShareholderReturn > 0.1) {
      score += 0.3;
      reasoning.push(`良好的总股东回报 (${(managementData.totalShareholderReturn * 100).toFixed(1)}%)`);
    } else if (managementData.totalShareholderReturn > 0.05) {
      score += 0.15;
      reasoning.push(`一般的总股东回报 (${(managementData.totalShareholderReturn * 100).toFixed(1)}%)`);
    } else {
      reasoning.push(`低于平均的总股东回报 (${(managementData.totalShareholderReturn * 100).toFixed(1)}%)`);
    }
  }
  
  return {
    score: Math.min(1.5, score), // 最高1.5分
    details: reasoning.join('；')
  };
}

/**
 * 分析管理层薪酬 (0-0.75分)
 */
function analyzeExecutiveCompensation(managementData: any): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 分析薪酬与业绩的关联
  if (managementData.compensationStructure !== undefined) {
    if (managementData.compensationStructure === 'performance_aligned') {
      score += 0.4;
      reasoning.push('薪酬结构与长期业绩紧密关联');
    } else if (managementData.compensationStructure === 'partially_aligned') {
      score += 0.2;
      reasoning.push('薪酬结构部分与业绩关联');
    } else {
      reasoning.push('薪酬结构与业绩关联性弱');
    }
  }
  
  // 分析薪酬水平的合理性
  if (managementData.compensationLevel !== undefined) {
    if (managementData.compensationLevel === 'reasonable') {
      score += 0.35;
      reasoning.push('薪酬水平合理适度');
    } else if (managementData.compensationLevel === 'slightly_high') {
      score += 0.15;
      reasoning.push('薪酬水平稍高');
    } else if (managementData.compensationLevel === 'excessive') {
      reasoning.push('薪酬水平过高');
    }
  }
  
  return {
    score: Math.min(0.75, score), // 最高0.75分
    details: reasoning.join('；')
  };
}

/**
 * 分析管理层持股 (0-0.75分)
 */
function analyzeInsiderOwnership(managementData: any): { score: number; details: string } {
  let score = 0;
  const reasoning = [];
  
  // 分析内部人持股比例
  if (managementData.insiderOwnership !== undefined) {
    if (managementData.insiderOwnership > 0.1) {
      score += 0.5;
      reasoning.push(`高水平的内部人持股 (${(managementData.insiderOwnership * 100).toFixed(1)}%)`);
    } else if (managementData.insiderOwnership > 0.05) {
      score += 0.3;
      reasoning.push(`良好的内部人持股 (${(managementData.insiderOwnership * 100).toFixed(1)}%)`);
    } else if (managementData.insiderOwnership > 0.01) {
      score += 0.15;
      reasoning.push(`有限的内部人持股 (${(managementData.insiderOwnership * 100).toFixed(1)}%)`);
    } else {
      reasoning.push(`很少的内部人持股 (${(managementData.insiderOwnership * 100).toFixed(1)}%)`);
    }
  }
  
  // 分析内部人交易模式
  if (managementData.insiderTrading !== undefined) {
    if (managementData.insiderTrading === 'buying') {
      score += 0.25;
      reasoning.push('内部人持续买入');
    } else if (managementData.insiderTrading === 'holding') {
      score += 0.15;
      reasoning.push('内部人持股稳定');
    } else if (managementData.insiderTrading === 'selling') {
      reasoning.push('内部人持续卖出');
    }
  }
  
  return {
    score: Math.min(0.75, score), // 最高0.75分
    details: reasoning.join('；')
  };
}

/**
 * 计算平均值
 */
function calculateAverage(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, value) => sum + value, 0) / data.length;
}

/**
 * 生成管理层质量分析综合评价
 */
function generateManagementReasoning(
  totalScore: number,
  capitalAllocation: { score: number; details: string },
  shareholderReturns: { score: number; details: string },
  executiveCompensation: { score: number; details: string },
  insiderOwnership: { score: number; details: string }
): string {
  const maxScore = 5;
  
  // 基于总分评价管理层质量
  let overallAssessment = '';
  if (totalScore >= 4) {
    overallAssessment = '公司拥有卓越的管理团队，资本分配明智，股东价值创造能力强。';
  } else if (totalScore >= 3) {
    overallAssessment = '公司管理团队质量良好，能够有效分配资本并创造股东价值。';
  } else if (totalScore >= 2) {
    overallAssessment = '公司管理团队表现一般，资本分配存在一定改进空间。';
  } else {
    overallAssessment = '公司管理团队质量不佳，资本分配效率低，股东价值创造有限。';
  }
  
  // 汇总各维度分析
  const details = [
    `资本分配: ${capitalAllocation.details}`,
    `股东回报: ${shareholderReturns.details}`,
    `管理层薪酬: ${executiveCompensation.details}`,
    `管理层持股: ${insiderOwnership.details}`
  ];
  
  return `${overallAssessment} 管理层质量得分: ${totalScore}/${maxScore}。\n${details.join('\n')}`;
} 