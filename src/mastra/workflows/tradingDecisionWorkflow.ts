import { Workflow, Step } from '@mastra/core/workflow';
import { z } from 'zod';
import { valueInvestingAgent } from '../agents/valueInvestingAgent';
import { technicalAnalysisAgent } from '../agents/technicalAnalysisAgent';
import { sentimentAnalysisAgent } from '../agents/sentimentAnalysisAgent';
import { riskManagementAgent } from '../agents/riskManagementAgent';
import { portfolioOptimizationAgent } from '../agents/portfolioOptimizationAgent';
import { strategyRecommendationAgent } from '../agents/strategyRecommendationAgent';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('tradingDecisionWorkflow');

// 分析类型枚举
export type AnalysisType = 'fundamental' | 'technical' | 'sentiment' | 'quantitative';

// 定义输入模式
const triggerSchema = z.object({
  ticker: z.string().describe('股票代码'),
  analysisTypes: z.array(z.enum(['fundamental', 'technical', 'sentiment', 'quantitative'])).default(['fundamental', 'technical']),
  riskTolerance: z.enum(['low', 'moderate', 'high']).describe('风险承受能力'),
  investmentHorizon: z.enum(['short', 'medium', 'long']).describe('投资期限'),
  marketCondition: z.enum(['bull', 'bear', 'neutral', 'volatile']).optional(),
  portfolioData: z.any().optional(),
  userId: z.string().optional(),
});

// 基本面分析步骤
const fundamentalAnalysisStep = new Step({
  id: 'fundamentalAnalysis',
  outputSchema: z.object({
    signal: z.enum(['bullish', 'bearish', 'neutral']),
    confidence: z.number().min(0).max(100),
    analysis: z.string(),
    metrics: z.record(z.any())
  }),
  execute: async ({ context, mastra }) => {
    try {
      logger.info('执行基本面分析', { ticker: context.ticker });
      
      const agent = mastra?.agents?.valueInvestingAgent;
      
      const prompt = `对${context.ticker}进行全面的基本面分析。
      分析公司的财务状况、增长潜力、管理团队质量和行业竞争力。
      考虑当前的市场环境(${context.marketCondition || 'neutral'})和用户的风险偏好(${context.riskTolerance})。
      以价值投资者的角度提供对${context.ticker}的看法。`;
      
      const response = await agent?.generate(prompt);
      
      // 解析代理返回的文本响应，提取关键信息
      // 实际项目中可使用更结构化的方法解析
      const signal = response?.text.includes('看涨') ? 'bullish' : 
                     response?.text.includes('看跌') ? 'bearish' : 'neutral';
                     
      const confidenceMatch = response?.text.match(/置信度[:：]\s*(\d+)/);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
      
      return {
        signal,
        confidence,
        analysis: response?.text || '',
        metrics: { /* 提取的指标数据 */ }
      };
    } catch (error) {
      logger.error('基本面分析失败', { error });
      throw error;
    }
  }
});

// 技术分析步骤
const technicalAnalysisStep = new Step({
  id: 'technicalAnalysis',
  outputSchema: z.object({
    signal: z.enum(['bullish', 'bearish', 'neutral']),
    confidence: z.number().min(0).max(100),
    analysis: z.string(),
    indicators: z.record(z.any())
  }),
  execute: async ({ context, mastra }) => {
    try {
      logger.info('执行技术分析', { ticker: context.ticker });
      
      const agent = mastra?.agents?.technicalAnalysisAgent;
      
      const prompt = `对${context.ticker}进行技术分析。
      分析价格走势、成交量、RSI、MACD和移动平均线等技术指标。
      考虑用户的投资期限(${context.investmentHorizon})和风险偏好(${context.riskTolerance})。
      提供技术角度的预测和交易信号。`;
      
      const response = await agent?.generate(prompt);
      
      // 解析代理返回的文本响应
      const signal = response?.text.includes('看涨') ? 'bullish' : 
                     response?.text.includes('看跌') ? 'bearish' : 'neutral';
                     
      const confidenceMatch = response?.text.match(/置信度[:：]\s*(\d+)/);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
      
      return {
        signal,
        confidence,
        analysis: response?.text || '',
        indicators: { /* 提取的指标数据 */ }
      };
    } catch (error) {
      logger.error('技术分析失败', { error });
      throw error;
    }
  }
});

// 情绪分析步骤
const sentimentAnalysisStep = new Step({
  id: 'sentimentAnalysis',
  outputSchema: z.object({
    signal: z.enum(['bullish', 'bearish', 'neutral']),
    confidence: z.number().min(0).max(100),
    analysis: z.string(),
    sources: z.array(z.object({
      source: z.string(),
      sentiment: z.number().min(-1).max(1)
    })).optional()
  }),
  execute: async ({ context, mastra }) => {
    try {
      logger.info('执行情绪分析', { ticker: context.ticker });
      
      const agent = mastra?.agents?.sentimentAnalysisAgent;
      
      const prompt = `分析${context.ticker}的市场情绪。
      考察新闻报道、社交媒体情绪和分析师评级。
      评估投资者情绪如何影响该股票的短期和中期走势。
      考虑当前的市场环境(${context.marketCondition || 'neutral'})。`;
      
      const response = await agent?.generate(prompt);
      
      // 解析代理返回的文本响应
      const signal = response?.text.includes('积极') || response?.text.includes('看涨') ? 'bullish' : 
                     response?.text.includes('消极') || response?.text.includes('看跌') ? 'bearish' : 'neutral';
                     
      const confidenceMatch = response?.text.match(/置信度[:：]\s*(\d+)/);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
      
      return {
        signal,
        confidence,
        analysis: response?.text || '',
        sources: []
      };
    } catch (error) {
      logger.error('情绪分析失败', { error });
      throw error;
    }
  }
});

// 风险评估步骤
const riskAssessmentStep = new Step({
  id: 'riskAssessment',
  outputSchema: z.object({
    riskLevel: z.enum(['low', 'moderate', 'high', 'extreme']),
    analysis: z.string(),
    recommendations: z.array(z.string())
  }),
  execute: async ({ context, results, mastra }) => {
    try {
      logger.info('执行风险评估', { ticker: context.ticker });
      
      const agent = mastra?.agents?.riskManagementAgent;
      
      // 综合前面步骤的结果
      const analyses = [];
      if (results.fundamentalAnalysis) analyses.push(`基本面分析: ${results.fundamentalAnalysis.analysis}`);
      if (results.technicalAnalysis) analyses.push(`技术分析: ${results.technicalAnalysis.analysis}`);
      if (results.sentimentAnalysis) analyses.push(`情绪分析: ${results.sentimentAnalysis.analysis}`);
      
      const prompt = `对${context.ticker}进行风险评估。
      考虑以下分析:
      ${analyses.join('\n')}
      
      考虑用户的风险承受能力(${context.riskTolerance})和投资期限(${context.investmentHorizon})。
      分析潜在风险，并给出风险管理建议。`;
      
      const response = await agent?.generate(prompt);
      
      // 解析代理返回的文本响应
      const riskLevelMatch = response?.text.match(/风险[等级水平][:：]?\s*(低|中|高|极高)/);
      const riskLevel = riskLevelMatch ? 
        (riskLevelMatch[1] === '低' ? 'low' : 
         riskLevelMatch[1] === '中' ? 'moderate' : 
         riskLevelMatch[1] === '高' ? 'high' : 'extreme') 
        : 'moderate';
      
      // 提取建议
      const recommendationsMatch = response?.text.match(/建议[:：]?\s*([\s\S]*?)(?:\n\n|$)/);
      const recommendationsText = recommendationsMatch ? recommendationsMatch[1] : '';
      const recommendations = recommendationsText
        .split(/\n/)
        .map(r => r.trim())
        .filter(r => r.length > 0 && !r.startsWith('建议'));
      
      return {
        riskLevel,
        analysis: response?.text || '',
        recommendations: recommendations.length > 0 ? recommendations : ['无具体建议']
      };
    } catch (error) {
      logger.error('风险评估失败', { error });
      throw error;
    }
  }
});

// 策略推荐步骤
const strategyRecommendationStep = new Step({
  id: 'strategyRecommendation',
  outputSchema: z.object({
    primaryStrategy: z.string(),
    secondaryStrategy: z.string().optional(),
    allocation: z.record(z.number()),
    tradingRules: z.object({
      entrySignals: z.array(z.string()),
      exitSignals: z.array(z.string())
    }),
    explanation: z.string()
  }),
  execute: async ({ context, results, mastra }) => {
    try {
      logger.info('执行策略推荐', { ticker: context.ticker });
      
      const agent = mastra?.agents?.strategyRecommendationAgent;
      
      // 使用现有的strategyRecommendationAgent
      const response = await agent?.generate(`
      为${context.ticker}推荐投资策略，考虑以下因素:
      - 风险承受能力: ${context.riskTolerance}
      - 投资期限: ${context.investmentHorizon}
      - 市场状况: ${context.marketCondition || 'neutral'}
      
      基于前面的分析:
      ${results.fundamentalAnalysis ? `- 基本面: ${results.fundamentalAnalysis.signal} (置信度: ${results.fundamentalAnalysis.confidence}%)` : ''}
      ${results.technicalAnalysis ? `- 技术面: ${results.technicalAnalysis.signal} (置信度: ${results.technicalAnalysis.confidence}%)` : ''}
      ${results.sentimentAnalysis ? `- 市场情绪: ${results.sentimentAnalysis.signal} (置信度: ${results.sentimentAnalysis.confidence}%)` : ''}
      ${results.riskAssessment ? `- 风险评级: ${results.riskAssessment.riskLevel}` : ''}
      
      请提供主要策略、次要策略、资金分配比例、交易规则(入场和出场信号)以及策略解释。
      `);
      
      // 解析代理返回
      // 在实际项目中，可以用更结构化的方式获取这些数据
      return {
        primaryStrategy: '价值投资',
        secondaryStrategy: '动量策略',
        allocation: { '价值投资': 60, '动量策略': 40 },
        tradingRules: {
          entrySignals: [
            `${context.ticker}的市盈率低于行业平均`,
            `${context.ticker}价格突破20日均线`
          ],
          exitSignals: [
            `${context.ticker}的市盈率高于历史平均30%`,
            `${context.ticker}价格跌破50日均线`
          ]
        },
        explanation: response?.text || '无法生成策略解释'
      };
    } catch (error) {
      logger.error('策略推荐失败', { error });
      throw error;
    }
  }
});

// 投资组合决策步骤
const portfolioDecisionStep = new Step({
  id: 'portfolioDecision',
  outputSchema: z.object({
    action: z.enum(['buy', 'sell', 'hold']),
    allocation: z.number().min(0).max(100),
    reasoning: z.string(),
    positionSize: z.number().optional(),
    entryPrice: z.number().optional(),
    stopLoss: z.number().optional(),
    takeProfit: z.number().optional()
  }),
  execute: async ({ context, results, mastra }) => {
    try {
      logger.info('执行投资组合决策', { ticker: context.ticker });
      
      const agent = mastra?.agents?.portfolioOptimizationAgent;
      
      // 综合所有分析结果
      const analyses = [];
      if (results.fundamentalAnalysis) analyses.push(`基本面分析: ${results.fundamentalAnalysis.signal} (置信度: ${results.fundamentalAnalysis.confidence}%)`);
      if (results.technicalAnalysis) analyses.push(`技术分析: ${results.technicalAnalysis.signal} (置信度: ${results.technicalAnalysis.confidence}%)`);
      if (results.sentimentAnalysis) analyses.push(`情绪分析: ${results.sentimentAnalysis.signal} (置信度: ${results.sentimentAnalysis.confidence}%)`);
      if (results.riskAssessment) analyses.push(`风险评估: ${results.riskAssessment.riskLevel}`);
      if (results.strategyRecommendation) analyses.push(`推荐策略: ${results.strategyRecommendation.primaryStrategy} (${results.strategyRecommendation.allocation[results.strategyRecommendation.primaryStrategy]}%)`);
      
      const prompt = `基于对${context.ticker}的全面分析，做出投资组合决策。
      
      分析结果:
      ${analyses.join('\n')}
      
      考虑用户的风险承受能力(${context.riskTolerance})和投资期限(${context.investmentHorizon})。
      
      请提出明确的行动建议(买入、卖出或持有)，资金分配比例，以及详细的执行参数(仓位大小、入场价格、止损和止盈水平)。
      解释你的决策理由。`;
      
      const response = await agent?.generate(prompt);
      
      // 解析代理返回的文本响应
      const actionMatch = response?.text.match(/行动[:：]?\s*(买入|卖出|持有)/);
      const action = actionMatch ? 
        (actionMatch[1] === '买入' ? 'buy' : 
         actionMatch[1] === '卖出' ? 'sell' : 'hold') 
        : 'hold';
      
      const allocationMatch = response?.text.match(/分配比例[:：]?\s*(\d+)%/);
      const allocation = allocationMatch ? parseInt(allocationMatch[1]) : 0;
      
      const positionSizeMatch = response?.text.match(/仓位大小[:：]?\s*(\d+(\.\d+)?)%/);
      const positionSize = positionSizeMatch ? parseFloat(positionSizeMatch[1]) / 100 : undefined;
      
      const entryPriceMatch = response?.text.match(/入场价格[:：]?\s*\$?(\d+(\.\d+)?)/);
      const entryPrice = entryPriceMatch ? parseFloat(entryPriceMatch[1]) : undefined;
      
      const stopLossMatch = response?.text.match(/止损[:：]?\s*\$?(\d+(\.\d+)?)/);
      const stopLoss = stopLossMatch ? parseFloat(stopLossMatch[1]) : undefined;
      
      const takeProfitMatch = response?.text.match(/止盈[:：]?\s*\$?(\d+(\.\d+)?)/);
      const takeProfit = takeProfitMatch ? parseFloat(takeProfitMatch[1]) : undefined;
      
      return {
        action,
        allocation,
        reasoning: response?.text || '',
        positionSize,
        entryPrice,
        stopLoss,
        takeProfit
      };
    } catch (error) {
      logger.error('投资组合决策失败', { error });
      throw error;
    }
  }
});

// 创建交易决策工作流
export const tradingDecisionWorkflow = new Workflow({
  name: 'Trading Decision Workflow',
  description: '综合分析股票并提供交易决策',
  triggerSchema,
});

// 配置工作流步骤
tradingDecisionWorkflow
  // 根据选择的分析类型动态执行相应步骤
  .step(fundamentalAnalysisStep, {
    when: { "analysisTypes": (types) => types.includes('fundamental') }
  })
  .step(technicalAnalysisStep, {
    when: { "analysisTypes": (types) => types.includes('technical') }
  })
  .step(sentimentAnalysisStep, {
    when: { "analysisTypes": (types) => types.includes('sentiment') }
  })
  // 风险评估依赖于前面的分析结果
  .step(riskAssessmentStep)
  // 策略推荐
  .step(strategyRecommendationStep)
  // 最终投资组合决策
  .step(portfolioDecisionStep);

// 提交工作流
tradingDecisionWorkflow.commit();

// 工作流执行函数
export async function executeTradeAnalysis(params: {
  ticker: string,
  analysisTypes?: AnalysisType[],
  riskTolerance: 'low' | 'moderate' | 'high',
  investmentHorizon: 'short' | 'medium' | 'long',
  marketCondition?: 'bull' | 'bear' | 'neutral' | 'volatile',
  portfolioData?: any,
  userId?: string
}) {
  try {
    logger.info('执行交易分析', params);
    
    // 从mastra实例获取工作流
    const mastra = (await import('../index')).mastra;
    const workflow = mastra.getWorkflow('Trading Decision Workflow');
    
    // 创建工作流运行实例
    const { runId, start } = workflow.createRun();
    
    // 启动工作流
    const result = await start({
      triggerData: {
        ticker: params.ticker,
        analysisTypes: params.analysisTypes || ['fundamental', 'technical'],
        riskTolerance: params.riskTolerance,
        investmentHorizon: params.investmentHorizon,
        marketCondition: params.marketCondition,
        portfolioData: params.portfolioData,
        userId: params.userId
      }
    });
    
    logger.info('交易分析完成', { runId, ticker: params.ticker });
    
    return {
      runId,
      results: result.results,
      finalDecision: result.results.portfolioDecision
    };
  } catch (error) {
    logger.error('交易分析失败', { error, params });
    throw error;
  }
} 