import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('stockPriceTool');

/**
 * 股票价格工具
 * 
 * 获取股票价格数据，包括历史价格、当前价格、交易量和技术指标等
 */
export const stockPriceTool = createTool({
  name: 'stockPriceTool',
  description: '获取股票价格数据和基本技术指标',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    period: z.enum(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max']).default('1y').describe('时间周期'),
    interval: z.enum(['1d', '1wk', '1mo']).default('1d').describe('时间间隔')
  }),
  execute: async ({ ticker, period, interval }: { ticker: string; period: string; interval: string }) => {
    logger.info('获取股票价格数据', { ticker, period, interval });
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成股票价格数据
      const priceData = generatePriceData(ticker, period);
      
      // 计算技术指标
      const technicalIndicators = calculateTechnicalIndicators(priceData);
      
      // 生成价格趋势分析
      const trendAnalysis = analyzePriceTrend(priceData, technicalIndicators);
      
      return {
        ticker,
        timestamp: new Date().toISOString(),
        currentPrice: priceData.currentPrice,
        priceChange: priceData.priceChange,
        percentChange: priceData.percentChange,
        volume: priceData.volume,
        avgVolume: priceData.avgVolume,
        high52Week: priceData.high52Week,
        low52Week: priceData.low52Week,
        priceData: priceData.historicalPrices.slice(0, 30), // 返回最近30个数据点
        technicalIndicators,
        trendAnalysis
      };
    } catch (error: any) {
      logger.error('获取股票价格数据失败', { ticker, error });
      throw new Error(`获取股票价格数据失败: ${error.message}`);
    }
  }
});

/**
 * 生成模拟股票价格数据
 */
function generatePriceData(ticker: string, period: string): {
  currentPrice: number;
  priceChange: number;
  percentChange: number;
  volume: number;
  avgVolume: number;
  high52Week: number;
  low52Week: number;
  historicalPrices: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
} {
  // 为不同股票设置不同的基础价格
  let basePrice: number;
  let volatility: number;
  let trend: number; // -1.0 到 1.0, 负数表示下跌趋势，正数表示上涨趋势
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      basePrice = 175;
      volatility = 0.015;
      trend = 0.3;
      break;
    case 'MSFT':
      basePrice = 340;
      volatility = 0.012;
      trend = 0.4;
      break;
    case 'GOOGL':
      basePrice = 138;
      volatility = 0.018;
      trend = 0.25;
      break;
    case 'AMZN':
      basePrice = 145;
      volatility = 0.022;
      trend = 0.35;
      break;
    case 'META':
      basePrice = 320;
      volatility = 0.025;
      trend = 0.4;
      break;
    case 'TSLA':
      basePrice = 215;
      volatility = 0.035;
      trend = 0.15;
      break;
    case 'NVDA':
      basePrice = 800;
      volatility = 0.028;
      trend = 0.5;
      break;
    default:
      basePrice = 100 + Math.random() * 200;
      volatility = 0.01 + Math.random() * 0.03;
      trend = -0.5 + Math.random() * 1;
  }
  
  // 确定数据点数量
  let dataPoints = 30;
  if (period === '5d') dataPoints = 5;
  else if (period === '1mo') dataPoints = 22;
  else if (period === '3mo') dataPoints = 66;
  else if (period === '6mo') dataPoints = 126;
  else if (period === '1y') dataPoints = 252;
  else if (period === '2y') dataPoints = 504;
  else if (period === '5y') dataPoints = 1260;
  else if (period === 'max') dataPoints = 2520;
  
  // 生成历史价格
  const historicalPrices = [];
  let currentPrice = basePrice;
  
  for (let i = dataPoints; i > 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dailyChange = (Math.random() - 0.5 + trend * 0.1) * volatility * currentPrice;
    const open = currentPrice;
    const close = open + dailyChange;
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.5;
    const volume = Math.round(1000000 + Math.random() * 9000000);
    
    historicalPrices.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
    
    currentPrice = close; // 为下一天设置起始价
  }
  
  // 计算当前价格、变化和量
  const latestPrice = historicalPrices[historicalPrices.length - 1].close;
  const previousPrice = historicalPrices[historicalPrices.length - 2].close;
  const priceChange = latestPrice - previousPrice;
  const percentChange = (priceChange / previousPrice) * 100;
  
  // 计算52周高低点
  const sortedPrices = [...historicalPrices].sort((a, b) => a.close - b.close);
  const low52Week = sortedPrices[0].close;
  const high52Week = sortedPrices[sortedPrices.length - 1].close;
  
  // 计算平均成交量
  const totalVolume = historicalPrices.reduce((sum, data) => sum + data.volume, 0);
  const avgVolume = Math.round(totalVolume / historicalPrices.length);
  
  return {
    currentPrice: latestPrice,
    priceChange,
    percentChange,
    volume: historicalPrices[historicalPrices.length - 1].volume,
    avgVolume,
    high52Week,
    low52Week,
    historicalPrices
  };
}

/**
 * 计算技术指标
 */
function calculateTechnicalIndicators(priceData: {
  historicalPrices: Array<{
    close: number;
    volume: number;
  }>;
}): {
  sma20: number;
  sma50: number;
  sma200: number;
  ema20: number;
  rsi14: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
} {
  const prices = priceData.historicalPrices.map(p => p.close);
  
  // 计算简单移动平均线
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);
  
  // 计算指数移动平均线
  const ema20 = calculateEMA(prices, 20);
  
  // 计算RSI
  const rsi14 = calculateRSI(prices, 14);
  
  // 计算MACD
  const macd = calculateMACD(prices);
  
  // 计算布林带
  const bollingerBands = calculateBollingerBands(prices, 20);
  
  return {
    sma20,
    sma50,
    sma200,
    ema20,
    rsi14,
    macd,
    bollingerBands
  };
}

/**
 * 计算简单移动平均线
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }
  
  const relevantPrices = prices.slice(prices.length - period);
  return relevantPrices.reduce((sum, price) => sum + price, 0) / period;
}

/**
 * 计算指数移动平均线
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return calculateSMA(prices, prices.length);
  }
  
  const k = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

/**
 * 计算相对强弱指数 (RSI)
 */
function calculateRSI(prices: number[], period: number): number {
  if (prices.length <= period) {
    return 50; // 默认值
  }
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period - 1; i < prices.length - 1; i++) {
    const difference = prices[i + 1] - prices[i];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }
  
  if (losses === 0) {
    return 100;
  }
  
  const relativeStrength = gains / losses;
  return 100 - (100 / (1 + relativeStrength));
}

/**
 * 计算MACD
 */
function calculateMACD(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  
  // 为了简化，我们不会计算完整的信号线，而是估计一个值
  const signal = macd * 0.8 + (Math.random() * 0.4 - 0.2); // 添加一些随机波动
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

/**
 * 计算布林带
 */
function calculateBollingerBands(prices: number[], period: number): {
  upper: number;
  middle: number;
  lower: number;
} {
  const middle = calculateSMA(prices, period);
  
  let sum = 0;
  const relevantPrices = prices.slice(Math.max(0, prices.length - period));
  
  for (const price of relevantPrices) {
    sum += Math.pow(price - middle, 2);
  }
  
  const standardDeviation = Math.sqrt(sum / relevantPrices.length);
  const upper = middle + standardDeviation * 2;
  const lower = middle - standardDeviation * 2;
  
  return { upper, middle, lower };
}

/**
 * 分析价格趋势
 */
function analyzePriceTrend(
  priceData: {
    currentPrice: number;
    historicalPrices: Array<{
      close: number;
    }>;
  },
  technicalIndicators: {
    sma20: number;
    sma50: number;
    sma200: number;
    rsi14: number;
    macd: {
      macd: number;
      signal: number;
      histogram: number;
    };
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
    };
  }
): {
  trend: 'strongly_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strongly_bearish';
  strength: number; // 0-100
  support: number;
  resistance: number;
  signals: Array<{
    indicator: string;
    signal: 'buy' | 'sell' | 'neutral';
    description: string;
  }>;
} {
  const currentPrice = priceData.currentPrice;
  const historicalPrices = priceData.historicalPrices.map(p => p.close);
  const sma20 = technicalIndicators.sma20;
  const sma50 = technicalIndicators.sma50;
  const sma200 = technicalIndicators.sma200;
  const rsi = technicalIndicators.rsi14;
  const macd = technicalIndicators.macd;
  const bollingerBands = technicalIndicators.bollingerBands;
  
  // 计算支撑位和阻力位（简化模型）
  const sortedPrices = [...historicalPrices].sort((a, b) => a - b);
  const firstQuartile = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
  const thirdQuartile = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
  
  let support = firstQuartile * 0.98;
  let resistance = thirdQuartile * 1.02;
  
  // 如果当前价格接近历史低点，调整支撑位
  if (currentPrice < firstQuartile * 1.05) {
    support = sortedPrices[0] * 0.95;
  }
  
  // 如果当前价格接近历史高点，调整阻力位
  if (currentPrice > thirdQuartile * 0.95) {
    resistance = sortedPrices[sortedPrices.length - 1] * 1.05;
  }
  
  // 基于技术指标生成信号
  const signals = [];
  
  // 移动平均线信号
  if (currentPrice > sma20 && sma20 > sma50) {
    signals.push({
      indicator: 'MA交叉',
      signal: 'buy',
      description: '价格位于20日均线之上且20日均线位于50日均线之上，表明上升趋势'
    });
  } else if (currentPrice < sma20 && sma20 < sma50) {
    signals.push({
      indicator: 'MA交叉',
      signal: 'sell',
      description: '价格位于20日均线之下且20日均线位于50日均线之下，表明下降趋势'
    });
  } else {
    signals.push({
      indicator: 'MA交叉',
      signal: 'neutral',
      description: '移动平均线未显示明确趋势'
    });
  }
  
  // RSI信号
  if (rsi > 70) {
    signals.push({
      indicator: 'RSI',
      signal: 'sell',
      description: `RSI(${rsi.toFixed(2)})处于超买区域，可能即将回落`
    });
  } else if (rsi < 30) {
    signals.push({
      indicator: 'RSI',
      signal: 'buy',
      description: `RSI(${rsi.toFixed(2)})处于超卖区域，可能即将反弹`
    });
  } else {
    signals.push({
      indicator: 'RSI',
      signal: 'neutral',
      description: `RSI(${rsi.toFixed(2)})处于中性区域`
    });
  }
  
  // MACD信号
  if (macd.macd > macd.signal && macd.histogram > 0) {
    signals.push({
      indicator: 'MACD',
      signal: 'buy',
      description: 'MACD线位于信号线之上且柱状图为正，表明上升动能'
    });
  } else if (macd.macd < macd.signal && macd.histogram < 0) {
    signals.push({
      indicator: 'MACD',
      signal: 'sell',
      description: 'MACD线位于信号线之下且柱状图为负，表明下降动能'
    });
  } else {
    signals.push({
      indicator: 'MACD',
      signal: 'neutral',
      description: 'MACD未显示明确信号'
    });
  }
  
  // 布林带信号
  if (currentPrice > bollingerBands.upper) {
    signals.push({
      indicator: '布林带',
      signal: 'sell',
      description: '价格突破上轨，可能超买'
    });
  } else if (currentPrice < bollingerBands.lower) {
    signals.push({
      indicator: '布林带',
      signal: 'buy',
      description: '价格突破下轨，可能超卖'
    });
  } else if (currentPrice > bollingerBands.middle) {
    signals.push({
      indicator: '布林带',
      signal: 'neutral',
      description: '价格位于中轨和上轨之间，偏向强势'
    });
  } else {
    signals.push({
      indicator: '布林带',
      signal: 'neutral',
      description: '价格位于中轨和下轨之间，偏向弱势'
    });
  }
  
  // 黄金交叉/死亡交叉
  if (sma50 > sma200 && sma50 - sma200 < sma50 * 0.02) {
    signals.push({
      indicator: '黄金交叉',
      signal: 'buy',
      description: '50日均线刚刚上穿200日均线，形成黄金交叉，看涨信号'
    });
  } else if (sma50 < sma200 && sma200 - sma50 < sma200 * 0.02) {
    signals.push({
      indicator: '死亡交叉',
      signal: 'sell',
      description: '50日均线刚刚下穿200日均线，形成死亡交叉，看跌信号'
    });
  }
  
  // 总结趋势
  let buySignals = 0;
  let sellSignals = 0;
  let neutralSignals = 0;
  
  for (const signal of signals) {
    if (signal.signal === 'buy') buySignals++;
    else if (signal.signal === 'sell') sellSignals++;
    else neutralSignals++;
  }
  
  let trend: 'strongly_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strongly_bearish';
  let strength = 0;
  
  if (buySignals >= 4) {
    trend = 'strongly_bullish';
    strength = 80 + Math.random() * 20;
  } else if (buySignals >= 2 && buySignals > sellSignals) {
    trend = 'bullish';
    strength = 60 + Math.random() * 20;
  } else if (sellSignals >= 4) {
    trend = 'strongly_bearish';
    strength = 80 + Math.random() * 20;
  } else if (sellSignals >= 2 && sellSignals > buySignals) {
    trend = 'bearish';
    strength = 60 + Math.random() * 20;
  } else {
    trend = 'neutral';
    strength = 40 + Math.random() * 20;
  }
  
  return {
    trend,
    strength,
    support,
    resistance,
    signals
  };
} 