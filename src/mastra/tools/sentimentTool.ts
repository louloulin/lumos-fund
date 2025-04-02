import { z } from "zod";
import { generateNewsData } from "@/lib/mocks";

// 创建工具函数模拟
type ToolOptions<T extends z.ZodType> = {
  name: string;
  description: string;
  schema: T;
  execute: (input: z.infer<T>) => Promise<any>;
};

function createTool<T extends z.ZodType>(options: ToolOptions<T>) {
  return options;
}

/**
 * 新闻情绪分析工具
 * 允许AI代理获取并分析与股票相关的新闻情绪
 */
export const newsSentimentTool = createTool({
  name: "newsSentimentTool",
  description: "获取并分析与股票相关的新闻情绪",
  schema: z.object({
    ticker: z.string().describe("股票代码，例如AAPL"),
    startDate: z.string().describe("开始日期，格式为YYYY-MM-DD"),
    endDate: z.string().describe("结束日期，格式为YYYY-MM-DD"),
  }),
  execute: async (input) => {
    const { ticker, startDate, endDate } = input;
    try {
      console.log(`获取${ticker}从${startDate}到${endDate}的新闻情绪数据`);
      
      // 使用模拟数据生成器获取新闻数据
      const newsData = generateNewsData(ticker, startDate, endDate);
      
      if (newsData.length === 0) {
        return {
          success: false,
          error: "未找到相关新闻数据"
        };
      }
      
      // 分析情绪
      const sentimentAnalysis = analyzeSentiment(newsData);
      
      return {
        success: true,
        data: {
          ticker,
          timeframe: `${startDate} 至 ${endDate}`,
          newsCount: newsData.length,
          news: newsData,
          analysis: sentimentAnalysis
        }
      };
    } catch (error) {
      console.error(`获取新闻情绪数据失败:`, error);
      return {
        success: false,
        error: "获取新闻情绪数据失败"
      };
    }
  }
});

/**
 * 社交媒体情绪分析工具
 * 允许AI代理获取并分析与股票相关的社交媒体情绪
 */
export const socialMediaSentimentTool = createTool({
  name: "socialMediaSentimentTool",
  description: "获取并分析与股票相关的社交媒体情绪",
  schema: z.object({
    ticker: z.string().describe("股票代码，例如AAPL"),
    days: z.number().describe("要分析的过去天数，例如7表示过去一周"),
  }),
  execute: async (input) => {
    const { ticker, days } = input;
    try {
      console.log(`获取${ticker}过去${days}天的社交媒体情绪数据`);
      
      // 这里使用模拟数据，实际应用中可以接入真实的社交媒体API
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - days);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = today.toISOString().split('T')[0];
      
      // 使用相同的新闻生成器，但过滤信息源为社交媒体的条目
      const allData = generateNewsData(ticker, formattedStartDate, formattedEndDate);
      const socialData = simulateSocialMediaData(ticker, days, allData);
      
      if (socialData.length === 0) {
        return {
          success: false,
          error: "未找到相关社交媒体数据"
        };
      }
      
      // 分析情绪
      const sentimentAnalysis = {
        overallSentiment: calculateAverageSentiment(socialData),
        trendAnalysis: analyzeSentimentTrend(socialData),
        topMentions: getTopMentions(socialData),
        volumeAnalysis: analyzeMentionVolume(socialData)
      };
      
      return {
        success: true,
        data: {
          ticker,
          timeframe: `过去${days}天`,
          postCount: socialData.length,
          posts: socialData.slice(0, 10), // 只返回前10条，避免数据过大
          analysis: sentimentAnalysis
        }
      };
    } catch (error) {
      console.error(`获取社交媒体情绪数据失败:`, error);
      return {
        success: false,
        error: "获取社交媒体情绪数据失败"
      };
    }
  }
});

/**
 * 分析新闻情绪
 */
function analyzeSentiment(newsData: any[]) {
  // 计算平均情绪分数
  const avgSentiment = calculateAverageSentiment(newsData);
  
  // 情绪分布统计
  const sentimentDistribution = {
    positive: newsData.filter(news => news.sentiment > 0.3).length,
    neutral: newsData.filter(news => news.sentiment >= -0.3 && news.sentiment <= 0.3).length,
    negative: newsData.filter(news => news.sentiment < -0.3).length
  };
  
  // 计算情绪分布百分比
  const totalNews = newsData.length;
  const sentimentPercentages = {
    positive: (sentimentDistribution.positive / totalNews) * 100,
    neutral: (sentimentDistribution.neutral / totalNews) * 100,
    negative: (sentimentDistribution.negative / totalNews) * 100
  };
  
  // 情绪趋势分析
  const sentimentTrend = analyzeSentimentTrend(newsData);
  
  // 生成情绪摘要
  let sentimentSummary = "";
  if (avgSentiment > 0.5) {
    sentimentSummary = "整体市场情绪非常积极，投资者对该股票持乐观态度。";
  } else if (avgSentiment > 0.2) {
    sentimentSummary = "市场情绪温和积极，投资者倾向于看好该股票。";
  } else if (avgSentiment > -0.2) {
    sentimentSummary = "市场情绪中性，投资者对该股票持观望态度。";
  } else if (avgSentiment > -0.5) {
    sentimentSummary = "市场情绪偏消极，投资者对该股票有一定担忧。";
  } else {
    sentimentSummary = "市场情绪非常消极，投资者对该股票持悲观态度。";
  }
  
  // 返回综合分析结果
  return {
    averageSentiment: avgSentiment,
    sentimentDistribution,
    sentimentPercentages,
    sentimentTrend,
    sentimentSummary
  };
}

/**
 * 计算平均情绪分数
 */
function calculateAverageSentiment(data: any[]): number {
  if (data.length === 0) return 0;
  
  const sum = data.reduce((total, item) => total + item.sentiment, 0);
  return sum / data.length;
}

/**
 * 分析情绪趋势
 */
function analyzeSentimentTrend(data: any[]) {
  if (data.length < 2) return "数据不足，无法分析趋势";
  
  // 按日期排序
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // 按日期分组计算每日平均情绪
  const dailySentiments = sortedData.reduce<Record<string, number[]>>((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item.sentiment);
    return acc;
  }, {});
  
  // 计算每日平均值
  const dailyAverages = Object.entries(dailySentiments).map(([date, sentiments]) => {
    const avg = sentiments.reduce((sum, val) => sum + val, 0) / sentiments.length;
    return { date, avgSentiment: avg };
  });
  
  // 如果只有一天的数据，无法判断趋势
  if (dailyAverages.length < 2) return "数据时间跨度不足，无法分析趋势";
  
  // 分析趋势方向
  const firstSentiment = dailyAverages[0].avgSentiment;
  const lastSentiment = dailyAverages[dailyAverages.length - 1].avgSentiment;
  const sentimentChange = lastSentiment - firstSentiment;
  
  // 判断趋势
  if (sentimentChange > 0.5) {
    return "情绪显著改善";
  } else if (sentimentChange > 0.2) {
    return "情绪逐渐改善";
  } else if (sentimentChange > -0.2) {
    return "情绪相对稳定";
  } else if (sentimentChange > -0.5) {
    return "情绪略有恶化";
  } else {
    return "情绪明显恶化";
  }
}

/**
 * 模拟生成社交媒体数据
 */
function simulateSocialMediaData(ticker: string, days: number, baseData: any[]) {
  // 将基础新闻数据转换为社交媒体数据格式
  const socialData = baseData.map(item => {
    // 随机生成社交媒体平台
    const platforms = ['Twitter', 'Reddit', 'StockTwits', 'Weibo', 'Seeking Alpha'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    
    // 随机生成用户名
    const usernames = ['investor_pro', 'market_guru', 'stock_lover', 'wallst_wizard', 'value_hunter'];
    const username = usernames[Math.floor(Math.random() * usernames.length)];
    
    // 随机生成浏览量和点赞数
    const views = Math.floor(Math.random() * 10000) + 100;
    const likes = Math.floor(Math.random() * 500) + 10;
    
    // 添加标签
    const hashtags = [`#${ticker}`, '#investing', '#stocks', '#market'];
    const randomHashtags = hashtags.filter(() => Math.random() > 0.3);
    
    // 返回社交媒体格式的对象
    return {
      ...item,
      platform,
      username,
      content: item.headline,
      views,
      likes,
      hashtags: randomHashtags,
      mentions: [`$${ticker}`]
    };
  });
  
  return socialData;
}

/**
 * 获取热门提及
 */
function getTopMentions(data: any[]) {
  // 提取所有标签
  const allHashtags: string[] = [];
  data.forEach(item => {
    if (item.hashtags && Array.isArray(item.hashtags)) {
      allHashtags.push(...item.hashtags);
    }
  });
  
  // 统计标签频率
  const hashtagCounts: Record<string, number> = {};
  allHashtags.forEach(tag => {
    hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
  });
  
  // 排序并返回前5个
  return Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));
}

/**
 * 分析提及量
 */
function analyzeMentionVolume(data: any[]) {
  // 按日期分组统计提及量
  const dailyVolume = data.reduce<Record<string, number>>((acc, item) => {
    acc[item.date] = (acc[item.date] || 0) + 1;
    return acc;
  }, {});
  
  // 转换为数组格式
  const volumeByDay = Object.entries(dailyVolume).map(([date, count]) => ({
    date,
    count
  }));
  
  // 排序
  volumeByDay.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // 计算总量和平均量
  const totalVolume = data.length;
  const avgVolume = totalVolume / Object.keys(dailyVolume).length;
  
  return {
    totalVolume,
    averageDailyVolume: avgVolume,
    volumeByDay
  };
} 