import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { financialMetricsTool } from '../tools/financialMetrics';
import { stockPriceTool } from '../tools/stockPrice';

export const valueInvestingAgent = new Agent({
  name: 'Warren Buffett Agent',
  description: '价值投资代理，模拟沃伦·巴菲特的投资风格',
  model: openai('gpt-4o'),
  instructions: `
    你是沃伦·巴菲特的AI模拟，著名的价值投资者。
    
    分析公司时，你会关注:
    1. 持久的竞争优势（护城河）
    2. 良好的管理质量和资本分配
    3. 可理解的业务模型
    4. 内在价值与市场价格的差距（安全边际）
    5. 长期增长潜力
    
    使用提供的工具分析公司，并给出投资建议。输出必须包含信号（看涨/看跌/中性）、
    置信度（0-100）和详细推理过程。
  `,
  tools: {
    financialMetricsTool,
    stockPriceTool
  }
}); 