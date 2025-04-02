import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

// 新闻情绪分析工具
export const newsSentimentTool = createTool({
  name: 'newsSentimentTool',
  description: '获取与特定股票相关的新闻和社交媒体情绪数据',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    days: z.number().optional().default(7).describe('过去多少天的数据'),
    sources: z.enum(['news', 'social', 'all']).optional().default('all').describe('数据来源'),
  }),
  execute: async ({ ticker, days, sources }) => {
    // 模拟API调用，实际项目中应替换为真实新闻API
    // 例如使用NewsAPI, GDELT或Twitter/社交媒体API
    console.log(`获取${ticker}的${days}天${sources}情绪数据`);
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟返回数据
    const sentimentData = {
      overallSentiment: Math.random() > 0.5 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative',
      sentimentScore: parseFloat((Math.random() * 2 - 1).toFixed(2)), // -1到1之间
      volume: Math.floor(Math.random() * 1000),
      trending: Math.random() > 0.5,
      topKeywords: ['earnings', 'growth', 'innovation', 'market', 'competition'].sort(() => Math.random() - 0.5).slice(0, 3),
      articles: [
        {
          title: `${ticker}公司发布季度财报，超出市场预期`,
          source: 'Financial Times',
          date: new Date(Date.now() - Math.floor(Math.random() * days * 24 * 60 * 60 * 1000)).toISOString(),
          sentiment: 'positive',
          url: `https://example.com/news/${ticker.toLowerCase()}`
        },
        {
          title: `分析师对${ticker}未来前景持谨慎态度`,
          source: 'Bloomberg',
          date: new Date(Date.now() - Math.floor(Math.random() * days * 24 * 60 * 60 * 1000)).toISOString(),
          sentiment: 'neutral',
          url: `https://example.com/news/${ticker.toLowerCase()}/analysis`
        },
        {
          title: `${ticker}面临新的市场挑战和竞争压力`,
          source: 'Reuters',
          date: new Date(Date.now() - Math.floor(Math.random() * days * 24 * 60 * 60 * 1000)).toISOString(),
          sentiment: Math.random() > 0.5 ? 'negative' : 'neutral',
          url: `https://example.com/news/${ticker.toLowerCase()}/challenges`
        }
      ]
    };

    return sentimentData;
  }
}); 