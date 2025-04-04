'use server'

import { createLogger } from '@/lib/logger.server';
import { 
  valueInvestingAgent, 
  growthInvestingAgent, 
  trendInvestingAgent, 
  quantInvestingAgent 
} from '@/mastra/agents';
import type { NewsItem, PriceData, FinancialData } from '@/services/marketDataService';
import { MarketDataService } from '@/services/marketDataService';

const logger = createLogger('runAIAgentAnalysis');
const marketDataService = new MarketDataService();

// 初始化市场数据服务
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await marketDataService.initialize();
    isInitialized = true;
  }
}

/**
 * 代理分析结果接口
 */
export interface AgentAnalysisResult {
  ticker: string;
  date: string;
  agentType: 'value' | 'growth' | 'trend' | 'quant';
  signal: 'buy' | 'sell' | 'hold';
  confidence: number; // 0-100
  analysisContent: string;
  reasoning: string;
}

/**
 * 获取代理类型的中文名称
 */
function getAgentTypeName(type: string): string {
  switch (type) {
    case 'value': return '价值投资代理';
    case 'growth': return '成长投资代理';
    case 'trend': return '趋势投资代理';
    case 'quant': return '量化投资代理';
    default: return '投资代理';
  }
}

/**
 * 运行价值投资代理分析
 */
export async function runValueAgent(ticker: string): Promise<AgentAnalysisResult> {
  try {
    logger.info('开始价值投资代理分析', { ticker });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 获取财务数据
    const financialData = await marketDataService.fetchFinancialData(ticker);
    
    // 获取新闻数据
    const newsData = await marketDataService.fetchNewsData(ticker, 30);
    
    // 构建提示
    const financialMetrics = formatFinancialData(financialData);
    const recentNews = formatNewsData(newsData);
    
    const prompt = `请分析以下公司的投资价值:
股票代码: ${ticker}

财务数据:
${financialMetrics}

近期相关新闻:
${recentNews}

请从价值投资的角度分析该股票，重点关注以下方面:
1. 公司的估值水平 (P/E, P/B 等)
2. 财务健康状况和稳定性
3. 股息收益和回报
4. 竞争优势和护城河
5. 现金流状况

基于你的分析，给出明确的投资建议: 买入、持有或卖出，并说明理由。
`;
    
    // 运行代理分析
    const response = await valueInvestingAgent.run({
      messages: [{ role: 'user', content: prompt }]
    });
    
    // 解析结果
    const result = parseAgentResponse(response.content, 'value', ticker);
    
    logger.info('价值投资代理分析完成', { ticker, signal: result.signal, confidence: result.confidence });
    return result;
    
  } catch (error) {
    logger.error('价值投资代理分析失败', { ticker, error });
    throw error;
  }
}

/**
 * 运行成长投资代理分析
 */
export async function runGrowthAgent(ticker: string): Promise<AgentAnalysisResult> {
  try {
    logger.info('开始成长投资代理分析', { ticker });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 获取财务数据
    const financialData = await marketDataService.fetchFinancialData(ticker);
    
    // 获取股价数据
    const priceData = await marketDataService.fetchStockPriceHistory(ticker, '1y');
    
    // 获取新闻数据
    const newsData = await marketDataService.fetchNewsData(ticker, 30);
    
    // 构建提示
    const financialMetrics = formatFinancialData(financialData);
    const recentNews = formatNewsData(newsData);
    const growthMetrics = extractGrowthMetrics(financialData, priceData);
    
    const prompt = `请分析以下公司的成长性:
股票代码: ${ticker}

财务数据:
${financialMetrics}

成长指标:
${growthMetrics}

近期相关新闻:
${recentNews}

请从成长投资的角度分析该股票，重点关注以下方面:
1. 营收和盈利增长率
2. 市场扩张和新产品/服务潜力
3. 行业趋势和公司的市场地位
4. 管理团队的执行能力
5. 潜在的创新和颠覆性机会

基于你的分析，给出明确的投资建议: 买入、持有或卖出，并说明理由。
`;
    
    // 运行代理分析
    const response = await growthInvestingAgent.run({
      messages: [{ role: 'user', content: prompt }]
    });
    
    // 解析结果
    const result = parseAgentResponse(response.content, 'growth', ticker);
    
    logger.info('成长投资代理分析完成', { ticker, signal: result.signal, confidence: result.confidence });
    return result;
    
  } catch (error) {
    logger.error('成长投资代理分析失败', { ticker, error });
    throw error;
  }
}

/**
 * 运行趋势投资代理分析
 */
export async function runTrendAgent(ticker: string): Promise<AgentAnalysisResult> {
  try {
    logger.info('开始趋势投资代理分析', { ticker });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 获取股价数据
    const priceData = await marketDataService.fetchStockPriceHistory(ticker, '1y');
    
    // 构建提示
    const technicalIndicators = extractTechnicalIndicators(priceData);
    
    const prompt = `请分析以下股票的技术形态和趋势:
股票代码: ${ticker}

技术指标:
${technicalIndicators}

请从技术分析和趋势投资的角度分析该股票，重点关注以下方面:
1. 价格趋势和动量
2. 支撑位和阻力位
3. 移动平均线交叉和价格相对于移动平均线的位置
4. RSI和MACD等指标信号
5. 成交量变化和确认信号

基于你的分析，给出明确的投资建议: 买入、持有或卖出，并说明理由。
`;
    
    // 运行代理分析
    const response = await trendInvestingAgent.run({
      messages: [{ role: 'user', content: prompt }]
    });
    
    // 解析结果
    const result = parseAgentResponse(response.content, 'trend', ticker);
    
    logger.info('趋势投资代理分析完成', { ticker, signal: result.signal, confidence: result.confidence });
    return result;
    
  } catch (error) {
    logger.error('趋势投资代理分析失败', { ticker, error });
    throw error;
  }
}

/**
 * 运行量化投资代理分析
 */
export async function runQuantAgent(ticker: string): Promise<AgentAnalysisResult> {
  try {
    logger.info('开始量化投资代理分析', { ticker });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 获取财务数据
    const financialData = await marketDataService.fetchFinancialData(ticker);
    
    // 获取股价数据
    const priceData = await marketDataService.fetchStockPriceHistory(ticker, '1y');
    
    // 获取新闻数据
    const newsData = await marketDataService.fetchNewsData(ticker, 30);
    
    // 构建提示
    const financialMetrics = formatFinancialData(financialData);
    const technicalIndicators = extractTechnicalIndicators(priceData);
    const sentimentAnalysis = analyzeSentiment(newsData);
    
    const prompt = `请进行量化分析以评估以下股票:
股票代码: ${ticker}

财务数据:
${financialMetrics}

技术指标:
${technicalIndicators}

情绪分析:
${sentimentAnalysis}

请从量化投资的角度综合分析该股票，重点关注以下方面:
1. 财务因子 (估值、质量、盈利能力)
2. 技术因子 (趋势、动量、波动性)
3. 情绪因子 (新闻情绪、异常交易量)
4. 多因子综合评分
5. 风险调整后的预期回报

基于你的量化模型和分析，给出明确的投资建议: 买入、持有或卖出，并说明理由。
`;
    
    // 运行代理分析
    const response = await quantInvestingAgent.run({
      messages: [{ role: 'user', content: prompt }]
    });
    
    // 解析结果
    const result = parseAgentResponse(response.content, 'quant', ticker);
    
    logger.info('量化投资代理分析完成', { ticker, signal: result.signal, confidence: result.confidence });
    return result;
    
  } catch (error) {
    logger.error('量化投资代理分析失败', { ticker, error });
    throw error;
  }
}

/**
 * 运行所有投资代理
 */
export async function runAllAgents(ticker: string): Promise<{
  results: AgentAnalysisResult[];
  consensus: {
    signal: 'buy' | 'sell' | 'hold';
    confidence: number;
    explanation: string;
  }
}> {
  try {
    logger.info('开始运行所有投资代理分析', { ticker });
    
    // 并行运行所有代理
    const [valueResult, growthResult, trendResult, quantResult] = await Promise.all([
      runValueAgent(ticker),
      runGrowthAgent(ticker),
      runTrendAgent(ticker),
      runQuantAgent(ticker)
    ]);
    
    const results = [valueResult, growthResult, trendResult, quantResult];
    
    // 确定共识信号
    const consensus = determineConsensusSignal(results);
    
    logger.info('所有投资代理分析完成', { 
      ticker, 
      consensus: consensus.signal, 
      confidence: consensus.confidence 
    });
    
    return { results, consensus };
    
  } catch (error) {
    logger.error('运行所有投资代理分析失败', { ticker, error });
    throw error;
  }
}

/**
 * 格式化财务数据
 */
function formatFinancialData(data: FinancialData): string {
  return `- 收入: ${formatCurrency(data.revenue)}
- 净利润: ${formatCurrency(data.netIncome)}
- 每股收益(EPS): $${data.eps}
- 市盈率(P/E): ${data.pe}
- 市净率(P/B): ${data.pbv}
- 股本回报率(ROE): ${(data.roe * 100).toFixed(2)}%
- 股息收益率: ${(data.dividendYield * 100).toFixed(2)}%
- 负债权益比: ${data.debtToEquity.toFixed(2)}
- 流动比率: ${data.currentRatio.toFixed(2)}
- 速动比率: ${data.quickRatio.toFixed(2)}
- 自由现金流: ${formatCurrency(data.freeCashFlow)}
- 利润率: ${(data.profitMargin * 100).toFixed(2)}%
- 收入增长率: ${(data.revenueGrowth * 100).toFixed(2)}%
- EPS增长率: ${(data.epsGrowth * 100).toFixed(2)}%`;
}

/**
 * 格式化货币
 */
function formatCurrency(amount: number): string {
  if (amount >= 1e12) {
    return `$${(amount / 1e12).toFixed(2)}万亿`;
  } else if (amount >= 1e9) {
    return `$${(amount / 1e9).toFixed(2)}十亿`;
  } else if (amount >= 1e6) {
    return `$${(amount / 1e6).toFixed(2)}百万`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * 提取增长指标
 */
function extractGrowthMetrics(financialData: FinancialData, priceData: PriceData[]): string {
  // 计算一年内股价增长
  const firstPrice = priceData[0]?.close || 0;
  const lastPrice = priceData[priceData.length - 1]?.close || 0;
  const priceGrowth = firstPrice > 0 ? (lastPrice - firstPrice) / firstPrice : 0;
  
  return `- 收入增长率(同比): ${(financialData.revenueGrowth * 100).toFixed(2)}%
- EPS增长率(同比): ${(financialData.epsGrowth * 100).toFixed(2)}%
- 股价增长率(1年): ${(priceGrowth * 100).toFixed(2)}%
- 利润率: ${(financialData.profitMargin * 100).toFixed(2)}%
- PEG比率: ${(financialData.pe / (financialData.epsGrowth * 100)).toFixed(2)}`;
}

/**
 * 提取技术指标
 */
function extractTechnicalIndicators(priceData: PriceData[]): string {
  // 获取最新的价格数据
  const recent = priceData.slice(-20);
  const latest = recent[recent.length - 1] || { close: 0, ma20: 0, ma60: 0, rsi: 0, macd: 0 };
  const prev = recent[recent.length - 2] || { close: 0, ma20: 0, ma60: 0, rsi: 0, macd: 0 };
  
  // 计算20日波动率
  const returns = recent.slice(1).map((day, i) => 
    day.close > 0 && recent[i].close > 0 ? (day.close - recent[i].close) / recent[i].close : 0
  );
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // 年化波动率
  
  // 计算交易量变化
  const avgVolume = recent.reduce((sum, day) => sum + day.volume, 0) / recent.length;
  const volumeChange = latest.volume > 0 ? (latest.volume - avgVolume) / avgVolume * 100 : 0;
  
  return `- 当前价格: $${latest.close.toFixed(2)}
- 20日移动平均线: $${latest.ma20?.toFixed(2) || 'N/A'} (价格${latest.close > (latest.ma20 || 0) ? '高于' : '低于'}MA20)
- 60日移动平均线: $${latest.ma60?.toFixed(2) || 'N/A'} (价格${latest.close > (latest.ma60 || 0) ? '高于' : '低于'}MA60)
- MA20与MA60: ${(latest.ma20 || 0) > (latest.ma60 || 0) ? 'MA20高于MA60(金叉形态)' : 'MA20低于MA60(死叉形态)'}
- RSI(14日): ${latest.rsi?.toFixed(2) || 'N/A'} (${(latest.rsi || 0) > 70 ? '超买' : (latest.rsi || 0) < 30 ? '超卖' : '中性'})
- MACD: ${latest.macd?.toFixed(2) || 'N/A'} (${(latest.macd || 0) > (prev.macd || 0) ? '上升' : '下降'})
- 20日波动率: ${volatility.toFixed(2)}%
- 成交量变化: ${volumeChange.toFixed(2)}% (相对于20日均量)`;
}

/**
 * 分析新闻情绪
 */
function analyzeSentiment(newsData: NewsItem[]): string {
  // 统计情绪
  const sentiments = {
    positive: 0,
    negative: 0,
    neutral: 0
  };
  
  newsData.forEach(news => {
    sentiments[news.sentiment]++;
  });
  
  const total = newsData.length;
  const positiveRatio = total > 0 ? sentiments.positive / total * 100 : 0;
  const negativeRatio = total > 0 ? sentiments.negative / total * 100 : 0;
  const neutralRatio = total > 0 ? sentiments.neutral / total * 100 : 0;
  
  // 确定整体情绪
  let overallSentiment = 'neutral';
  if (positiveRatio >= 60) overallSentiment = 'strongly positive';
  else if (positiveRatio >= 50) overallSentiment = 'positive';
  else if (negativeRatio >= 60) overallSentiment = 'strongly negative';
  else if (negativeRatio >= 50) overallSentiment = 'negative';
  
  return `- 积极新闻比例: ${positiveRatio.toFixed(2)}% (${sentiments.positive}条)
- 消极新闻比例: ${negativeRatio.toFixed(2)}% (${sentiments.negative}条)
- 中性新闻比例: ${neutralRatio.toFixed(2)}% (${sentiments.neutral}条)
- 总新闻数量: ${total}条
- 整体情绪评估: ${overallSentiment}
- 最新新闻标题: ${newsData[0]?.title || 'N/A'}`;
}

/**
 * 格式化新闻数据
 */
function formatNewsData(newsData: NewsItem[]): string {
  return newsData.slice(0, 5).map((news, index) => {
    return `${index + 1}. ${news.title} (${news.date}, ${news.source}) - ${news.sentiment}`;
  }).join('\n');
}

/**
 * 解析代理响应
 */
function parseAgentResponse(content: string, agentType: 'value' | 'growth' | 'trend' | 'quant', ticker: string): AgentAnalysisResult {
  // 默认值
  let signal: 'buy' | 'sell' | 'hold' = 'hold';
  let confidence = 50;
  let reasoning = '';
  
  // 尝试从内容中提取信号和置信度
  try {
    // 查找买入/卖出/持有的建议
    const buyMatch = content.match(/买入|购买|建议购入|强烈推荐|看涨|增持/i);
    const sellMatch = content.match(/卖出|售出|减持|清仓|建议出售|看跌/i);
    const holdMatch = content.match(/持有|观望|中性|保持现状|不建议操作/i);
    
    if (buyMatch) {
      signal = 'buy';
      
      // 尝试提取置信度
      const strongMatch = content.match(/强烈|非常|极为|高度|坚定/i);
      const weakMatch = content.match(/略微|稍微|小幅|轻微|谨慎/i);
      
      if (strongMatch) {
        confidence = 90;
      } else if (weakMatch) {
        confidence = 60;
      } else {
        confidence = 75;
      }
    } else if (sellMatch) {
      signal = 'sell';
      
      // 尝试提取置信度
      const strongMatch = content.match(/强烈|立即|紧急|必须|坚决/i);
      const weakMatch = content.match(/考虑|适当|部分|逐步|谨慎/i);
      
      if (strongMatch) {
        confidence = 90;
      } else if (weakMatch) {
        confidence = 60;
      } else {
        confidence = 75;
      }
    } else if (holdMatch) {
      signal = 'hold';
      confidence = 50;
    }
    
    // 尝试提取推荐理由
    const reasoningMatch = content.match(/理由[：:]([\s\S]+?)(?=\n\n|\n$|$)/i);
    if (reasoningMatch && reasoningMatch[1]) {
      reasoning = reasoningMatch[1].trim();
    } else {
      // 如果找不到明确的理由部分，取内容的后半部分
      reasoning = content.substring(Math.floor(content.length / 2)).trim();
    }
    
  } catch (error) {
    logger.error('解析代理响应失败', { error });
  }
  
  return {
    ticker,
    date: new Date().toISOString(),
    agentType,
    signal,
    confidence,
    analysisContent: content,
    reasoning: reasoning || content
  };
}

/**
 * 确定共识信号
 */
function determineConsensusSignal(results: AgentAnalysisResult[]): {
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  explanation: string;
} {
  // 统计各种信号
  const signalCounts = {
    buy: 0,
    sell: 0,
    hold: 0
  };
  
  // 累计置信度
  const confidenceSum = {
    buy: 0,
    sell: 0,
    hold: 0
  };
  
  // 统计各种信号的数量和置信度
  results.forEach(result => {
    signalCounts[result.signal]++;
    confidenceSum[result.signal] += result.confidence;
  });
  
  // 计算加权得分
  let buyScore = signalCounts.buy > 0 ? confidenceSum.buy / signalCounts.buy * signalCounts.buy : 0;
  let sellScore = signalCounts.sell > 0 ? confidenceSum.sell / signalCounts.sell * signalCounts.sell : 0;
  let holdScore = signalCounts.hold > 0 ? confidenceSum.hold / signalCounts.hold * signalCounts.hold : 0;
  
  // 确定最终信号
  let signal: 'buy' | 'sell' | 'hold';
  let confidence: number;
  
  if (buyScore > sellScore && buyScore > holdScore) {
    signal = 'buy';
    confidence = Math.min(100, Math.round((buyScore / (buyScore + sellScore + holdScore)) * 100));
  } else if (sellScore > buyScore && sellScore > holdScore) {
    signal = 'sell';
    confidence = Math.min(100, Math.round((sellScore / (buyScore + sellScore + holdScore)) * 100));
  } else {
    signal = 'hold';
    confidence = Math.min(100, Math.round((holdScore / (buyScore + sellScore + holdScore)) * 100));
  }
  
  // 生成解释
  const explanation = generateConsensusExplanation(results, signal, confidence);
  
  return {
    signal,
    confidence,
    explanation
  };
}

/**
 * 生成共识解释
 */
function generateConsensusExplanation(results: AgentAnalysisResult[], signal: 'buy' | 'sell' | 'hold', confidence: number): string {
  const signalCounts = {
    buy: results.filter(r => r.signal === 'buy').length,
    sell: results.filter(r => r.signal === 'sell').length,
    hold: results.filter(r => r.signal === 'hold').length
  };
  
  let explanation = `${signalCounts.buy}个代理建议买入，${signalCounts.sell}个代理建议卖出，${signalCounts.hold}个代理建议持有。\n\n`;
  
  // 添加具体代理的建议
  results.forEach(result => {
    const agentName = getAgentTypeName(result.agentType);
    explanation += `${agentName}: ${result.signal === 'buy' ? '买入' : result.signal === 'sell' ? '卖出' : '持有'} (置信度: ${result.confidence}%)\n`;
    explanation += `理由: ${result.reasoning.substring(0, 100)}${result.reasoning.length > 100 ? '...' : ''}\n\n`;
  });
  
  // 解释最终决策
  explanation += `综合考虑各代理的分析结果，最终建议: `;
  
  if (signal === 'buy') {
    explanation += `买入 (置信度: ${confidence}%)`;
  } else if (signal === 'sell') {
    explanation += `卖出 (置信度: ${confidence}%)`;
  } else {
    explanation += `持有 (置信度: ${confidence}%)`;
  }
  
  return explanation;
}

export default runAllAgents; 