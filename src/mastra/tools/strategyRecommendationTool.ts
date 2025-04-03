import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('strategyRecommendationTool');

/**
 * 策略推荐工具 - 根据市场状况、风险承受能力和投资期限推荐最优交易策略
 * 
 * 该工具基于用户的风险偏好、投资期限、市场状况和当前宏观环境，
 * 使用多因子评分方法为用户推荐最适合的投资策略和参数配置。
 */
export const strategyRecommendationTool = createTool({
  name: 'strategyRecommendationTool',
  description: '根据市场状况、风险承受能力和投资期限推荐最优交易策略',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    riskTolerance: z.enum(['low', 'moderate', 'high']).describe('风险承受能力'),
    investmentHorizon: z.enum(['short', 'medium', 'long']).describe('投资期限'),
    marketCondition: z.enum(['bull', 'bear', 'neutral', 'volatile']).optional().describe('市场状况'),
    fundamentalData: z.any().optional().describe('基本面数据'),
    technicalData: z.any().optional().describe('技术指标数据'),
    macroEnvironment: z.any().optional().describe('宏观经济环境')
  }),
  execute: async ({ 
    ticker, 
    riskTolerance, 
    investmentHorizon, 
    marketCondition = 'neutral', 
    fundamentalData = null, 
    technicalData = null,
    macroEnvironment = null
  }) => {
    logger.info('生成策略推荐', { ticker, riskTolerance, investmentHorizon, marketCondition });
    
    try {
      // 第一步: 评估每种策略的适应性分数
      const strategyScores = evaluateStrategyScores(
        riskTolerance, 
        investmentHorizon, 
        marketCondition,
        fundamentalData,
        technicalData,
        macroEnvironment
      );
      
      // 第二步: 确定推荐策略和组合
      const { 
        primaryStrategy,
        secondaryStrategy,
        allocation, 
        parameters 
      } = determineRecommendedStrategies(strategyScores, riskTolerance);
      
      // 第三步: 生成解释和建议
      const explanation = generateStrategyExplanation(
        primaryStrategy, 
        secondaryStrategy,
        allocation,
        riskTolerance, 
        investmentHorizon, 
        marketCondition
      );
      
      // 第四步: 生成具体的交易规则
      const tradingRules = generateTradingRules(
        primaryStrategy, 
        parameters, 
        ticker, 
        riskTolerance
      );
      
      // 构建响应
      return {
        ticker,
        recommendationDate: new Date().toISOString(),
        riskProfile: {
          tolerance: riskTolerance,
          horizon: investmentHorizon,
          marketCondition
        },
        recommendation: {
          primaryStrategy,
          secondaryStrategy,
          allocation,
          parameters,
          tradingRules,
          explanation
        },
        strategyScores,
        confidence: calculateConfidenceScore(strategyScores, fundamentalData, technicalData),
        disclaimer: "此推荐基于当前市场状况和历史数据，投资有风险，实际结果可能因市场变化而不同。"
      };
    } catch (error) {
      logger.error('策略推荐生成失败', error);
      return {
        ticker,
        error: `策略推荐失败: ${error instanceof Error ? error.message : String(error)}`,
        fallbackRecommendation: getFallbackRecommendation(riskTolerance)
      };
    }
  }
});

/**
 * 评估每种策略的适应性分数
 */
function evaluateStrategyScores(
  riskTolerance: string,
  investmentHorizon: string,
  marketCondition: string,
  fundamentalData: any,
  technicalData: any,
  macroEnvironment: any
): Record<string, number> {
  // 策略评分初始化
  const scores: Record<string, number> = {
    value: 0,        // 价值投资
    growth: 0,       // 成长投资 
    momentum: 0,     // 动量策略
    meanReversion: 0, // 均值回归
    trend: 0,        // 趋势跟踪
    technical: 0,    // 技术分析
    quantitative: 0, // 量化模型
    dividend: 0,     // 股息投资
    factorBased: 0   // 因子模型
  };
  
  // 根据风险承受能力评分
  if (riskTolerance === 'low') {
    scores.value += 30;
    scores.dividend += 35;
    scores.meanReversion += 15;
    scores.factorBased += 10;
  } else if (riskTolerance === 'moderate') {
    scores.growth += 20;
    scores.value += 20;
    scores.meanReversion += 20;
    scores.factorBased += 20;
    scores.technical += 15;
  } else { // high
    scores.momentum += 30;
    scores.growth += 25;
    scores.trend += 20;
    scores.technical += 25;
    scores.quantitative += 20;
  }
  
  // 根据投资期限评分
  if (investmentHorizon === 'short') { // 短期 (3-6个月)
    scores.momentum += 20;
    scores.technical += 20;
    scores.meanReversion += 15;
    scores.trend += 15;
    scores.value -= 15;
    scores.dividend -= 10;
  } else if (investmentHorizon === 'medium') { // 中期 (6-18个月)
    scores.trend += 15;
    scores.growth += 15;
    scores.factorBased += 15;
    scores.quantitative += 10;
  } else { // 长期 (18个月以上)
    scores.value += 25;
    scores.growth += 15;
    scores.dividend += 20;
    scores.momentum -= 10;
    scores.technical -= 10;
  }
  
  // 根据市场状况评分
  if (marketCondition === 'bull') {
    scores.momentum += 20;
    scores.growth += 15;
    scores.trend += 15;
    scores.meanReversion -= 10;
  } else if (marketCondition === 'bear') {
    scores.value += 15;
    scores.dividend += 15;
    scores.meanReversion += 20;
    scores.momentum -= 15;
    scores.growth -= 10;
  } else if (marketCondition === 'volatile') {
    scores.meanReversion += 20;
    scores.factorBased += 15;
    scores.quantitative += 15;
    scores.trend -= 10;
  }
  
  // 如果有基本面数据，进一步调整分数
  if (fundamentalData) {
    // 估值低 -> 提高价值策略
    if (fundamentalData.pe < 15 || fundamentalData.pb < 1.5) {
      scores.value += 15;
      scores.dividend += 10;
    }
    
    // 高增长 -> 提高成长策略
    if (fundamentalData.revenueGrowth > 0.15 || fundamentalData.epsGrowth > 0.2) {
      scores.growth += 20;
      scores.momentum += 10;
    }
    
    // 高股息 -> 提高股息策略
    if (fundamentalData.dividendYield > 0.04) {
      scores.dividend += 25;
      scores.value += 10;
    }
  }
  
  // 如果有技术数据，进一步调整分数
  if (technicalData) {
    // 强势动量 -> 提高动量策略
    if ((technicalData.rsi && technicalData.rsi > 60 && technicalData.rsi < 75) || 
        (technicalData.macd && technicalData.macd.histogram > 0)) {
      scores.momentum += 15;
      scores.trend += 10;
    }
    
    // 超卖状态 -> 提高均值回归策略
    if ((technicalData.rsi && technicalData.rsi < 35) || 
        (technicalData.bollinger && technicalData.bollinger.percentB < 0.2)) {
      scores.meanReversion += 20;
      scores.momentum -= 10;
    }
    
    // 明确趋势 -> 提高趋势策略
    if (technicalData.adx && technicalData.adx > 25) {
      scores.trend += 20;
      scores.technical += 15;
    }
  }
  
  // 如果有宏观环境数据，进一步调整分数
  if (macroEnvironment) {
    // 高利率环境 -> 提高价值和股息策略
    if (macroEnvironment.interestRate > 0.04) {
      scores.value += 10;
      scores.dividend += 15;
      scores.growth -= 10;
    }
    
    // 低增长环境 -> 提高防御性策略
    if (macroEnvironment.gdpGrowth < 0.02) {
      scores.dividend += 10;
      scores.value += 5;
      scores.growth -= 10;
      scores.momentum -= 5;
    }
    
    // 高通胀环境 -> 调整策略适应性
    if (macroEnvironment.inflation > 0.04) {
      scores.value += 5;
      scores.growth -= 5;
      scores.factorBased += 10;
    }
  }
  
  // 规范化分数 (确保最低不小于0)
  Object.keys(scores).forEach(key => {
    scores[key] = Math.max(0, scores[key]);
  });
  
  return scores;
}

/**
 * 确定推荐的策略和参数
 */
function determineRecommendedStrategies(
  scores: Record<string, number>,
  riskTolerance: string
): {
  primaryStrategy: string;
  secondaryStrategy: string;
  allocation: Record<string, number>;
  parameters: Record<string, any>;
} {
  // 根据分数排序
  const sortedStrategies = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([strategy]) => strategy);
  
  const primaryStrategy = sortedStrategies[0];
  const secondaryStrategy = sortedStrategies[1];
  
  // 确定资产配置比例
  const primaryScore = scores[primaryStrategy];
  const secondaryScore = scores[secondaryStrategy];
  const totalScore = primaryScore + secondaryScore;
  
  const primaryAllocation = Math.round((primaryScore / totalScore) * 100);
  const secondaryAllocation = 100 - primaryAllocation;
  
  // 根据策略类型和风险承受能力确定参数
  const parameters: Record<string, any> = {};
  
  // 设置主要策略参数
  switch (primaryStrategy) {
    case 'value':
      parameters.primaryParams = {
        peRatio: riskTolerance === 'low' ? 15 : (riskTolerance === 'moderate' ? 20 : 25),
        pbRatio: riskTolerance === 'low' ? 1.5 : (riskTolerance === 'moderate' ? 2.0 : 2.5),
        dividendYield: riskTolerance === 'low' ? 3.0 : (riskTolerance === 'moderate' ? 2.0 : 1.0),
        roe: 15
      };
      break;
    case 'momentum':
      parameters.primaryParams = {
        lookbackPeriod: riskTolerance === 'low' ? 12 : (riskTolerance === 'moderate' ? 6 : 3),
        maShortPeriod: riskTolerance === 'low' ? 50 : (riskTolerance === 'moderate' ? 20 : 10),
        maLongPeriod: riskTolerance === 'low' ? 200 : (riskTolerance === 'moderate' ? 100 : 50),
        minimumMomentum: 0.05
      };
      break;
    case 'meanReversion':
      parameters.primaryParams = {
        rsiPeriod: 14,
        rsiOversold: riskTolerance === 'low' ? 35 : (riskTolerance === 'moderate' ? 30 : 25),
        rsiOverbought: riskTolerance === 'low' ? 65 : (riskTolerance === 'moderate' ? 70 : 75),
        bollingerPeriod: 20,
        bollingerDeviation: riskTolerance === 'low' ? 1.5 : (riskTolerance === 'moderate' ? 2.0 : 2.5)
      };
      break;
    case 'trend':
      parameters.primaryParams = {
        adxThreshold: 25,
        trendStrength: riskTolerance === 'low' ? 'strong' : (riskTolerance === 'moderate' ? 'medium' : 'any'),
        stopLoss: riskTolerance === 'low' ? 0.05 : (riskTolerance === 'moderate' ? 0.08 : 0.12)
      };
      break;
    case 'dividend':
      parameters.primaryParams = {
        minYield: riskTolerance === 'low' ? 4.0 : (riskTolerance === 'moderate' ? 3.0 : 2.0),
        payoutRatioMax: riskTolerance === 'low' ? 0.6 : (riskTolerance === 'moderate' ? 0.7 : 0.8),
        dividendGrowth: riskTolerance === 'low' ? 0.05 : (riskTolerance === 'moderate' ? 0.03 : 0.01)
      };
      break;
    default:
      parameters.primaryParams = {
        riskLevel: riskTolerance,
        customized: false
      };
  }
  
  // 设置次要策略参数 (简化版本)
  switch (secondaryStrategy) {
    case 'value':
      parameters.secondaryParams = {
        peRatio: riskTolerance === 'low' ? 15 : (riskTolerance === 'moderate' ? 20 : 25),
        pbRatio: riskTolerance === 'low' ? 1.5 : (riskTolerance === 'moderate' ? 2.0 : 2.5)
      };
      break;
    case 'momentum':
      parameters.secondaryParams = {
        lookbackPeriod: riskTolerance === 'low' ? 12 : (riskTolerance === 'moderate' ? 6 : 3),
        maShortPeriod: 20,
        maLongPeriod: 50
      };
      break;
    case 'meanReversion':
      parameters.secondaryParams = {
        rsiPeriod: 14,
        rsiOversold: 30,
        rsiOverbought: 70
      };
      break;
    default:
      parameters.secondaryParams = {
        riskLevel: riskTolerance
      };
  }
  
  // 风险管理参数
  parameters.riskManagement = {
    maxPositionSize: riskTolerance === 'low' ? 0.05 : (riskTolerance === 'moderate' ? 0.1 : 0.15),
    stopLoss: riskTolerance === 'low' ? 0.05 : (riskTolerance === 'moderate' ? 0.1 : 0.15),
    takeProfit: riskTolerance === 'low' ? 0.1 : (riskTolerance === 'moderate' ? 0.2 : 0.3),
    trailingStop: riskTolerance === 'low' ? true : (riskTolerance === 'high' ? false : true)
  };
  
  return {
    primaryStrategy,
    secondaryStrategy,
    allocation: {
      [primaryStrategy]: primaryAllocation,
      [secondaryStrategy]: secondaryAllocation
    },
    parameters
  };
}

/**
 * 生成策略解释
 */
function generateStrategyExplanation(
  primaryStrategy: string,
  secondaryStrategy: string,
  allocation: Record<string, number>,
  riskTolerance: string,
  investmentHorizon: string,
  marketCondition: string
): string {
  const strategyDescriptions: Record<string, string> = {
    value: '价值投资策略专注于寻找相对于其内在价值被低估的股票，通常关注低市盈率、低市净率及稳定的股息',
    growth: '成长投资策略关注有强劲收入和盈利增长潜力的公司，即使估值相对较高',
    momentum: '动量策略专注于追踪已经展示强劲价格上涨趋势的股票，基于价格将继续朝相同方向移动的原理',
    meanReversion: '均值回归策略寻找偏离其历史均值的股票，预期它们会回归到正常水平',
    trend: '趋势跟踪策略识别并跟随长期市场趋势，在趋势确立后进场，趋势结束时退出',
    technical: '技术分析策略基于价格模式、交易量和技术指标来识别交易机会',
    quantitative: '量化策略使用数学和统计模型分析市场数据，自动执行交易决策',
    dividend: '股息策略投资于提供稳定、高股息的公司，专注于持续的收入流',
    factorBased: '因子投资策略基于特定的因子（如价值、质量、规模等）来选择股票'
  };
  
  // 风险承受能力和投资期限描述
  const riskToleranceDesc = {
    low: '保守型',
    moderate: '平衡型',
    high: '积极型'
  }[riskTolerance];
  
  const horizonDesc = {
    short: '短期(3-6个月)',
    medium: '中期(6-18个月)',
    long: '长期(18个月以上)'
  }[investmentHorizon];
  
  const marketDesc = {
    bull: '牛市',
    bear: '熊市',
    neutral: '中性市场',
    volatile: '波动市场'
  }[marketCondition];
  
  // 构建解释
  return `基于您${riskToleranceDesc}的风险承受能力和${horizonDesc}的投资期限，在当前${marketDesc}环境下，我们推荐以下策略组合:
  
1. ${allocation[primaryStrategy]}% ${primaryStrategy}策略: ${strategyDescriptions[primaryStrategy]}
2. ${allocation[secondaryStrategy]}% ${secondaryStrategy}策略: ${strategyDescriptions[secondaryStrategy]}

这种组合旨在平衡风险和收益，适应当前市场环境，同时符合您的投资目标。`;
}

/**
 * 生成交易规则
 */
function generateTradingRules(
  strategy: string,
  parameters: Record<string, any>,
  ticker: string,
  riskTolerance: string
): any {
  const baseRules = {
    entrySignals: [],
    exitSignals: [],
    positionSizing: parameters.riskManagement.maxPositionSize,
    stopLoss: parameters.riskManagement.stopLoss,
    takeProfit: parameters.riskManagement.takeProfit,
    trailingStop: parameters.riskManagement.trailingStop
  };
  
  // 根据主要策略类型设置具体的入场和出场信号
  switch (strategy) {
    case 'value':
      return {
        ...baseRules,
        entrySignals: [
          `股票${ticker}的市盈率低于${parameters.primaryParams.peRatio}`,
          `股票${ticker}的市净率低于${parameters.primaryParams.pbRatio}`,
          `股票${ticker}的ROE高于${parameters.primaryParams.roe}%`
        ],
        exitSignals: [
          `股票${ticker}的市盈率高于${parameters.primaryParams.peRatio * 1.5}`,
          `股票${ticker}的市净率高于${parameters.primaryParams.pbRatio * 1.5}`,
          '基本面发生显著恶化'
        ],
        timeframe: '周线或月线',
        reviewFrequency: '季度'
      };
    case 'momentum':
      return {
        ...baseRules,
        entrySignals: [
          `股票${ticker}的价格突破${parameters.primaryParams.maShortPeriod}日均线`,
          `${parameters.primaryParams.maShortPeriod}日均线上穿${parameters.primaryParams.maLongPeriod}日均线`,
          `股票${ticker}过去${parameters.primaryParams.lookbackPeriod}个月表现超过大盘${parameters.primaryParams.minimumMomentum * 100}%`
        ],
        exitSignals: [
          `股票${ticker}的价格跌破${parameters.primaryParams.maShortPeriod}日均线`,
          `${parameters.primaryParams.maShortPeriod}日均线下穿${parameters.primaryParams.maLongPeriod}日均线`,
          '动量指标显著减弱'
        ],
        timeframe: '日线',
        reviewFrequency: '每周'
      };
    case 'meanReversion':
      return {
        ...baseRules,
        entrySignals: [
          `RSI(${parameters.primaryParams.rsiPeriod})低于${parameters.primaryParams.rsiOversold}进入超卖区域`,
          `股票${ticker}价格触及布林带下轨(${parameters.primaryParams.bollingerPeriod}日, ${parameters.primaryParams.bollingerDeviation}标准差)`,
          '股价偏离20日均线超过2个标准差'
        ],
        exitSignals: [
          `RSI(${parameters.primaryParams.rsiPeriod})高于${parameters.primaryParams.rsiOverbought}进入超买区域`,
          '股价回归均线',
          `股票${ticker}价格触及布林带上轨`
        ],
        timeframe: '日线',
        reviewFrequency: '每日'
      };
    case 'trend':
      return {
        ...baseRules,
        entrySignals: [
          `ADX高于${parameters.primaryParams.adxThreshold}确认趋势存在`,
          '价格形成更高的高点和更高的低点(上升趋势)',
          '价格突破重要阻力位'
        ],
        exitSignals: [
          '价格跌破关键趋势线',
          '形成反转图形',
          'ADX下降并低于20'
        ],
        timeframe: '日线和周线结合',
        reviewFrequency: '每周'
      };
    case 'dividend':
      return {
        ...baseRules,
        entrySignals: [
          `股息率高于${parameters.primaryParams.minYield}%`,
          `分红派息率低于${parameters.primaryParams.payoutRatioMax * 100}%`,
          `股息年增长率高于${parameters.primaryParams.dividendGrowth * 100}%`
        ],
        exitSignals: [
          '公司削减或暂停股息',
          '股息覆盖率显著下降',
          '公司基本面恶化'
        ],
        timeframe: '月线或季线',
        reviewFrequency: '半年'
      };
    default:
      return baseRules;
  }
}

/**
 * 计算推荐置信度
 */
function calculateConfidenceScore(
  scores: Record<string, number>,
  fundamentalData: any,
  technicalData: any
): number {
  // 获取主要策略的分数
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const topScore = sortedScores[0];
  const runnerUpScore = sortedScores[1];
  
  // 计算主要策略与次要策略的分数差距
  const scoreDifference = topScore - runnerUpScore;
  
  // 基础置信度 (60-80)
  let confidence = 70;
  
  // 根据分数差距调整置信度
  if (scoreDifference > 30) {
    confidence += 15; // 明显的首选策略
  } else if (scoreDifference < 10) {
    confidence -= 10; // 多个策略分数接近
  }
  
  // 如果有基本面或技术面数据，进一步调整置信度
  if (fundamentalData && technicalData) {
    confidence += 10; // 更多数据支持决策
  } else if (!fundamentalData && !technicalData) {
    confidence -= 10; // 缺乏数据支持
  }
  
  // 确保置信度在合理范围内 (50-95)
  return Math.min(95, Math.max(50, confidence));
}

/**
 * 获取备用推荐 (当出错时)
 */
function getFallbackRecommendation(riskTolerance: string): any {
  switch (riskTolerance) {
    case 'low':
      return {
        primaryStrategy: 'value',
        allocation: { value: 70, dividend: 30 },
        explanation: '基于您保守型的风险偏好，建议采用价值投资和股息策略的组合，专注于低估值和稳定收入的股票。'
      };
    case 'moderate':
      return {
        primaryStrategy: 'value',
        allocation: { value: 50, growth: 30, momentum: 20 },
        explanation: '基于您平衡型的风险偏好，建议采用价值投资为主，同时适当配置成长和动量策略。'
      };
    case 'high':
      return {
        primaryStrategy: 'momentum',
        allocation: { momentum: 60, growth: 40 },
        explanation: '基于您积极型的风险偏好，建议采用动量策略为主，配合成长策略，追求更高潜在回报。'
      };
    default:
      return {
        primaryStrategy: 'value',
        allocation: { value: 60, momentum: 40 },
        explanation: '采用均衡策略组合，平衡风险和收益。'
      };
  }
} 