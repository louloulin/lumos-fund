import { Mastra } from '@mastra/core';
import { valueInvestingAgent } from './agents/valueInvestingAgent';
import { technicalAnalysisAgent } from './agents/technicalAnalysisAgent';
import { portfolioManagementAgent } from './agents/portfolioManagementAgent';
import { tradingDecisionWorkflow } from './workflows/tradingDecisionWorkflow';

export const mastra = new Mastra({
  agents: { 
    valueInvestingAgent,
    technicalAnalysisAgent,
    portfolioManagementAgent
  },
  workflows: {
    tradingDecisionWorkflow
  }
});

export { 
  valueInvestingAgent,
  technicalAnalysisAgent,
  portfolioManagementAgent,
  tradingDecisionWorkflow
}; 