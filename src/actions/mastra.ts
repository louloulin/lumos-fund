'use server';

import { mastra } from '@/mastra';

/**
 * 测试Mastra AI代理
 * @param agentType 代理类型
 * @param prompt 提示词
 * @returns 代理响应内容
 */
export async function testAgent(agentType: string, prompt: string): Promise<string> {
  try {
    // 获取对应的代理
    const agent = mastra.getAgent(agentType);
    
    // 生成响应
    const response = await agent.generate(prompt);
    return response.text;
  } catch (error) {
    console.error('代理调用错误:', error);
    
    // 格式化错误消息
    const errorMessage = error instanceof Error 
      ? error.message 
      : '未知错误';
    
    throw new Error(`调用Mastra代理失败: ${errorMessage}`);
  }
}

/**
 * 获取股票分析
 * @param ticker 股票代码
 * @returns 股票分析结果
 */
export async function getStockAnalysis(ticker: string) {
  try {
    const agent = mastra.getAgent('tradingAgent');
    const response = await agent.generate(`分析股票 ${ticker} 的投资价值，给出投资建议和理由。`);
    return response.text;
  } catch (error) {
    console.error('股票分析错误:', error);
    throw new Error(`股票分析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取市场洞察分析
 * @returns 市场洞察分析
 */
export async function getMarketInsights() {
  try {
    const agent = mastra.getAgent('macroAnalysisAgent');
    const response = await agent.generate('给出当前市场的主要趋势和洞察，包括主要指数、行业表现和重要事件影响。');
    return response.text;
  } catch (error) {
    console.error('市场洞察错误:', error);
    throw new Error(`市场洞察分析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 执行交易决策工作流
 * @param ticker 股票代码
 * @param portfolio 投资组合信息
 * @returns 工作流执行结果
 */
export async function executeTradingWorkflow(ticker: string, portfolio: any = {}) {
  try {
    const workflow = mastra.getWorkflow('tradingDecisionWorkflow');
    const result = await workflow.execute({
      context: {
        ticker,
        portfolio,
        timestamp: new Date().toISOString(),
      }
    });
    
    return result;
  } catch (error) {
    console.error('交易工作流错误:', error);
    throw new Error(`交易决策工作流失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取价值投资分析
 * @param ticker 股票代码
 * @returns 价值投资分析结果
 */
export async function getValueInvestingAnalysis(ticker: string) {
  try {
    const agent = mastra.getAgent('valueInvestingAgent');
    const response = await agent.generate(`分析 ${ticker} 的价值投资潜力，包括估值、财务状况和竞争优势。`);
    return response.text;
  } catch (error) {
    console.error('价值投资分析错误:', error);
    throw new Error(`价值投资分析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取成长投资分析
 * @param ticker 股票代码
 * @returns 成长投资分析结果
 */
export async function getGrowthInvestingAnalysis(ticker: string) {
  try {
    const agent = mastra.getAgent('growthInvestingAgent');
    const response = await agent.generate(`分析 ${ticker} 的成长投资潜力，包括收入增长、市场扩张和创新能力。`);
    return response.text;
  } catch (error) {
    console.error('成长投资分析错误:', error);
    throw new Error(`成长投资分析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取技术分析
 * @param ticker 股票代码
 * @returns 技术分析结果
 */
export async function getTechnicalAnalysis(ticker: string) {
  try {
    const agent = mastra.getAgent('technicalAnalysisAgent');
    const response = await agent.generate(`分析 ${ticker} 的技术指标和价格走势。`);
    return response.text;
  } catch (error) {
    console.error('技术分析错误:', error);
    throw new Error(`技术分析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取量化投资分析
 * @param ticker 股票代码
 * @param timeframe 时间框架
 * @param riskTolerance 风险承受能力
 * @returns 量化投资分析结果
 */
export async function getQuantInvestingAnalysis(
  ticker: string, 
  timeframe: 'short' | 'medium' | 'long' = 'medium',
  riskTolerance: 'low' | 'medium' | 'high' = 'medium'
) {
  try {
    const agent = mastra.getAgent('quantInvestingAgent');
    const response = await agent.generate(
      `通过量化方法分析 ${ticker}，时间框架: ${timeframe}，风险承受能力: ${riskTolerance}。`
    );
    return response.text;
  } catch (error) {
    console.error('量化投资分析错误:', error);
    throw new Error(`量化投资分析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取情绪分析
 * @param ticker 股票代码
 * @returns 情绪分析结果
 */
export async function getSentimentAnalysis(ticker: string) {
  try {
    const agent = mastra.getAgent('sentimentAnalysisAgent');
    const response = await agent.generate(`分析市场对 ${ticker} 的情绪和新闻报道。`);
    return response.text;
  } catch (error) {
    console.error('情绪分析错误:', error);
    throw new Error(`情绪分析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取投资组合优化
 * @param portfolio 当前投资组合
 * @param riskProfile 风险偏好
 * @returns 投资组合优化建议
 */
export async function getPortfolioOptimization(portfolio: any, riskProfile: 'conservative' | 'moderate' | 'aggressive' = 'moderate') {
  try {
    const agent = mastra.getAgent('portfolioOptimizationAgent');
    const response = await agent.generate(
      `基于以下投资组合 ${JSON.stringify(portfolio)} 和 ${riskProfile} 风险偏好，提供投资组合优化建议。`
    );
    return response.text;
  } catch (error) {
    console.error('投资组合优化错误:', error);
    throw new Error(`投资组合优化失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取宏观经济分析
 * @param sector 行业部门
 * @returns 宏观经济分析
 */
export async function getMacroAnalysis(sector?: string) {
  try {
    const agent = mastra.getAgent('macroAnalysisAgent');
    let prompt = '分析当前宏观经济环境及其对投资市场的影响';
    if (sector) {
      prompt += `，特别关注对${sector}行业的影响`;
    }
    
    const response = await agent.generate(prompt);
    return response.text;
  } catch (error) {
    console.error('宏观分析错误:', error);
    throw new Error(`宏观经济分析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取风险管理分析
 * @param ticker 股票代码或投资组合
 * @returns 风险管理分析
 */
export async function getRiskManagementAnalysis(ticker: string | any) {
  try {
    const agent = mastra.getAgent('riskManagementAgent');
    
    let prompt;
    if (typeof ticker === 'string') {
      prompt = `评估投资 ${ticker} 的风险，并提供风险管理建议。`;
    } else {
      prompt = `评估以下投资组合的风险: ${JSON.stringify(ticker)}，并提供风险管理建议。`;
    }
    
    const response = await agent.generate(prompt);
    return response.text;
  } catch (error) {
    console.error('风险管理分析错误:', error);
    throw new Error(`风险管理分析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取交易执行计划
 * @param action 交易行动
 * @param ticker 股票代码
 * @param quantity 数量
 * @param constraints 额外约束条件
 * @returns 交易执行计划
 */
export async function getExecutionPlan(
  action: 'buy' | 'sell',
  ticker: string,
  quantity: number,
  constraints?: string
) {
  try {
    const agent = mastra.getAgent('executionAgent');
    
    let prompt = `为${action === 'buy' ? '买入' : '卖出'} ${quantity} 股 ${ticker} 生成交易执行计划`;
    
    if (constraints) {
      prompt += `，需要考虑以下约束: ${constraints}`;
    }
    
    const response = await agent.generate(prompt);
    return response.text;
  } catch (error) {
    console.error('执行计划错误:', error);
    throw new Error(`交易执行计划生成失败: ${error instanceof Error ? error.message : String(error)}`);
  }
} 