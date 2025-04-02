/**
 * 类型声明文件，为Mastra库提供类型定义
 * 这些定义解决了客户端组件中的类型检查问题
 */

// 注意: 客户端组件不应直接导入这些模块，而应使用Server Actions
declare module '@mastra/core' {
  export class Mastra {
    constructor(options: any);
    getAgent(name: string): any;
    getWorkflow(name: string): any;
    // 添加其他方法
  }
}

declare module '@mastra/core/agent' {
  export class Agent {
    constructor(options: any);
    generate(prompt: string, options?: any): Promise<any>;
    stream(prompt: string, options?: any): Promise<any>;
  }
}

declare module '@mastra/core/tools' {
  export interface Tool {
    id: string;
    description: string;
    execute(options: any): Promise<any>;
  }
  
  export function createTool(options: any): Tool;
}

declare module '@mastra/core/workflow' {
  export class Workflow {
    constructor(options: any);
    execute(options: any): Promise<any>;
  }
}

declare module '@ai-sdk/openai' {
  export function openai(model: string): any;
}

// 本地Mastra模块声明
declare module '@/mastra' {
  import { Mastra } from '@mastra/core';
  import { Agent } from '@mastra/core/agent';
  import { Tool } from '@mastra/core/tools';
  
  export const mastra: Mastra;
  export const valueInvestingAgent: Agent;
  export const technicalAnalysisAgent: Agent;
  export const portfolioManagementAgent: Agent;
  export const sentimentAnalysisAgent: Agent;
  export const tradingDecisionWorkflow: any;
  export const stockPriceTool: Tool;
  export const financialMetricsTool: Tool;
  export const technicalIndicatorsTool: Tool;
  export const newsSentimentTool: Tool;
  
  export default mastra;
}

// 处理node:*模块问题 
declare module 'node:events' {
  export * from 'events';
}

declare module 'node:fs' {
  export * from 'fs';
}

declare module 'node:path' {
  export * from 'path';
}

declare module 'node:util' {
  export * from 'util';
}

declare module 'node:stream' {
  export * from 'stream';
}

declare module 'node:crypto' {
  export * from 'crypto';
}

// 可以根据需要添加更多node:*模块的声明 