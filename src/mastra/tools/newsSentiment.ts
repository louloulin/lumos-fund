import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('newsSentimentTool');

/**
 * 新闻情绪分析工具
 * 
 * 抓取和分析与股票相关的新闻，评估媒体情绪和潜在影响
 */
export const newsSentimentTool = createTool({
  name: 'newsSentimentTool',
  description: '分析与特定股票相关的新闻情绪',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    days: z.number().int().min(1).max(30).default(7).describe('分析的天数'),
  }),
  execute: async ({ ticker, days }: { ticker: string; days: number }) => {
    logger.info('执行新闻情绪分析', { ticker, days });
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成新闻数据
      const newsData = generateNewsData(ticker, days);
      
      // 分析情绪
      const sentimentAnalysis = analyzeSentiment(newsData);
      
      // 识别关键主题
      const keyTopics = identifyKeyTopics(newsData);
      
      // 评估潜在影响
      const impact = assessImpact(sentimentAnalysis, keyTopics);
      
      return {
        ticker,
        timestamp: new Date().toISOString(),
        newsCount: newsData.articles.length,
        sentimentAnalysis,
        keyTopics,
        impact,
        recentNews: newsData.articles.slice(0, 5) // 只返回最近的5条新闻
      };
    } catch (error: any) {
      logger.error('新闻情绪分析失败', { ticker, error });
      throw new Error(`新闻情绪分析失败: ${error.message}`);
    }
  }
});

/**
 * 生成模拟新闻数据
 */
function generateNewsData(ticker: string, days: number): {
  articles: Array<{
    title: string;
    source: string;
    date: string;
    url: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    relevance: number; // 0-1
    reach: number; // 估计阅读量，以千为单位
  }>;
} {
  // 为不同股票设置不同的新闻倾向
  let positiveChance: number;
  let negativeChance: number;
  let customHeadlines: string[] = [];
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      positiveChance = 0.65;
      negativeChance = 0.15;
      customHeadlines = [
        "Apple推出全新AI功能，分析师看好前景",
        "苹果Vision Pro销量超预期，股价上涨",
        "分析师上调苹果目标价，称iPhone销量强劲",
        "苹果公布季度财报，营收超出华尔街预期",
        "苹果扩大在印度的制造业务，减少对中国依赖"
      ];
      break;
    case 'MSFT':
      positiveChance = 0.70;
      negativeChance = 0.10;
      customHeadlines = [
        "微软云业务增长强劲，Azure营收大增",
        "微软Copilot订阅用户超过千万，AI战略成功",
        "微软与OpenAI深化合作，AI领导地位巩固",
        "微软收购游戏工作室，扩大Xbox Game Pass阵容",
        "分析师：微软将成为首个市值达到4万亿美元的公司"
      ];
      break;
    case 'GOOGL':
      positiveChance = 0.60;
      negativeChance = 0.20;
      customHeadlines = [
        "谷歌推出全新搜索功能，用户体验大幅提升",
        "谷歌AI模型Gemini Pro性能超越竞争对手",
        "谷歌云业务盈利能力首次实现持续盈利",
        "谷歌数字广告业务恢复增长，超出市场预期",
        "监管担忧减轻，谷歌股价受益反弹"
      ];
      break;
    case 'META':
      positiveChance = 0.55;
      negativeChance = 0.25;
      customHeadlines = [
        "Meta营收超预期，广告业务强劲复苏",
        "Facebook用户增长超预期，Meta股价大涨",
        "Meta元宇宙战略开始见效，Quest 3销量强劲",
        "Meta裁员后效率提升，利润率创历史新高",
        "分析师上调Meta目标价，引用AI集成成功"
      ];
      break;
    case 'TSLA':
      positiveChance = 0.50;
      negativeChance = 0.30;
      customHeadlines = [
        "特斯拉中国销量创新高，全球交付量增长",
        "特斯拉推出新型电池技术，续航里程大幅提升",
        "特斯拉自动驾驶技术获监管积极评价",
        "特斯拉能源业务增长迅猛，储能装机量翻倍",
        "马斯克宣布特斯拉机器人将于明年投入商用"
      ];
      break;
    case 'AMZN':
      positiveChance = 0.60;
      negativeChance = 0.20;
      customHeadlines = [
        "亚马逊AWS云业务加速增长，市场份额扩大",
        "亚马逊Prime会员数量突破2.5亿，创历史新高",
        "亚马逊物流效率提升，配送时间缩短",
        "亚马逊广告业务增长迅猛，成为新的利润增长点",
        "亚马逊加大AI投资，分析师看好长期增长"
      ];
      break;
    default:
      positiveChance = 0.50;
      negativeChance = 0.20;
      // 通用标题
      customHeadlines = [
        `${ticker}季度财报超预期，股价上涨`,
        `${ticker}获多家分析师上调评级，前景乐观`,
        `${ticker}推出创新产品，市场反应积极`,
        `${ticker}扩大市场份额，行业地位巩固`,
        `${ticker}管理层对未来业绩表示乐观`
      ];
  }
  
  const neutralChance = 1 - positiveChance - negativeChance;
  
  // 生成新闻源
  const newsSources = [
    "Bloomberg", "CNBC", "Reuters", "Wall Street Journal", "Financial Times",
    "Barron's", "MarketWatch", "Seeking Alpha", "The Motley Fool", "Investor's Business Daily",
    "Yahoo Finance", "Business Insider", "TheStreet", "Zacks", "Benzinga"
  ];
  
  // 生成通用正面新闻标题
  const positiveHeadlines = [
    `${ticker}股价创新高，分析师看好增长前景`,
    `${ticker}超预期财报推动股价上涨`,
    `多家投行上调${ticker}目标价，前景乐观`,
    `${ticker}新产品线获市场积极反响`,
    `${ticker}扩大市场份额，分析师提高评级`,
    `${ticker}宣布回购计划，投资者信心提振`,
    `${ticker}国际业务增长强劲，全球扩张提速`,
    `分析师报告：${ticker}行业领导地位进一步巩固`,
    `${ticker}管理层提高全年指引，信心十足`,
    `机构大幅增持${ticker}股票，看好长期表现`
  ];
  
  // 生成通用负面新闻标题
  const negativeHeadlines = [
    `${ticker}财报不及预期，股价承压`,
    `分析师下调${ticker}评级，引用增长放缓`,
    `${ticker}面临供应链挑战，可能影响业绩`,
    `竞争加剧，${ticker}市场份额受到挤压`,
    `${ticker}首席高管离职，引发市场担忧`,
    `监管压力加大，${ticker}面临不确定性`,
    `${ticker}盈利能力下降，毛利率收窄`,
    `${ticker}新产品发布延迟，投资者失望`,
    `机构减持${ticker}股票，对估值表示担忧`,
    `${ticker}国际业务面临挑战，增长放缓`
  ];
  
  // 生成通用中性新闻标题
  const neutralHeadlines = [
    `${ticker}维持市场预期，股价小幅波动`,
    `分析师对${ticker}持观望态度，等待更多数据`,
    `${ticker}调整业务策略，长期影响待观察`,
    `${ticker}与行业伙伴合作，推出新服务`,
    `市场波动，${ticker}股价表现与大盘一致`,
    `${ticker}举行投资者日活动，展示未来规划`,
    `${ticker}任命新高管，市场反应平淡`,
    `行业报告：${ticker}维持稳定市场地位`,
    `${ticker}业绩符合预期，无明显亮点`,
    `分析师密切关注${ticker}下季度表现`
  ];
  
  // 生成随机新闻文章
  const articles = [];
  const now = new Date();
  
  // 首先添加自定义新闻标题
  for (let i = 0; i < Math.min(customHeadlines.length, days); i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const randomSource = newsSources[Math.floor(Math.random() * newsSources.length)];
    
    const sentiment = Math.random() < 0.7 ? 'positive' : (Math.random() < 0.5 ? 'negative' : 'neutral');
    
    articles.push({
      title: customHeadlines[i],
      source: randomSource,
      date: date.toISOString().split('T')[0],
      url: `https://example.com/news/${ticker.toLowerCase()}/${date.getTime()}`,
      sentiment: sentiment as 'positive' | 'negative' | 'neutral',
      relevance: 0.8 + Math.random() * 0.2, // 高相关性
      reach: 10 + Math.floor(Math.random() * 90) // 10k-100k
    });
  }
  
  // 再添加通用新闻标题，直到达到要求的天数
  while (articles.length < days * 3) { // 每天平均3篇新闻
    const dayOffset = Math.floor(Math.random() * days);
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    
    const randomSource = newsSources[Math.floor(Math.random() * newsSources.length)];
    const rand = Math.random();
    
    let title;
    let sentiment: 'positive' | 'negative' | 'neutral';
    
    if (rand < positiveChance) {
      title = positiveHeadlines[Math.floor(Math.random() * positiveHeadlines.length)];
      sentiment = 'positive';
    } else if (rand < positiveChance + negativeChance) {
      title = negativeHeadlines[Math.floor(Math.random() * negativeHeadlines.length)];
      sentiment = 'negative';
    } else {
      title = neutralHeadlines[Math.floor(Math.random() * neutralHeadlines.length)];
      sentiment = 'neutral';
    }
    
    articles.push({
      title,
      source: randomSource,
      date: date.toISOString().split('T')[0],
      url: `https://example.com/news/${ticker.toLowerCase()}/${date.getTime()}${articles.length}`,
      sentiment,
      relevance: 0.5 + Math.random() * 0.5, // 中到高相关性
      reach: 5 + Math.floor(Math.random() * 45) // 5k-50k
    });
  }
  
  // 按日期排序
  articles.sort((a, b) => new Date(b.date).getTime() - new Date(a).getTime());
  
  return { articles };
}

/**
 * 分析新闻情绪
 */
function analyzeSentiment(newsData: {
  articles: Array<{
    sentiment: 'positive' | 'negative' | 'neutral';
    relevance: number;
    reach: number;
  }>;
}): {
  overallSentiment: number; // -1 到 1
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sentimentTrend: 'improving' | 'deteriorating' | 'stable';
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
  significantShift: boolean;
} {
  const articles = newsData.articles;
  
  // 计算情绪分布
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  
  // 计算加权情绪得分
  let totalSentimentScore = 0;
  let totalWeight = 0;
  
  for (const article of articles) {
    const weight = article.relevance * Math.sqrt(article.reach); // 相关性和覆盖范围都很重要
    
    if (article.sentiment === 'positive') {
      positiveCount++;
      totalSentimentScore += 1 * weight;
    } else if (article.sentiment === 'negative') {
      negativeCount++;
      totalSentimentScore += -1 * weight;
    } else {
      neutralCount++;
      totalSentimentScore += 0 * weight;
    }
    
    totalWeight += weight;
  }
  
  // 计算加权平均情绪得分
  const overallSentiment = totalWeight ? totalSentimentScore / totalWeight : 0;
  
  // 计算情绪分布比例
  const total = positiveCount + neutralCount + negativeCount;
  const sentimentDistribution = {
    positive: positiveCount / total,
    neutral: neutralCount / total,
    negative: negativeCount / total
  };
  
  // 如果有足够的文章，计算情绪趋势
  let sentimentTrend: 'improving' | 'deteriorating' | 'stable' = 'stable';
  
  if (articles.length >= 6) {
    const recentHalf = articles.slice(0, Math.floor(articles.length / 2));
    const olderHalf = articles.slice(Math.floor(articles.length / 2));
    
    let recentPositive = 0;
    let recentNegative = 0;
    let olderPositive = 0;
    let olderNegative = 0;
    
    for (const article of recentHalf) {
      if (article.sentiment === 'positive') recentPositive++;
      if (article.sentiment === 'negative') recentNegative++;
    }
    
    for (const article of olderHalf) {
      if (article.sentiment === 'positive') olderPositive++;
      if (article.sentiment === 'negative') olderNegative++;
    }
    
    const recentRatio = recentPositive / (recentNegative || 1);
    const olderRatio = olderPositive / (olderNegative || 1);
    
    if (recentRatio > olderRatio * 1.2) {
      sentimentTrend = 'improving';
    } else if (recentRatio < olderRatio * 0.8) {
      sentimentTrend = 'deteriorating';
    }
  }
  
  // 计算新闻量趋势
  let volumeTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  
  if (articles.length >= 6) {
    const dateCount: {[key: string]: number} = {};
    
    for (const article of articles) {
      if (!dateCount[article.date]) {
        dateCount[article.date] = 0;
      }
      dateCount[article.date]++;
    }
    
    const dates = Object.keys(dateCount).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (dates.length >= 4) {
      const recentDays = dates.slice(0, Math.floor(dates.length / 2));
      const olderDays = dates.slice(Math.floor(dates.length / 2));
      
      let recentVolume = 0;
      let olderVolume = 0;
      
      for (const date of recentDays) {
        recentVolume += dateCount[date];
      }
      
      for (const date of olderDays) {
        olderVolume += dateCount[date];
      }
      
      const recentAvg = recentVolume / recentDays.length;
      const olderAvg = olderVolume / olderDays.length;
      
      if (recentAvg > olderAvg * 1.3) {
        volumeTrend = 'increasing';
      } else if (recentAvg < olderAvg * 0.7) {
        volumeTrend = 'decreasing';
      }
    }
  }
  
  // 检测是否有显著变化
  const significantShift = (
    Math.abs(overallSentiment) > 0.6 || 
    sentimentTrend !== 'stable' || 
    volumeTrend === 'increasing'
  );
  
  return {
    overallSentiment,
    sentimentDistribution,
    sentimentTrend,
    volumeTrend,
    significantShift
  };
}

/**
 * 识别新闻中的关键主题
 */
function identifyKeyTopics(newsData: {
  articles: Array<{
    title: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    relevance: number;
  }>;
}): Array<{
  topic: string;
  frequency: number;
  sentiment: number; // -1 到 1
  significance: number; // 0-10
}> {
  // 预定义可能的主题
  const possibleTopics = [
    { keyword: ['财报', '营收', '利润', 'earnings', 'revenue', 'profit'], topic: '财务业绩' },
    { keyword: ['产品', '发布', '推出', 'launch', 'product', 'release'], topic: '产品发布' },
    { keyword: ['增长', '市场份额', 'growth', 'market share', 'expansion'], topic: '业务增长' },
    { keyword: ['并购', '收购', 'acquisition', 'merger', 'takeover'], topic: '并购活动' },
    { keyword: ['管理层', '首席', 'CEO', 'CFO', 'executive', 'management'], topic: '管理层变动' },
    { keyword: ['股价', '估值', '评级', 'stock price', 'valuation', 'rating'], topic: '市场表现' },
    { keyword: ['竞争', '竞争对手', 'competition', 'competitor', 'rival'], topic: '行业竞争' },
    { keyword: ['创新', '研发', '技术', 'innovation', 'R&D', 'technology'], topic: '创新与研发' },
    { keyword: ['国际', '全球', '扩张', 'international', 'global', 'expansion'], topic: '国际业务' },
    { keyword: ['监管', '法规', '诉讼', 'regulation', 'compliance', 'lawsuit'], topic: '监管与法律' },
    { keyword: ['供应链', 'supply chain', 'supplier', 'manufacturing'], topic: '供应链' },
    { keyword: ['回购', '股息', '分红', 'buyback', 'dividend', 'yield'], topic: '股东回报' },
    { keyword: ['AI', '人工智能', '机器学习', 'artificial intelligence', 'machine learning'], topic: 'AI与技术' },
    { keyword: ['可持续', '环保', 'ESG', 'sustainable', 'green', 'environmental'], topic: 'ESG与可持续发展' }
  ];
  
  // 统计各主题出现频率与情绪
  const topicStats: {[key: string]: {count: number; sentimentSum: number; relevanceSum: number}} = {};
  
  for (const article of newsData.articles) {
    const title = article.title.toLowerCase();
    
    for (const { keyword, topic } of possibleTopics) {
      if (keyword.some(k => title.includes(k.toLowerCase()))) {
        if (!topicStats[topic]) {
          topicStats[topic] = { count: 0, sentimentSum: 0, relevanceSum: 0 };
        }
        
        topicStats[topic].count += 1;
        topicStats[topic].sentimentSum += article.sentiment === 'positive' ? 1 : 
                                      article.sentiment === 'negative' ? -1 : 0;
        topicStats[topic].relevanceSum += article.relevance;
      }
    }
  }
  
  // 转换为结果格式
  const result = [];
  
  for (const topic in topicStats) {
    const stats = topicStats[topic];
    const frequency = stats.count / newsData.articles.length;
    const avgSentiment = stats.count > 0 ? stats.sentimentSum / stats.count : 0;
    const avgRelevance = stats.count > 0 ? stats.relevanceSum / stats.count : 0;
    
    // 计算主题显著性（基于频率、情绪强度和相关性）
    const significance = Math.min(10, (
      frequency * 5 + // 频率权重
      Math.abs(avgSentiment) * 3 + // 情绪强度权重
      avgRelevance * 2 // 相关性权重
    ));
    
    if (stats.count >= 2) { // 仅包含出现多次的主题
      result.push({
        topic,
        frequency,
        sentiment: avgSentiment,
        significance
      });
    }
  }
  
  // 按显著性排序
  return result.sort((a, b) => b.significance - a.significance);
}

/**
 * 评估新闻情绪对股价的潜在影响
 */
function assessImpact(
  sentimentAnalysis: {
    overallSentiment: number;
    sentimentTrend: 'improving' | 'deteriorating' | 'stable';
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    significantShift: boolean;
  },
  keyTopics: Array<{
    topic: string;
    sentiment: number;
    significance: number;
  }>
): {
  marketEffect: 'strongly_positive' | 'positive' | 'neutral' | 'negative' | 'strongly_negative';
  confidence: number; // 0-1
  shortTermImpact: number; // -5 到 5
  longTermImpact: number; // -5 到 5
  keyFactors: string[];
} {
  // 计算短期影响
  let shortTermScore = sentimentAnalysis.overallSentiment * 3; // 情绪影响
  
  // 情绪趋势对短期的影响
  if (sentimentAnalysis.sentimentTrend === 'improving') {
    shortTermScore += 1;
  } else if (sentimentAnalysis.sentimentTrend === 'deteriorating') {
    shortTermScore -= 1;
  }
  
  // 新闻量趋势对短期的影响
  if (sentimentAnalysis.volumeTrend === 'increasing') {
    shortTermScore = shortTermScore > 0 ? shortTermScore * 1.2 : shortTermScore * 1.5;
  }
  
  // 显著变化对短期的影响
  if (sentimentAnalysis.significantShift) {
    shortTermScore = shortTermScore > 0 ? shortTermScore * 1.3 : shortTermScore * 1.3;
  }
  
  // 长期影响的基础分数
  let longTermScore = sentimentAnalysis.overallSentiment * 2; // 情绪影响较小
  
  // 关键主题对长期的影响
  for (const topic of keyTopics.slice(0, 3)) { // 仅考虑前三个主题
    const topicImpact = topic.sentiment * (topic.significance / 10) * 2;
    
    // 不同主题对长期影响的权重不同
    switch (topic.topic) {
      case '财务业绩':
      case '业务增长':
      case '创新与研发':
      case 'AI与技术':
        longTermScore += topicImpact * 1.5; // 这些因素对长期影响更大
        break;
      case '产品发布':
      case '并购活动':
      case '国际业务':
        longTermScore += topicImpact * 1.2;
        break;
      default:
        longTermScore += topicImpact;
    }
  }
  
  // 调整到 -5 到 5 的范围
  shortTermScore = Math.max(-5, Math.min(5, shortTermScore));
  longTermScore = Math.max(-5, Math.min(5, longTermScore));
  
  // 确定市场影响
  let marketEffect: 'strongly_positive' | 'positive' | 'neutral' | 'negative' | 'strongly_negative';
  
  if (shortTermScore > 3) {
    marketEffect = 'strongly_positive';
  } else if (shortTermScore > 1) {
    marketEffect = 'positive';
  } else if (shortTermScore > -1) {
    marketEffect = 'neutral';
  } else if (shortTermScore > -3) {
    marketEffect = 'negative';
  } else {
    marketEffect = 'strongly_negative';
  }
  
  // 确定关键因素
  const keyFactors = [];
  
  if (Math.abs(sentimentAnalysis.overallSentiment) > 0.4) {
    keyFactors.push(`整体媒体情绪${sentimentAnalysis.overallSentiment > 0 ? '积极' : '消极'}`);
  }
  
  if (sentimentAnalysis.sentimentTrend !== 'stable') {
    keyFactors.push(`情绪趋势${sentimentAnalysis.sentimentTrend === 'improving' ? '改善中' : '恶化中'}`);
  }
  
  if (sentimentAnalysis.volumeTrend === 'increasing') {
    keyFactors.push('媒体关注度上升');
  }
  
  // 添加关键主题
  keyTopics.slice(0, 2).forEach(topic => {
    keyFactors.push(`${topic.topic}相关新闻${topic.sentiment > 0 ? '积极' : topic.sentiment < 0 ? '消极' : '中性'}`);
  });
  
  // 计算置信度
  const confidence = 0.5 + 
                    Math.min(0.2, keyTopics.length * 0.03) + // 主题多样性增加置信度
                    Math.min(0.15, newsData.articles.length * 0.01) + // 新闻数量增加置信度
                    Math.min(0.15, Math.abs(sentimentAnalysis.overallSentiment) * 0.2); // 明确的情绪增加置信度
  
  return {
    marketEffect,
    confidence,
    shortTermImpact: shortTermScore,
    longTermImpact: longTermScore,
    keyFactors
  };
} 