import { Workflow } from '@mastra/core/workflow';
import { 
  valueInvestingAgent, 
  growthInvestingAgent, 
  trendInvestingAgent, 
  quantInvestingAgent, 
  macroAnalysisAgent, 
  riskManagementAgent 
} from '../index';

// 定义工作流上下文和结果类型
interface TradingContext {
  ticker: string;
  industry?: string;
  data: any;
  portfolio: any;
  cash: number;
}

interface StepResults {
  valueAnalysis?: any;
  growthAnalysis?: any;
  trendAnalysis?: any;
  quantAnalysis?: any;
  macroAnalysis?: any;
  riskAssessment?: any;
}

// 定义工作流和相关类型
type WorkflowConfig = {
  name: string;
  description: string;
  agents: Record<string, any>;
  steps: any[];
};

const createWorkflow = (config: WorkflowConfig): WorkflowConfig => config;

export const tradingDecisionWorkflow = new Workflow({
  name: 'Trading Decision Workflow',
  description: '完整的交易决策工作流',
  agents: {
    valueInvestingAgent,
    growthInvestingAgent,
    trendInvestingAgent,
    quantInvestingAgent,
    macroAnalysisAgent,
    riskManagementAgent
  },
  steps: [
    {
      id: 'valueAnalysis',
      agent: 'valueInvestingAgent',
      input: ({ context }: { context: TradingContext }) => ({
        ticker: context.ticker,
        data: context.data
      })
    },
    {
      id: 'growthAnalysis',
      agent: 'growthInvestingAgent',
      input: ({ context }: { context: TradingContext }) => ({
        ticker: context.ticker,
        data: context.data
      })
    },
    {
      id: 'trendAnalysis',
      agent: 'trendInvestingAgent',
      input: ({ context }: { context: TradingContext }) => ({
        ticker: context.ticker,
        data: context.data
      })
    },
    {
      id: 'quantAnalysis',
      agent: 'quantInvestingAgent',
      input: ({ context }: { context: TradingContext }) => ({
        ticker: context.ticker,
        data: context.data
      })
    },
    {
      id: 'macroAnalysis',
      agent: 'macroAnalysisAgent',
      input: ({ context }: { context: TradingContext }) => ({
        ticker: context.ticker,
        industry: context.industry,
        data: context.data
      })
    },
    {
      id: 'riskAssessment',
      agent: 'riskManagementAgent',
      input: ({ context, results }: { context: TradingContext; results: StepResults }) => ({
        ticker: context.ticker,
        valueAnalysis: results.valueAnalysis,
        growthAnalysis: results.growthAnalysis,
        trendAnalysis: results.trendAnalysis,
        quantAnalysis: results.quantAnalysis,
        macroAnalysis: results.macroAnalysis,
        portfolio: context.portfolio
      })
    },
    {
      id: 'finalDecision',
      agent: 'valueInvestingAgent',
      input: ({ context, results }: { context: TradingContext; results: StepResults }) => ({
        ticker: context.ticker,
        analyses: {
          value: results.valueAnalysis,
          growth: results.growthAnalysis,
          trend: results.trendAnalysis,
          quant: results.quantAnalysis,
          macro: results.macroAnalysis
        },
        riskAssessment: results.riskAssessment,
        portfolio: context.portfolio,
        cash: context.cash
      })
    }
  ]
}); 