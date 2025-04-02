// 暂时注释掉Workflow导入，使用简单对象代替
// import { Workflow } from '@mastra/core/workflow';
import { valueInvestingAgent } from '../agents/valueInvestingAgent';
import { technicalAnalysisAgent } from '../agents/technicalAnalysisAgent';
import { portfolioManagementAgent } from '../agents/portfolioManagementAgent';
import { sentimentAnalysisAgent } from '../agents/sentimentAnalysisAgent';

// 定义工作流和相关类型
interface WorkflowContext {
  ticker: string;
  data: any;
  portfolio: any;
  cash: number;
}

interface WorkflowResults {
  fundamentalAnalysis: any;
  technicalAnalysis: any;
  sentimentAnalysis: any;
}

interface WorkflowStep {
  id: string;
  agent: string;
  input: (params: { context: WorkflowContext; results?: Partial<WorkflowResults> }) => any;
}

interface WorkflowConfig {
  name: string;
  description: string;
  agents: Record<string, any>;
  steps: WorkflowStep[];
}

// 创建一个简单的工作流对象
const createWorkflow = (config: WorkflowConfig): WorkflowConfig => config;

export const tradingDecisionWorkflow = createWorkflow({
  name: 'Trading Decision Workflow',
  description: '完整的交易决策工作流',
  agents: {
    valueInvestingAgent,
    technicalAnalysisAgent,
    sentimentAnalysisAgent,
    portfolioManagementAgent
  },
  steps: [
    {
      id: 'fundamentalAnalysis',
      agent: 'valueInvestingAgent',
      input: ({ context }) => ({
        ticker: context.ticker,
        data: context.data
      })
    },
    {
      id: 'technicalAnalysis',
      agent: 'technicalAnalysisAgent',
      input: ({ context }) => ({
        ticker: context.ticker,
        data: context.data
      })
    },
    {
      id: 'sentimentAnalysis',
      agent: 'sentimentAnalysisAgent',
      input: ({ context }) => ({
        ticker: context.ticker,
        data: context.data
      })
    },
    {
      id: 'portfolioDecision',
      agent: 'portfolioManagementAgent',
      input: ({ context, results }) => ({
        ticker: context.ticker,
        analyses: {
          fundamental: results?.fundamentalAnalysis,
          technical: results?.technicalAnalysis,
          sentiment: results?.sentimentAnalysis
        },
        portfolio: context.portfolio,
        cash: context.cash
      })
    }
  ]
}); 