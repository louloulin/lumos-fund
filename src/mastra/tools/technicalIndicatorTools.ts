import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * 技术指标工具 - 计算股票的技术分析指标
 */
export const technicalIndicatorsTool = createTool({
  id: 'technicalIndicatorsTool',
  description: '计算股票的技术分析指标，如RSI、MACD、布林带等',
  inputSchema: z.object({
    ticker: z.string().describe('股票代码'),
    indicators: z.array(z.string()).describe('要计算的指标列表'),
    period: z.number().optional().describe('计算周期（默认为14天）'),
    days: z.number().optional().describe('获取多少天的历史数据（默认为60天）')
  }),
  execute: async ({ ticker, indicators, period = 14, days = 60 }) => {
    console.log(`计算股票 ${ticker} 的技术指标`, { indicators, period, days });

    try {
      // 获取历史价格数据（实际项目中应该调用真实API）
      const response = await fetch(
        `https://lumosfund-api.vercel.app/api/historical-data?ticker=${ticker}&days=${days}`
      );

      if (!response.ok) {
        return {
          ticker,
          success: false,
          error: `获取历史数据失败: ${response.status}`
        };
      }

      const data = await response.json();
      const prices = data.historicalPrices || [];

      // 确保有足够的价格数据
      if (prices.length < period) {
        return {
          ticker,
          success: false,
          error: `历史数据不足，至少需要 ${period} 天的数据`
        };
      }

      // 计算各种技术指标
      const calculatedIndicators: Record<string, any> = {};

      // 处理每个请求的指标
      for (const indicator of indicators) {
        switch (indicator.toLowerCase()) {
          case 'rsi':
            calculatedIndicators.rsi = calculateRSI(prices, period);
            break;
          case 'macd':
            calculatedIndicators.macd = calculateMACD(prices);
            break;
          case 'bollinger':
            calculatedIndicators.bollinger = calculateBollingerBands(prices, period);
            break;
          case 'sma':
            calculatedIndicators.sma = calculateSMA(prices, period);
            break;
          case 'ema':
            calculatedIndicators.ema = calculateEMA(prices, period);
            break;
          case 'atr':
            calculatedIndicators.atr = calculateATR(prices, period);
            break;
          case 'obv':
            calculatedIndicators.obv = calculateOBV(prices);
            break;
          default:
            console.warn(`未知指标: ${indicator}`);
        }
      }

      return {
        ticker,
        period,
        indicators: calculatedIndicators,
        lastPrice: prices[0]?.close || null,
        success: true
      };
    } catch (error) {
      console.error(`计算股票 ${ticker} 的技术指标时出错:`, error);
      return {
        ticker,
        success: false,
        error: `计算技术指标失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
});

/**
 * 计算相对强弱指标 (RSI)
 */
function calculateRSI(prices: any[], period: number): any {
  // 实际项目中应使用更精确的计算
  const closes = prices.map(p => parseFloat(p.close));
  
  let gains = 0;
  let losses = 0;
  
  // 计算初始平均收益和损失
  for (let i = 1; i < period + 1; i++) {
    const change = closes[i - 1] - closes[i];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // 计算RSI
  const rsiValues = [];
  for (let i = period; i < closes.length; i++) {
    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
    
    // 更新平均收益和损失
    const change = closes[i - period] - closes[i - period + 1];
    if (i < prices.length - 1) {
      avgGain = ((avgGain * (period - 1)) + (change >= 0 ? change : 0)) / period;
      avgLoss = ((avgLoss * (period - 1)) + (change < 0 ? -change : 0)) / period;
    }
  }
  
  const currentRSI = rsiValues.length > 0 ? rsiValues[0] : 50;
  
  return {
    current: currentRSI,
    values: rsiValues.slice(0, 10), // 只返回最近10个值
    interpretation: interpretRSI(currentRSI)
  };
}

/**
 * 解释RSI值
 */
function interpretRSI(rsi: number): string {
  if (rsi >= 70) return '超买';
  if (rsi <= 30) return '超卖';
  if (rsi > 50) return '看涨';
  if (rsi < 50) return '看跌';
  return '中性';
}

/**
 * 计算MACD (移动平均线收敛/发散)
 */
function calculateMACD(prices: any[]): any {
  const closes = prices.map(p => parseFloat(p.close));
  const shortPeriod = 12;
  const longPeriod = 26;
  const signalPeriod = 9;
  
  // 计算EMA
  const shortEMA = calculateEMAValues(closes, shortPeriod);
  const longEMA = calculateEMAValues(closes, longPeriod);
  
  // 计算MACD线
  const macdLine = [];
  for (let i = 0; i < longEMA.length; i++) {
    if (i < longEMA.length - shortEMA.length) {
      macdLine.push(null);
    } else {
      const shortIndex = i - (longEMA.length - shortEMA.length);
      macdLine.push(shortEMA[shortIndex] - longEMA[i]);
    }
  }
  
  // 计算信号线 (MACD的9日EMA)
  const validMacd = macdLine.filter(v => v !== null) as number[];
  const signalLine = calculateEMAValues(validMacd, signalPeriod);
  
  // 计算柱状图
  const histogram = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macdIndex = macdLine.length - signalLine.length + i;
    histogram.push((macdLine[macdIndex] as number) - signalLine[i]);
  }
  
  const currentMACD = validMacd.length > 0 ? validMacd[validMacd.length - 1] : 0;
  const currentSignal = signalLine.length > 0 ? signalLine[signalLine.length - 1] : 0;
  const currentHistogram = histogram.length > 0 ? histogram[histogram.length - 1] : 0;
  
  // 解释MACD信号
  let interpretation = '中性';
  if (currentMACD > currentSignal) {
    interpretation = '看涨';
    if (currentMACD > 0 && currentHistogram > 0) {
      interpretation = '强烈看涨';
    }
  } else if (currentMACD < currentSignal) {
    interpretation = '看跌';
    if (currentMACD < 0 && currentHistogram < 0) {
      interpretation = '强烈看跌';
    }
  }
  
  return {
    current: {
      macd: currentMACD,
      signal: currentSignal,
      histogram: currentHistogram
    },
    interpretation
  };
}

/**
 * 计算EMA值
 */
function calculateEMAValues(values: number[], period: number): number[] {
  const ema = [];
  
  // 计算首个EMA值 (简单移动平均)
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  ema.push(sum / period);
  
  // 计算剩余EMA值
  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    ema.push(values[i] * k + ema[ema.length - 1] * (1 - k));
  }
  
  return ema;
}

/**
 * 计算布林带
 */
function calculateBollingerBands(prices: any[], period: number): any {
  const closes = prices.map(p => parseFloat(p.close));
  
  // 计算简单移动平均线
  const sma = [];
  for (let i = 0; i <= closes.length - period; i++) {
    let sum = 0;
    for (let j = i; j < i + period; j++) {
      sum += closes[j];
    }
    sma.push(sum / period);
  }
  
  // 计算标准差
  const stdDev = [];
  for (let i = 0; i <= closes.length - period; i++) {
    let sum = 0;
    for (let j = i; j < i + period; j++) {
      sum += Math.pow(closes[j] - sma[i], 2);
    }
    stdDev.push(Math.sqrt(sum / period));
  }
  
  // 计算上下轨
  const upperBand = [];
  const lowerBand = [];
  for (let i = 0; i < sma.length; i++) {
    upperBand.push(sma[i] + 2 * stdDev[i]);
    lowerBand.push(sma[i] - 2 * stdDev[i]);
  }
  
  const currentPrice = closes[0];
  const currentMiddle = sma[0];
  const currentUpper = upperBand[0];
  const currentLower = lowerBand[0];
  
  // 解释布林带信号
  let interpretation = '中性';
  if (currentPrice > currentUpper) {
    interpretation = '超买';
  } else if (currentPrice < currentLower) {
    interpretation = '超卖';
  } else if (currentPrice > currentMiddle) {
    interpretation = '看涨';
  } else if (currentPrice < currentMiddle) {
    interpretation = '看跌';
  }
  
  // 计算布林带宽度和百分比B
  const bandWidth = (currentUpper - currentLower) / currentMiddle;
  const percentB = (currentPrice - currentLower) / (currentUpper - currentLower);
  
  return {
    current: {
      middle: currentMiddle,
      upper: currentUpper,
      lower: currentLower,
      bandWidth,
      percentB
    },
    interpretation
  };
}

/**
 * 计算简单移动平均线 (SMA)
 */
function calculateSMA(prices: any[], period: number): any {
  const closes = prices.map(p => parseFloat(p.close));
  
  const smaValues = [];
  for (let i = 0; i <= closes.length - period; i++) {
    let sum = 0;
    for (let j = i; j < i + period; j++) {
      sum += closes[j];
    }
    smaValues.push(sum / period);
  }
  
  const currentPrice = closes[0];
  const currentSMA = smaValues[0];
  
  return {
    current: currentSMA,
    values: smaValues.slice(0, 10),
    interpretation: currentPrice > currentSMA ? '看涨' : currentPrice < currentSMA ? '看跌' : '中性'
  };
}

/**
 * 计算指数移动平均线 (EMA)
 */
function calculateEMA(prices: any[], period: number): any {
  const closes = prices.map(p => parseFloat(p.close));
  const emaValues = calculateEMAValues(closes, period);
  
  const currentPrice = closes[0];
  const currentEMA = emaValues[emaValues.length - 1];
  
  return {
    current: currentEMA,
    values: emaValues.slice(-10).reverse(),
    interpretation: currentPrice > currentEMA ? '看涨' : currentPrice < currentEMA ? '看跌' : '中性'
  };
}

/**
 * 计算平均真实范围 (ATR)
 */
function calculateATR(prices: any[], period: number): any {
  // 计算真实范围
  const tr = [];
  for (let i = 1; i < prices.length; i++) {
    const high = parseFloat(prices[i - 1].high);
    const low = parseFloat(prices[i - 1].low);
    const close = parseFloat(prices[i].close);
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - close);
    const tr3 = Math.abs(low - close);
    
    tr.push(Math.max(tr1, tr2, tr3));
  }
  
  // 计算ATR
  let atr = tr.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  const atrValues = [atr];
  
  for (let i = period; i < tr.length; i++) {
    atr = ((atr * (period - 1)) + tr[i]) / period;
    atrValues.push(atr);
  }
  
  const currentATR = atrValues[atrValues.length - 1];
  const currentPrice = parseFloat(prices[0].close);
  const volatilityPercentage = (currentATR / currentPrice) * 100;
  
  return {
    current: currentATR,
    volatilityPercentage,
    interpretation: volatilityPercentage > 3 ? '高波动' : volatilityPercentage < 1 ? '低波动' : '中等波动'
  };
}

/**
 * 计算能量潮 (OBV)
 */
function calculateOBV(prices: any[]): any {
  const obvValues = [0];
  
  for (let i = 1; i < prices.length; i++) {
    const currentClose = parseFloat(prices[i - 1].close);
    const previousClose = parseFloat(prices[i].close);
    const currentVolume = parseInt(prices[i - 1].volume);
    
    let newOBV = obvValues[obvValues.length - 1];
    if (currentClose > previousClose) {
      newOBV += currentVolume;
    } else if (currentClose < previousClose) {
      newOBV -= currentVolume;
    }
    
    obvValues.push(newOBV);
  }
  
  // 检查OBV趋势
  const recentOBV = obvValues.slice(-10).reverse();
  const obvTrend = recentOBV[0] > recentOBV[recentOBV.length - 1] ? '上升' : '下降';
  
  return {
    current: recentOBV[0],
    values: recentOBV,
    trend: obvTrend,
    interpretation: obvTrend === '上升' ? '看涨' : '看跌'
  };
} 