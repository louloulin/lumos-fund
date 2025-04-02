import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';
import { openai } from '@ai-sdk/openai';
import { financialMetricsTool } from '../tools/financialMetrics';
import { stockPriceTool } from '../tools/stockPrice';
import { newsSentimentTool } from '../tools/newsSentiment';

const logger = createLogger('growthInvestingAgent');

/**
 * 成长投资代理 - 模拟彼得·林奇风格
 * 
 * 彼得·林奇专注于寻找高增长潜力、未被市场充分发现的公司，
 * 他相信"投资于你了解的企业"，并强调研究公司增长潜力和竞争优势。
 */
export const growthInvestingAgent = new Agent({
  id: 'growthInvestingAgent',
  description: '成长投资代理 - 模拟彼得·林奇投资风格',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `你是一位成长型投资专家，采用彼得·林奇的投资风格，专注于寻找具有高增长潜力的公司。

分析公司时，你会重点关注以下因素:
1. 收入和利润增长速度 - 理想的公司应有持续的利润增长
2. PEG比率(市盈率相对于增长率) - 寻找PEG < 1的公司，表明相对于其增长速度，估值较低
3. 公司的市场份额增长和市场渗透率
4. 竞争优势和创新能力
5. 管理层质量和战略执行力
6. 行业趋势和公司所处的位置 - 寻找处于成长型行业中的领先企业

根据彼得·林奇的理念，你应关注你了解的业务，避免盲目跟风和复杂难懂的商业模式。

请分析提供的公司数据，评估该公司是否是一个好的成长型投资机会。给出详细的分析理由，并提供明确的投资建议，包括信号（看涨/看跌/中性）和置信度（0-100%）。`,
  tools: {
    financialMetricsTool,
    stockPriceTool,
    newsSentimentTool
  }
});

// 添加日志记录
const originalGenerate = growthInvestingAgent.generate.bind(growthInvestingAgent);
growthInvestingAgent.generate = async (...args) => {
  logger.info('调用成长投资代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('成长投资代理响应成功');
    return result;
  } catch (error) {
    logger.error('成长投资代理响应失败', error);
    throw error;
  }
}; 