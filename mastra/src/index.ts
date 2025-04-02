import { Mastra } from '@mastra/core';

import { valueInvestingAgent } from './agents/valueInvestingAgent';
import { technicalAnalysisAgent } from './agents/technicalAnalysisAgent';
import { sentimentAnalysisAgent } from './agents/sentimentAnalysisAgent';
import { tradingDecisionWorkflow } from './workflows/tradingDecisionWorkflow';

// 创建并导出Mastra实例
export const mastra = new Mastra({
  agents: {
    valueInvestingAgent,
    technicalAnalysisAgent,
    sentimentAnalysisAgent
  },
  workflows: {
    tradingDecisionWorkflow
  }
});

// 如果直接运行此文件，则打印注册的代理和工作流信息
if (require.main === module) {
  console.log('LumosFund Mastra AI代理系统');
  console.log('==========================');
  console.log('\n已注册的代理:');
  console.log(' - valueInvestingAgent (价值投资代理)');
  console.log(' - technicalAnalysisAgent (技术分析代理)');
  console.log(' - sentimentAnalysisAgent (情绪分析代理)');
  
  console.log('\n已注册的工作流:');
  console.log(' - tradingDecisionWorkflow (交易决策工作流)');
  
  console.log('\n使用以下命令启动服务:');
  console.log('mastra dev --dir src');
} 