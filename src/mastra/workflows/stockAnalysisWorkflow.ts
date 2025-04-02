import { Workflow } from '@mastra/core/workflow';
import { createLogger } from '@/lib/logger.server';

import {
  valueInvestingAgent,
  growthInvestingAgent,
  technicalAnalysisAgent,
  sentimentAnalysisAgent,
  riskManagementAgent,
  investmentCommitteeAgent
} from '../agents';

import { 
  stockPriceTool,
  historicalPriceTool,
  financialMetricsTool,
  financialStatementsTool,
  financialHistoryTool,
  sentimentAnalysisTool
} from '../tools';

import { 
  generateValueInvestingAnalysis 
} from '../agents/valueInvestingAgent';

import { 
  generateGrowthInvestingAnalysis 
} from '../agents/growthInvestingAgent';

import { 
  generateTechnicalAnalysis 
} from '../agents/technicalAnalysisAgent';

import { 
  generateSentimentAnalysis 
} from '../agents/sentimentAnalysisAgent';

import {
  generateRiskAssessment
} from '../agents/riskManagementAgent';

import {
  generateInvestmentDecision
} from '../agents/investmentCommitteeAgent';

const logger = createLogger('stockAnalysisWorkflow');

/**
 * 股票分析工作流
 * 
 * 协调多个专业代理，完成对单只股票的全面分析
 */
export const stockAnalysisWorkflow = new Workflow({
  id: 'stockAnalysisWorkflow',
  description: '股票分析工作流 - 协调多个专业代理的工作',
  agents: {
    valueInvestingAgent,
    growthInvestingAgent,
    technicalAnalysisAgent,
    sentimentAnalysisAgent,
    riskManagementAgent,
    investmentCommitteeAgent
  },
  tools: {
    stockPriceTool,
    historicalPriceTool,
    financialMetricsTool,
    financialStatementsTool,
    financialHistoryTool,
    sentimentAnalysisTool
  },
  steps: [
    {
      id: 'getData',
      description: '获取分析所需的数据',
      execute: async ({ context }) => {
        const { ticker } = context;
        logger.info('获取股票数据', { ticker });
        
        try {
          // 获取价格数据
          const priceData = await stockPriceTool.execute({ symbol: ticker });
          
          // 获取历史价格数据 (90天)
          const historicalData = await historicalPriceTool.execute({ symbol: ticker, days: 90 });
          
          // 获取财务指标
          const financialMetrics = await financialMetricsTool.execute({ ticker });
          
          // 获取财务报表
          const financialStatements = await financialStatementsTool.execute({ ticker });
          
          // 获取5年财务历史
          const financialHistory = await financialHistoryTool.execute({ ticker, years: 5 });
          
          // 获取情绪数据
          const sentimentData = await sentimentAnalysisTool.execute({ ticker, days: 14 });
          
          return {
            ticker,
            priceData,
            historicalData,
            financialMetrics,
            financialStatements,
            financialHistory,
            sentimentData,
            success: true
          };
        } catch (error: any) {
          logger.error('获取股票数据失败', { ticker, error });
          return {
            ticker,
            success: false,
            error: error.message
          };
        }
      }
    },
    {
      id: 'valueAnalysis',
      description: '价值投资分析',
      execute: async ({ context, previousStepResult }) => {
        const { ticker } = context;
        const { 
          priceData, 
          financialMetrics, 
          financialStatements,
          financialHistory 
        } = previousStepResult;
        
        if (!previousStepResult.success) {
          return {
            ticker,
            success: false,
            message: '由于数据获取失败，无法执行价值投资分析'
          };
        }
        
        logger.info('执行价值投资分析', { ticker });
        
        // 准备价值分析数据
        const analysisData = {
          currentPrice: priceData.currentPrice,
          financialMetrics: financialMetrics.metrics,
          financialData: {
            incomeStatement: financialStatements.incomeStatement,
            balanceSheet: financialStatements.balanceSheet,
            cashFlow: financialStatements.cashFlow
          },
          financialHistory: financialHistory.financialHistory,
          // 假设这些数据在实际系统中会通过其他API获取
          managementData: {
            executiveTeam: [],
            capitalAllocation: {},
            insiderTrading: {}
          },
          estimatedGrowthRate: 0.05  // 默认估计增长率5%
        };
        
        try {
          const valueAnalysis = await generateValueInvestingAnalysis(ticker, analysisData);
          return valueAnalysis;
        } catch (error: any) {
          logger.error('价值投资分析失败', { ticker, error });
          return {
            ticker,
            success: false,
            error: error.message
          };
        }
      }
    },
    {
      id: 'growthAnalysis',
      description: '增长投资分析',
      execute: async ({ context, stepResults }) => {
        const { ticker } = context;
        const dataResult = stepResults.getData;
        
        if (!dataResult.success) {
          return {
            ticker,
            success: false,
            message: '由于数据获取失败，无法执行增长投资分析'
          };
        }
        
        logger.info('执行增长投资分析', { ticker });
        
        // 准备增长分析数据
        const companyData = {
          financialMetrics: dataResult.financialMetrics.metrics,
          valuation: {
            peRatio: dataResult.financialMetrics.metrics.priceToEarnings,
            pegRatio: dataResult.financialMetrics.metrics.pegRatio
          },
          industryMetrics: {
            marketGrowth: 0.07,  // 假设行业增长率7%
            marketShare: 0.15    // 假设市场份额15%
          },
          // 假设这些数据在实际系统中会通过其他API获取
          companyDescription: "公司业务描述将在此显示",
          competitiveAdvantages: "公司竞争优势将在此显示",
          managementData: {
            overview: "管理团队概述将在此显示"
          }
        };
        
        try {
          const growthAnalysis = await generateGrowthInvestingAnalysis(
            ticker, 
            companyData, 
            "请提供增长投资分析，重点关注销售增长、盈利增长和十倍股潜力。"
          );
          return growthAnalysis;
        } catch (error: any) {
          logger.error('增长投资分析失败', { ticker, error });
          return {
            ticker,
            success: false,
            error: error.message
          };
        }
      }
    },
    {
      id: 'technicalAnalysis',
      description: '技术分析',
      execute: async ({ context, stepResults }) => {
        const { ticker } = context;
        const dataResult = stepResults.getData;
        
        if (!dataResult.success) {
          return {
            ticker,
            success: false,
            message: '由于数据获取失败，无法执行技术分析'
          };
        }
        
        logger.info('执行技术分析', { ticker });
        
        // 准备技术分析数据
        const priceData = dataResult.priceData;
        
        // 假设这些数据在实际系统中会通过技术指标计算服务获取
        const technicalData = {
          rsi: {
            value: 56.7,
            signal: "中性"
          },
          macd: {
            value: 0.82,
            signal: 0.65,
            histogram: 0.17
          },
          movingAverages: {
            ma50: priceData.currentPrice * 0.96,  // 假设50日均线
            ma200: priceData.currentPrice * 0.92  // 假设200日均线
          },
          patterns: ["金叉", "支撑位反弹"],
          supportLevels: [priceData.currentPrice * 0.9, priceData.currentPrice * 0.85],
          resistanceLevels: [priceData.currentPrice * 1.1, priceData.currentPrice * 1.2]
        };
        
        try {
          const technicalAnalysis = await generateTechnicalAnalysis(
            ticker, 
            priceData, 
            technicalData, 
            "请提供技术分析，重点关注当前趋势、支撑阻力位和短期交易信号。"
          );
          return technicalAnalysis;
        } catch (error: any) {
          logger.error('技术分析失败', { ticker, error });
          return {
            ticker,
            success: false,
            error: error.message
          };
        }
      }
    },
    {
      id: 'sentimentAnalysis',
      description: '情绪分析',
      execute: async ({ context, stepResults }) => {
        const { ticker } = context;
        const dataResult = stepResults.getData;
        
        if (!dataResult.success) {
          return {
            ticker,
            success: false,
            message: '由于数据获取失败，无法执行情绪分析'
          };
        }
        
        logger.info('执行情绪分析', { ticker });
        
        try {
          const sentimentAnalysis = await generateSentimentAnalysis(ticker, 14);
          return sentimentAnalysis;
        } catch (error: any) {
          logger.error('情绪分析失败', { ticker, error });
          return {
            ticker,
            success: false,
            error: error.message
          };
        }
      }
    },
    {
      id: 'riskAssessment',
      description: '风险评估',
      execute: async ({ context, stepResults }) => {
        const { ticker } = context;
        const dataResult = stepResults.getData;
        const valueAnalysis = stepResults.valueAnalysis;
        const technicalAnalysis = stepResults.technicalAnalysis;
        const sentimentAnalysis = stepResults.sentimentAnalysis;
        
        if (!dataResult.success || !valueAnalysis.success || 
            !technicalAnalysis.success || !sentimentAnalysis.success) {
          return {
            ticker,
            success: false,
            message: '由于前置分析步骤失败，无法执行风险评估'
          };
        }
        
        logger.info('执行风险评估', { ticker });
        
        // 假设这些数据在实际系统中会通过投资组合管理服务获取
        const portfolioData = {
          positions: {
            [ticker]: context.currentPosition || null
          },
          allocation: {
            sectorConcentration: {
              "TECH": 0.25,
              "FINANCE": 0.15,
              "HEALTHCARE": 0.2,
              "CONSUMER": 0.1,
              "INDUSTRIAL": 0.1,
              "OTHER": 0.2
            }
          },
          cash: 50000,
          totalValue: 500000,
          riskRating: "中等"
        };
        
        try {
          const riskAssessment = await generateRiskAssessment(
            ticker,
            valueAnalysis,
            technicalAnalysis.analysis,
            sentimentAnalysis,
            portfolioData
          );
          return riskAssessment;
        } catch (error: any) {
          logger.error('风险评估失败', { ticker, error });
          return {
            ticker,
            success: false,
            error: error.message
          };
        }
      }
    },
    {
      id: 'investmentDecision',
      description: '投资决策',
      execute: async ({ context, stepResults }) => {
        const { ticker } = context;
        const valueAnalysis = stepResults.valueAnalysis;
        const growthAnalysis = stepResults.growthAnalysis;
        const technicalAnalysis = stepResults.technicalAnalysis;
        const sentimentAnalysis = stepResults.sentimentAnalysis;
        const riskAssessment = stepResults.riskAssessment;
        
        if (!valueAnalysis.success || !growthAnalysis.success || 
            !technicalAnalysis.success || !sentimentAnalysis.success || 
            !riskAssessment.success) {
          return {
            ticker,
            success: false,
            message: '由于前置分析步骤失败，无法生成投资决策'
          };
        }
        
        logger.info('生成投资决策', { ticker });
        
        // 假设这些数据在实际系统中会通过宏观经济分析服务获取
        const marketContext = {
          marketStatus: "牛市",
          industryTrend: "上升",
          macroIndicators: "利率稳定，GDP增长",
          marketSentiment: "乐观"
        };
        
        try {
          const investmentDecision = await generateInvestmentDecision(
            ticker,
            valueAnalysis,
            growthAnalysis.analysis,
            technicalAnalysis.analysis,
            marketContext,
            "请综合各种分析结果，给出最终投资决策建议，包括建议操作和仓位大小。"
          );
          return investmentDecision;
        } catch (error: any) {
          logger.error('投资决策生成失败', { ticker, error });
          return {
            ticker,
            success: false,
            error: error.message
          };
        }
      }
    },
    {
      id: 'summarizeResults',
      description: '汇总分析结果',
      execute: async ({ stepResults }) => {
        const dataResult = stepResults.getData;
        const valueAnalysis = stepResults.valueAnalysis;
        const growthAnalysis = stepResults.growthAnalysis;
        const technicalAnalysis = stepResults.technicalAnalysis;
        const sentimentAnalysis = stepResults.sentimentAnalysis;
        const riskAssessment = stepResults.riskAssessment;
        const investmentDecision = stepResults.investmentDecision;
        
        // 判断整体流程是否成功
        const overallSuccess = 
          dataResult.success && 
          valueAnalysis.success && 
          growthAnalysis.success && 
          technicalAnalysis.success && 
          sentimentAnalysis.success && 
          riskAssessment.success && 
          investmentDecision.success;
        
        return {
          ticker: dataResult.ticker,
          currentPrice: dataResult.success ? dataResult.priceData.currentPrice : null,
          priceChange: dataResult.success ? dataResult.priceData.changePercent : null,
          valueAnalysis: valueAnalysis.success ? {
            signal: valueAnalysis.signal,
            confidence: valueAnalysis.confidence,
            intrinsicValue: valueAnalysis.intrinsicValue,
            marginOfSafety: valueAnalysis.marginOfSafety,
            summary: valueAnalysis.summary
          } : null,
          growthAnalysis: growthAnalysis.success ? growthAnalysis.analysis : null,
          technicalAnalysis: technicalAnalysis.success ? technicalAnalysis.analysis : null,
          sentimentAnalysis: sentimentAnalysis.success ? sentimentAnalysis.analysis : null,
          riskAssessment: riskAssessment.success ? riskAssessment.assessment : null,
          investmentDecision: investmentDecision.success ? investmentDecision.decision : null,
          timestamp: new Date().toISOString(),
          success: overallSuccess
        };
      }
    }
  ]
});

/**
 * 执行股票分析
 * 
 * 运行完整的股票分析工作流
 */
export async function analyzeStock(ticker: string, additionalContext: any = {}) {
  logger.info('开始股票分析', { ticker });
  
  try {
    const result = await stockAnalysisWorkflow.execute({
      context: {
        ticker,
        ...additionalContext
      }
    });
    
    logger.info('股票分析完成', { ticker });
    return result;
  } catch (error: any) {
    logger.error('股票分析工作流执行失败', { ticker, error });
    return {
      ticker,
      success: false,
      error: error.message,
      message: '股票分析工作流执行过程中发生错误'
    };
  }
} 