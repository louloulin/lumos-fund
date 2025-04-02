import { run, message, AgentState, Events, MemoryVectorStoreOptions, MemoryVectorStore } from '@mastra/core';
import { stockPriceTool, financialMetricsTool } from '../tools/stockTool';
import { technicalAnalysisTool, trendAnalysisTool } from '../tools/technicalTool';
import { newsSentimentTool, socialMediaSentimentTool } from '../tools/sentimentTool';

interface AnalyzeAgentState extends AgentState {
  ticker: string;
  timeframe: {
    startDate: string;
    endDate: string;
  };
  analysisData: {
    price?: any;
    fundamentals?: any;
    technicals?: any;
    sentiment?: any;
    recommendation?: string;
  };
}

// 初始化内存向量存储
const memoryOptions: MemoryVectorStoreOptions = {
  vectorSize: 1536,
};

const memory = new MemoryVectorStore(memoryOptions);

/**
 * 股票分析代理
 * 一个专门分析股票和市场数据的AI代理
 */
export const createAnalysisAgent = () => {
  const agent = run<AnalyzeAgentState>({
    name: "MarketAnalyst",
    model: "gpt-4-turbo",
    memory,
    systemMessage: `你是一位专业的股票分析师，名为MarketAnalyst。你的职责是分析股票数据并提供投资建议。
    
你可以分析以下几个方面的数据：
1. 价格数据：历史价格走势、成交量、市值等
2. 基本面数据：财务指标、收益报告、估值等
3. 技术指标：RSI、MACD、移动平均线、布林带等
4. 情绪数据：新闻舆论、社交媒体情绪等

请遵循以下分析流程：
1. 首先收集并理解用户提供的股票代码和时间范围
2. 分析股票价格历史走势和基本财务指标
3. 分析技术指标和市场情绪
4. 综合所有数据给出投资建议，说明理由

你的分析应该客观、全面、专业，避免过度乐观或悲观的偏见。`,
    initialState: {
      ticker: '',
      timeframe: {
        startDate: '',
        endDate: ''
      },
      analysisData: {}
    },
    tools: [
      stockPriceTool,
      financialMetricsTool,
      technicalAnalysisTool, 
      trendAnalysisTool,
      newsSentimentTool,
      socialMediaSentimentTool
    ],
    events: {
      [Events.start]: async (state) => {
        return message('欢迎使用股票分析助手。请告诉我您想分析的股票代码和时间范围。');
      },
      
      // 分析入口
      analysis: async (state, options) => {
        const { ticker, startDate, endDate } = options;
        
        // 更新状态
        state.ticker = ticker;
        state.timeframe = {
          startDate,
          endDate
        };
        
        // 开始收集数据
        return message(`我将为您分析${ticker}从${startDate}到${endDate}的数据。正在收集相关信息...`, {
          next: 'collectPriceData'
        });
      },
      
      // 收集价格数据
      collectPriceData: async (state) => {
        const { ticker, timeframe } = state;
        try {
          const priceResult = await stockPriceTool.execute({
            ticker,
            startDate: timeframe.startDate,
            endDate: timeframe.endDate
          });
          
          if (priceResult.success) {
            state.analysisData.price = priceResult.data;
            return message('价格数据收集完成。正在获取财务指标...', {
              next: 'collectFundamentals'
            });
          } else {
            return message(`获取${ticker}的价格数据失败：${priceResult.error}`, {
              next: 'handleError'
            });
          }
        } catch (error) {
          console.error('收集价格数据时出错:', error);
          return message(`收集${ticker}价格数据时发生系统错误`, {
            next: 'handleError'
          });
        }
      },
      
      // 收集基本面数据
      collectFundamentals: async (state) => {
        const { ticker } = state;
        try {
          const fundamentalsResult = await financialMetricsTool.execute({
            ticker
          });
          
          if (fundamentalsResult.success) {
            state.analysisData.fundamentals = fundamentalsResult.data;
            return message('财务指标数据收集完成。正在分析技术指标...', {
              next: 'collectTechnicals'
            });
          } else {
            return message(`获取${ticker}的财务指标失败：${fundamentalsResult.error}`, {
              next: 'collectTechnicals' // 继续下一步，因为财务数据不是必须的
            });
          }
        } catch (error) {
          console.error('收集财务数据时出错:', error);
          return message(`收集${ticker}财务数据时发生系统错误，将继续分析其他可用数据`, {
            next: 'collectTechnicals'
          });
        }
      },
      
      // 收集技术指标
      collectTechnicals: async (state) => {
        const { ticker, timeframe } = state;
        try {
          // 获取技术指标
          const technicalResult = await technicalAnalysisTool.execute({
            ticker,
            startDate: timeframe.startDate,
            endDate: timeframe.endDate,
            indicators: ['RSI', 'MACD', 'BOLL', 'KDJ']
          });
          
          // 获取趋势分析
          const trendResult = await trendAnalysisTool.execute({
            ticker,
            period: 60 // 分析最近60天的趋势
          });
          
          if (technicalResult.success || trendResult.success) {
            state.analysisData.technicals = {
              ...(technicalResult.success ? { indicators: technicalResult.data } : {}),
              ...(trendResult.success ? { trend: trendResult.data } : {})
            };
            
            return message('技术指标分析完成。正在分析市场情绪...', {
              next: 'collectSentiment'
            });
          } else {
            return message(`获取${ticker}的技术指标失败，将继续分析其他可用数据`, {
              next: 'collectSentiment'
            });
          }
        } catch (error) {
          console.error('收集技术指标时出错:', error);
          return message(`收集${ticker}技术指标时发生系统错误，将继续分析其他可用数据`, {
            next: 'collectSentiment'
          });
        }
      },
      
      // 收集情绪数据
      collectSentiment: async (state) => {
        const { ticker, timeframe } = state;
        try {
          // 获取新闻情绪
          const newsResult = await newsSentimentTool.execute({
            ticker,
            startDate: timeframe.startDate,
            endDate: timeframe.endDate
          });
          
          // 获取社交媒体情绪
          const socialResult = await socialMediaSentimentTool.execute({
            ticker,
            days: 14 // 分析最近14天的社交媒体情绪
          });
          
          if (newsResult.success || socialResult.success) {
            state.analysisData.sentiment = {
              ...(newsResult.success ? { news: newsResult.data } : {}),
              ...(socialResult.success ? { social: socialResult.data } : {})
            };
          }
          
          return message('市场情绪分析完成。正在生成综合分析...', {
            next: 'generateAnalysis'
          });
        } catch (error) {
          console.error('收集情绪数据时出错:', error);
          return message(`收集${ticker}情绪数据时发生系统错误，将继续生成分析`, {
            next: 'generateAnalysis'
          });
        }
      },
      
      // 生成综合分析
      generateAnalysis: async (state) => {
        const { ticker, timeframe, analysisData } = state;
        
        // 检查是否有足够的数据进行分析
        if (!analysisData.price) {
          return message(`无法完成对${ticker}的分析，因为缺少基本的价格数据。请稍后重试或选择其他股票。`, {
            next: 'handleError'
          });
        }
        
        // 生成分析报告
        const analysisReport = generateAnalysisReport(ticker, timeframe, analysisData);
        
        // 存储推荐结果
        state.analysisData.recommendation = analysisReport.recommendation;
        
        return message(analysisReport.report);
      },
      
      // 错误处理
      handleError: async (state) => {
        return message(`分析${state.ticker}时遇到错误。请检查股票代码是否正确，然后重试。或者告诉我另一个您想分析的股票代码。`);
      }
    },
  });
  
  return agent;
};

/**
 * 生成分析报告
 */
function generateAnalysisReport(ticker: string, timeframe: { startDate: string, endDate: string }, analysisData: any) {
  // 提取所有可用数据
  const { price, fundamentals, technicals, sentiment } = analysisData;
  
  // 初始化报告部分
  const parts = [];
  
  // 分析评分（用于最终推荐）
  const scores = {
    price: 0,
    fundamental: 0,
    technical: 0,
    sentiment: 0
  };
  
  // 添加价格分析
  if (price) {
    const priceChangePercent = price.percentChange;
    const lastPrice = price.data[price.data.length - 1].close;
    
    parts.push(`## 价格分析\n`);
    parts.push(`${ticker}当前价格为$${lastPrice}，在分析期间价格变化了${priceChangePercent.toFixed(2)}%。`);
    
    // 分析价格趋势并评分
    if (priceChangePercent > 10) {
      parts.push(`近期股价表现非常强劲，有明显上涨趋势。`);
      scores.price = 2;
    } else if (priceChangePercent > 3) {
      parts.push(`近期股价表现不错，有轻微上涨趋势。`);
      scores.price = 1;
    } else if (priceChangePercent > -3) {
      parts.push(`近期股价相对稳定，变化不大。`);
      scores.price = 0;
    } else if (priceChangePercent > -10) {
      parts.push(`近期股价有轻微下跌趋势。`);
      scores.price = -1;
    } else {
      parts.push(`近期股价表现很弱，有明显下跌趋势。`);
      scores.price = -2;
    }
  }
  
  // 添加基本面分析
  if (fundamentals) {
    parts.push(`\n## 基本面分析\n`);
    
    // 财务健康状况
    parts.push(`**财务状况**：${fundamentals.summary}`);
    
    // P/E 分析
    if (fundamentals.metrics.peRatio < 15) {
      parts.push(`市盈率为${fundamentals.metrics.peRatio.toFixed(2)}，相对行业平均值较低，可能被低估。`);
      scores.fundamental += 1;
    } else if (fundamentals.metrics.peRatio > 30) {
      parts.push(`市盈率为${fundamentals.metrics.peRatio.toFixed(2)}，高于行业平均值，可能估值较高。`);
      scores.fundamental -= 1;
    } else {
      parts.push(`市盈率为${fundamentals.metrics.peRatio.toFixed(2)}，在合理估值范围内。`);
    }
    
    // 股息分析
    if (fundamentals.metrics.dividendYield > 3) {
      parts.push(`股息收益率为${fundamentals.metrics.dividendYield.toFixed(2)}%，提供了良好的收入潜力。`);
      scores.fundamental += 1;
    }
    
    // 增长分析
    if (fundamentals.metrics.revenueGrowth > 15) {
      parts.push(`收入增长率为${fundamentals.metrics.revenueGrowth.toFixed(2)}%，表现出强劲的增长势头。`);
      scores.fundamental += 1;
    } else if (fundamentals.metrics.revenueGrowth < 0) {
      parts.push(`收入增长率为${fundamentals.metrics.revenueGrowth.toFixed(2)}%，存在收入下滑的问题。`);
      scores.fundamental -= 1;
    }
    
    // 综合评价
    const fundamentalOutlook = scores.fundamental > 1 ? "积极" : (scores.fundamental < -1 ? "消极" : "中性");
    parts.push(`\n总体而言，${ticker}的基本面状况${fundamentalOutlook}。`);
  }
  
  // 添加技术分析
  if (technicals) {
    parts.push(`\n## 技术分析\n`);
    
    // 技术指标分析
    if (technicals.indicators && technicals.indicators.analysis) {
      const analysis = technicals.indicators.analysis;
      
      // RSI 分析
      if (analysis.RSI) {
        parts.push(`**RSI**：${analysis.RSI.currentValue.toFixed(2)}，${analysis.RSI.description}`);
        
        if (analysis.RSI.signal === "超卖") {
          scores.technical += 1;
        } else if (analysis.RSI.signal === "超买") {
          scores.technical -= 1;
        }
      }
      
      // MACD 分析
      if (analysis.MACD) {
        parts.push(`**MACD**：${analysis.MACD.description}`);
        
        if (analysis.MACD.signal.includes("金叉")) {
          scores.technical += 1;
        } else if (analysis.MACD.signal.includes("死叉")) {
          scores.technical -= 1;
        }
      }
      
      // 布林带分析
      if (analysis.BOLL) {
        parts.push(`**布林带**：${analysis.BOLL.description}`);
        
        if (analysis.BOLL.signal.includes("突破上轨")) {
          scores.technical += 0.5;
        } else if (analysis.BOLL.signal.includes("突破下轨")) {
          scores.technical -= 0.5;
        }
      }
      
      // 综合技术面
      if (analysis["综合分析"]) {
        const signal = analysis["综合分析"].overallSignal;
        parts.push(`\n综合技术指标显示：看涨信号${analysis["综合分析"].bullishSignalsCount}个，看跌信号${analysis["综合分析"].bearishSignalsCount}个，整体信号为"${signal}"`);
        
        if (signal === "看涨") {
          scores.technical += 1;
        } else if (signal === "看跌") {
          scores.technical -= 1;
        }
      }
    }
    
    // 趋势分析
    if (technicals.trend && technicals.trend.trendAnalysis) {
      const trends = technicals.trend.trendAnalysis.trends;
      parts.push(`\n**趋势分析**：`);
      parts.push(`短期趋势：${trends.shortTerm}`);
      parts.push(`中期趋势：${trends.mediumTerm}`);
      parts.push(`长期趋势：${trends.longTerm}`);
      parts.push(`整体趋势：${trends.overall}`);
      
      if (trends.overall === "看涨") {
        scores.technical += 1;
      } else if (trends.overall === "看跌") {
        scores.technical -= 1;
      }
    }
    
    // 支撑阻力位
    if (technicals.trend && technicals.trend.supportResistance) {
      const sr = technicals.trend.supportResistance;
      parts.push(`\n**支撑位和阻力位**：`);
      
      if (sr.support && sr.support.length > 0) {
        parts.push(`主要支撑位：${sr.support.map(s => `$${s.price.toFixed(2)}`).join(', ')}`);
      }
      
      if (sr.resistance && sr.resistance.length > 0) {
        parts.push(`主要阻力位：${sr.resistance.map(r => `$${r.price.toFixed(2)}`).join(', ')}`);
      }
    }
  }
  
  // 添加情绪分析
  if (sentiment) {
    parts.push(`\n## 市场情绪分析\n`);
    
    // 新闻情绪
    if (sentiment.news) {
      const newsAnalysis = sentiment.news.analysis;
      parts.push(`**新闻情绪**：${newsAnalysis.sentimentSummary}`);
      parts.push(`平均情绪分数：${newsAnalysis.averageSentiment.toFixed(2)}`);
      parts.push(`情绪分布：积极${newsAnalysis.sentimentPercentages.positive.toFixed(1)}%，中性${newsAnalysis.sentimentPercentages.neutral.toFixed(1)}%，消极${newsAnalysis.sentimentPercentages.negative.toFixed(1)}%`);
      parts.push(`情绪趋势：${newsAnalysis.sentimentTrend}`);
      
      // 情绪评分
      if (newsAnalysis.averageSentiment > 0.3) {
        scores.sentiment += 1;
      } else if (newsAnalysis.averageSentiment < -0.3) {
        scores.sentiment -= 1;
      }
    }
    
    // 社交媒体情绪
    if (sentiment.social) {
      const socialAnalysis = sentiment.social.analysis;
      parts.push(`\n**社交媒体情绪**：`);
      parts.push(`总体情绪：${socialAnalysis.overallSentiment.toFixed(2)}`);
      parts.push(`趋势：${socialAnalysis.trendAnalysis}`);
      parts.push(`热门话题：${socialAnalysis.topMentions.map(m => m.tag).join(', ')}`);
      
      // 情绪评分
      if (socialAnalysis.overallSentiment > 0.3) {
        scores.sentiment += 1;
      } else if (socialAnalysis.overallSentiment < -0.3) {
        scores.sentiment -= 1;
      }
    }
  }
  
  // 生成投资建议
  const totalScore = scores.price + scores.fundamental + scores.technical + scores.sentiment;
  let recommendation = '';
  
  if (totalScore >= 4) {
    recommendation = "强烈推荐买入";
  } else if (totalScore >= 2) {
    recommendation = "建议买入";
  } else if (totalScore >= 0) {
    recommendation = "持有";
  } else if (totalScore >= -2) {
    recommendation = "建议卖出";
  } else {
    recommendation = "强烈建议卖出";
  }
  
  // 添加投资建议
  parts.push(`\n## 投资建议\n`);
  parts.push(`基于对${ticker}价格、基本面、技术面和市场情绪的综合分析，我的投资建议是：**${recommendation}**`);
  
  // 解释得分
  parts.push(`\n**分析评分**：`);
  parts.push(`- 价格趋势评分：${scores.price}`);
  parts.push(`- 基本面评分：${scores.fundamental}`);
  parts.push(`- 技术面评分：${scores.technical}`);
  parts.push(`- 市场情绪评分：${scores.sentiment}`);
  parts.push(`- 总评分：${totalScore}`);
  
  // 风险提示
  parts.push(`\n**风险提示**：以上分析基于历史数据和当前市场情况，投资有风险，实际市场变化可能与预期不符。请根据自身风险承受能力和投资目标做出决策。`);
  
  return {
    report: parts.join('\n'),
    recommendation
  };
}

// 导出用于客户端的函数
export async function analyzeStock(ticker: string, startDate: string, endDate: string) {
  const agent = createAnalysisAgent();
  
  try {
    // 启动代理并执行分析
    const result = await agent.events.analysis({
      ticker,
      startDate,
      endDate
    });
    
    return result;
  } catch (error) {
    console.error('分析股票时出错:', error);
    throw new Error(`分析${ticker}失败: ${error.message}`);
  }
} 