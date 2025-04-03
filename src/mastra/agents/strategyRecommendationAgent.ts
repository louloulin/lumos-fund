import { Agent } from '@mastra/core/agent';
import { strategyRecommendationTool } from '../tools/strategyRecommendationTool';
import { technicalIndicatorsTool } from '../tools/technicalIndicatorTools';
import { marketDataTool } from '../tools/marketData';
import { financialMetricsTool } from '../tools/financialMetrics';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('strategyRecommendationAgent');

/**
 * 策略推荐智能体 - 根据用户风险偏好和市场状况提供个性化投资策略建议
 * 
 * 该智能体整合市场数据、基本面分析和技术指标，为用户提供个性化的投资策略推荐，
 * 包括策略组合、资产配置比例、参数设置和具体交易规则。
 */
export const strategyRecommendationAgent = new Agent({
  name: 'strategyRecommendationAgent',
  description: '分析市场状况、风险承受能力和投资期限，推荐最适合的投资策略组合和参数配置',
  prompt: `你是一个专业的投资策略顾问，专注于为投资者提供个性化的策略推荐。
  
**你的任务**:
根据用户提供的风险承受能力、投资期限和投资目标，结合当前市场环境，推荐最适合的投资策略组合。

**注意事项**:
1. 你需要整合基本面分析、技术指标和宏观经济因素，生成全面的策略推荐
2. 你应根据用户的风险承受能力（保守、平衡或积极）调整策略组合
3. 考虑不同投资期限（短期、中期或长期）的最佳策略选择
4. 提供明确的策略解释、资产配置比例和具体的交易规则
5. 针对不同市场环境（牛市、熊市、波动市场或中性市场）进行策略调整

**已有数据**:
当用户询问特定股票的策略建议时，你可使用工具获取:
- 基本面数据：估值指标、增长率、财务健康度
- 技术指标：RSI、MACD、布林带等
- 市场数据：当前市场趋势、成交量、波动率

**可推荐的策略类型**:
- 价值投资策略 (Value)
- 成长投资策略 (Growth)
- 动量策略 (Momentum)
- 均值回归策略 (Mean Reversion)
- 趋势跟踪策略 (Trend)
- 技术分析策略 (Technical)
- 量化模型策略 (Quantitative)
- 股息策略 (Dividend)
- 因子投资策略 (Factor-based)

**回复格式**:
你的回复应包含以下部分:
1. 策略组合推荐：主要策略和次要策略的组合，及其分配比例
2. 策略解释：为什么这些策略适合用户的风险偏好和当前市场
3. 参数设置：推荐的具体参数（如技术指标阈值、估值标准等）
4. 交易规则：明确的入场和出场信号
5. 建议的复审周期：多久应重新评估策略有效性

**专业用语**:
使用投资领域专业术语，但确保解释清晰，使不同投资经验水平的用户都能理解。`,
  tools: [
    strategyRecommendationTool,
    technicalIndicatorsTool,
    marketDataTool,
    financialMetricsTool
  ],
});

/**
 * 获取策略推荐
 * 
 * @param ticker 股票代码
 * @param riskTolerance 风险承受能力 ('low' | 'moderate' | 'high')
 * @param investmentHorizon 投资期限 ('short' | 'medium' | 'long')
 * @param marketCondition 市场状况 ('bull' | 'bear' | 'neutral' | 'volatile')
 * @returns 策略推荐结果
 */
export async function getStrategyRecommendation(
  ticker: string,
  riskTolerance: 'low' | 'moderate' | 'high',
  investmentHorizon: 'short' | 'medium' | 'long',
  marketCondition?: 'bull' | 'bear' | 'neutral' | 'volatile'
) {
  try {
    logger.info('获取策略推荐', { ticker, riskTolerance, investmentHorizon, marketCondition });
    
    // 获取相关市场和财务数据
    const technicalData = await fetchTechnicalData(ticker);
    const fundamentalData = await fetchFundamentalData(ticker);
    const macroEnvironment = await fetchMacroEnvironment();
    
    // 使用策略推荐工具生成推荐
    const toolResult = await strategyRecommendationTool.execute({
      ticker,
      riskTolerance,
      investmentHorizon,
      marketCondition: marketCondition || 'neutral',
      fundamentalData,
      technicalData,
      macroEnvironment
    });
    
    // 使用代理生成策略推荐解释
    const prompt = `请为股票 ${ticker} 提供投资策略推荐。我的风险承受能力是${translateRiskTolerance(riskTolerance)}，
    投资期限是${translateInvestmentHorizon(investmentHorizon)}。
    ${marketCondition ? `我认为目前是${translateMarketCondition(marketCondition)}。` : ''}
    
    基于以下策略推荐数据，请提供详细的策略解释和实施建议：
    ${JSON.stringify(toolResult, null, 2)}`;
    
    const agentResponse = await strategyRecommendationAgent.generate(prompt);
    
    return {
      agentResponse: agentResponse.text,
      strategyData: toolResult,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('策略推荐生成失败', error);
    throw new Error(`获取策略推荐失败: ${error instanceof Error ? error.message : String(error)}`);
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