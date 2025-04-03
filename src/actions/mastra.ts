'use server';

import { z } from "zod";
import { runValueBacktest, runMomentumBacktest, runMeanReversionBacktest, runComparisonBacktest } from "@/actions/backtest";

/**
 * Mastra AI Agent类型声明
 */
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
  getWorkflow?: (name: string) => any;
};

type Tool = {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any) => Promise<any>;
};

/**
 * Mastra模拟实现
 * 在生产环境中，这些会替换为实际的Mastra导入
 */
const openai = (model: string) => {
  return { model };
};

const createTool = (config: Tool): Tool => {
  return config;
};

/**
 * 市场分析工具 - 分析市场状况和趋势
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

/**
 * 回测工具参数类型
 */
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
 * 回测工具 - 评估交易策略的历史表现
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
      
      // 添加AI友好的分析
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

/**
 * 策略推荐参数接口
 */
interface StrategyRecommendationParams {
  ticker: string;
  riskTolerance: "low" | "medium" | "high";
  investmentHorizon: "short" | "medium" | "long";
  marketCondition?: "bull" | "bear" | "neutral";
}

/**
 * 策略推荐工具 - 根据投资者偏好和市场状况推荐交易策略
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
        reasoning += "适中的风险承受能力配合当前市场状况，动量策略可能会有不错的表现。";
      } else {
        recommendedStrategies.push("meanReversion");
        parameters = {
          bollingerPeriod: 20,
          bollingerDeviation: 2
        };
        reasoning += "在熊市环境下，均值回归策略通常能够更好地捕捉反弹机会。";
      }
    } else if (riskTolerance === "high") {
      if (investmentHorizon === "short") {
        recommendedStrategies.push("momentum");
        parameters = {
          maShortPeriod: 10,
          maLongPeriod: 30,
          rsiPeriod: 7,
          rsiOverbought: 75,
          rsiOversold: 25
        };
        reasoning += "高风险承受能力配合短期投资视野，激进的动量策略可能更适合您的需求。";
      } else {
        recommendedStrategies.push("value");
        recommendedStrategies.push("momentum");
        parameters = {
          peRatio: 20,
          pbRatio: 2.5,
          dividendYield: 1.5,
          maShortPeriod: 20,
          maLongPeriod: 50
        };
        reasoning += "长期投资视野配合高风险承受能力，混合策略可能会是更优选择，同时考虑价值和动量因素。";
      }
    }
    
    // 生成具体的策略推荐
    return {
      ticker,
      recommendedStrategies,
      primaryStrategy: recommendedStrategies[0],
      parameters,
      reasoning,
      recommendationDate: new Date().toISOString(),
      recommendation: `根据您的风险承受能力(${riskTolerance})和投资期限(${investmentHorizon})，针对${ticker}的最佳策略是${recommendedStrategies.join('+')}。${reasoning}`
    };
  },
});

/**
 * AI交易代理实现
 * 模拟Mastra AI Agent行为
 */
class MockMastraAgent implements Agent {
  name: string;
  instructions: string;
  model: any;
  tools: Record<string, any>;
  memory?: { enabled: boolean };

  constructor({
    name,
    instructions,
    model,
    tools,
    memory,
  }: {
    name: string;
    instructions: string;
    model: any;
    tools: Record<string, Tool>;
    memory?: { enabled: boolean };
  }) {
    this.name = name;
    this.instructions = instructions;
    this.model = model;
    this.tools = tools;
    this.memory = memory;
  }

  async generate(prompt: string): Promise<AgentResponse> {
    console.log(`[${this.name}] 处理请求: ${prompt}`);
    
    try {
      // 分析提示并决定使用哪个工具
      const lowerPrompt = prompt.toLowerCase();
      let response: any = null;
      
      // 根据提示内容选择合适的工具
      if (lowerPrompt.includes('市场') || lowerPrompt.includes('分析') || lowerPrompt.includes('趋势')) {
        const ticker = extractTicker(prompt) || 'AAPL';
        const timeframe = lowerPrompt.includes('周') ? 'week' : 
                         lowerPrompt.includes('月') ? 'month' : 'day';
        
        response = await this.tools.marketAnalysis.execute({
          ticker,
          timeframe
        });
        
        return {
          text: `我已经分析了${ticker}的市场状况：${response.analysis}`,
          result: response
        };
      } 
      else if (lowerPrompt.includes('回测') || lowerPrompt.includes('测试') || lowerPrompt.includes('策略')) {
        const ticker = extractTicker(prompt) || 'AAPL';
        const strategy = lowerPrompt.includes('价值') ? 'value' :
                       lowerPrompt.includes('动量') ? 'momentum' : 'meanReversion';
        
        response = await this.tools.backtestStrategy.execute({
          ticker,
          initialCapital: 10000,
          startDate: '2022-01-01',
          endDate: '2023-01-01',
          strategy
        });
        
        return {
          text: `我已经为${ticker}回测了${strategy}策略：${response.summary}`,
          result: response
        };
      }
      else if (lowerPrompt.includes('推荐') || lowerPrompt.includes('建议')) {
        const ticker = extractTicker(prompt) || 'AAPL';
        const riskTolerance = lowerPrompt.includes('低风险') ? 'low' :
                            lowerPrompt.includes('高风险') ? 'high' : 'medium';
        const investmentHorizon = lowerPrompt.includes('短期') ? 'short' :
                                lowerPrompt.includes('长期') ? 'long' : 'medium';
        
        response = await this.tools.recommendStrategy.execute({
          ticker,
          riskTolerance,
          investmentHorizon,
          marketCondition: 'neutral'
        });
        
        return {
          text: `基于您的偏好，${response.recommendation}`,
          result: response
        };
      }
      else {
        // 默认回复
        return {
          text: `您好，我是${this.name}。我可以帮您分析市场、回测策略或推荐投资方法。请提供更具体的信息，如股票代码、风险偏好或投资期限等。`,
        };
      }
    } catch (error: any) {
      console.error(`[${this.name}] 处理错误:`, error);
      return {
        text: `很抱歉，处理您的请求时出现了错误: ${error.message || '未知错误'}`,
        error: error.message
      };
    }
  }

  getWorkflow(name: string) {
    // 模拟工作流获取功能
    console.log(`[${this.name}] 获取工作流: ${name}`);
    return {
      execute: async (context: any) => {
        console.log(`执行工作流 ${name} 使用上下文:`, context);
        
        // 模拟工作流执行
        const results: any = {};
        
        // 对每种分析类型进行处理
        if (name === 'tradingDecision') {
          // 执行基本面分析
          results.fundamental = await this.generate(`分析${context.ticker}的基本面`);
          
          // 执行技术分析
          results.technical = await this.generate(`分析${context.ticker}的技术指标`);
          
          // 执行风险分析
          results.risk = await this.generate(`评估${context.ticker}的投资风险`);
          
          // 生成最终建议
          const recommendation = await this.generate(`基于分析结果，推荐${context.ticker}的交易策略`);
          
          return {
            results,
            recommendation,
          };
        }
        
        return {
          text: `未找到工作流: ${name}`,
          error: 'Workflow not found'
        };
      }
    };
  }
}

/**
 * 从提示中提取股票代码
 */
function extractTicker(prompt: string): string | null {
  // 简单地查找大写字母组合作为股票代码
  const matches = prompt.match(/[A-Z]{2,6}/);
  return matches ? matches[0] : null;
}

/**
 * 交易助手代理 - 综合分析市场并提供交易建议
 */
const tradingAssistantAgent = new MockMastraAgent({
  name: "Trading Assistant",
  instructions: `你是一个专业的交易助手，帮助用户分析市场、回测策略并提供投资建议。
  
  使用提供的工具分析市场状况，回测不同的交易策略，并根据用户的风险偏好和投资目标推荐适合的投资方法。
  
  在每次回应中，请提供：
  1. 清晰简洁的分析总结
  2. 具体的数据支持你的观点
  3. 明确的行动建议
  4. 投资相关风险提示
  
  始终提醒用户投资有风险，市场预测不保证未来结果。`,
  model: openai("gpt-4o"),
  tools: {
    marketAnalysis: marketAnalysisTool,
    backtestStrategy: backtestTool,
    recommendStrategy: strategyRecommendationTool
  },
  memory: { enabled: true }
});

/**
 * 价值投资代理 - 巴菲特风格
 */
const valueInvestingAgent = new MockMastraAgent({
  name: "Value Investing Expert",
  instructions: `你是沃伦·巴菲特风格的价值投资专家。
  
  分析公司时，你会关注:
  1. 持久的竞争优势（护城河）
  2. 良好的管理质量和资本分配
  3. 可理解的业务模型
  4. 内在价值与市场价格的差距（安全边际）
  5. 长期增长潜力
  
  使用提供的工具分析公司基本面，并寻找被低估的优质公司。`,
  model: openai("gpt-4o"),
  tools: {
    marketAnalysis: marketAnalysisTool,
    backtestStrategy: backtestTool
  }
});

/**
 * 技术分析代理 - 专注短期市场动态
 */
const technicalAnalysisAgent = new MockMastraAgent({
  name: "Technical Analysis Expert",
  instructions: `你是一位专业的技术分析师，专注于价格图表和技术指标分析。
  
  你擅长于:
  1. 趋势识别与跟踪
  2. 支撑位和阻力位分析
  3. 各种技术指标解读（RSI、MACD、移动平均线等）
  4. 图表形态识别
  5. 交易量分析
  
  使用提供的工具分析价格走势和技术指标，寻找交易信号。`,
  model: openai("gpt-4o"),
  tools: {
    marketAnalysis: marketAnalysisTool,
    backtestStrategy: backtestTool
  }
});

/**
 * 风险管理代理 - 专注投资风险控制
 */
const riskManagementAgent = new MockMastraAgent({
  name: "Risk Management Expert",
  instructions: `你是一位风险管理专家，专注于控制投资组合风险。
  
  你关注的方面包括:
  1. 投资组合多样化
  2. 最大回撤管理
  3. 头寸规模控制
  4. 风险收益比评估
  5. 相关性分析
  
  使用提供的工具评估投资风险，设计风险管理策略，确保投资安全。`,
  model: openai("gpt-4o"),
  tools: {
    backtestStrategy: backtestTool,
    recommendStrategy: strategyRecommendationTool
  }
});

/**
 * Mastra AI 实例
 * 管理所有的AI代理和工具
 */
class MastraMock {
  agents: Record<string, Agent>;

  constructor({ agents }: { agents: Record<string, Agent> }) {
    this.agents = agents;
  }

  getAgent(name: string): Agent {
    const agent = this.agents[name];
    if (!agent) {
      throw new Error(`Agent not found: ${name}`);
    }
    return agent;
  }
}

/**
 * 创建Mastra AI实例，导出供应用使用
 */
const mastra = new MastraMock({
  agents: {
    tradingAssistant: tradingAssistantAgent,
    valueInvestor: valueInvestingAgent,
    technicalAnalyst: technicalAnalysisAgent,
    riskManager: riskManagementAgent
  }
});

/**
 * 股票分析行动 - 使用交易助手代理进行全面分析
 */
export async function getStockAnalysis(ticker: string): Promise<string> {
  try {
    const agent = mastra.getAgent('tradingAssistant');
    if (!agent) {
      throw new Error("Mastra agent not initialized");
    }
    const response = await agent.generate(`分析${ticker}的市场状况、技术指标和投资前景`);
    return response.text;
  } catch (error: any) {
    console.error('股票分析错误:', error);
    return `分析错误: ${error.message || '未知错误'}`;
  }
}

/**
 * 市场洞察行动 - 获取整体市场情况
 */
export async function getMarketInsights(ticker: string, timeframe: string): Promise<string> {
  try {
    const agent = mastra.getAgent('tradingAssistant');
    if (!agent) {
      throw new Error("Mastra agent not initialized");
    }
    const response = await agent.generate(`分析${ticker}在${timeframe}时间周期的市场状况，包括价格趋势、成交量分析和整体市场情绪`);
    return response.text;
  } catch (error: any) {
    console.error('市场洞察错误:', error);
    return `分析错误: ${error.message || '未知错误'}`;
  }
}

/**
 * 交易决策工作流行动 - 运行完整的分析和决策流程
 */
export async function executeTradingWorkflow(ticker: string, portfolio: any = {}) {
  try {
    const agent = mastra.getAgent('tradingAssistant');
    
    if (!agent.getWorkflow) {
      throw new Error('Agent does not support workflows');
    }
    
    const workflow = agent.getWorkflow('tradingDecision');
    
    if (!workflow) {
      throw new Error('Trading decision workflow not found');
    }
    
    const result = await workflow.execute({
      ticker,
      portfolio,
      context: {
        date: new Date().toISOString(),
        accountSize: portfolio.accountSize || 10000,
      }
    });
    
    return result;
  } catch (error: any) {
    console.error('交易工作流错误:', error);
    return { text: `执行错误: ${error.message || '未知错误'}` };
  }
}

/**
 * 价值投资分析行动 - 使用价值投资代理
 */
export async function getValueInvestingAnalysis(ticker: string) {
  try {
    const agent = mastra.getAgent('valueInvestor');
    const response = await agent.generate(`从价值投资角度分析${ticker}的投资价值和潜力`);
    return response;
  } catch (error: any) {
    console.error('价值投资分析错误:', error);
    return { text: `分析错误: ${error.message || '未知错误'}` };
  }
}

/**
 * 成长投资分析行动
 */
export async function getGrowthInvestingAnalysis(ticker: string) {
  try {
    const agent = mastra.getAgent('tradingAssistant');
    const response = await agent.generate(`从成长投资角度分析${ticker}的增长潜力和未来前景`);
    return response;
  } catch (error: any) {
    console.error('成长投资分析错误:', error);
    return { text: `分析错误: ${error.message || '未知错误'}` };
  }
}

/**
 * 技术分析行动 - 使用技术分析代理
 */
export async function getTechnicalAnalysis(ticker: string) {
  try {
    const agent = mastra.getAgent('technicalAnalyst');
    const response = await agent.generate(`分析${ticker}的技术指标、价格走势和交易信号`);
    return response;
  } catch (error: any) {
    console.error('技术分析错误:', error);
    return { text: `分析错误: ${error.message || '未知错误'}` };
  }
}

/**
 * 量化投资分析行动
 */
export async function getQuantInvestingAnalysis(
  ticker: string, 
  timeframe: 'short' | 'medium' | 'long' = 'medium',
  riskTolerance: 'low' | 'medium' | 'high' = 'medium'
) {
  try {
    const agent = mastra.getAgent('tradingAssistant');
    const response = await agent.generate(`对${ticker}进行量化分析，时间框架为${timeframe}，风险承受能力为${riskTolerance}`);
    return response;
  } catch (error: any) {
    console.error('量化投资分析错误:', error);
    return { text: `分析错误: ${error.message || '未知错误'}` };
  }
}

/**
 * 情绪分析行动
 */
export async function getSentimentAnalysis(ticker: string) {
  try {
    const agent = mastra.getAgent('tradingAssistant');
    const response = await agent.generate(`分析市场对${ticker}的情绪和舆论，包括新闻、社交媒体和分析师观点`);
    return response;
  } catch (error: any) {
    console.error('情绪分析错误:', error);
    return { text: `分析错误: ${error.message || '未知错误'}` };
  }
}

/**
 * 投资组合优化行动
 */
export async function getPortfolioOptimization(portfolio: any, riskProfile: 'conservative' | 'moderate' | 'aggressive' = 'moderate') {
  try {
    const agent = mastra.getAgent('riskManager');
    const response = await agent.generate(`优化投资组合配置，风险偏好为${riskProfile}，当前资产分配为${JSON.stringify(portfolio)}`);
    return response;
  } catch (error: any) {
    console.error('投资组合优化错误:', error);
    return { text: `分析错误: ${error.message || '未知错误'}` };
  }
}

/**
 * 宏观经济分析行动
 */
export async function getMacroAnalysis(sector?: string) {
  try {
    const agent = mastra.getAgent('tradingAssistant');
    let prompt = '分析当前宏观经济环境，包括通胀、利率、GDP增长和就业情况';
    
    if (sector) {
      prompt += `，特别关注对${sector}行业的影响`;
    }
    
    const response = await agent.generate(prompt);
    return response;
  } catch (error: any) {
    console.error('宏观分析错误:', error);
    return { text: `分析错误: ${error.message || '未知错误'}` };
  }
}

/**
 * 风险管理分析行动
 */
export async function getRiskManagementAnalysis(ticker: string | any) {
  try {
    const agent = mastra.getAgent('riskManager');
    
    let prompt = '';
    if (typeof ticker === 'string') {
      prompt = `分析投资${ticker}的风险因素，并提供风险管理建议`;
    } else {
      prompt = `分析当前投资组合的风险状况，并提供风险管理建议: ${JSON.stringify(ticker)}`;
    }
    
    const response = await agent.generate(prompt);
    return response;
  } catch (error: any) {
    console.error('风险管理分析错误:', error);
    return { text: `分析错误: ${error.message || '未知错误'}` };
  }
}

/**
 * 执行计划行动 - 生成交易执行计划
 */
export async function getExecutionPlan(
  action: 'buy' | 'sell',
  ticker: string,
  quantity: number,
  constraints?: string
) {
  try {
    const agent = mastra.getAgent('tradingAssistant');
    
    let prompt = `制定${action === 'buy' ? '买入' : '卖出'}${quantity}股${ticker}的执行计划`;
    if (constraints) {
      prompt += `，同时考虑以下约束条件：${constraints}`;
    }
    
    const response = await agent.generate(prompt);
    return response;
  } catch (error: any) {
    console.error('执行计划错误:', error);
    return { text: `分析错误: ${error.message || '未知错误'}` };
  }
}

/**
 * 策略推荐行动 - 根据风险承受能力推荐策略
 */
export async function getStrategyRecommendation(ticker: string, riskTolerance: 'low' | 'moderate' | 'high'): Promise<string> {
  try {
    const agent = mastra.getAgent('recommendStrategy');
    if (!agent) {
      throw new Error("Mastra agent not initialized");
    }
    const response = await agent.generate(`推荐适合${ticker}的交易策略，风险承受能力为${riskTolerance}。包括入场点、退出策略、仓位大小和风险管理。`);
    return response.text;
  } catch (error: any) {
    console.error('策略推荐错误:', error);
    return `分析错误: ${error.message || '未知错误'}`;
  }
}

// 导出所有行动函数 