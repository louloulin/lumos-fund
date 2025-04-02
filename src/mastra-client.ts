/**
 * 客户端Mastra模块替代
 * 
 * 此模块提供与@mastra/core相同的API接口，但所有方法都返回错误提示
 * 客户端组件应使用Server Actions而不是直接导入Mastra
 */

const CLIENT_ERROR_MESSAGE = '此Mastra功能只能在服务器上使用。请使用Server Actions或API路由调用Mastra功能。';

export class Mastra {
  constructor() {
    console.warn(CLIENT_ERROR_MESSAGE);
  }
  
  getAgent() {
    throw new Error(CLIENT_ERROR_MESSAGE);
  }
  
  getWorkflow() {
    throw new Error(CLIENT_ERROR_MESSAGE);
  }
}

export class Agent {
  constructor() {
    console.warn(CLIENT_ERROR_MESSAGE);
  }
  
  generate() {
    throw new Error(CLIENT_ERROR_MESSAGE);
  }
  
  stream() {
    throw new Error(CLIENT_ERROR_MESSAGE);
  }
}

export class Tool {
  constructor() {
    console.warn(CLIENT_ERROR_MESSAGE);
  }
  
  execute() {
    throw new Error(CLIENT_ERROR_MESSAGE);
  }
}

export class Workflow {
  constructor() {
    console.warn(CLIENT_ERROR_MESSAGE);
  }
  
  execute() {
    throw new Error(CLIENT_ERROR_MESSAGE);
  }
}

// 创建空的Mastra实例
export const mastra = new Mastra();

// 创建空的工具和代理
export const valueInvestingAgent = new Agent();
export const technicalAnalysisAgent = new Agent();
export const portfolioManagementAgent = new Agent();
export const sentimentAnalysisAgent = new Agent();
export const riskManagementAgent = new Agent();
export const tradingDecisionWorkflow = new Workflow();
export const stockPriceTool = new Tool();
export const financialMetricsTool = new Tool();
export const technicalIndicatorsTool = new Tool();
export const newsSentimentTool = new Tool();

// 默认导出
export default mastra; 