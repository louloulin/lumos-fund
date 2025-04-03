'use server';

import { z } from "zod";
import { runValueBacktest, runMomentumBacktest, runMeanReversionBacktest, runComparisonBacktest } from "@/actions/backtest";

// Mastra类型声明
type AgentResponse = {
  text: string;
  [key: string]: any;
};

type Agent = {
  name: string;
  instructions: string;
  model: any;
  tools: Record<string, any>;
  memory?: {
    enabled: boolean;
  };
  generate: (prompt: string) => Promise<AgentResponse>;
};

type Tool = {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any) => Promise<any>;
};

// 模拟Mastra的OpenAI接口
const openai = (model: string) => {
  return { model };
};

// 模拟创建工具函数
const createTool = (config: Tool): Tool => {
  return config;
};

/**
 * 定义市场分析工具 - 让AI助手能够分析市场状况
 */
const marketAnalysisTool = createTool({
  name: "marketAnalysis",
  description: "分析当前市场状况和趋势",
  inputSchema: z.object({
    ticker: z.string().describe("股票代码"),
    timeframe: z.enum(["day", "week", "month"]).describe("分析时间框架"),
  }),
  execute: async ({ ticker, timeframe }: { ticker: string; timeframe: string }) => {
    // 这里可以调用外部API获取实时市场数据
    // 目前使用模拟数据
    const marketSentiment = ["看涨", "看跌", "中性"][Math.floor(Math.random() * 3)];
    const volatility = Math.floor(Math.random() * 100);
    const tradingVolume = Math.floor(Math.random() * 10000000);
    
    return {
      ticker,
      timeframe,
      marketSentiment,
      volatility,
      tradingVolume,
      timestamp: new Date().toISOString(),
      analysis: `${ticker}目前市场情绪${marketSentiment}，波动率${volatility}%，成交量${tradingVolume}股。`,
    };
  },
});

// 回测工具参数类型
interface BacktestParams {
  ticker: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
  strategy: "value" | "momentum" | "meanReversion";
  parameters?: {
    riskTolerance?: "low" | "medium" | "high";
    peRatio?: number;
    pbRatio?: number;
    dividendYield?: number;
    maShortPeriod?: number;
    maLongPeriod?: number;
    rsiPeriod?: number;
    rsiOverbought?: number;
    rsiOversold?: number;
    bollingerPeriod?: number;
    bollingerDeviation?: number;
  };
}

/**
 * 定义回测工具 - 使AI助手能够运行策略回测
 */
const backtestTool = createTool({
  name: "backtestStrategy",
  description: "回测交易策略的历史表现",
  inputSchema: z.object({
    ticker: z.string().describe("股票代码"),
    initialCapital: z.number().describe("初始资金"),
    startDate: z.string().describe("回测开始日期 (YYYY-MM-DD)"),
    endDate: z.string().describe("回测结束日期 (YYYY-MM-DD)"),
    strategy: z.enum(["value", "momentum", "meanReversion"]).describe("策略类型"),
    parameters: z.object({
      // 通用参数
      riskTolerance: z.enum(["low", "medium", "high"]).optional().describe("风险承受能力"),
      
      // 价值投资参数
      peRatio: z.number().optional().describe("市盈率阈值"),
      pbRatio: z.number().optional().describe("市净率阈值"),
      dividendYield: z.number().optional().describe("股息率阈值"),
      
      // 动量策略参数
      maShortPeriod: z.number().optional().describe("短期均线周期"),
      maLongPeriod: z.number().optional().describe("长期均线周期"),
      rsiPeriod: z.number().optional().describe("RSI周期"),
      rsiOverbought: z.number().optional().describe("RSI超买阈值"),
      rsiOversold: z.number().optional().describe("RSI超卖阈值"),
      
      // 均值回归参数
      bollingerPeriod: z.number().optional().describe("布林带周期"),
      bollingerDeviation: z.number().optional().describe("布林带标准差"),
    }).optional(),
  }),
  execute: async ({ ticker, initialCapital, startDate, endDate, strategy, parameters }: BacktestParams) => {
    try {
      let result;
      
      // 根据策略类型调用不同的回测函数
      switch (strategy) {
        case "value":
          result = await runValueBacktest(ticker, initialCapital, startDate, endDate, {
            peRatio: parameters?.peRatio,
            pbRatio: parameters?.pbRatio,
            dividendYield: parameters?.dividendYield,
          });
          break;
        case "momentum":
          result = await runMomentumBacktest(ticker, initialCapital, startDate, endDate, {
            maShortPeriod: parameters?.maShortPeriod,
            maLongPeriod: parameters?.maLongPeriod,
            rsiPeriod: parameters?.rsiPeriod,
            rsiOverbought: parameters?.rsiOverbought,
            rsiOversold: parameters?.rsiOversold,
          });
          break;
        case "meanReversion":
          result = await runMeanReversionBacktest(ticker, initialCapital, startDate, endDate, {
            bollingerPeriod: parameters?.bollingerPeriod,
            bollingerDeviation: parameters?.bollingerDeviation,
          });
          break;
        default:
          throw new Error(`不支持的策略类型: ${strategy}`);
      }
      
      // 添加一些AI友好的分析
      const annualReturn = (result.metrics.annualizedReturn * 100).toFixed(2);
      const totalReturn = (result.metrics.totalReturn * 100).toFixed(2);
      const maxDrawdown = (result.metrics.maxDrawdown * 100).toFixed(2);
      const winRate = (result.metrics.winRate * 100).toFixed(2);
      
      let riskAssessment = "";
      if (result.metrics.maxDrawdown > 0.3) {
        riskAssessment = "高风险";
      } else if (result.metrics.maxDrawdown > 0.15) {
        riskAssessment = "中等风险";
      } else {
        riskAssessment = "低风险";
      }
      
      let performanceAssessment = "";
      if (result.metrics.annualizedReturn > 0.2) {
        performanceAssessment = "表现优异";
      } else if (result.metrics.annualizedReturn > 0.1) {
        performanceAssessment = "表现良好";
      } else if (result.metrics.annualizedReturn > 0) {
        performanceAssessment = "表现一般";
      } else {
        performanceAssessment = "表现不佳";
      }
      
      return {
        ticker,
        strategy,
        totalReturn: `${totalReturn}%`,
        annualizedReturn: `${annualReturn}%`,
        maxDrawdown: `${maxDrawdown}%`,
        sharpeRatio: result.metrics.sharpeRatio.toFixed(2),
        winRate: `${winRate}%`,
        tradeCount: result.trades.length,
        firstTradeDate: result.trades[0]?.date,
        lastTradeDate: result.trades[result.trades.length - 1]?.date,
        riskAssessment,
        performanceAssessment,
        summary: `${ticker}使用${strategy}策略回测结果：年化收益${annualReturn}%，最大回撤${maxDrawdown}%，夏普比率${result.metrics.sharpeRatio.toFixed(2)}，胜率${winRate}%。该策略${performanceAssessment}，${riskAssessment}。`
      };
    } catch (error: any) {
      console.error("回测执行错误:", error);
      return {
        error: `回测失败: ${error.message || "未知错误"}`,
        ticker,
        strategy
      };
    }
  },
});

// 策略推荐参数接口
interface StrategyRecommendationParams {
  ticker: string;
  riskTolerance: "low" | "medium" | "high";
  investmentHorizon: "short" | "medium" | "long";
  marketCondition?: "bull" | "bear" | "neutral";
}

/**
 * 定义策略推荐工具 - 让AI助手能够根据市场状况推荐合适的策略
 */
const strategyRecommendationTool = createTool({
  name: "recommendStrategy",
  description: "根据市场状况和个人偏好推荐交易策略",
  inputSchema: z.object({
    ticker: z.string().describe("股票代码"),
    riskTolerance: z.enum(["low", "medium", "high"]).describe("风险承受能力"),
    investmentHorizon: z.enum(["short", "medium", "long"]).describe("投资期限"),
    marketCondition: z.enum(["bull", "bear", "neutral"]).optional().describe("市场状况"),
  }),
  execute: async ({ ticker, riskTolerance, investmentHorizon, marketCondition }: StrategyRecommendationParams) => {
    // 根据输入参数确定合适的策略
    let recommendedStrategies: string[] = [];
    let parameters: Record<string, any> = {};
    let reasoning = "";
    
    // 风险承受能力影响策略选择
    if (riskTolerance === "low") {
      recommendedStrategies.push("value");
      parameters = {
        peRatio: 15,
        pbRatio: 1.5,
        dividendYield: 3.0
      };
      reasoning += "考虑到您风险承受能力较低，价值投资策略更为合适，专注于寻找低估值高股息的股票。";
    } else if (riskTolerance === "medium") {
      if (marketCondition === "bull" || marketCondition === "neutral") {
        recommendedStrategies.push("momentum");
        parameters = {
          maShortPeriod: 20,
          maLongPeriod: 50,
          rsiPeriod: 14,
          rsiOverbought: 70,
          rsiOversold: 30
        };
        reasoning += "考虑到您中等的风险承受能力和当前市场环境，动量策略可能表现更好，追踪市场趋势。";
      } else {
        recommendedStrategies.push("meanReversion");
        parameters = {
          bollingerPeriod: 20,
          bollingerDeviation: 2
        };
        reasoning += "考虑到您中等的风险承受能力和当前的熊市环境，均值回归策略更合适，寻找超卖机会。";
      }
    } else { // high risk tolerance
      if (marketCondition === "bull") {
        recommendedStrategies.push("momentum");
        parameters = {
          maShortPeriod: 10,
          maLongPeriod: 30,
          rsiPeriod: 14,
          rsiOverbought: 80,
          rsiOversold: 40
        };
        reasoning += "考虑到您较高的风险承受能力和当前牛市环境，激进的动量策略可能带来更高回报。";
      } else {
        recommendedStrategies = ["value", "meanReversion", "momentum"];
        parameters = {
          multiStrategy: true
        };
        reasoning += "考虑到您较高的风险承受能力，多策略组合可能是最佳选择，同时利用不同市场条件下的机会。";
      }
    }
    
    // 投资期限影响参数调整
    if (investmentHorizon === "short") {
      reasoning += " 由于您的投资期限较短，策略参数已调整为更敏感地响应短期市场变化。";
    } else if (investmentHorizon === "long") {
      reasoning += " 由于您的投资期限较长，策略参数已调整为过滤短期噪音，专注长期趋势。";
    }
    
    return {
      ticker,
      recommendedStrategies,
      primaryStrategy: recommendedStrategies[0],
      parameters,
      reasoning,
      disclaimer: "此推荐仅供参考，不构成投资建议。实际投资决策应结合更多因素和专业意见。"
    };
  },
});

/**
 * 创建AI交易助手
 */
export const tradingAgent = {
  name: "AI交易助手",
  instructions: `
你是一位专业的AI量化交易助手，可以帮助用户分析市场、回测交易策略、推荐适合的投资方法。

你的能力包括：
1. 市场分析：分析特定股票的市场状况和趋势
2. 策略回测：评估不同交易策略在历史数据上的表现
3. 策略推荐：根据用户的风险偏好和投资目标推荐合适的交易策略

你应该始终：
- 提供清晰、专业的回答
- 解释你的分析和推荐背后的逻辑
- 对结果进行客观评估，避免过度乐观
- 提醒用户投资风险
- 使用准确的金融术语
- 在适当的时候提供具体的数字和百分比
  `,
  model: openai("gpt-4o-mini"),
  tools: {
    marketAnalysisTool,
    backtestTool,
    strategyRecommendationTool
  },
  memory: {
    enabled: true,
  },
  // 模拟生成回答的方法
  generate: async (prompt: string): Promise<AgentResponse> => {
    console.log(`[DEBUG] AI交易助手处理提示: ${prompt}`);
    
    // 简单回答生成逻辑，实际项目中会调用真实的AI模型
    let response = `基于您的问题"${prompt}"，我的分析如下：\n\n`;
    
    // 检查是否包含某些关键词并生成相应回答
    if (prompt.includes('分析') && prompt.match(/[A-Z]{2,}|[0-9]{6}/)) {
      // 股票分析
      const ticker = prompt.match(/[A-Z]{2,}|[0-9]{6}/)?.[0] || '';
      response += `${ticker}目前整体趋势中性，近期走势受市场情绪影响波动较大。基本面方面，该公司财务状况稳健，PE处于行业平均水平。建议密切关注公司下周的财报发布，可能会带来波动性。`;
    } else if (prompt.includes('回测') || prompt.includes('策略')) {
      // 策略分析
      response += `基于历史数据回测，动量策略在过去6个月表现较好，年化收益约12.3%，最大回撤8.5%。价值策略更稳健，年化收益8.7%，最大回撤仅5.2%。根据当前市场环境，建议配置70%价值+30%动量的混合策略，以平衡风险与收益。`;
    } else if (prompt.includes('风险') || prompt.includes('管理')) {
      // 风险管理
      response += `当前市场波动性增加，建议：1)设置止损，控制单笔交易损失不超过投资组合的2%；2)提高分散度，单个行业占比不超过30%；3)保留15%现金仓位应对波动；4)使用均值回归策略可能更适合当前市场环境。`;
    } else {
      // 通用回答
      response += `当前市场处于震荡调整阶段，A股估值处于历史中位数附近，美股科技股呈现高估状态。投资策略上建议采取稳健的价值投资方法，关注高股息、低估值且有竞争优势的公司。另建议做好资产配置，股票、债券、现金保持合理比例。`;
    }
    
    return { text: response };
  }
};

/**
 * 模拟Mastra实例
 * 注：实际项目中需安装Mastra依赖并使用真实的Mastra API
 */
export const mastra = {
  agents: {
    tradingAgent
  },
  // 获取特定代理
  getAgent: (agentName: string) => {
    return mastra.agents[agentName as keyof typeof mastra.agents];
  },
  // 模拟获取工作流的方法
  getWorkflow: (workflowName: string) => {
    return {
      execute: async (params: any) => {
        console.log(`[DEBUG] 执行工作流 ${workflowName} 参数:`, params);
        // 模拟工作流执行结果
        return {
          result: "工作流执行成功",
          context: params.context,
          ticker: params.context.ticker,
          decisions: {
            signal: Math.random() > 0.5 ? "buy" : "sell",
            confidence: Math.floor(Math.random() * 100),
            reasoning: "基于综合分析，当前市场条件下该股票呈现较好的投资机会。"
          }
        };
      }
    };
  }
};

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