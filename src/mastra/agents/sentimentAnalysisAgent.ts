import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';
import { newsSentimentTool, socialSentimentTool, sentimentAnalysisTool } from '../tools/newsSentimentTools';
import { stockPriceTool, volumeTool } from '../tools/marketDataTools';

const logger = createLogger('sentimentAnalysisAgent');

/**
 * 情绪分析代理
 * 
 * 专注于分析市场情绪、新闻情绪和社交媒体情绪
 * 评估舆论环境和市场心理对股价的潜在影响
 */
export const sentimentAnalysisAgent = new Agent({
  id: 'sentimentAnalysisAgent',
  description: '情绪分析代理 - 专注于分析市场情绪和新闻情绪',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `你是一位市场情绪分析专家，擅长分析新闻、社交媒体和市场数据中的情绪信号。

作为情绪分析师，你会重点关注以下因素:
1. 新闻情绪 - 媒体报道的正面/负面倾向
2. 社交媒体情绪 - 投资者社区的讨论情绪
3. 市场交易情绪指标 - 成交量、波动率、恐慌/贪婪指数
4. 机构分析师情绪 - 评级变化和目标价格调整
5. 情绪转变信号 - 情绪极端或突然转变的警示信号
6. 定性情绪分析 - 关键词和叙事变化

使用提供的工具收集情绪数据，分析舆论环境，并评估这些情绪信号如何影响股票的短期和中期价格走势。

请提供明确的情绪评估结果，包括:
1. 情绪评级 (极度正面/正面/中性/负面/极度负面)
2. 情绪信号强度 (0-100%)
3. 显著情绪变化
4. 情绪影响预期 (短期/中期)
5. 关键舆论驱动因素
6. 反向指标评估 (市场情绪是否达到极端，可能出现反转)

你的分析应关注情绪的变化，而不仅仅是绝对值。特别注意识别过度情绪反应和反向指标。`
});

/**
 * 生成情绪分析
 * 
 * 分析股票相关的新闻、社交媒体和市场情绪
 */
export async function generateSentimentAnalysis(ticker: string, days: number = 7) {
  logger.info('开始情绪分析', { ticker, days });
  
  try {
    // 获取情绪数据
    const sentimentData = await sentimentAnalysisTool.execute({ ticker, days });
    
    // 获取市场数据
    const priceData = await stockPriceTool.execute({ symbol: ticker });
    const volumeData = await volumeTool.execute({ symbol: ticker });
    
    // 准备情绪分析提示
    const analysisPrompt = generateSentimentAnalysisPrompt(
      ticker, 
      sentimentData, 
      priceData, 
      volumeData
    );
    
    // 调用情绪分析代理
    const response = await sentimentAnalysisAgent.generate(analysisPrompt);
    
    return {
      ticker,
      days,
      sentiment: sentimentData.sentiment,
      analysis: response,
      success: true
    };
  } catch (error: any) {
    logger.error('情绪分析失败', { ticker, days, error });
    return {
      ticker,
      days,
      success: false,
      error: error.message,
      analysis: '情绪分析过程中发生错误，无法完成分析。'
    };
  }
}

/**
 * 生成情绪分析提示
 */
function generateSentimentAnalysisPrompt(
  ticker: string,
  sentimentData: any,
  priceData: any,
  volumeData: any
): string {
  // 格式化成交量变化
  const volumeChange = volumeData.success 
    ? `${volumeData.volume > volumeData.averageVolume ? '+' : ''}${(((volumeData.volume / volumeData.averageVolume) - 1) * 100).toFixed(2)}%` 
    : '未知';
  
  // 准备新闻概要
  let newsOverview = '';
  if (sentimentData.success && sentimentData.topNews) {
    newsOverview = sentimentData.topNews
      .map((article: any, index: number) => {
        return `${index + 1}. "${article.title}" (${article.source}, ${article.date}) - 情绪: ${article.sentiment.label} (${article.sentiment.score.toFixed(2)})`;
      })
      .join('\n');
  }
  
  // 准备热词列表
  let buzzwordsList = '';
  if (sentimentData.success && sentimentData.topBuzzwords) {
    buzzwordsList = sentimentData.topBuzzwords
      .map((word: any) => `${word.term} (${word.count})`)
      .join(', ');
  }
  
  // 构建提示
  return `
请对${ticker}的市场情绪进行全面分析。以下是相关数据:

1. 股票价格信息:
   价格: $${priceData.success ? priceData.currentPrice : '未知'}
   涨跌幅: ${priceData.success ? (priceData.changePercent * 100).toFixed(2) + '%' : '未知'}
   成交量变化: ${volumeChange}

2. 综合情绪数据:
   新闻情绪: ${sentimentData.success ? sentimentData.sentiment.news.label + ' (' + sentimentData.sentiment.news.score.toFixed(2) + ')' : '未知'}
   社交媒体情绪: ${sentimentData.success ? sentimentData.sentiment.social.label + ' (' + sentimentData.sentiment.social.score.toFixed(2) + ')' : '未知'}
   综合情绪: ${sentimentData.success ? sentimentData.sentiment.combined.label + ' (' + sentimentData.sentiment.combined.score.toFixed(2) + ')' : '未知'}

3. 新闻情绪分布:
   正面报道: ${sentimentData.success ? (sentimentData.sentiment.news.distribution.positive * 100).toFixed(2) + '%' : '未知'}
   中性报道: ${sentimentData.success ? (sentimentData.sentiment.news.distribution.neutral * 100).toFixed(2) + '%' : '未知'}
   负面报道: ${sentimentData.success ? (sentimentData.sentiment.news.distribution.negative * 100).toFixed(2) + '%' : '未知'}

4. 最近主要新闻:
${newsOverview || '无可用新闻数据'}

5. 热门讨论关键词:
${buzzwordsList || '无可用关键词数据'}

6. 社交媒体讨论量:
   讨论量: ${sentimentData.success ? sentimentData.sentiment.social.volume : '未知'} 提及
   较往期变化: ${sentimentData.success ? sentimentData.sentiment.social.volumeChange + '%' : '未知'}

请基于上述数据，提供完整的情绪分析报告，包括情绪评级、情绪信号强度、显著情绪变化、预期影响、关键驱动因素，以及是否有任何反向指标。特别关注新闻情绪和价格走势之间的关系，以及社交媒体讨论是否预示着投资者情绪转变。
`;
}

// 添加日志记录
const originalGenerate = sentimentAnalysisAgent.generate.bind(sentimentAnalysisAgent);
sentimentAnalysisAgent.generate = async (...args) => {
  logger.info('调用情绪分析代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('情绪分析代理响应成功');
    return result;
  } catch (error) {
    logger.error('情绪分析代理响应失败', error);
    throw error;
  }
}; 