'use server'

import { createLogger } from '@/lib/logger.server';
import { 
  valueInvestingAgent, 
  growthInvestingAgent, 
  quantInvestingAgent,
  technicalAnalysisAgent,
  riskManagementAgent,
  strategyRecommendationAgent
} from '@/mastra/agents';
import { MarketDataService } from '@/services/marketDataService';
import { revalidatePath } from 'next/cache';
import { BacktestResult, StrategyType } from './backtest-strategy';

const logger = createLogger('ai-strategy-evaluation');
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
 * 策略评估结果接口
 */
export interface StrategyEvaluationResult {
  strategyType: StrategyType;
  ticker: string;
  performance: {
    overallScore: number; // 0-100
    returnScore: number; // 0-100
    riskScore: number; // 0-100
    consistencyScore: number; // 0-100
    efficiencyScore: number; // 0-100
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  improvements: {
    parameters: Record<string, any>;
    reasoning: string;
  };
  marketFit: {
    score: number; // 0-100
    rationale: string;
    suitableMarketConditions: string[];
  };
  analysisReport: string;
}

/**
 * 评估交易策略
 * 使用AI代理评估回测结果，提供分析和改进建议
 */
export async function evaluateStrategy(
  backtestResult: BacktestResult,
  strategyType: StrategyType,
  parameters: Record<string, any>,
  marketCondition: 'bull' | 'bear' | 'neutral' | 'volatile' = 'neutral'
): Promise<StrategyEvaluationResult> {
  try {
    logger.info('开始策略评估', { strategyType });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 1. 格式化回测结果
    const formattedBacktestResult = formatBacktestResult(backtestResult);
    
    // 2. 策略性能评估
    const performancePrompt = `
      请评估以下交易策略的性能指标，给出评分并分析优缺点:
      
      策略类型: ${strategyType}
      策略参数: ${JSON.stringify(parameters, null, 2)}
      
      回测结果指标:
      ${formattedBacktestResult}
      
      市场环境: ${marketCondition}
      
      请分析以下方面，并给出1-100的评分:
      1. 总收益性能评分，考虑总回报率和年化收益率
      2. 风险控制能力评分，考虑最大回撤、波动率和夏普比率
      3. 一致性评分，考虑月度收益的稳定性和胜率
      4. 执行效率评分，考虑交易频率和平均收益/亏损
      5. 整体绩效评分
      
      按以下JSON格式输出:
      {
        "overallScore": 85,
        "returnScore": 90,
        "riskScore": 75,
        "consistencyScore": 80,
        "efficiencyScore": 70,
        "strengths": ["优势1", "优势2", "优势3"],
        "weaknesses": ["劣势1", "劣势2", "劣势3"]
      }
    `;
    
    // 3. 策略机会与威胁分析
    const marketFitPrompt = `
      请分析以下交易策略在当前和不同市场环境下的适用性:
      
      策略类型: ${strategyType}
      策略参数: ${JSON.stringify(parameters, null, 2)}
      
      回测结果指标:
      ${formattedBacktestResult}
      
      当前市场环境: ${marketCondition}
      
      请分析:
      1. 该策略在当前市场环境下的适用性评分(1-100)及理由
      2. 该策略最适合的3种市场环境
      3. 该策略面临的市场机会
      4. 该策略面临的市场威胁
      
      按以下JSON格式输出:
      {
        "score": 80,
        "rationale": "该策略在当前市场环境下表现良好，因为...",
        "suitableMarketConditions": ["条件1", "条件2", "条件3"],
        "opportunities": ["机会1", "机会2", "机会3"],
        "threats": ["威胁1", "威胁2", "威胁3"]
      }
    `;
    
    // 4. 策略改进建议
    const improvementPrompt = `
      请为以下交易策略提供具体的改进建议:
      
      策略类型: ${strategyType}
      当前参数: ${JSON.stringify(parameters, null, 2)}
      
      回测结果指标:
      ${formattedBacktestResult}
      
      市场环境: ${marketCondition}
      
      根据回测结果，请提供:
      1. 具体的参数优化建议
      2. 风险管理改进建议
      3. 执行优化建议
      4. 可能的策略组合建议
      
      特别是给出可以直接实施的参数调整，如:
      - 移动平均线周期调整
      - 止损比例调整
      - 头寸规模调整
      - 其他相关参数优化
      
      按以下JSON格式输出:
      {
        "parameters": {
          "param1": 新值,
          "param2": 新值,
          "stopLoss": 新值,
          "positionSize": 新值
        },
        "reasoning": "详细说明调整理由和预期效果"
      }
    `;
    
    // 并行执行所有分析
    const [performanceResult, marketFitResult, improvementResult] = await Promise.all([
      quantInvestingAgent.run({ messages: [{ role: 'user', content: performancePrompt }] }),
      strategyRecommendationAgent.run({ messages: [{ role: 'user', content: marketFitPrompt }] }),
      riskManagementAgent.run({ messages: [{ role: 'user', content: improvementPrompt }] })
    ]);
    
    // 解析结果
    const performanceAnalysis = parseJsonFromAgentResponse(performanceResult.content);
    const marketFitAnalysis = parseJsonFromAgentResponse(marketFitResult.content);
    const improvementAnalysis = parseJsonFromAgentResponse(improvementResult.content);
    
    // 5. 生成综合报告
    const reportPrompt = `
      请根据以下策略评估结果，生成一份简洁专业的策略评估报告:
      
      策略类型: ${strategyType}
      策略参数: ${JSON.stringify(parameters, null, 2)}
      
      性能评估:
      ${performanceResult.content}
      
      市场适应性评估:
      ${marketFitResult.content}
      
      改进建议:
      ${improvementResult.content}
      
      生成一份不超过800字的综合评估报告，包括:
      1. 策略综述
      2. 关键优势和劣势
      3. 性能分析
      4. 最重要的改进建议
      5. 结论
    `;
    
    const reportResult = await strategyRecommendationAgent.run({
      messages: [{ role: 'user', content: reportPrompt }]
    });
    
    // 构建最终评估结果
    const result: StrategyEvaluationResult = {
      strategyType,
      ticker: backtestResult.strategy.parameters.ticker || 'N/A',
      performance: {
        overallScore: performanceAnalysis.overallScore || 50,
        returnScore: performanceAnalysis.returnScore || 50,
        riskScore: performanceAnalysis.riskScore || 50,
        consistencyScore: performanceAnalysis.consistencyScore || 50,
        efficiencyScore: performanceAnalysis.efficiencyScore || 50
      },
      strengths: performanceAnalysis.strengths || [],
      weaknesses: performanceAnalysis.weaknesses || [],
      opportunities: marketFitAnalysis.opportunities || [],
      threats: marketFitAnalysis.threats || [],
      improvements: {
        parameters: improvementAnalysis.parameters || {},
        reasoning: improvementAnalysis.reasoning || '无法获取具体改进建议'
      },
      marketFit: {
        score: marketFitAnalysis.score || 50,
        rationale: marketFitAnalysis.rationale || '无法评估市场适应性',
        suitableMarketConditions: marketFitAnalysis.suitableMarketConditions || []
      },
      analysisReport: reportResult.content
    };
    
    logger.info('策略评估完成', { 
      strategyType, 
      overallScore: result.performance.overallScore 
    });
    
    return result;
    
  } catch (error) {
    logger.error('策略评估失败', { strategyType, error });
    throw error;
  }
}

/**
 * 格式化回测结果，便于AI模型处理
 */
function formatBacktestResult(result: BacktestResult): string {
  return `
    回测期间: ${result.performance.startDate} 至 ${result.performance.endDate}
    初始资金: ${result.performance.initialCapital}
    最终资金: ${result.performance.finalCapital}
    
    收益指标:
    - 总收益率: ${(result.performance.totalReturn * 100).toFixed(2)}%
    - 年化收益率: ${(result.performance.annualizedReturn * 100).toFixed(2)}%
    
    风险指标:
    - 最大回撤: ${(result.performance.maxDrawdown * 100).toFixed(2)}%
    - 夏普比率: ${result.performance.sharpeRatio.toFixed(2)}
    - 波动率: ${(result.performance.volatility * 100).toFixed(2)}%
    
    交易统计:
    - 交易次数: ${result.tradeLog.length}
    - 胜率: ${(result.performance.winRate * 100).toFixed(2)}%
    - 平均盈利: ${result.performance.averageWin.toFixed(2)}
    - 平均亏损: ${result.performance.averageLoss.toFixed(2)}
    
    基准对比:
    ${result.comparisonToBenchmark ? `
    - 基准收益率: ${(result.comparisonToBenchmark.benchmarkReturn * 100).toFixed(2)}%
    - 超额收益: ${(result.comparisonToBenchmark.outperformance * 100).toFixed(2)}%
    - Alpha: ${result.comparisonToBenchmark.alpha.toFixed(2)}
    - Beta: ${result.comparisonToBenchmark.beta.toFixed(2)}` : '无基准对比'}
  `;
}

/**
 * 从代理响应中解析JSON
 */
function parseJsonFromAgentResponse(response: string): any {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    logger.error('解析JSON响应失败', { error, response });
    return {};
  }
}

/**
 * 比较多个策略的评估结果
 */
export async function compareStrategyEvaluations(
  evaluations: StrategyEvaluationResult[]
): Promise<{
  recommendations: {
    bestOverallStrategy: string;
    bestRiskAdjustedStrategy: string;
    bestConsistencyStrategy: string;
    mostPromisingStrategy: string;
  };
  comparisonReport: string;
}> {
  try {
    if (evaluations.length < 2) {
      throw new Error('至少需要两个策略评估结果才能进行比较');
    }
    
    logger.info('比较策略评估结果', { strategiesCount: evaluations.length });
    
    // 创建比较提示
    const comparisonPrompt = `
      请比较以下交易策略的评估结果，并提供策略选择建议:
      
      ${evaluations.map((evaluation, index) => `
      策略 ${index + 1}: ${evaluation.strategyType}
      整体得分: ${evaluation.performance.overallScore}
      收益得分: ${evaluation.performance.returnScore}
      风险得分: ${evaluation.performance.riskScore}
      一致性得分: ${evaluation.performance.consistencyScore}
      效率得分: ${evaluation.performance.efficiencyScore}
      市场适应性得分: ${evaluation.marketFit.score}
      优势: ${evaluation.strengths.join(', ')}
      劣势: ${evaluation.weaknesses.join(', ')}
      `).join('\n')}
      
      请进行全面比较分析，并推荐:
      1. 综合表现最佳的策略
      2. 风险调整后收益最佳的策略
      3. 一致性表现最佳的策略
      4. 最具发展潜力的策略（考虑改进空间）
      
      按以下JSON格式输出推荐:
      {
        "bestOverallStrategy": "策略X",
        "bestRiskAdjustedStrategy": "策略Y",
        "bestConsistencyStrategy": "策略Z",
        "mostPromisingStrategy": "策略W"
      }
      
      同时提供一份不超过1000字的对比分析报告，重点说明各策略的相对优势和适用场景。
    `;
    
    // 调用策略推荐代理
    const comparisonResult = await strategyRecommendationAgent.run({
      messages: [{ role: 'user', content: comparisonPrompt }]
    });
    
    // 解析推荐结果
    const recommendationsMatch = comparisonResult.content.match(/\{[\s\S]*?\}/);
    const recommendations = recommendationsMatch 
      ? JSON.parse(recommendationsMatch[0]) 
      : {
          bestOverallStrategy: '无法确定',
          bestRiskAdjustedStrategy: '无法确定',
          bestConsistencyStrategy: '无法确定',
          mostPromisingStrategy: '无法确定'
        };
    
    // 提取比较报告
    const reportText = comparisonResult.content.replace(/\{[\s\S]*?\}/, '').trim();
    
    logger.info('策略比较完成', { strategiesCount: evaluations.length });
    
    return {
      recommendations,
      comparisonReport: reportText
    };
    
  } catch (error) {
    logger.error('策略比较失败', { error });
    throw error;
  }
} 