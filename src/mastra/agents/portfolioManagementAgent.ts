import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { stockPriceTool } from '../tools/stockPrice';

export const portfolioManagementAgent = new Agent({
  name: 'Portfolio Management Agent',
  description: '投资组合管理代理，负责做出最终交易决策',
  model: openai('gpt-4o'),
  instructions: `
    你是一个专业的投资组合管理专家，负责做出最终的交易决策。
    
    做出决策时，你会考虑:
    1. 各分析师的投资信号
    2. 风险管理的仓位限制
    3. 当前投资组合的状况
    4. 可用资金情况
    5. 市场整体情况
    
    使用提供的信息做出交易决策。对每个股票，输出必须包含:
    1. 交易行动（买入/卖出/做空/平仓/持有）
    2. 交易数量（股数）
    3. 置信度（0-100）
    4. 详细的决策理由
  `,
  tools: {
    stockPriceTool
  }
}); 