import { Agent } from '@mastra/core/agent';
import { strategyRecommendationTool } from '../tools/strategyRecommendationTool';
import { technicalIndicatorsTool } from '../tools/technicalIndicatorTools';
import { marketDataTool } from '../tools/marketData';
import { financialMetricsTool } from '../tools/financialMetrics';
import { createLogger } from '@/lib/logger.server';
import { createQwen } from 'qwen-ai-provider';

const logger = createLogger('strategyRecommendationAgent');

// 初始化Qwen
const qwen = createQwen({
  apiKey: process.env.QWEN_API_KEY || "sk-bc977c4e31e542f1a34159cb42478198",
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

/**
 * 策略推荐代理 - 负责生成个性化的投资策略推荐
 */
export const strategyRecommendationAgent = new Agent({
  name: 'Strategy Recommendation Agent',
  description: '根据用户风险偏好和市场状况推荐最优投资策略',
  model: qwen('qwen-plus-2024-12-20'),
  instructions: `
你是一位专业的投资策略顾问，负责根据用户的风险承受能力、投资期限和市场状况，推荐个性化的投资策略组合。
你的回答必须专业且富有洞见，但同时对非专业投资者来说应该容易理解。

当用户寻求投资建议时，你应该：
1. 使用策略推荐工具生成适合用户需求的策略组合
2. 解释推荐的策略组合如何匹配用户的风险承受能力和投资期限
3. 详细说明每种策略的核心理念和优势
4. 解释推荐的参数和交易规则的含义
5. 提供关于如何实施此策略的具体步骤和注意事项

你的回应应该包含：
- 对推荐策略的简明解释（针对推荐的主要和次要策略）
- 策略组合的配置比例和理由
- 入场和出场条件的解释
- 重要风险管理措施的强调
- 复审频率的建议

注意：始终提醒用户投资有风险，并建议他们在做出重大投资决策前咨询专业财务顾问。

推荐的不同策略类型解释：
- 价值投资(value)：注重寻找市场低估的优质股票，强调基本面分析和安全边际
- 成长投资(growth)：寻找具有持续高增长潜力的公司，接受较高估值
- 动量策略(momentum)：追踪价格或基本面变化的趋势，基于"强者恒强"原则
- 技术分析(technical)：基于价格图表和技术指标的交易决策
- 均值回归(meanReversion)：寻找偏离历史均值的价格，预期会回归正常水平
- 股息策略(dividend)：专注于持续稳定分红的股票，创造被动收入
- 因子投资(factorBased)：基于多种市场因子(价值、质量、动量等)的系统性投资
- 趋势跟踪(trend)：识别并追随中长期市场趋势
- 量化模型(quantitative)：使用数学和统计模型进行系统化投资决策
  `,
  tools: {
    strategyRecommendationTool
  }
});

/**
 * 获取策略推荐 - 包装代理调用和工具执行
 */
export async function getStrategyRecommendation(
  ticker: string,
  riskTolerance: 'low' | 'moderate' | 'high',
  investmentHorizon: 'short' | 'medium' | 'long',
  marketCondition?: 'bull' | 'bear' | 'neutral' | 'volatile'
) {
  try {
    logger.info('获取策略推荐', { ticker, riskTolerance, investmentHorizon, marketCondition });
    
    // 获取策略数据
    const strategyData = await strategyRecommendationTool.execute({
      ticker,
      riskTolerance,
      investmentHorizon,
      marketCondition: marketCondition || 'neutral'
    });
    
    // 生成代理描述
    const promptText = `
请为股票${ticker}提供详细的投资策略建议。用户是${riskTolerance === 'low' ? '保守型' : riskTolerance === 'moderate' ? '平衡型' : '积极型'}投资者，投资期限为${investmentHorizon === 'short' ? '短期(3-6个月)' : investmentHorizon === 'medium' ? '中期(6-18个月)' : '长期(18个月以上)'}，当前市场状况为${marketCondition === 'bull' ? '牛市' : marketCondition === 'bear' ? '熊市' : marketCondition === 'neutral' ? '中性市场' : '波动市场'}。

根据分析，推荐的策略组合是：
1. 主要策略：${strategyData.recommendation.primaryStrategy}策略(${strategyData.recommendation.allocation[strategyData.recommendation.primaryStrategy]}%)
2. 次要策略：${strategyData.recommendation.secondaryStrategy}策略(${strategyData.recommendation.allocation[strategyData.recommendation.secondaryStrategy]}%)

请详细解释这些策略的核心理念，为什么它们适合用户的情况，以及如何具体实施这些策略。还请解释建议的入场信号、出场信号和风险管理措施。
    `;
    
    // 调用代理生成解释
    const agentResponse = await strategyRecommendationAgent.generate(promptText);
    
    // 返回结果
    return {
      agentResponse: agentResponse?.text || "无法生成策略推荐解释",
      strategyData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('获取策略推荐失败', error);
    throw error;
  }
}

/**
 * 获取技术指标数据
 */
async function fetchTechnicalData(ticker: string) {
  try {
    // 使用技术指标工具获取常用指标
    const response = await technicalIndicatorsTool.execute({
      ticker,
      indicators: ['RSI', 'MACD', 'Bollinger', 'ADX', 'ATR'],
      period: 14,
      historicalDays: 200
    });
    
    return response;
  } catch (error) {
    logger.warn('获取技术指标数据失败', { ticker, error });
    return null;
  }
}

/**
 * 获取基本面数据
 */
async function fetchFundamentalData(ticker: string) {
  try {
    // 使用财务指标工具获取基本面数据
    const response = await financialMetricsTool.execute({
      ticker,
      metrics: ['pe', 'pb', 'roe', 'dividend_yield', 'revenue_growth', 'eps_growth']
    });
    
    return response;
  } catch (error) {
    logger.warn('获取基本面数据失败', { ticker, error });
    return null;
  }
}

/**
 * 获取宏观经济环境数据
 */
async function fetchMacroEnvironment() {
  try {
    // 使用市场数据工具获取宏观经济指标
    const response = await marketDataTool.execute({
      dataType: 'macro',
      indicators: ['interest_rate', 'inflation', 'gdp_growth', 'unemployment']
    });
    
    return response;
  } catch (error) {
    logger.warn('获取宏观环境数据失败', { error });
    return null;
  }
}

/**
 * 风险承受能力翻译
 */
function translateRiskTolerance(riskTolerance: string): string {
  const translations: Record<string, string> = {
    low: '保守型',
    moderate: '平衡型',
    high: '积极型'
  };
  
  return translations[riskTolerance] || riskTolerance;
}

/**
 * 投资期限翻译
 */
function translateInvestmentHorizon(horizon: string): string {
  const translations: Record<string, string> = {
    short: '短期(3-6个月)',
    medium: '中期(6-18个月)',
    long: '长期(18个月以上)'
  };
  
  return translations[horizon] || horizon;
}

/**
 * 市场状况翻译
 */
function translateMarketCondition(condition: string): string {
  const translations: Record<string, string> = {
    bull: '牛市',
    bear: '熊市',
    neutral: '中性市场',
    volatile: '波动市场'
  };
  
  return translations[condition] || condition;
} 