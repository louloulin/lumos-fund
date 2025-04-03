// 此文件仅可在服务器端使用
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';
import { openai } from '@ai-sdk/openai';

// 导入Agent、Tool、Workflow接口从正确的子模块
import type { Tool } from '@mastra/core/tools';
import type { Workflow } from '@mastra/core/workflow';

// 导入代理
import { riskManagementAgent } from './agents/riskManagementAgent';
import { quantInvestingAgent } from './agents/quantInvestingAgent';
import { macroAnalysisAgent } from './agents/macroAnalysisAgent';
import { sentimentAnalysisAgent } from './agents/sentimentAnalysisAgent';
import { stockAgent, valueInvestingAgent, growthInvestingAgent, trendInvestingAgent } from './agents/stockAgent';
import { technicalAnalysisAgent } from './agents/technicalAnalysisAgent';

// 导入工具 - 修复导入冲突
import { financialMetricsTool } from './tools/financialMetrics';
import { technicalIndicatorsTool } from './tools/technicalIndicatorTools';
import { newsSentimentTool } from './tools/newsSentiment';
import { factorModelTool } from './tools/factorModelTools';
import { statisticalArbitrageTool } from './tools/statisticalArbitrageTools';

const logger = createLogger('mastra');

// 定义工具和代理

/**
 * 股票价格工具 - 用于获取股票价格数据
 */
const stockPriceTool: Tool = {
  id: 'stockPriceTool',
  description: '获取股票价格数据',
  execute: async (options: any) => {
    try {
      const { context } = options;
      const { ticker } = context;
      logger.info(`获取股票价格: ${ticker}`);
      
      // 这里模拟API调用，实际项目中应该调用真实API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData = {
        ticker,
        currentPrice: Math.random() * 1000 + 50,
        change: Math.random() * 20 - 10,
        changePercent: Math.random() * 5 - 2.5,
        volume: Math.floor(Math.random() * 10000000),
        marketCap: `${Math.floor(Math.random() * 1000)}B`,
        pe: (Math.random() * 30 + 5).toFixed(2),
        dividendYield: (Math.random() * 5).toFixed(2),
        high52: Math.random() * 1200 + 100,
        low52: Math.random() * 500 + 50,
      };
      
      return mockData;
    } catch (error) {
      logger.error('获取股票价格失败', error);
      throw error;
    }
  }
};

/**
 * 投资组合优化代理 - 负责优化投资组合配置
 */
const portfolioOptimizationAgent: Agent = new Agent({
  id: 'portfolioOptimizationAgent',
  description: '投资组合优化代理，根据风险收益优化投资组合',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `
    你是一位专业的投资组合优化专家，负责根据风险收益分析优化投资组合。
    
    提供投资组合建议时，你应该：
    1. 考虑资产相关性和多元化
    2. 根据风险偏好调整资产配置
    3. 考虑行业、规模、地区的分散
    4. 给出明确的资产配置百分比
    5. 解释你的优化逻辑和预期结果
    
    使用专业的投资组合理论和量化方法支持你的建议。
  `
});

/**
 * 执行代理 - 负责生成交易执行计划
 */
const executionAgent: Agent = new Agent({
  id: 'executionAgent',
  description: '执行代理，负责生成具体的交易执行计划',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `
    你是一位专业的交易执行专家，负责根据投资决策生成具体的交易执行计划。
    
    提供执行计划时，你应该：
    1. 考虑交易成本和滑点
    2. 分析最佳交易时机
    3. 建议适当的订单类型（市价单、限价单等）
    4. 考虑分批交易减少市场影响
    5. 提供风控措施如止损设置
    
    注重执行效率和风险控制。
  `
});

/**
 * 交易代理 - 综合分析并提供交易建议
 */
const tradingAgent: Agent = new Agent({
  id: 'tradingAgent',
  description: '综合交易代理，能够分析股票并给出投资建议',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `
    你是一个专业的交易顾问，擅长从多角度分析股票，并给出清晰的投资建议。
    
    提供分析时，你应该：
    1. 考虑基本面、技术面和市场情绪
    2. 给出明确的投资信号（买入/卖出/持有）
    3. 说明你的置信度和理由
    4. 提供风险提示
    5. 给出合理的价格区间和时间框架
    
    保持客观、专业，避免过度乐观或悲观。
  `,
  tools: {
    stockPriceTool,
    financialMetricsTool,
    technicalIndicatorsTool,
    newsSentimentTool
  }
});

/**
 * 交易决策工作流
 */
const tradingDecisionWorkflow: Workflow = {
  execute: async (options: any) => {
    const { context } = options;
    const { ticker, portfolio } = context;
    logger.info(`执行交易决策工作流: ${ticker}`);
    
    try {
      // 获取股票数据
      const stockData = await stockPriceTool.execute({ 
        context: { ticker } 
      });
      
      // 执行价值投资分析
      const valueAnalysis = await valueInvestingAgent.generate(
        `分析 ${ticker} 的价值投资潜力，基于以下数据：${JSON.stringify(stockData)}`
      );
      
      // 执行成长投资分析
      const growthAnalysis = await growthInvestingAgent.generate(
        `分析 ${ticker} 的成长投资潜力，基于以下数据：${JSON.stringify(stockData)}`
      );
      
      // 执行趋势分析
      const trendAnalysis = await trendInvestingAgent.generate(
        `分析 ${ticker} 的技术趋势，基于以下数据：${JSON.stringify(stockData)}`
      );
      
      // 执行量化因子分析
      const quantAnalysis = await quantInvestingAgent.generate(
        `分析 ${ticker} 的量化因子表现，基于以下数据：${JSON.stringify(stockData)}`
      );
      
      // 执行宏观环境分析
      const macroAnalysis = await macroAnalysisAgent.generate(
        `分析当前宏观经济环境对 ${ticker} 所在行业的影响`
      );
      
      // 执行风险评估
      const riskAssessment = await riskManagementAgent.generate(
        `评估 ${ticker} 的投资风险，基于以下数据和分析：
        价格数据: ${JSON.stringify(stockData)}
        价值分析: ${valueAnalysis.text}
        成长分析: ${growthAnalysis.text}
        趋势分析: ${trendAnalysis.text}
        量化分析: ${quantAnalysis.text}
        宏观分析: ${macroAnalysis.text}
        投资组合: ${JSON.stringify(portfolio)}`
      );
      
      // 综合分析并给出决策
      const decisionPrompt = `基于以下分析，为投资组合${JSON.stringify(portfolio)}给出关于${ticker}的投资决策建议:
        价值分析: ${valueAnalysis.text}
        成长分析: ${growthAnalysis.text}
        趋势分析: ${trendAnalysis.text}
        量化分析: ${quantAnalysis.text}
        宏观分析: ${macroAnalysis.text}
        风险评估: ${riskAssessment.text}
        
        考虑风险收益比，当前市场环境和投资组合现状，请给出明确的建议：买入、卖出或持有，以及建议的仓位比例和理由。
      `;
      
      const finalDecision = await valueInvestingAgent.generate(decisionPrompt);
      
      return {
        stockData,
        valueAnalysis: valueAnalysis.text,
        growthAnalysis: growthAnalysis.text,
        trendAnalysis: trendAnalysis.text,
        quantAnalysis: quantAnalysis.text,
        macroAnalysis: macroAnalysis.text,
        riskAssessment: riskAssessment.text,
        decision: finalDecision.text,
      };
    } catch (error) {
      logger.error('交易决策工作流失败', error);
      throw error;
    }
  }
};

// 初始化mastra - 使用正确的声明顺序
logger.info('初始化mastra服务');
export const mastra = new Mastra({
  agents: {
    stockAgent,
    valueInvestingAgent,
    growthInvestingAgent,
    trendInvestingAgent,
    quantInvestingAgent,
    macroAnalysisAgent,
    riskManagementAgent,
    sentimentAnalysisAgent,
    technicalAnalysisAgent,
    portfolioOptimizationAgent,
    executionAgent,
    tradingAgent
  },
  workflows: {
    tradingDecisionWorkflow
  },
  tools: {
    stockPriceTool,
    financialMetricsTool,
    technicalIndicatorsTool,
    newsSentimentTool,
    factorModelTool,
    statisticalArbitrageTool
  }
});

// 设置mastra的getAgent和getWorkflow方法
mastra.getAgent = (name: string) => {
  switch (name) {
    case 'valueInvestingAgent':
      return valueInvestingAgent;
    case 'growthInvestingAgent':
      return growthInvestingAgent;
    case 'trendInvestingAgent':
      return trendInvestingAgent;
    case 'quantInvestingAgent':
      return quantInvestingAgent;
    case 'macroAnalysisAgent':
      return macroAnalysisAgent;
    case 'riskManagementAgent':
      return riskManagementAgent;
    case 'sentimentAnalysisAgent':
      return sentimentAnalysisAgent;
    case 'technicalAnalysisAgent':
      return technicalAnalysisAgent;
    case 'portfolioOptimizationAgent':
      return portfolioOptimizationAgent;
    case 'executionAgent':
      return executionAgent;
    case 'tradingAgent':
      return tradingAgent;
    default:
      throw new Error(`Agent ${name} not found`);
  }
};

mastra.getWorkflow = (name: string) => {
  switch (name) {
    case 'tradingDecisionWorkflow':
      return tradingDecisionWorkflow;
    default:
      throw new Error(`Workflow ${name} not found`);
  }
};

// 导出所有代理供其他模块使用
export {
  stockAgent,
  valueInvestingAgent, 
  growthInvestingAgent, 
  trendInvestingAgent, 
  quantInvestingAgent, 
  macroAnalysisAgent, 
  riskManagementAgent,
  sentimentAnalysisAgent,
  technicalAnalysisAgent,
  portfolioOptimizationAgent,
  executionAgent,
  tradingAgent
};

// 导出工作流
export { tradingDecisionWorkflow };

// 导出工具（统一在一个export语句中导出所有工具）
export {
  financialMetricsTool,
  technicalIndicatorsTool,
  newsSentimentTool,
  factorModelTool,
  statisticalArbitrageTool,
  stockPriceTool
}; 