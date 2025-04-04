'use server'

import { createLogger } from '@/lib/logger.server';
import { valueInvestingAgent } from '@/mastra/agents/valueInvestingAgent';
import { growthInvestingAgent } from '@/mastra/agents/growthInvestingAgent';
import { trendInvestingAgent, parseTrendAgentOutput } from '@/mastra/agents/trendInvestingAgent';
import { quantInvestingAgent } from '@/mastra/agents/quantInvestingAgent';
import { generateHistoricalPrices, calculateTechnicalIndicators, generateFinancialMetrics, generateNewsData } from '@/lib/mocks';

const logger = createLogger('testAIAgent-action');

/**
 * 测试价值投资AI代理
 */
export async function testValueAgent(ticker: string = 'AAPL') {
  try {
    logger.info('测试价值投资AI代理', { ticker });

    // 生成模拟数据
    const financialMetrics = generateFinancialMetrics(ticker);
    const today = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);
    
    const startDate = twoYearsAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const priceData = generateHistoricalPrices(ticker, startDate, endDate);
    const newsData = generateNewsData(ticker, startDate, endDate);

    // 构建分析提示
    const prompt = `
      分析 ${ticker} 的投资价值，基于以下数据：
      
      价格数据: ${JSON.stringify(priceData.slice(-30))}
      
      财务指标: ${JSON.stringify(financialMetrics)}
      
      新闻事件: ${JSON.stringify(newsData.slice(-5))}
      
      请从价值投资的角度进行分析，评估公司的竞争优势，管理质量，内在价值与市场价格的差距，
      并给出明确的投资建议。输出必须包含信号（看涨/看跌/中性）、置信度（0-100）和建议仓位比例。
    `;

    // 调用价值投资代理
    const response = await valueInvestingAgent.generate(prompt);
    
    return {
      success: true,
      agentType: 'value',
      ticker,
      analysis: response.text,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('价值投资AI代理测试失败', { ticker, error });
    return {
      success: false,
      agentType: 'value',
      ticker,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 测试成长投资AI代理
 */
export async function testGrowthAgent(ticker: string = 'TSLA') {
  try {
    logger.info('测试成长投资AI代理', { ticker });

    // 生成模拟数据
    const financialMetrics = generateFinancialMetrics(ticker);
    const today = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);
    
    const startDate = twoYearsAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const priceData = generateHistoricalPrices(ticker, startDate, endDate);
    const newsData = generateNewsData(ticker, startDate, endDate);

    // 构建分析提示
    const prompt = `
      分析 ${ticker} 的成长投资机会，基于以下数据：
      
      价格数据: ${JSON.stringify(priceData.slice(-30))}
      
      财务指标: ${JSON.stringify(financialMetrics)}
      
      新闻事件: ${JSON.stringify(newsData.slice(-5))}
      
      请从成长投资的角度进行分析，评估公司的增长潜力，市场拓展机会，创新能力，
      并给出明确的投资建议。输出必须包含信号（看涨/看跌/中性）、置信度（0-100）和建议仓位比例。
    `;

    // 调用成长投资代理
    const response = await growthInvestingAgent.generate(prompt);
    
    return {
      success: true,
      agentType: 'growth',
      ticker,
      analysis: response.text,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('成长投资AI代理测试失败', { ticker, error });
    return {
      success: false,
      agentType: 'growth',
      ticker,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 测试趋势投资AI代理
 */
export async function testTrendAgent(ticker: string = 'NVDA') {
  try {
    logger.info('测试趋势投资AI代理', { ticker });

    // 生成模拟数据
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const startDate = sixMonthsAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const priceData = generateHistoricalPrices(ticker, startDate, endDate);
    const technicalIndicators = calculateTechnicalIndicators(priceData);

    // 构建分析提示
    const prompt = `
      分析 ${ticker} 的价格趋势和动量，基于以下数据：
      
      价格数据: ${JSON.stringify(priceData.slice(-30))}
      
      技术指标:
      MA20: ${JSON.stringify(technicalIndicators.ma20?.slice(-10))}
      MA60: ${JSON.stringify(technicalIndicators.ma60?.slice(-10))}
      RSI: ${JSON.stringify(technicalIndicators.rsi14?.slice(-10))}
      MACD线: ${JSON.stringify(technicalIndicators.macd?.macdLine.slice(-10))}
      
      请从趋势投资的角度进行分析，评估价格趋势的强度和方向，成交量变化的确认性，
      并给出明确的投资建议。按照指定格式输出。
    `;

    // 调用趋势投资代理
    const response = await trendInvestingAgent.generate(prompt);
    
    // 解析代理输出
    const parsedOutput = parseTrendAgentOutput(response.text);
    
    return {
      success: true,
      agentType: 'trend',
      ticker,
      analysis: response.text,
      parsedSignal: {
        action: parsedOutput.action,
        confidence: parsedOutput.confidence,
        position: parsedOutput.position
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('趋势投资AI代理测试失败', { ticker, error });
    return {
      success: false,
      agentType: 'trend',
      ticker,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 测试量化投资AI代理
 */
export async function testQuantAgent(ticker: string = 'MSFT') {
  try {
    logger.info('测试量化投资AI代理', { ticker });

    // 生成模拟数据
    const financialMetrics = generateFinancialMetrics(ticker);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const startDate = oneYearAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const priceData = generateHistoricalPrices(ticker, startDate, endDate);
    const technicalIndicators = calculateTechnicalIndicators(priceData);

    // 构建分析提示
    const prompt = `
      对 ${ticker} 进行量化因子分析，基于以下数据：
      
      价格数据: ${JSON.stringify(priceData.slice(-30))}
      
      财务指标: ${JSON.stringify(financialMetrics)}
      
      技术指标:
      MA20: ${JSON.stringify(technicalIndicators.ma20?.slice(-10))}
      MA60: ${JSON.stringify(technicalIndicators.ma60?.slice(-10))}
      RSI: ${JSON.stringify(technicalIndicators.rsi14?.slice(-10))}
      MACD线: ${JSON.stringify(technicalIndicators.macd?.macdLine.slice(-10))}
      
      请从量化投资的角度进行分析，综合评估各因子的表现，并给出明确的投资建议。
      输出必须包含信号（看涨/看跌/中性）、置信度（0-100）和建议仓位比例。
    `;

    // 调用量化投资代理
    const response = await quantInvestingAgent.generate(prompt);
    
    return {
      success: true,
      agentType: 'quant',
      ticker,
      analysis: response.text,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('量化投资AI代理测试失败', { ticker, error });
    return {
      success: false,
      agentType: 'quant',
      ticker,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 测试所有AI代理并比较结果
 */
export async function testAllAgents(ticker: string = 'AMZN') {
  try {
    logger.info('测试所有AI代理', { ticker });
    
    // 并行测试所有代理
    const [valueResult, growthResult, trendResult, quantResult] = await Promise.all([
      testValueAgent(ticker),
      testGrowthAgent(ticker),
      testTrendAgent(ticker),
      testQuantAgent(ticker)
    ]);
    
    return {
      success: true,
      ticker,
      results: {
        value: valueResult,
        growth: growthResult,
        trend: trendResult,
        quant: quantResult
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('AI代理综合测试失败', { ticker, error });
    return {
      success: false,
      ticker,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
} 