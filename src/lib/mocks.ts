/**
 * 模拟数据生成工具
 * 用于生成回测系统所需的模拟数据
 */

import { format, addDays, parseISO, differenceInDays } from 'date-fns';

// 模拟股票数据
export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 生成股票历史数据
export function generateHistoricalPrices(
  ticker: string,
  startDate: string,
  endDate: string,
  volatility: number = 0.015,
  initialPrice: number = 100,
  trend: number = 0.0002
): StockData[] {
  console.log(`生成${ticker}从${startDate}到${endDate}的历史数据`);
  
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInDays(end, start) + 1;
  
  // 确保至少有1天数据
  if (days <= 0) {
    return [];
  }
  
  const result: StockData[] = [];
  let currentPrice = initialPrice;
  
  // 根据股票代码创建一个稳定的"随机"种子
  const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    // 跳过周末
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    // 使用股票代码为种子，为不同股票生成不同走势
    const seedRandom = (seed + i) / 1000;
    const dailyReturn = (Math.sin(seedRandom) * volatility) + trend;
    
    currentPrice = currentPrice * (1 + dailyReturn);
    
    // 确保价格不会变成负数
    if (currentPrice < 0.1) {
      currentPrice = 0.1;
    }
    
    // 生成当天的高低点
    const dayHigh = currentPrice * (1 + (Math.random() * volatility));
    const dayLow = currentPrice * (1 - (Math.random() * volatility));
    
    // 确保高低点正确
    const high = Math.max(dayHigh, currentPrice);
    const low = Math.min(dayLow, currentPrice);
    
    // 生成当天的开盘价
    const open = low + Math.random() * (high - low);
    
    // 生成交易量
    const volume = Math.floor(Math.random() * 1000000) + 500000;
    
    result.push({
      date: format(date, 'yyyy-MM-dd'),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(currentPrice.toFixed(2)),
      volume
    });
  }
  
  return result;
}

// 生成财务指标数据
export function generateFinancialMetrics(ticker: string) {
  // 使用股票代码为种子，为不同股票生成不同财务数据
  const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  const seedRandom = (offset: number = 0) => ((seed + offset) % 100) / 100;
  
  return {
    // 价值投资指标
    pe_ratio: parseFloat((10 + seedRandom(1) * 25).toFixed(2)),
    pb_ratio: parseFloat((0.5 + seedRandom(2) * 6).toFixed(2)),
    dividend_yield: parseFloat((seedRandom(3) * 0.06).toFixed(4)),
    eps_growth: parseFloat(((seedRandom(4) - 0.3) * 0.4).toFixed(4)),
    profit_margin: parseFloat((0.05 + seedRandom(5) * 0.25).toFixed(4)),
    
    // 财务健康指标
    current_ratio: parseFloat((1 + seedRandom(6) * 3).toFixed(2)),
    debt_to_equity: parseFloat((seedRandom(7) * 2).toFixed(2)),
    
    // 估值指标
    market_cap: parseFloat((1 + seedRandom(8) * 200).toFixed(2)) * 1e9,
    revenue_growth: parseFloat(((seedRandom(9) - 0.2) * 0.5).toFixed(4)),
    
    // 行业指标
    industry_rank: Math.floor(seedRandom(10) * 100),
    sector_performance: parseFloat(((seedRandom(11) - 0.5) * 0.3).toFixed(4))
  };
}

// 生成新闻情绪数据
export function generateNewsData(ticker: string, startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInDays(end, start) + 1;
  
  // 确保至少有1天数据
  if (days <= 0) {
    return [];
  }
  
  // 使用股票代码为种子
  const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const result = [];
  
  // 生成随机新闻数
  const newsCount = Math.floor((days / 7) * (1 + Math.random())) + 2;
  
  for (let i = 0; i < newsCount; i++) {
    // 随机选择日期
    const randomDayOffset = Math.floor(Math.random() * days);
    const newsDate = addDays(start, randomDayOffset);
    
    // 计算情绪得分 (-1.0 到 1.0)
    const sentimentScore = parseFloat(((seed % 7 + i) / 10 + Math.random() - 0.8).toFixed(2));
    
    // 限制在 -1.0 到 1.0 之间
    const normalizedSentiment = Math.max(-1.0, Math.min(1.0, sentimentScore));
    
    result.push({
      date: format(newsDate, 'yyyy-MM-dd'),
      headline: generateNewsHeadline(ticker, normalizedSentiment),
      sentiment: normalizedSentiment,
      source: randomNewsSource()
    });
  }
  
  // 按日期排序
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// 辅助函数：生成新闻标题
function generateNewsHeadline(ticker: string, sentiment: number) {
  const positive = [
    `${ticker}超预期财报引发股价飙升`,
    `分析师上调${ticker}目标价，称增长前景强劲`,
    `${ticker}宣布回购计划，股东回报增加`,
    `${ticker}新产品线获市场热捧，销售额创新高`,
    `${ticker}扩张国际市场，全球战略加速推进`
  ];
  
  const neutral = [
    `${ticker}季度财报符合市场预期`,
    `${ticker}任命新CFO，公司战略保持不变`,
    `行业数据显示${ticker}市场份额保持稳定`,
    `${ticker}重组部门架构，提升运营效率`,
    `分析师对${ticker}持谨慎乐观态度`
  ];
  
  const negative = [
    `${ticker}营收不及预期，股价承压`,
    `分析师下调${ticker}评级，引发投资者担忧`,
    `${ticker}面临供应链中断，生产受阻`,
    `监管机构对${ticker}展开调查，不确定性增加`,
    `${ticker}市场份额下滑，竞争压力加大`
  ];
  
  if (sentiment > 0.3) {
    return positive[Math.floor(Math.random() * positive.length)];
  } else if (sentiment < -0.3) {
    return negative[Math.floor(Math.random() * negative.length)];
  } else {
    return neutral[Math.floor(Math.random() * neutral.length)];
  }
}

// 辅助函数：随机新闻来源
function randomNewsSource() {
  const sources = [
    '彭博社', '路透社', '财联社', '华尔街日报', 
    '金融时报', '证券时报', '第一财经', '新浪财经'
  ];
  return sources[Math.floor(Math.random() * sources.length)];
}

// 计算技术指标 - 简化版
export function calculateTechnicalIndicators(priceData: StockData[]) {
  if (!priceData || priceData.length === 0) {
    return {};
  }
  
  // 计算移动平均线
  const calculateMA = (period: number) => {
    const result = [];
    
    for (let i = 0; i < priceData.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += priceData[j].close;
      }
      
      result.push(parseFloat((sum / period).toFixed(2)));
    }
    
    return result;
  };
  
  // 计算相对强弱指数 (RSI)
  const calculateRSI = (period: number = 14) => {
    const result = [];
    
    // 前period天没有足够数据计算RSI
    for (let i = 0; i < period; i++) {
      result.push(null);
    }
    
    for (let i = period; i < priceData.length; i++) {
      let gains = 0;
      let losses = 0;
      
      // 计算前period天的涨跌
      for (let j = i - period + 1; j <= i; j++) {
        const change = priceData[j].close - priceData[j-1].close;
        
        if (change >= 0) {
          gains += change;
        } else {
          losses -= change;
        }
      }
      
      if (losses === 0) {
        result.push(100); // 如果没有下跌，RSI为100
      } else {
        const rs = gains / losses;
        const rsi = 100 - (100 / (1 + rs));
        result.push(parseFloat(rsi.toFixed(2)));
      }
    }
    
    return result;
  };
  
  // 计算MACD
  const calculateMACD = () => {
    // 简化的MACD实现
    const ema12 = calculateEMA(12);
    const ema26 = calculateEMA(26);
    
    const macdLine = ema12.map((val, index) => {
      if (val === null || ema26[index] === null) return null;
      return parseFloat((val - ema26[index]).toFixed(2));
    });
    
    // 计算信号线 (9日EMA of MACD Line)
    const signalLine = calculateEMAFromArray(macdLine.filter(x => x !== null) as number[], 9);
    
    // 补充前面的空值
    const paddedSignalLine = Array(macdLine.length - signalLine.length).fill(null).concat(signalLine);
    
    // 计算柱状图
    const histogram = macdLine.map((val, index) => {
      if (val === null || paddedSignalLine[index] === null) return null;
      return parseFloat((val - paddedSignalLine[index]).toFixed(2));
    });
    
    return {
      macdLine,
      signalLine: paddedSignalLine,
      histogram
    };
  };
  
  // 辅助函数：计算EMA
  const calculateEMA = (period: number) => {
    const result = [];
    const multiplier = 2 / (period + 1);
    
    // 计算第一个EMA值（用简单移动平均）
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += priceData[i].close;
    }
    
    let ema = sum / period;
    
    // 前period-1天没有足够的数据
    for (let i = 0; i < period - 1; i++) {
      result.push(null);
    }
    
    result.push(parseFloat(ema.toFixed(2)));
    
    // 计算后续的EMA
    for (let i = period; i < priceData.length; i++) {
      ema = (priceData[i].close - ema) * multiplier + ema;
      result.push(parseFloat(ema.toFixed(2)));
    }
    
    return result;
  };
  
  // 从数组计算EMA
  const calculateEMAFromArray = (data: number[], period: number) => {
    const result = [];
    const multiplier = 2 / (period + 1);
    
    // 计算第一个EMA值（用简单移动平均）
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    
    let ema = sum / period;
    result.push(parseFloat(ema.toFixed(2)));
    
    // 计算后续的EMA
    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(parseFloat(ema.toFixed(2)));
    }
    
    return result;
  };
  
  // 返回常用技术指标
  return {
    ma5: calculateMA(5),
    ma10: calculateMA(10),
    ma20: calculateMA(20),
    ma60: calculateMA(60),
    rsi14: calculateRSI(14),
    macd: calculateMACD(),
    
    // 获取最新指标值
    latest: {
      close: priceData[priceData.length - 1].close,
      ma5: calculateMA(5)[priceData.length - 1],
      ma20: calculateMA(20)[priceData.length - 1],
      rsi14: calculateRSI(14)[priceData.length - 1],
      macd: {
        line: calculateMACD().macdLine[priceData.length - 1],
        signal: calculateMACD().signalLine[priceData.length - 1],
        histogram: calculateMACD().histogram[priceData.length - 1]
      }
    }
  };
} 