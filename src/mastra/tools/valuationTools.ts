import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('valuationTools');

/**
 * 计算股票内在价值的工具
 * 
 * 基于巴菲特/格雷厄姆的价值投资理念，计算公司的内在价值
 * 使用多种估值方法，包括DCF、Graham公式和市盈率分析
 */
export const calculateIntrinsicValueTool = createTool({
  name: 'calculateIntrinsicValueTool',
  description: '计算股票的内在价值',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    financialData: z.any().describe('公司财务数据'),
    growthRate: z.number().optional().describe('预估增长率')
  }),
  execute: async ({ ticker, financialData, growthRate }: { 
    ticker: string, 
    financialData: any, 
    growthRate?: number 
  }) => {
    logger.info('计算内在价值', { ticker });
    
    try {
      // 使用多种估值模型
      const dcfValue = calculateDCFValue(financialData, growthRate);
      const grahamValue = calculateGrahamValue(financialData);
      const epvValue = calculateEPVValue(financialData);
      
      // 综合估值结果
      const intrinsicValue = combineValuations([dcfValue, grahamValue, epvValue]);
      
      // 计算估值的置信区间
      const confidenceInterval = calculateConfidenceInterval(
        intrinsicValue,
        [dcfValue, grahamValue, epvValue]
      );
      
      return {
        intrinsicValue,
        valuation: {
          dcf: dcfValue,
          graham: grahamValue,
          epv: epvValue
        },
        confidenceInterval,
        reasoning: generateValuationReasoning(financialData, intrinsicValue, confidenceInterval)
      };
    } catch (error) {
      logger.error('内在价值计算失败', error);
      return {
        intrinsicValue: null,
        valuation: {
          dcf: null,
          graham: null,
          epv: null
        },
        confidenceInterval: null,
        reasoning: '无法计算内在价值，数据不足'
      };
    }
  }
});

/**
 * 使用DCF模型计算内在价值
 * 
 * 折现现金流模型是巴菲特经常使用的估值方法
 */
function calculateDCFValue(financialData: any, customGrowthRate?: number): number | null {
  if (!financialData || !financialData.freeCashFlow || !financialData.wacc) {
    return null;
  }
  
  const freeCashFlow = financialData.freeCashFlow;
  const wacc = financialData.wacc || 0.1; // 加权平均资本成本，默认10%
  
  // 使用提供的增长率或基于历史计算
  let currentGrowthRate = customGrowthRate || estimateGrowthRate(financialData);
  
  // DCF计算参数
  const forecastYears = 10;
  const terminalGrowthRate = 0.03; // 永续增长率3%
  
  // 计算预测期现金流现值
  let presentValue = 0;
  let currentCashFlow = freeCashFlow;
  
  for (let year = 1; year <= forecastYears; year++) {
    currentCashFlow *= (1 + currentGrowthRate);
    // 增长率逐年降低到永续增长率
    currentGrowthRate = Math.max(
      terminalGrowthRate,
      currentGrowthRate - (currentGrowthRate - terminalGrowthRate) / forecastYears
    );
    
    // 计算现值
    presentValue += currentCashFlow / Math.pow(1 + wacc, year);
  }
  
  // 计算永续价值
  const terminalValue = currentCashFlow * (1 + terminalGrowthRate) / 
                        (wacc - terminalGrowthRate);
  
  // 永续价值现值
  const presentTerminalValue = terminalValue / Math.pow(1 + wacc, forecastYears);
  
  // 总企业价值
  const enterpriseValue = presentValue + presentTerminalValue;
  
  // 股权价值 = 企业价值 - 净债务
  const equityValue = enterpriseValue - (financialData.totalDebt - financialData.cashAndEquivalents);
  
  // 每股内在价值
  return equityValue / financialData.sharesOutstanding;
}

/**
 * 使用本杰明·格雷厄姆公式计算内在价值
 */
function calculateGrahamValue(financialData: any): number | null {
  if (!financialData || !financialData.eps || !financialData.bookValuePerShare) {
    return null;
  }
  
  const eps = financialData.eps; // 每股收益
  const bvps = financialData.bookValuePerShare; // 每股账面价值
  const growthRate = financialData.estimatedGrowthRate || 0.07; // 预估增长率，默认7%
  
  // 格雷厄姆公式: √(22.5 * EPS * BVPS)
  return Math.sqrt(22.5 * eps * bvps);
}

/**
 * 计算收益能力价值(EPV)
 * 
 * 基于布鲁斯·格林沃尔德的估值方法，专注于企业当前收益能力
 */
function calculateEPVValue(financialData: any): number | null {
  if (!financialData || !financialData.operatingIncome || !financialData.sharesOutstanding) {
    return null;
  }
  
  const operatingIncome = financialData.operatingIncome;
  const taxRate = financialData.taxRate || 0.21; // 默认税率21%
  const requiredReturn = financialData.requiredReturn || 0.15; // 要求回报率，默认15%
  const sharesOutstanding = financialData.sharesOutstanding;
  
  // 计算税后营业收入
  const nopat = operatingIncome * (1 - taxRate);
  
  // 收益能力价值 = 税后营业收入 / 要求回报率
  const epvValue = nopat / requiredReturn;
  
  // 每股EPV
  return epvValue / sharesOutstanding;
}

/**
 * 根据历史数据估计增长率
 */
function estimateGrowthRate(financialData: any): number {
  if (!financialData || !financialData.historicalEPS || financialData.historicalEPS.length < 2) {
    return 0.07; // 默认7%增长率
  }
  
  const eps = financialData.historicalEPS;
  const years = eps.length;
  
  // 计算年复合增长率
  const startEPS = eps[0];
  const endEPS = eps[years - 1];
  
  // CAGR计算公式: (终值/初值)^(1/年数) - 1
  const cagr = Math.pow(endEPS / startEPS, 1 / (years - 1)) - 1;
  
  // 限制在合理范围内
  return Math.max(0.03, Math.min(0.20, cagr));
}

/**
 * 综合多种估值结果
 */
function combineValuations(valuations: (number | null)[]): number | null {
  // 过滤掉null值
  const validValues = valuations.filter(val => val !== null) as number[];
  
  if (validValues.length === 0) {
    return null;
  }
  
  // 使用中位数避免极端值影响
  validValues.sort((a, b) => a - b);
  const middleIndex = Math.floor(validValues.length / 2);
  
  if (validValues.length % 2 === 0) {
    return (validValues[middleIndex - 1] + validValues[middleIndex]) / 2;
  } else {
    return validValues[middleIndex];
  }
}

/**
 * 计算估值置信区间
 */
function calculateConfidenceInterval(
  centralValue: number | null,
  valuations: (number | null)[]
): { low: number | null; high: number | null } | null {
  if (centralValue === null) {
    return null;
  }
  
  // 过滤掉null值
  const validValues = valuations.filter(val => val !== null) as number[];
  
  if (validValues.length < 2) {
    // 至少需要2个有效估值
    return {
      low: centralValue * 0.8, // 简单地使用中心值的80%
      high: centralValue * 1.2  // 简单地使用中心值的120%
    };
  }
  
  // 计算标准差
  const avg = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  const squaredDiffs = validValues.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / validValues.length;
  const stdDev = Math.sqrt(variance);
  
  // 使用标准差构建置信区间
  return {
    low: Math.max(0, centralValue - stdDev), // 确保下限不小于0
    high: centralValue + stdDev
  };
}

/**
 * 生成估值分析理由
 */
function generateValuationReasoning(
  financialData: any,
  intrinsicValue: number | null,
  confidenceInterval: { low: number | null; high: number | null } | null
): string {
  if (intrinsicValue === null) {
    return '数据不足，无法生成可靠的内在价值估计';
  }
  
  const currentPrice = financialData.currentPrice || null;
  
  let reasoning = `估计内在价值为每股$${intrinsicValue.toFixed(2)}`;
  
  if (confidenceInterval && confidenceInterval.low !== null && confidenceInterval.high !== null) {
    reasoning += `，置信区间为$${confidenceInterval.low.toFixed(2)}-$${confidenceInterval.high.toFixed(2)}`;
  }
  
  if (currentPrice) {
    const marginOfSafety = (intrinsicValue - currentPrice) / currentPrice;
    
    if (marginOfSafety > 0.3) {
      reasoning += `。当前市价$${currentPrice.toFixed(2)}，提供${(marginOfSafety * 100).toFixed(0)}%的安全边际，符合巴菲特的投资标准。`;
    } else if (marginOfSafety > 0) {
      reasoning += `。当前市价$${currentPrice.toFixed(2)}，安全边际${(marginOfSafety * 100).toFixed(0)}%不足，投资需谨慎。`;
    } else {
      reasoning += `。当前市价$${currentPrice.toFixed(2)}高于估计内在价值，不符合价值投资标准。`;
    }
  }
  
  return reasoning;
}