import { Mastra } from '@mastra/core';
import { valueInvestingAgent } from './agents/valueInvestingAgent';
import { technicalAnalysisAgent } from './agents/technicalAnalysisAgent';
import { portfolioManagementAgent } from './agents/portfolioManagementAgent';
import { sentimentAnalysisAgent } from './agents/sentimentAnalysisAgent';
import { tradingDecisionWorkflow } from './workflows/tradingDecisionWorkflow';

// 创建并配置Mastra实例
export const mastra = new Mastra({
  agents: {
    valueInvestingAgent,
    technicalAnalysisAgent,
    portfolioManagementAgent,
    sentimentAnalysisAgent,
  },
  workflows: {
    tradingDecisionWorkflow,
  },
});

// 默认导出为单例模式
export default mastra;

export { 
  valueInvestingAgent,
  technicalAnalysisAgent,
  portfolioManagementAgent,
  sentimentAnalysisAgent,
  tradingDecisionWorkflow
}; 