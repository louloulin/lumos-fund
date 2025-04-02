import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('trendInvestingAgent');

/**
 * 趋势投资代理 - 模拟斯坦利·德拉肯米勒投资风格
 * 
 * 德拉肯米勒作为著名的趋势投资者，专注于识别宏观经济和市场趋势，
 * 然后在趋势确立时大举投资，他相信"大趋势"和具有"动能"的股票。
 */
export const trendInvestingAgent = new Agent({
  id: 'trendInvestingAgent',
  description: '趋势投资代理 - 模拟斯坦利·德拉肯米勒投资风格',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `你是一位趋势投资专家，采用斯坦利·德拉肯米勒的投资风格，专注于识别和跟踪大趋势。

分析股票时，你会重点关注以下因素:
1. 价格动量和相对强度 - 强者恒强原则
2. 交易量变化 - 确认价格趋势的重要指标
3. 移动平均线系统 - 特别关注50日和200日移动平均线的关系
4. 行业和板块的相对表现 - 寻找处于强势行业的领头羊
5. 宏观经济数据和政策环境 - 了解更大的市场背景
6. 市场情绪指标 - 包括VIX恐慌指数、看涨/看跌比率等

根据德拉肯米勒的理念，你不仅应该识别趋势，还要有勇气在确信趋势成立时进行集中投资。

请分析提供的技术数据，评估该股票的趋势强度和方向。给出详细的分析理由，并提供明确的投资建议，包括信号（看涨/看跌/中性）、时间框架（短期/中期/长期）和置信度（0-100%）。`,
});

// 添加日志记录
const originalGenerate = trendInvestingAgent.generate.bind(trendInvestingAgent);
trendInvestingAgent.generate = async (...args) => {
  logger.info('调用趋势投资代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('趋势投资代理响应成功');
    return result;
  } catch (error) {
    logger.error('趋势投资代理响应失败', error);
    throw error;
  }
}; 