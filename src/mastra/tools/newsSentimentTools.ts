import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('newsSentimentTools');

// 定义API返回数据类型
interface NewsArticle {
  title: string;
  source: string;
  date: string;
  url: string;
  summary: string;
  sentiment: {
    score: number;  // -1 (非常负面) 到 1 (非常正面)
    label: 'positive' | 'negative' | 'neutral';
  };
}

interface NewsSentimentData {
  ticker: string;
  company: string;
  articles: NewsArticle[];
  overallSentiment: {
    score: number;  // -1 到 1
    label: 'positive' | 'negative' | 'neutral';
    distribution: {
      positive: number;  // 正面文章比例
      neutral: number;   // 中性文章比例
      negative: number;  // 负面文章比例
    };
  };
}

/**
 * 获取新闻情绪数据
 * @param ticker 股票代码
 * @param days 获取天数
 * @returns 新闻情绪数据
 */
const getNewsSentiment = async (ticker: string, days: number = 7): Promise<NewsSentimentData> => {
  try {
    // 调用外部API获取新闻情绪数据
    const response = await fetch(
      `https://lumosfund-api.vercel.app/api/news-sentiment?ticker=${ticker}&days=${days}`,
      { next: { revalidate: 3600 } } // 1小时缓存
    );
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.error('获取新闻情绪数据失败', { ticker, days, error });
    throw new Error(`获取新闻情绪数据失败: ${error.message}`);
  }
};

/**
 * 获取社交媒体情绪数据
 * @param ticker 股票代码
 * @param days 获取天数
 * @returns 社交媒体情绪数据
 */
const getSocialMediaSentiment = async (ticker: string, days: number = 7): Promise<any> => {
  try {
    // 调用外部API获取社交媒体情绪数据
    const response = await fetch(
      `https://lumosfund-api.vercel.app/api/social-sentiment?ticker=${ticker}&days=${days}`,
      { next: { revalidate: 3600 } } // 1小时缓存
    );
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.error('获取社交媒体情绪数据失败', { ticker, days, error });
    throw new Error(`获取社交媒体情绪数据失败: ${error.message}`);
  }
};

/**
 * 新闻情绪分析工具
 * 获取和分析与股票相关的新闻情绪
 */
export const newsSentimentTool = createTool({
  id: 'newsSentimentTool',
  description: '获取和分析与股票相关的新闻情绪',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    days: z.number().min(1).max(30).optional().describe('获取天数(1-30)，默认7天')
  }),
  execute: async ({ ticker, days = 7 }: { ticker: string; days?: number }) => {
    logger.info('获取新闻情绪数据', { ticker, days });
    
    try {
      const sentimentData = await getNewsSentiment(ticker, days);
      
      return {
        ticker,
        days,
        company: sentimentData.company,
        articles: sentimentData.articles.slice(0, 10), // 只返回前10条新闻
        overallSentiment: sentimentData.overallSentiment,
        success: true
      };
    } catch (error: any) {
      logger.error('新闻情绪分析工具执行失败', { ticker, days, error });
      return {
        ticker,
        days,
        success: false,
        error: error.message
      };
    }
  }
});

/**
 * 社交媒体情绪分析工具
 * 获取和分析社交媒体上关于股票的讨论情绪
 */
export const socialSentimentTool = createTool({
  id: 'socialSentimentTool',
  description: '获取和分析社交媒体上关于股票的讨论情绪',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    days: z.number().min(1).max(30).optional().describe('获取天数(1-30)，默认7天')
  }),
  execute: async ({ ticker, days = 7 }: { ticker: string; days?: number }) => {
    logger.info('获取社交媒体情绪数据', { ticker, days });
    
    try {
      const socialData = await getSocialMediaSentiment(ticker, days);
      
      return {
        ticker,
        days,
        platform: socialData.platform,
        mentions: socialData.mentions,
        volume: socialData.volume,
        sentiment: socialData.sentiment,
        buzzwords: socialData.buzzwords,
        success: true
      };
    } catch (error: any) {
      logger.error('社交媒体情绪分析工具执行失败', { ticker, days, error });
      return {
        ticker,
        days,
        success: false,
        error: error.message
      };
    }
  }
});

/**
 * 综合情绪分析工具
 * 整合新闻和社交媒体的情绪分析，提供综合情绪评估
 */
export const sentimentAnalysisTool = createTool({
  id: 'sentimentAnalysisTool',
  description: '整合新闻和社交媒体的情绪分析，提供综合情绪评估',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    days: z.number().min(1).max(30).optional().describe('获取天数(1-30)，默认7天')
  }),
  execute: async ({ ticker, days = 7 }: { ticker: string; days?: number }) => {
    logger.info('获取综合情绪分析', { ticker, days });
    
    try {
      // 并行获取新闻和社交媒体情绪数据
      const [newsData, socialData] = await Promise.all([
        getNewsSentiment(ticker, days),
        getSocialMediaSentiment(ticker, days)
      ]);
      
      // 计算综合情绪分数 (加权平均)
      const newsWeight = 0.6;  // 新闻权重60%
      const socialWeight = 0.4;  // 社交媒体权重40%
      
      const combinedScore = (
        newsData.overallSentiment.score * newsWeight + 
        socialData.sentiment.score * socialWeight
      );
      
      // 确定综合情绪标签
      let combinedLabel: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (combinedScore >= 0.2) {
        combinedLabel = 'positive';
      } else if (combinedScore <= -0.2) {
        combinedLabel = 'negative';
      }
      
      return {
        ticker,
        days,
        company: newsData.company,
        sentiment: {
          news: newsData.overallSentiment,
          social: socialData.sentiment,
          combined: {
            score: combinedScore,
            label: combinedLabel
          }
        },
        topNews: newsData.articles.slice(0, 5),  // 只返回前5条新闻
        topBuzzwords: socialData.buzzwords.slice(0, 10),  // 只返回前10个热词
        success: true
      };
    } catch (error: any) {
      logger.error('综合情绪分析工具执行失败', { ticker, days, error });
      return {
        ticker,
        days,
        success: false,
        error: error.message
      };
    }
  }
}); 