import { z } from "zod";
import { generateTechnicalIndicators, generateHistoricalPrices } from "@/lib/mocks";

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
 * 技术分析工具
 * 允许AI代理获取并分析股票的技术指标
 */
export const technicalAnalysisTool = createTool({
  name: "technicalAnalysisTool",
  description: "获取并分析股票的技术指标",
  schema: z.object({
    ticker: z.string().describe("股票代码，例如AAPL"),
    startDate: z.string().describe("开始日期，格式为YYYY-MM-DD"),
    endDate: z.string().describe("结束日期，格式为YYYY-MM-DD"),
    indicators: z.array(z.string()).describe("需要分析的技术指标列表，例如['RSI', 'MACD', 'MA']"),
  }),
  execute: async (input) => {
    const { ticker, startDate, endDate, indicators } = input;
    try {
      console.log(`获取${ticker}从${startDate}到${endDate}的技术指标数据`);
      
      // 首先获取历史价格数据
      const priceData = generateHistoricalPrices(ticker, startDate, endDate);
      
      if (priceData.length === 0) {
        return {
          success: false,
          error: "未找到股票价格数据"
        };
      }
      
      // 获取技术指标数据
      const technicalData = generateTechnicalIndicators(ticker, startDate, endDate);
      
      // 根据请求的指标筛选数据
      const filteredIndicators = {};
      for (const indicator of indicators) {
        if (technicalData[indicator.toLowerCase()]) {
          filteredIndicators[indicator] = technicalData[indicator.toLowerCase()];
        }
      }
      
      // 分析技术指标
      const analysis = analyzeTechnicalIndicators(filteredIndicators, priceData);
      
      return {
        success: true,
        data: {
          ticker,
          timeframe: `${startDate} 至 ${endDate}`,
          indicators: filteredIndicators,
          priceData: priceData.slice(-30), // 只返回最近30天的价格数据
          analysis
        }
      };
    } catch (error) {
      console.error(`获取技术指标数据失败:`, error);
      return {
        success: false,
        error: "获取技术指标数据失败"
      };
    }
  }
});

/**
 * 趋势分析工具
 * 允许AI代理分析股票价格的趋势
 */
export const trendAnalysisTool = createTool({
  name: "trendAnalysisTool",
  description: "分析股票价格的趋势",
  schema: z.object({
    ticker: z.string().describe("股票代码，例如AAPL"),
    period: z.number().describe("分析周期（天数），例如30表示30天"),
    maTypes: z.array(z.number()).optional().describe("移动平均线周期，例如[20, 50, 200]"),
  }),
  execute: async (input) => {
    const { ticker, period, maTypes = [20, 50, 200] } = input;
    try {
      console.log(`分析${ticker}过去${period}天的价格趋势`);
      
      // 计算开始日期
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - (period + Math.max(...maTypes))); // 确保有足够的数据计算MA
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = today.toISOString().split('T')[0];
      
      // 获取历史价格数据
      const priceData = generateHistoricalPrices(ticker, formattedStartDate, formattedEndDate);
      
      if (priceData.length === 0) {
        return {
          success: false,
          error: "未找到股票价格数据"
        };
      }
      
      // 计算移动平均线
      const maData = calculateMovingAverages(priceData, maTypes);
      
      // 分析趋势
      const trendAnalysis = analyzeTrend(priceData, maData, maTypes);
      
      // 获取支撑位和阻力位
      const supportResistance = calculateSupportResistance(priceData.slice(-period));
      
      return {
        success: true,
        data: {
          ticker,
          period: `${period}天`,
          priceData: priceData.slice(-period),
          movingAverages: maData,
          trendAnalysis,
          supportResistance
        }
      };
    } catch (error) {
      console.error(`分析价格趋势失败:`, error);
      return {
        success: false,
        error: "分析价格趋势失败"
      };
    }
  }
});

/**
 * 计算移动平均线
 */
function calculateMovingAverages(priceData: any[], periods: number[]) {
  const result = {};
  
  // 对每个周期计算MA
  for (const period of periods) {
    result[`MA${period}`] = [];
    
    // 确保数据长度足够
    if (priceData.length < period) {
      continue;
    }
    
    // 计算每一天的移动平均
    for (let i = period - 1; i < priceData.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += priceData[i - j].close;
      }
      const ma = sum / period;
      
      result[`MA${period}`].push({
        date: priceData[i].date,
        value: ma
      });
    }
  }
  
  return result;
}

/**
 * 分析趋势
 */
function analyzeTrend(priceData: any[], maData: any, periods: number[]) {
  // 只分析最近的数据
  const recentPrice = priceData[priceData.length - 1].close;
  const previousPrice = priceData[priceData.length - 2].close;
  const weekAgoPrice = priceData[Math.max(0, priceData.length - 6)].close;
  const monthAgoPrice = priceData[Math.max(0, priceData.length - 21)].close;
  
  // 计算价格变化百分比
  const dailyChange = ((recentPrice - previousPrice) / previousPrice) * 100;
  const weeklyChange = ((recentPrice - weekAgoPrice) / weekAgoPrice) * 100;
  const monthlyChange = ((recentPrice - monthAgoPrice) / monthAgoPrice) * 100;
  
  // 分析MA关系
  const maRelationship = {};
  const maSignals = [];
  
  for (const period of periods) {
    const ma = maData[`MA${period}`];
    if (ma && ma.length > 0) {
      const latestMA = ma[ma.length - 1].value;
      maRelationship[`MA${period}`] = {
        value: latestMA,
        priceRelation: recentPrice > latestMA ? "价格在MA上方" : "价格在MA下方"
      };
      
      // 分析交叉信号
      if (ma.length > 1) {
        const previousMA = ma[ma.length - 2].value;
        if (previousPrice < previousMA && recentPrice > latestMA) {
          maSignals.push(`价格上穿MA${period}：看涨信号`);
        } else if (previousPrice > previousMA && recentPrice < latestMA) {
          maSignals.push(`价格下穿MA${period}：看跌信号`);
        }
      }
    }
  }
  
  // 分析MA之间的关系（黄金交叉和死亡交叉）
  if (periods.length >= 2) {
    periods.sort((a, b) => a - b); // 确保从短到长排序
    
    for (let i = 0; i < periods.length - 1; i++) {
      const shortPeriod = periods[i];
      const longPeriod = periods[i + 1];
      
      const shortMA = maData[`MA${shortPeriod}`];
      const longMA = maData[`MA${longPeriod}`];
      
      if (shortMA && shortMA.length > 1 && longMA && longMA.length > 1) {
        const currentShortMA = shortMA[shortMA.length - 1].value;
        const previousShortMA = shortMA[shortMA.length - 2].value;
        
        const currentLongMA = longMA[longMA.length - 1].value;
        const previousLongMA = longMA[longMA.length - 2].value;
        
        if (previousShortMA < previousLongMA && currentShortMA > currentLongMA) {
          maSignals.push(`MA${shortPeriod}上穿MA${longPeriod}：黄金交叉（看涨）`);
        } else if (previousShortMA > previousLongMA && currentShortMA < currentLongMA) {
          maSignals.push(`MA${shortPeriod}下穿MA${longPeriod}：死亡交叉（看跌）`);
        }
      }
    }
  }
  
  // 确定整体趋势
  let overallTrend = "中性";
  
  // 基于价格变化判断短期趋势
  let shortTermTrend = "中性";
  if (dailyChange > 1.5) {
    shortTermTrend = "强烈看涨";
  } else if (dailyChange > 0.5) {
    shortTermTrend = "看涨";
  } else if (dailyChange < -1.5) {
    shortTermTrend = "强烈看跌";
  } else if (dailyChange < -0.5) {
    shortTermTrend = "看跌";
  }
  
  // 基于价格与移动平均线关系判断中期趋势
  let mediumTermTrend = "中性";
  const ma50 = maData['MA50'];
  const ma20 = maData['MA20'];
  
  if (ma20 && ma20.length > 0 && ma50 && ma50.length > 0) {
    const ma20Value = ma20[ma20.length - 1].value;
    const ma50Value = ma50[ma50.length - 1].value;
    
    if (recentPrice > ma20Value && recentPrice > ma50Value && ma20Value > ma50Value) {
      mediumTermTrend = "看涨";
    } else if (recentPrice < ma20Value && recentPrice < ma50Value && ma20Value < ma50Value) {
      mediumTermTrend = "看跌";
    }
  }
  
  // 基于价格与长期移动平均线关系判断长期趋势
  let longTermTrend = "中性";
  const ma200 = maData['MA200'];
  
  if (ma200 && ma200.length > 0) {
    const ma200Value = ma200[ma200.length - 1].value;
    
    if (recentPrice > ma200Value) {
      longTermTrend = "看涨";
    } else if (recentPrice < ma200Value) {
      longTermTrend = "看跌";
    }
  }
  
  // 综合判断整体趋势
  if ((shortTermTrend.includes("看涨") && mediumTermTrend.includes("看涨")) || 
      (mediumTermTrend.includes("看涨") && longTermTrend.includes("看涨"))) {
    overallTrend = "看涨";
  } else if ((shortTermTrend.includes("看跌") && mediumTermTrend.includes("看跌")) || 
             (mediumTermTrend.includes("看跌") && longTermTrend.includes("看跌"))) {
    overallTrend = "看跌";
  }
  
  return {
    priceChanges: {
      daily: dailyChange.toFixed(2) + "%",
      weekly: weeklyChange.toFixed(2) + "%",
      monthly: monthlyChange.toFixed(2) + "%"
    },
    movingAverages: maRelationship,
    signals: maSignals,
    trends: {
      shortTerm: shortTermTrend,
      mediumTerm: mediumTermTrend,
      longTerm: longTermTrend,
      overall: overallTrend
    }
  };
}

/**
 * 计算支撑位和阻力位
 */
function calculateSupportResistance(priceData: any[]) {
  if (priceData.length < 10) {
    return {
      support: [],
      resistance: []
    };
  }
  
  // 提取价格
  const prices = priceData.map(data => data.close);
  const highPrices = priceData.map(data => data.high);
  const lowPrices = priceData.map(data => data.low);
  
  // 计算价格范围
  const minPrice = Math.min(...lowPrices);
  const maxPrice = Math.max(...highPrices);
  const lastPrice = prices[prices.length - 1];
  
  // 识别局部极值作为可能的支撑位和阻力位
  const supportLevels = [];
  const resistanceLevels = [];
  
  // 寻找局部低点作为支撑位
  for (let i = 2; i < lowPrices.length - 2; i++) {
    if (lowPrices[i] < lowPrices[i - 1] && lowPrices[i] < lowPrices[i - 2] &&
        lowPrices[i] < lowPrices[i + 1] && lowPrices[i] < lowPrices[i + 2]) {
      // 找到局部最低点
      supportLevels.push({
        price: lowPrices[i],
        date: priceData[i].date
      });
    }
  }
  
  // 寻找局部高点作为阻力位
  for (let i = 2; i < highPrices.length - 2; i++) {
    if (highPrices[i] > highPrices[i - 1] && highPrices[i] > highPrices[i - 2] &&
        highPrices[i] > highPrices[i + 1] && highPrices[i] > highPrices[i + 2]) {
      // 找到局部最高点
      resistanceLevels.push({
        price: highPrices[i],
        date: priceData[i].date
      });
    }
  }
  
  // 合并接近的支撑位/阻力位
  const mergedSupport = mergeCloseLevels(supportLevels);
  const mergedResistance = mergeCloseLevels(resistanceLevels);
  
  // 筛选当前价格以下的支撑位和当前价格以上的阻力位
  const filteredSupport = mergedSupport
    .filter(level => level.price < lastPrice)
    .sort((a, b) => b.price - a.price)  // 从高到低排序
    .slice(0, 3);                       // 取最接近的3个
  
  const filteredResistance = mergedResistance
    .filter(level => level.price > lastPrice)
    .sort((a, b) => a.price - b.price)  // 从低到高排序
    .slice(0, 3);                       // 取最接近的3个
  
  return {
    currentPrice: lastPrice,
    support: filteredSupport,
    resistance: filteredResistance
  };
}

/**
 * 合并接近的价格水平
 */
function mergeCloseLevels(levels: any[]) {
  if (levels.length <= 1) return levels;
  
  // 按价格排序
  levels.sort((a, b) => a.price - b.price);
  
  const result = [];
  let currentGroup = [levels[0]];
  
  for (let i = 1; i < levels.length; i++) {
    const currentLevel = levels[i];
    const lastGroupLevel = currentGroup[0];
    
    // 如果当前价格与组内价格相差小于0.5%，则合并
    const percentDiff = Math.abs((currentLevel.price - lastGroupLevel.price) / lastGroupLevel.price) * 100;
    
    if (percentDiff < 0.5) {
      currentGroup.push(currentLevel);
    } else {
      // 计算组内平均价格
      const avgPrice = currentGroup.reduce((sum, level) => sum + level.price, 0) / currentGroup.length;
      
      // 找到最近的日期
      const latestDate = currentGroup.reduce((latest, level) => {
        const levelDate = new Date(level.date);
        const latestDate = new Date(latest);
        return levelDate > latestDate ? level.date : latest;
      }, currentGroup[0].date);
      
      // 添加到结果中
      result.push({
        price: avgPrice,
        date: latestDate,
        strength: currentGroup.length // 支撑/阻力强度
      });
      
      // 开始新的组
      currentGroup = [currentLevel];
    }
  }
  
  // 处理最后一组
  if (currentGroup.length > 0) {
    const avgPrice = currentGroup.reduce((sum, level) => sum + level.price, 0) / currentGroup.length;
    const latestDate = currentGroup.reduce((latest, level) => {
      const levelDate = new Date(level.date);
      const latestDate = new Date(latest);
      return levelDate > latestDate ? level.date : latest;
    }, currentGroup[0].date);
    
    result.push({
      price: avgPrice,
      date: latestDate,
      strength: currentGroup.length
    });
  }
  
  return result;
}

/**
 * 分析技术指标
 */
function analyzeTechnicalIndicators(indicators: any, priceData: any[]) {
  const analysis = {};
  const lastPrice = priceData[priceData.length - 1].close;
  
  // 分析RSI
  if (indicators.RSI) {
    const rsiValues = indicators.RSI;
    const lastRSI = rsiValues[rsiValues.length - 1].value;
    
    let rsiSignal = "中性";
    let rsiDescription = "";
    
    if (lastRSI > 70) {
      rsiSignal = "超买";
      rsiDescription = "RSI值处于超买区域，可能面临回调风险。";
    } else if (lastRSI < 30) {
      rsiSignal = "超卖";
      rsiDescription = "RSI值处于超卖区域，可能出现反弹机会。";
    } else if (lastRSI > 50) {
      rsiSignal = "偏强";
      rsiDescription = "RSI值处于中性偏强区域，市场动能较好。";
    } else {
      rsiSignal = "偏弱";
      rsiDescription = "RSI值处于中性偏弱区域，市场动能较弱。";
    }
    
    analysis["RSI"] = {
      currentValue: lastRSI,
      signal: rsiSignal,
      description: rsiDescription
    };
  }
  
  // 分析MACD
  if (indicators.MACD) {
    const macdData = indicators.MACD;
    const lastMACD = macdData[macdData.length - 1];
    const previousMACD = macdData[macdData.length - 2];
    
    let macdSignal = "中性";
    let macdDescription = "";
    
    // 判断MACD柱状图方向
    const currentHistogram = lastMACD.histogram;
    const previousHistogram = previousMACD.histogram;
    const histogramDirection = currentHistogram > previousHistogram ? "上升" : "下降";
    
    // 判断MACD交叉信号
    if (previousMACD.macd < previousMACD.signal && lastMACD.macd > lastMACD.signal) {
      macdSignal = "金叉（看涨）";
      macdDescription = "MACD线上穿信号线，形成金叉看涨信号。";
    } else if (previousMACD.macd > previousMACD.signal && lastMACD.macd < lastMACD.signal) {
      macdSignal = "死叉（看跌）";
      macdDescription = "MACD线下穿信号线，形成死叉看跌信号。";
    } else if (lastMACD.macd > lastMACD.signal) {
      macdSignal = "MACD位于信号线上方";
      macdDescription = `MACD位于信号线上方，柱状图${histogramDirection}，走势偏强。`;
    } else {
      macdSignal = "MACD位于信号线下方";
      macdDescription = `MACD位于信号线下方，柱状图${histogramDirection}，走势偏弱。`;
    }
    
    analysis["MACD"] = {
      currentValues: {
        macd: lastMACD.macd,
        signal: lastMACD.signal,
        histogram: lastMACD.histogram
      },
      histogramDirection,
      signal: macdSignal,
      description: macdDescription
    };
  }
  
  // 分析布林带
  if (indicators.BOLL) {
    const bollData = indicators.BOLL;
    const lastBoll = bollData[bollData.length - 1];
    
    let bollSignal = "中性";
    let bollDescription = "";
    
    // 判断价格相对布林带位置
    if (lastPrice > lastBoll.upper) {
      bollSignal = "价格突破上轨";
      bollDescription = "价格位于布林带上轨之上，可能处于强势上涨趋势，但也有超买风险。";
    } else if (lastPrice < lastBoll.lower) {
      bollSignal = "价格突破下轨";
      bollDescription = "价格位于布林带下轨之下，可能处于强势下跌趋势，但也有超卖机会。";
    } else if (lastPrice > lastBoll.middle) {
      bollSignal = "价格位于中轨和上轨之间";
      bollDescription = "价格位于布林带中轨和上轨之间，走势偏强。";
    } else {
      bollSignal = "价格位于中轨和下轨之间";
      bollDescription = "价格位于布林带中轨和下轨之间，走势偏弱。";
    }
    
    // 计算布林带宽度
    const bandWidth = ((lastBoll.upper - lastBoll.lower) / lastBoll.middle) * 100;
    let bandWidthDescription = "";
    
    if (bandWidth < 2) {
      bandWidthDescription = "布林带收窄，可能即将出现剧烈波动。";
    } else if (bandWidth > 5) {
      bandWidthDescription = "布林带宽度较大，市场波动性较高。";
    } else {
      bandWidthDescription = "布林带宽度正常，市场波动性适中。";
    }
    
    analysis["BOLL"] = {
      currentValues: {
        upper: lastBoll.upper,
        middle: lastBoll.middle,
        lower: lastBoll.lower,
        bandwidth: bandWidth.toFixed(2) + "%"
      },
      signal: bollSignal,
      description: bollDescription,
      bandwidthAnalysis: bandWidthDescription
    };
  }
  
  // 分析KDJ
  if (indicators.KDJ) {
    const kdjData = indicators.KDJ;
    const lastKDJ = kdjData[kdjData.length - 1];
    const previousKDJ = kdjData[kdjData.length - 2];
    
    let kdjSignal = "中性";
    let kdjDescription = "";
    
    // 判断KDJ值区域
    if (lastKDJ.k > 80 && lastKDJ.d > 80) {
      kdjSignal = "严重超买";
      kdjDescription = "K和D值都处于超买区域，可能面临回调风险。";
    } else if (lastKDJ.k < 20 && lastKDJ.d < 20) {
      kdjSignal = "严重超卖";
      kdjDescription = "K和D值都处于超卖区域，可能出现反弹机会。";
    } 
    // 判断KDJ交叉信号
    else if (previousKDJ.k < previousKDJ.d && lastKDJ.k > lastKDJ.d) {
      kdjSignal = "金叉（看涨）";
      kdjDescription = "K线上穿D线，形成金叉看涨信号。";
    } else if (previousKDJ.k > previousKDJ.d && lastKDJ.k < lastKDJ.d) {
      kdjSignal = "死叉（看跌）";
      kdjDescription = "K线下穿D线，形成死叉看跌信号。";
    } else if (lastKDJ.j > 100) {
      kdjSignal = "J值超买";
      kdjDescription = "J值处于超买区域，可能面临回调风险。";
    } else if (lastKDJ.j < 0) {
      kdjSignal = "J值超卖";
      kdjDescription = "J值处于超卖区域，可能出现反弹机会。";
    } else if (lastKDJ.k > lastKDJ.d) {
      kdjSignal = "K线位于D线上方";
      kdjDescription = "K线位于D线上方，走势偏强。";
    } else {
      kdjSignal = "K线位于D线下方";
      kdjDescription = "K线位于D线下方，走势偏弱。";
    }
    
    analysis["KDJ"] = {
      currentValues: {
        k: lastKDJ.k,
        d: lastKDJ.d,
        j: lastKDJ.j
      },
      signal: kdjSignal,
      description: kdjDescription
    };
  }
  
  // 综合分析
  const signals = Object.values(analysis).map((item: any) => item.signal);
  const bullishSignals = signals.filter(signal => signal.includes("看涨") || signal.includes("金叉") || signal.includes("超卖"));
  const bearishSignals = signals.filter(signal => signal.includes("看跌") || signal.includes("死叉") || signal.includes("超买"));
  
  let overallSignal = "中性";
  if (bullishSignals.length > bearishSignals.length) {
    overallSignal = "看涨";
  } else if (bearishSignals.length > bullishSignals.length) {
    overallSignal = "看跌";
  }
  
  analysis["综合分析"] = {
    bullishSignalsCount: bullishSignals.length,
    bearishSignalsCount: bearishSignals.length,
    overallSignal
  };
  
  return analysis;
} 