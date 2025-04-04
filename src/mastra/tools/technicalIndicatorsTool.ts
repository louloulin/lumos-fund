import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('technicalIndicatorsTool');

/**
 * 技术指标工具
 * 
 * 提供常用技术指标的计算和分析功能，包括：
 * - RSI（相对强弱指标）
 * - MACD（移动平均线收敛/发散）
 * - 布林带
 * - 移动平均线
 * - ATR（平均真实范围）
 */
export const technicalIndicatorsTool = createTool({
  name: 'technicalIndicatorsTool',
  description: '计算并分析股票的技术指标，如RSI、MACD、移动平均线等',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    period: z.enum(['daily', 'weekly', 'monthly']).default('daily').describe('数据周期'),
    indicators: z.array(z.enum([
      'rsi', 'macd', 'bollinger', 'sma', 'ema', 'atr', 'obv', 'stochastic', 'adx'
    ])).default(['rsi', 'macd', 'sma']).describe('需要计算的技术指标列表')
  }),
  execute: async ({ ticker, period, indicators }) => {
    try {
      logger.info('计算技术指标', { ticker, period, indicators });
      
      // 模拟从API获取历史价格数据
      const priceData = await fetchHistoricalPrices(ticker, period);
      
      // 计算请求的技术指标
      const results = {};
      
      for (const indicator of indicators) {
        switch (indicator) {
          case 'rsi':
            results['rsi'] = calculateRSI(priceData);
            break;
          case 'macd':
            results['macd'] = calculateMACD(priceData);
            break;
          case 'bollinger':
            results['bollinger'] = calculateBollingerBands(priceData);
            break;
          case 'sma':
            results['sma'] = calculateSMA(priceData);
            break;
          case 'ema':
            results['ema'] = calculateEMA(priceData);
            break;
          case 'atr':
            results['atr'] = calculateATR(priceData);
            break;
          case 'obv':
            results['obv'] = calculateOBV(priceData);
            break;
          case 'stochastic':
            results['stochastic'] = calculateStochastic(priceData);
            break;
          case 'adx':
            results['adx'] = calculateADX(priceData);
            break;
        }
      }
      
      // 提供综合信号和解释
      const analysis = analyzeTechnicalIndicators(results);
      
      return {
        ticker,
        period,
        timestamp: new Date().toISOString(),
        indicators: results,
        analysis
      };
    } catch (error) {
      logger.error('技术指标计算失败', { ticker, error });
      throw new Error(`技术指标计算失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

/**
 * 模拟从API获取历史价格数据
 * 在实际应用中，应替换为真实API调用
 */
async function fetchHistoricalPrices(ticker: string, period: string) {
  // 模拟数据 - 在实际应用中替换为API调用
  return {
    dates: ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05'],
    open: [150.0, 153.0, 151.0, 155.0, 158.0],
    high: [155.0, 158.0, 154.0, 160.0, 163.0],
    low: [148.0, 151.0, 149.0, 153.0, 156.0],
    close: [153.0, 151.0, 155.0, 158.0, 162.0],
    volume: [1000000, 1200000, 980000, 1100000, 1300000]
  };
}

/**
 * 计算相对强弱指标(RSI)
 */
function calculateRSI(priceData: any) {
  // 实际应用中应实现完整的RSI计算逻辑
  const lastClose = priceData.close[priceData.close.length - 1];
  const secondLastClose = priceData.close[priceData.close.length - 2];
  
  // 简化计算 - 实际实现应使用正确的RSI公式
  let rsiValue = 0;
  if (lastClose > secondLastClose) {
    rsiValue = 70 + Math.random() * 15;
  } else {
    rsiValue = 30 - Math.random() * 15;
  }
  
  let signal = 'neutral';
  if (rsiValue > 70) {
    signal = 'overbought';
  } else if (rsiValue < 30) {
    signal = 'oversold';
  }
  
  return {
    value: rsiValue,
    period: 14, // 标准RSI周期
    signal,
    interpretation: rsiValue > 70 
      ? '当前RSI处于超买区域，可能出现回调'
      : rsiValue < 30
        ? '当前RSI处于超卖区域，可能出现反弹'
        : 'RSI处于中性区域，无明显信号'
  };
}

/**
 * 计算MACD(移动平均线收敛/发散)指标
 */
function calculateMACD(priceData: any) {
  // 简化计算 - 实际实现应使用正确的MACD公式
  const lastClose = priceData.close[priceData.close.length - 1];
  const trend = lastClose > priceData.close[0] ? 'uptrend' : 'downtrend';
  
  const macdLine = Math.random() * 2 - 1;
  const signalLine = macdLine - (Math.random() * 0.5);
  const histogram = macdLine - signalLine;
  
  let signal = 'neutral';
  if (macdLine > signalLine) {
    signal = 'bullish';
  } else if (macdLine < signalLine) {
    signal = 'bearish';
  }
  
  return {
    macdLine,
    signalLine,
    histogram,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    signal,
    trend,
    interpretation: signal === 'bullish'
      ? 'MACD线上穿信号线，产生买入信号'
      : signal === 'bearish'
        ? 'MACD线下穿信号线，产生卖出信号'
        : 'MACD无明显信号'
  };
}

/**
 * 计算布林带
 */
function calculateBollingerBands(priceData: any) {
  const lastClose = priceData.close[priceData.close.length - 1];
  
  // 简化计算 - 实际实现应使用正确的布林带公式
  const middle = lastClose;
  const upper = middle + (middle * 0.05);
  const lower = middle - (middle * 0.05);
  
  let signal = 'neutral';
  if (lastClose > upper) {
    signal = 'overbought';
  } else if (lastClose < lower) {
    signal = 'oversold';
  }
  
  return {
    upper,
    middle,
    lower,
    period: 20,
    stdDev: 2,
    signal,
    interpretation: signal === 'overbought'
      ? '价格接近或超过上轨，可能出现回调'
      : signal === 'oversold'
        ? '价格接近或低于下轨，可能出现反弹'
        : '价格在布林带中轨附近，无明显信号'
  };
}

/**
 * 计算简单移动平均线(SMA)
 */
function calculateSMA(priceData: any) {
  const closes = priceData.close;
  const lastClose = closes[closes.length - 1];
  
  // 简化计算 - 实际实现应使用正确的SMA公式
  const sma20 = lastClose - (Math.random() * 5);
  const sma50 = sma20 - (Math.random() * 10);
  const sma200 = sma50 - (Math.random() * 20);
  
  let signal = 'neutral';
  if (lastClose > sma20 && sma20 > sma50) {
    signal = 'bullish';
  } else if (lastClose < sma20 && sma20 < sma50) {
    signal = 'bearish';
  }
  
  return {
    sma20,
    sma50,
    sma200,
    crossovers: {
      goldenCross: sma50 > sma200 && (sma50 - sma200) < 5,
      deathCross: sma50 < sma200 && (sma200 - sma50) < 5
    },
    signal,
    interpretation: signal === 'bullish'
      ? '价格位于20日均线上方，且20日均线高于50日均线，呈现上升趋势'
      : signal === 'bearish'
        ? '价格位于20日均线下方，且20日均线低于50日均线，呈现下降趋势'
        : '价格与均线关系不明确，无明显趋势信号'
  };
}

/**
 * 计算指数移动平均线(EMA)
 */
function calculateEMA(priceData: any) {
  const closes = priceData.close;
  const lastClose = closes[closes.length - 1];
  
  // 简化计算 - 实际实现应使用正确的EMA公式
  const ema12 = lastClose + (Math.random() * 2 - 1);
  const ema26 = ema12 - (Math.random() * 5);
  
  let signal = 'neutral';
  if (ema12 > ema26) {
    signal = 'bullish';
  } else if (ema12 < ema26) {
    signal = 'bearish';
  }
  
  return {
    ema12,
    ema26,
    signal,
    interpretation: signal === 'bullish'
      ? '短期EMA(12)高于长期EMA(26)，呈现上升趋势'
      : signal === 'bearish'
        ? '短期EMA(12)低于长期EMA(26)，呈现下降趋势'
        : 'EMA无明显信号'
  };
}

/**
 * 计算平均真实范围(ATR)
 */
function calculateATR(priceData: any) {
  // 简化计算 - 实际实现应使用正确的ATR公式
  const atrValue = Math.random() * 5;
  const volatility = atrValue > 3 ? 'high' : atrValue > 1 ? 'medium' : 'low';
  
  return {
    value: atrValue,
    period: 14,
    volatility,
    interpretation: `波动性${volatility === 'high' ? '高' : volatility === 'medium' ? '中等' : '低'}，ATR值为${atrValue.toFixed(2)}`
  };
}

/**
 * 计算能量潮(OBV)
 */
function calculateOBV(priceData: any) {
  // 简化计算 - 实际实现应使用正确的OBV公式
  const obvValue = Math.random() * 1000000;
  const trend = Math.random() > 0.5 ? 'rising' : 'falling';
  
  return {
    value: obvValue,
    trend,
    interpretation: trend === 'rising'
      ? 'OBV上升，表明成交量支持价格走势'
      : 'OBV下降，表明成交量不支持价格走势'
  };
}

/**
 * 计算随机指标
 */
function calculateStochastic(priceData: any) {
  // 简化计算 - 实际实现应使用正确的随机指标公式
  const kValue = Math.random() * 100;
  const dValue = kValue + (Math.random() * 10 - 5);
  
  let signal = 'neutral';
  if (kValue > 80) {
    signal = 'overbought';
  } else if (kValue < 20) {
    signal = 'oversold';
  }
  
  return {
    k: kValue,
    d: dValue,
    period: {
      k: 14,
      d: 3
    },
    signal,
    interpretation: signal === 'overbought'
      ? 'K值位于超买区域，可能出现回调'
      : signal === 'oversold'
        ? 'K值位于超卖区域，可能出现反弹'
        : 'K值在中性区域，无明显信号'
  };
}

/**
 * 计算平均趋向指数(ADX)
 */
function calculateADX(priceData: any) {
  // 简化计算 - 实际实现应使用正确的ADX公式
  const adxValue = Math.random() * 100;
  
  let trendStrength = 'weak';
  if (adxValue > 25) {
    trendStrength = 'strong';
  } else if (adxValue > 20) {
    trendStrength = 'moderate';
  }
  
  return {
    value: adxValue,
    plusDI: Math.random() * 50,
    minusDI: Math.random() * 50,
    period: 14,
    trendStrength,
    interpretation: trendStrength === 'strong'
      ? 'ADX值大于25，表明当前趋势较强'
      : trendStrength === 'moderate'
        ? 'ADX值在20-25之间，表明趋势中等'
        : 'ADX值小于20，表明当前趋势较弱'
  };
}

/**
 * 综合分析所有技术指标，得出整体信号
 */
function analyzeTechnicalIndicators(indicators: any) {
  let bullishCount = 0;
  let bearishCount = 0;
  let totalSignals = 0;
  
  for (const key in indicators) {
    if (indicators[key].signal === 'bullish' || indicators[key].signal === 'oversold') {
      bullishCount++;
    } else if (indicators[key].signal === 'bearish' || indicators[key].signal === 'overbought') {
      bearishCount++;
    }
    totalSignals++;
  }
  
  let signal = 'neutral';
  let confidence = 50;
  
  if (totalSignals > 0) {
    if (bullishCount > bearishCount) {
      signal = 'bullish';
      confidence = Math.round((bullishCount / totalSignals) * 100);
    } else if (bearishCount > bullishCount) {
      signal = 'bearish';
      confidence = Math.round((bearishCount / totalSignals) * 100);
    }
  }
  
  return {
    signal,
    confidence,
    summary: signal === 'bullish'
      ? `技术指标总体看涨，${bullishCount}个指标显示看涨信号，置信度${confidence}%`
      : signal === 'bearish'
        ? `技术指标总体看跌，${bearishCount}个指标显示看跌信号，置信度${confidence}%`
        : `技术指标总体中性，缺乏明确方向性信号`
  };
} 