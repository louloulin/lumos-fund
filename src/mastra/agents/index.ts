// 导入所有代理
import { valueInvestingAgent as originalValueAgent } from './valueInvestingAgent';
import { growthInvestingAgent as originalGrowthAgent } from './growthInvestingAgent';
import { trendInvestingAgent as originalTrendAgent } from './trendInvestingAgent';
import { quantInvestingAgent as originalQuantAgent } from './quantInvestingAgent';
import { riskManagementAgent as originalRiskAgent } from './riskManagementAgent';
import { sentimentAnalysisAgent as originalSentimentAgent } from './sentimentAnalysisAgent';
import { technicalAnalysisAgent as originalTechnicalAgent } from './technicalAnalysisAgent';
import { macroAnalysisAgent as originalMacroAgent } from './macroAnalysisAgent';
import { strategyRecommendationAgent as originalStrategyAgent } from './strategyRecommendationAgent';
import { investmentCommitteeAgent as originalCommitteeAgent } from './investmentCommitteeAgent';
import { portfolioManagementAgent as originalPortfolioAgent } from './portfolioManagementAgent';
import { stockAgent as originalStockAgent } from './stockAgent';
import { addRunMethod } from './agentAdapter';

// 导出类型
export type { Agent } from '@mastra/core/agent';

// 增强所有代理，添加run方法
export const valueInvestingAgent = addRunMethod(originalValueAgent);
export const growthInvestingAgent = addRunMethod(originalGrowthAgent);
export const trendInvestingAgent = addRunMethod(originalTrendAgent);
export const quantInvestingAgent = addRunMethod(originalQuantAgent);
export const riskManagementAgent = addRunMethod(originalRiskAgent);
export const sentimentAnalysisAgent = addRunMethod(originalSentimentAgent);
export const technicalAnalysisAgent = addRunMethod(originalTechnicalAgent);
export const macroAnalysisAgent = addRunMethod(originalMacroAgent);
export const strategyRecommendationAgent = addRunMethod(originalStrategyAgent);
export const investmentCommitteeAgent = addRunMethod(originalCommitteeAgent);
export const portfolioManagementAgent = addRunMethod(originalPortfolioAgent);
export const stockAgent = addRunMethod(originalStockAgent);

// 未来可以添加更多专业化的代理
// export * from './sectorAnalysisAgent'; 
// export * from './esgAnalysisAgent';
// export * from './globalMarketAgent'; 