import { Workflow } from '@mastra/core/workflow';
import { valueInvestingAgent } from '../agents/valueInvestingAgent';
import { technicalAnalysisAgent } from '../agents/technicalAnalysisAgent';
import { portfolioManagementAgent } from '../agents/portfolioManagementAgent';

export const tradingDecisionWorkflow = new Workflow({
  name: 'Trading Decision Workflow',
  description: '完整的交易决策工作流',
  agents: {
    valueInvestingAgent,
    technicalAnalysisAgent,
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
      id: 'portfolioDecision',
      agent: 'portfolioManagementAgent',
      input: ({ context, results }) => ({
        ticker: context.ticker,
        analyses: {
          fundamental: results.fundamentalAnalysis,
          technical: results.technicalAnalysis
        },
        portfolio: context.portfolio,
        cash: context.cash
      })
    }
  ]
}); 