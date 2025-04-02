import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

interface NewsItem {
  title: string;
  source: string;
  date: string;
  url: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // -1到1之间，-1极负面，1极正面
}

interface SentimentResult {
  ticker: string;
  companyName: string;
  overallSentiment: {
    score: number;
    label: 'bullish' | 'bearish' | 'neutral';
    summary: string;
  };
  news: NewsItem[];
  topKeywords: string[];
  trendChanges: {
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

// 模拟新闻数据
const newsTopics = [
  { positive: '季报超预期', negative: '季报不及预期' },
  { positive: '新产品发布', negative: '产品召回' },
  { positive: '扩大市场份额', negative: '市场份额下滑' },
  { positive: '分析师上调评级', negative: '分析师下调评级' },
  { positive: '获得重大合同', negative: '失去重要客户' },
  { positive: '成本削减成功', negative: '成本上升' },
  { positive: '成功收购', negative: '并购交易失败' },
  { positive: '新市场扩张', negative: '退出市场' },
  { positive: '股票回购计划', negative: '发行新股稀释股权' },
  { positive: '提高股息', negative: '削减股息' }
];

// 模拟新闻来源
const newsSources = [
  '彭博社', '路透社', '华尔街日报', '金融时报', '福布斯',
  '巴伦周刊', '财富杂志', '经济学人', '证券时报', '第一财经'
];

// 模拟新闻关键词
const keywords = [
  '盈利', '增长', '收入', '成本', '毛利率', '利润', '扩张', '研发',
  '创新', '竞争', '市场', '股东', '股息', '回购', '债务', '融资',
  '战略', '管理层', '投资', '产品', '服务', '客户', '供应链', '监管'
];

// 模拟公司趋势变化
const trendChanges = [
  { positive: '行业领导地位增强', negative: '竞争压力加剧' },
  { positive: '产品需求增加', negative: '需求疲软' },
  { positive: '利润率改善', negative: '利润率受压' },
  { positive: '技术创新加速', negative: '技术落后竞争对手' },
  { positive: '全球扩张顺利', negative: '国际业务遇阻' },
  { positive: '供应链优化', negative: '供应链中断' },
  { positive: '现金流改善', negative: '现金流恶化' },
  { positive: '新兴市场增长强劲', negative: '核心市场萎缩' }
];

// 生成随机日期（过去30天内）
function getRandomDate(): string {
  const today = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// 模拟获取新闻情绪数据
async function fetchNewsSentiment(ticker: string, days: number = 7): Promise<SentimentResult> {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // 公司名称，复用之前股票工具里的映射逻辑
  const companies = {
    'AAPL': '苹果公司',
    'MSFT': '微软',
    'GOOGL': 'Alphabet A',
    'AMZN': '亚马逊',
    'META': 'Meta平台',
    'TSLA': '特斯拉',
    'NVDA': '英伟达',
    'JPM': '摩根大通',
    'V': 'Visa',
    'JNJ': '强生'
  };
  
  const companyName = (ticker in companies) ? companies[ticker as keyof typeof companies] : `${ticker} Inc.`;
  
  // 生成整体情绪评分（-0.8到0.8之间）
  const overallSentimentScore = parseFloat((Math.random() * 1.6 - 0.8).toFixed(2));
  
  // 根据情绪评分确定标签
  let sentimentLabel: 'bullish' | 'bearish' | 'neutral';
  if (overallSentimentScore > 0.2) {
    sentimentLabel = 'bullish';
  } else if (overallSentimentScore < -0.2) {
    sentimentLabel = 'bearish';
  } else {
    sentimentLabel = 'neutral';
  }
  
  // 生成情绪总结
  const sentimentSummary = sentimentLabel === 'bullish' 
    ? `媒体对${companyName}的报道总体正面，主要关注其市场扩张和产品创新。`
    : sentimentLabel === 'bearish'
    ? `媒体对${companyName}的报道总体负面，主要担忧其竞争压力和盈利能力。`
    : `媒体对${companyName}的报道褒贬不一，看法较为中立。`;
  
  // 生成新闻条目
  const news: NewsItem[] = [];
  const newsCount = Math.min(days, 20); // 最多返回20条
  
  for (let i = 0; i < newsCount; i++) {
    // 根据整体情绪确定该条新闻的情绪倾向概率
    const positivityBias = sentimentLabel === 'bullish' ? 0.7 : 
                           sentimentLabel === 'bearish' ? 0.3 : 0.5;
    
    // 决定该条新闻是正面还是负面
    const isPositive = Math.random() < positivityBias;
    
    // 随机选择一个新闻主题
    const topicIndex = Math.floor(Math.random() * newsTopics.length);
    const topic = isPositive ? newsTopics[topicIndex].positive : newsTopics[topicIndex].negative;
    
    // 随机选择一个新闻来源
    const source = newsSources[Math.floor(Math.random() * newsSources.length)];
    
    // 生成情绪评分
    const sentimentScore = isPositive 
      ? parseFloat((Math.random() * 0.6 + 0.2).toFixed(2))  // 0.2到0.8
      : parseFloat((-Math.random() * 0.6 - 0.2).toFixed(2)); // -0.2到-0.8
    
    // 生成新闻标题
    const title = `${companyName}${topic}，分析师${isPositive ? '看好' : '担忧'}未来发展`;
    
    // 生成新闻摘要
    const summary = `${source}报道，${companyName}近期${topic}，这可能对公司${isPositive ? '带来积极影响' : '产生负面影响'}。市场分析师表示，这一发展${isPositive ? '增强了公司竞争力' : '可能削弱公司市场地位'}，${isPositive ? '有望' : '或将难以'}在未来季度改善业绩。`;
    
    news.push({
      title,
      source,
      date: getRandomDate(),
      url: `https://example.com/news/${ticker.toLowerCase()}/${Math.random().toString(36).substring(2, 10)}`,
      summary,
      sentiment: isPositive ? 'positive' : (sentimentScore < -0.6 ? 'negative' : 'neutral'),
      sentimentScore
    });
  }
  
  // 按日期排序，最新的在前
  news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // 生成热门关键词
  const keywordCount = Math.floor(Math.random() * 5) + 5; // 5-10个关键词
  const shuffledKeywords = [...keywords].sort(() => Math.random() - 0.5);
  const topKeywords = shuffledKeywords.slice(0, keywordCount);
  
  // 生成趋势变化
  const changeCount = Math.floor(Math.random() * 3) + 1; // 1-3个变化
  const changes: { description: string; impact: 'positive' | 'negative' | 'neutral' }[] = [];
  
  for (let i = 0; i < changeCount; i++) {
    const trendIndex = Math.floor(Math.random() * trendChanges.length);
    const isPositive = Math.random() < (sentimentLabel === 'bullish' ? 0.7 : 0.3);
    const trend = isPositive ? trendChanges[trendIndex].positive : trendChanges[trendIndex].negative;
    
    changes.push({
      description: trend,
      impact: isPositive ? 'positive' : 'negative' as const
    });
  }
  
  return {
    ticker,
    companyName,
    overallSentiment: {
      score: overallSentimentScore,
      label: sentimentLabel,
      summary: sentimentSummary
    },
    news,
    topKeywords,
    trendChanges: changes
  };
}

export const newsSentimentTool = createTool({
  name: 'newsSentimentTool',
  description: '分析特定公司或股票的新闻情绪，包括整体情绪评分、主要新闻条目和趋势变化',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    days: z.number().optional().describe('需要分析的新闻天数，默认为7天')
  }),
  execute: async ({ ticker, days = 7 }: { ticker: string; days?: number }) => {
    try {
      const data = await fetchNewsSentiment(ticker, days);
      
      const sentiment = data.overallSentiment.label === 'bullish'
        ? '看涨'
        : data.overallSentiment.label === 'bearish'
        ? '看跌'
        : '中性';
      
      return {
        result: data,
        explanation: `成功分析 ${ticker} (${data.companyName}) 的新闻情绪。整体情绪: ${sentiment} (${data.overallSentiment.score.toFixed(2)}), 基于 ${data.news.length} 条近期新闻。`
      };
    } catch (error) {
      console.error('Error fetching news sentiment:', error);
      throw new Error(`获取新闻情绪失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}); 