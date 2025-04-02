import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sentimentAnalysisAgent } from '@/mastra/agents/sentimentAnalysisAgent';
import { newsSentimentTool } from '@/mastra/tools/newsSentiment';
import { mockTool } from '../test-utils';

// 模拟新闻情绪工具
vi.mock('@/mastra/tools/newsSentiment', () => ({
  newsSentimentTool: mockTool({
    overallSentiment: 'positive',
    sentimentScore: 0.75,
    volume: 500,
    trending: true,
    topKeywords: ['earnings', 'growth', 'innovation'],
    articles: [
      {
        title: 'AAPL公司发布季度财报，超出市场预期',
        source: 'Financial Times',
        date: '2023-04-01T10:00:00Z',
        sentiment: 'positive',
        url: 'https://example.com/news/aapl'
      }
    ]
  })
}));

// 模拟股票价格工具
vi.mock('@/mastra/tools/stockPrice', () => ({
  stockPriceTool: mockTool({
    currentPrice: 185.92,
    previousClose: 180.25,
    change: 5.67,
    changePercent: 3.15,
    volume: 75000000,
    averageVolume: 65000000,
    yearHigh: 198.23,
    yearLow: 124.17,
    priceHistory: [
      { date: '2023-03-25', price: 175.34 },
      { date: '2023-03-26', price: 177.89 },
      { date: '2023-03-27', price: 180.25 },
      { date: '2023-03-28', price: 185.92 }
    ]
  })
}));

describe('情绪分析代理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('应根据积极情绪数据生成看涨信号', async () => {
    // 调用代理
    const response = await sentimentAnalysisAgent.generate('分析AAPL的市场情绪');
    
    // 验证结果
    expect(response).toBeDefined();
    const text = response.toString();
    
    // 验证包含预期关键词和结论
    expect(text).toContain('看涨');
    expect(text).toContain('情绪');
    expect(text).toContain('积极');
    
    // 验证工具被调用
    expect(newsSentimentTool.execute).toHaveBeenCalledTimes(1);
  });
  
  it('应包含分析结论和置信度', async () => {
    // 调用代理
    const response = await sentimentAnalysisAgent.generate('分析AAPL的市场情绪');
    const text = response.toString();
    
    // 验证置信度和分析结论
    expect(text).toMatch(/置信度[：:]\s*\d+/);
    expect(text).toMatch(/推理|分析|结论/);
  });
}); 