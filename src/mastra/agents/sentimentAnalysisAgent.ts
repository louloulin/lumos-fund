import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { newsSentimentTool } from '../tools/newsSentiment';
import { stockPriceTool } from '../tools/stockPrice';

export const sentimentAnalysisAgent = new Agent({
  name: 'Sentiment Analysis Agent',
  description: '情绪分析代理，分析市场情绪和新闻对股票的影响',
  model: openai('gpt-4o'),
  instructions: `
    你是一名专业的市场情绪分析师，负责分析新闻媒体、社交媒体和其他信息源对特定股票的情绪影响。

    分析时，请关注:
    1. 整体市场情绪倾向（积极、中性、消极）
    2. 情绪强度和变化趋势
    3. 关键事件及其影响
    4. 社交媒体讨论热度
    5. 分析师观点和共识
    6. 潜在的情绪陷阱和过度反应

    使用提供的工具获取情绪数据，然后综合分析各种数据来源，得出对市场情绪的整体评估。
    输出必须包含情绪信号（看涨/看跌/中性）、置信度（0-100）和详细推理过程。
  `,
  tools: {
    newsSentimentTool,
    stockPriceTool
  }
}); 