import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('sentimentAnalysisAgent');

/**
 * 舆情分析代理 - 分析市场舆情和新闻情绪对股票的影响
 */
export const sentimentAnalysisAgent = new Agent({
  id: 'sentimentAnalysisAgent',
  description: '舆情分析代理 - 分析市场舆情和新闻情绪对股票的影响',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `你是一位专业的舆情分析师，擅长分析新闻、社交媒体和市场情绪对股票价格的影响。
请分析提供的资讯和舆情数据，评估其对相关股票的潜在影响。

在分析时，请考虑以下因素:
1. 情绪倾向 (正面/负面/中性)
2. 消息来源的可信度和影响力
3. 消息的传播广度和持续时间
4. 历史上类似消息对股价的影响
5. 市场当前的整体情绪状态

请提供详细分析，并给出舆情对股价短期(1-7天)、中期(1-3个月)和长期(3个月以上)的可能影响。`
});

// 添加日志记录
const originalGenerate = sentimentAnalysisAgent.generate.bind(sentimentAnalysisAgent);
sentimentAnalysisAgent.generate = async (...args) => {
  logger.info('调用舆情分析代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('舆情分析代理响应成功');
    return result;
  } catch (error) {
    logger.error('舆情分析代理响应失败', error);
    throw error;
  }
}; 