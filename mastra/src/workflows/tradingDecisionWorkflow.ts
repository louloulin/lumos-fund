import { Workflow } from '@mastra/core/workflow';
import { valueInvestingAgent } from '../agents/valueInvestingAgent';
import { technicalAnalysisAgent } from '../agents/technicalAnalysisAgent';
import { sentimentAnalysisAgent } from '../agents/sentimentAnalysisAgent';

// 定义工作流上下文类型
interface WorkflowContext {
  ticker: string;
  data?: any;
  timestamp: string;
}

// 定义各步骤结果类型
interface FundamentalAnalysisResult {
  signal?: string;
  confidence?: number;
  analysis?: string;
  longTermValue?: string;
  safetyMargin?: string;
}

interface TechnicalAnalysisResult {
  signal?: string;
  strength?: number;
  trendDirection?: string;
  supportLevels?: number[];
  resistanceLevels?: number[];
  keyPatterns?: string[];
}

interface SentimentAnalysisResult {
  signal?: string;
  strength?: number;
  newsImpact?: string;
  sentimentTrend?: string;
  catalysts?: string[];
}

interface StepResults {
  fundamentalAnalysis: {
    fundamentalSignal: string;
    fundamentalConfidence: number;
    fundamentalAnalysis: string;
    longTermValue: string;
    safetyMargin: string;
  };
  technicalAnalysis: {
    technicalSignal: string;
    technicalStrength: number;
    trendDirection: string;
    supportLevels: number[];
    resistanceLevels: number[];
    keyPatterns: string[];
  };
  sentimentAnalysis: {
    sentimentSignal: string;
    sentimentStrength: number;
    newsImpact: string;
    sentimentTrend: string;
    catalysts: string[];
  };
}

interface FinalDecisionResult {
  ticker?: string;
  decision?: string;
  confidence?: number;
  timeHorizon?: string;
  reasoning?: string;
  riskLevel?: string;
  targetPrice?: number;
  stopLossPrice?: number;
  keyFactors?: string[];
}

export const tradingDecisionWorkflow = new Workflow({
  name: 'tradingDecisionWorkflow',
  description: '整合基本面、技术面和情绪面的完整交易决策工作流',
  agents: {
    valueInvestingAgent,
    technicalAnalysisAgent,
    sentimentAnalysisAgent
  },
  steps: [
    {
      id: 'fundamentalAnalysis',
      agent: 'valueInvestingAgent',
      input: ({ context }: { context: WorkflowContext }) => ({
        ticker: context.ticker,
        data: context.data
      }),
      output: ({ result }: { result: FundamentalAnalysisResult }) => {
        // 从价值投资代理结果中提取关键信息
        return {
          fundamentalSignal: result.signal || '未知',
          fundamentalConfidence: result.confidence || 5,
          fundamentalAnalysis: result.analysis || '无分析结果',
          longTermValue: result.longTermValue || '未评估',
          safetyMargin: result.safetyMargin || '未评估'
        };
      }
    },
    {
      id: 'technicalAnalysis',
      agent: 'technicalAnalysisAgent',
      input: ({ context }: { context: WorkflowContext }) => ({
        ticker: context.ticker,
        days: 120 // 请求120天的价格历史进行技术分析
      }),
      output: ({ result }: { result: TechnicalAnalysisResult }) => {
        // 从技术分析代理结果中提取关键信息
        return {
          technicalSignal: result.signal || '未知',
          technicalStrength: result.strength || 5,
          trendDirection: result.trendDirection || '未确定',
          supportLevels: result.supportLevels || [],
          resistanceLevels: result.resistanceLevels || [],
          keyPatterns: result.keyPatterns || []
        };
      }
    },
    {
      id: 'sentimentAnalysis',
      agent: 'sentimentAnalysisAgent',
      input: ({ context }: { context: WorkflowContext }) => ({
        ticker: context.ticker,
        days: 14 // 分析最近两周的新闻和情绪
      }),
      output: ({ result }: { result: SentimentAnalysisResult }) => {
        // 从情绪分析代理结果中提取关键信息
        return {
          sentimentSignal: result.signal || '未知',
          sentimentStrength: result.strength || 5,
          newsImpact: result.newsImpact || '中性',
          sentimentTrend: result.sentimentTrend || '稳定',
          catalysts: result.catalysts || []
        };
      }
    },
    {
      id: 'finalDecision',
      agent: 'valueInvestingAgent', // 使用价值投资代理作为最终决策者
      input: ({ context, results }: { context: WorkflowContext; results: StepResults }) => ({
        ticker: context.ticker,
        task: 'final_decision',
        fundamental: results.fundamentalAnalysis,
        technical: results.technicalAnalysis,
        sentiment: results.sentimentAnalysis,
        timestamp: context.timestamp
      }),
      output: ({ result }: { result: FinalDecisionResult }) => {
        // 构建最终的综合分析结果
        return {
          ticker: result.ticker,
          decision: result.decision || '持有',
          confidence: result.confidence || 5,
          timeHorizon: result.timeHorizon || '中期',
          reasoning: result.reasoning || '综合分析后的决策',
          riskLevel: result.riskLevel || '中等',
          targetPrice: result.targetPrice,
          stopLossPrice: result.stopLossPrice,
          keyFactors: result.keyFactors || [],
          timestamp: new Date().toISOString()
        };
      }
    }
  ]
}); 