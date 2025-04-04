// 导出所有投资代理

// 投资风格代理
import { valueInvestingAgent as originalValueAgent } from './valueInvestingAgent';
import { growthInvestingAgent as originalGrowthAgent } from './growthInvestingAgent';
import { trendInvestingAgent as originalTrendAgent } from './trendInvestingAgent';
import { quantInvestingAgent as originalQuantAgent } from './quantInvestingAgent';
import { addRunMethod } from './agentAdapter';

// 增强代理，添加run方法
export const valueInvestingAgent = addRunMethod(originalValueAgent);
export const growthInvestingAgent = addRunMethod(originalGrowthAgent);
export const trendInvestingAgent = addRunMethod(originalTrendAgent);
export const quantInvestingAgent = addRunMethod(originalQuantAgent);

// 专业分析代理
export * from './sentimentAnalysisAgent';
export * from './riskManagementAgent';

// 决策代理
export * from './investmentCommitteeAgent';

// 未来可以添加更多专业化的代理
// export * from './sectorAnalysisAgent'; 
// export * from './macroEconomicsAgent'; 