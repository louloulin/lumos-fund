'use server'

import { generateHistoricalPrices, generateFinancialMetrics, generateNewsData, calculateTechnicalIndicators, type StockData } from '../lib/mocks';

// 回测结果类型
export interface BacktestResult {
  equityCurve: { date: string; value: number }[];
  metrics: {
    totalReturn: number;
    annualizedReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    profitFactor: number;
  };
  trades: {
    date: string;
    type: 'buy' | 'sell';
    price: number;
    shares: number;
    profit?: number;
  }[];
  // 比较模式会有多个结果
  results?: {
    [key: string]: {
      equityCurve: { date: string; value: number }[];
      metrics: {
        totalReturn: number;
        annualizedReturn: number;
        maxDrawdown: number;
        sharpeRatio: number;
        winRate: number;
        profitFactor: number;
      };
    }
  };
}

// 基础回测功能
async function runBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string,
  strategy: (data: StockData[], additionalData?: any) => { signal: 'buy' | 'sell' | 'hold'; price?: number }
): Promise<BacktestResult> {
  try {
    // 获取历史价格数据
    const priceData = generateHistoricalPrices(ticker, startDate, endDate);
    
    if (priceData.length === 0) {
      throw new Error('没有找到足够的历史数据进行回测');
    }
    
    // 运行策略回测
    let cash = initialCapital;
    let shares = 0;
    let equity = initialCapital;
    const equityCurve: { date: string; value: number }[] = [];
    const trades: { date: string; type: 'buy' | 'sell'; price: number; shares: number; profit?: number }[] = [];
    
    // 记录绩效指标的变量
    let maxEquity = initialCapital;
    let maxDrawdown = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let winCount = 0;
    let lossCount = 0;
    
    // 对每个交易日应用策略
    for (let i = 20; i < priceData.length; i++) { // 从第20天开始，给指标计算留出空间
      const currentData = priceData.slice(0, i + 1);
      const currentDay = currentData[i];
      
      // 运行策略获取信号
      const { signal, price = currentDay.close } = strategy(currentData);
      
      // 执行交易
      if (signal === 'buy' && cash > 0) {
        const sharesToBuy = Math.floor(cash / price);
        if (sharesToBuy > 0) {
          trades.push({
            date: currentDay.date,
            type: 'buy',
            price,
            shares: sharesToBuy
          });
          
          shares += sharesToBuy;
          cash -= sharesToBuy * price;
        }
      } else if (signal === 'sell' && shares > 0) {
        const saleProceeds = shares * price;
        const costBasis = trades
          .filter(t => t.type === 'buy')
          .reduce((sum, t) => sum + (t.price * t.shares), 0);
        
        const profit = saleProceeds - costBasis;
        
        trades.push({
          date: currentDay.date,
          type: 'sell',
          price,
          shares,
          profit
        });
        
        // 更新绩效指标
        if (profit > 0) {
          totalProfit += profit;
          winCount++;
        } else {
          totalLoss += Math.abs(profit);
          lossCount++;
        }
        
        cash += saleProceeds;
        shares = 0;
      }
      
      // 计算当前权益
      equity = cash + (shares * price);
      
      // 更新最大回撤
      if (equity > maxEquity) {
        maxEquity = equity;
      } else {
        const drawdown = (maxEquity - equity) / maxEquity;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
      
      // 记录权益曲线
      equityCurve.push({
        date: currentDay.date,
        value: equity
      });
    }
    
    // 计算回测绩效指标
    const totalDays = priceData.length;
    const annualizedReturn = Math.pow(equity / initialCapital, 252 / totalDays) - 1;
    const totalReturn = (equity / initialCapital) - 1;
    
    // 计算夏普比率 (简化版，使用无风险利率0%)
    const dailyReturns = equityCurve.map((point, i, arr) => {
      if (i === 0) return 0;
      return (point.value / arr[i - 1].value) - 1;
    }).slice(1);
    
    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const stdDailyReturn = Math.sqrt(
      dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length
    );
    
    const sharpeRatio = stdDailyReturn === 0 ? 0 : (avgDailyReturn * Math.sqrt(252)) / stdDailyReturn;
    
    // 计算胜率
    const winRate = (winCount + lossCount) === 0 ? 0 : winCount / (winCount + lossCount);
    
    // 计算盈亏比
    const profitFactor = totalLoss === 0 ? totalProfit : totalProfit / totalLoss;
    
    return {
      equityCurve,
      metrics: {
        totalReturn,
        annualizedReturn,
        maxDrawdown,
        sharpeRatio,
        winRate,
        profitFactor
      },
      trades
    };
  } catch (error) {
    console.error('回测失败:', error);
    throw error;
  }
}

// 价值投资策略回测
export async function runValueBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
): Promise<BacktestResult> {
  // 获取财务指标
  const financials = generateFinancialMetrics(ticker);
  
  // 价值投资策略
  const valueStrategy = (data: StockData[]) => {
    const current = data[data.length - 1];
    const previousDay = data[data.length - 2];
    
    // 基于PE和PB的简单价值策略
    const isPriceDecreasing = current.close < previousDay.close;
    const isPELow = financials.pe_ratio < 15;
    const isPBLow = financials.pb_ratio < 1.5;
    
    // 价格下跌且估值低时买入
    if (isPriceDecreasing && isPELow && isPBLow) {
      return { signal: 'buy' };
    }
    
    // 价格过高时卖出
    if (financials.pe_ratio > 25 || financials.pb_ratio > 3) {
      return { signal: 'sell' };
    }
    
    return { signal: 'hold' };
  };
  
  return runBacktest(ticker, initialCapital, startDate, endDate, valueStrategy);
}

// 技术分析策略回测
export async function runTechnicalBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
): Promise<BacktestResult> {
  // 技术分析策略
  const technicalStrategy = (data: StockData[]) => {
    // 计算技术指标
    const technicalData = calculateTechnicalIndicators(data);
    const current = data[data.length - 1];
    
    // MA交叉策略
    const ma5 = technicalData.ma5 || [];
    const ma20 = technicalData.ma20 || [];
    
    const currentMA5 = ma5[ma5.length - 1] ?? 0;
    const previousMA5 = ma5[ma5.length - 2] ?? 0;
    const currentMA20 = ma20[ma20.length - 1] ?? 0;
    const previousMA20 = ma20[ma20.length - 2] ?? 0;
    
    // MA5上穿MA20为买入信号
    if (previousMA5 < previousMA20 && currentMA5 > currentMA20) {
      return { signal: 'buy' as const };
    }
    
    // MA5下穿MA20为卖出信号
    if (previousMA5 > previousMA20 && currentMA5 < currentMA20) {
      return { signal: 'sell' as const };
    }
    
    // RSI超买超卖策略
    const rsi = technicalData.rsi14 || [];
    const currentRSI = rsi[rsi.length - 1];
    
    if (currentRSI !== null) {
      // RSI低于30为超卖，买入信号
      if (currentRSI < 30) {
        return { signal: 'buy' as const };
      }
      
      // RSI高于70为超买，卖出信号
      if (currentRSI > 70) {
        return { signal: 'sell' as const };
      }
    }
    
    return { signal: 'hold' as const };
  };
  
  return runBacktest(ticker, initialCapital, startDate, endDate, technicalStrategy);
}

// 情绪分析策略回测
export async function runSentimentBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
): Promise<BacktestResult> {
  // 获取新闻情绪数据
  const newsData = generateNewsData(ticker, startDate, endDate);
  
  // 情绪分析策略
  const sentimentStrategy = (data: StockData[]) => {
    const current = data[data.length - 1];
    const currentDate = current.date;
    
    // 查找当天的新闻情绪
    const todayNews = newsData.filter(news => news.date === currentDate);
    
    if (todayNews.length > 0) {
      // 计算平均情绪分数
      const avgSentiment = todayNews.reduce((sum, news) => sum + news.sentiment, 0) / todayNews.length;
      
      // 情绪显著正面时买入
      if (avgSentiment > 0.5) {
        return { signal: 'buy' as const };
      }
      
      // 情绪显著负面时卖出
      if (avgSentiment < -0.5) {
        return { signal: 'sell' as const };
      }
    }
    
    return { signal: 'hold' as const };
  };
  
  return runBacktest(ticker, initialCapital, startDate, endDate, sentimentStrategy);
}

// 风险管理策略回测
export async function runRiskBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
): Promise<BacktestResult> {
  // 风险管理策略
  const riskStrategy = (data: StockData[]) => {
    const current = data[data.length - 1];
    
    // 计算波动率（20日标准差）
    const last20Days = data.slice(-20);
    const returns = last20Days.map((day, i) => {
      if (i === 0) return 0;
      return day.close / last20Days[i - 1].close - 1;
    }).slice(1);
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // 计算止损水平 (前20天最低价的90%)
    const stopLoss = Math.min(...last20Days.map(day => day.low)) * 0.9;
    
    // 如果当前价格低于止损价，卖出
    if (current.close < stopLoss) {
      return { signal: 'sell' };
    }
    
    // 波动率低时买入
    if (volatility < 0.015 && current.close > last20Days[0].close) {
      return { signal: 'buy' };
    }
    
    // 波动率高时卖出
    if (volatility > 0.03) {
      return { signal: 'sell' };
    }
    
    return { signal: 'hold' };
  };
  
  return runBacktest(ticker, initialCapital, startDate, endDate, riskStrategy);
}

// 混合策略回测
export async function runMixedBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
): Promise<BacktestResult> {
  // 获取附加数据
  const financials = generateFinancialMetrics(ticker);
  const newsData = generateNewsData(ticker, startDate, endDate);
  
  // 混合策略
  const mixedStrategy = (data: StockData[]) => {
    // 计算技术指标
    const technicalData = calculateTechnicalIndicators(data);
    const current = data[data.length - 1];
    const currentDate = current.date;
    
    // 得分系统
    let score = 0;
    
    // 1. 技术分析得分
    const ma5 = technicalData.ma5 || [];
    const ma20 = technicalData.ma20 || [];
    const rsi = technicalData.rsi14 || [];
    
    const currentMA5 = ma5[ma5.length - 1];
    const previousMA5 = ma5[ma5.length - 2];
    const currentMA20 = ma20[ma20.length - 1];
    const previousMA20 = ma20[ma20.length - 2];
    
    // MA5上穿MA20加分
    if (previousMA5 < previousMA20 && currentMA5 > currentMA20) {
      score += 2;
    }
    
    // MA5下穿MA20减分
    if (previousMA5 > previousMA20 && currentMA5 < currentMA20) {
      score -= 2;
    }
    
    // RSI考量
    const currentRSI = rsi[rsi.length - 1];
    if (currentRSI !== null) {
      // RSI低于30超卖，加分
      if (currentRSI < 30) {
        score += 1;
      }
      
      // RSI高于70超买，减分
      if (currentRSI > 70) {
        score -= 1;
      }
    }
    
    // 2. 价值分析得分
    const isPELow = financials.pe_ratio < 15;
    const isPBLow = financials.pb_ratio < 1.5;
    
    if (isPELow) score += 1;
    if (isPBLow) score += 1;
    
    if (financials.pe_ratio > 25) score -= 1;
    if (financials.pb_ratio > 3) score -= 1;
    
    // 3. 情绪分析得分
    const todayNews = newsData.filter(news => news.date === currentDate);
    
    if (todayNews.length > 0) {
      // 计算平均情绪分数
      const avgSentiment = todayNews.reduce((sum, news) => sum + news.sentiment, 0) / todayNews.length;
      
      // 把-1到1的情绪分数转换为-2到2的得分
      score += avgSentiment * 2;
    }
    
    // 根据总分决定交易信号
    if (score >= 3) {
      return { signal: 'buy' };
    } else if (score <= -3) {
      return { signal: 'sell' };
    }
    
    return { signal: 'hold' };
  };
  
  return runBacktest(ticker, initialCapital, startDate, endDate, mixedStrategy);
}

// 对比多种策略
export async function runComparisonBacktest(
  ticker: string,
  initialCapital: number,
  startDate: string,
  endDate: string
): Promise<BacktestResult> {
  try {
    // 运行各种策略
    const valueResult = await runValueBacktest(ticker, initialCapital, startDate, endDate);
    const technicalResult = await runTechnicalBacktest(ticker, initialCapital, startDate, endDate);
    const sentimentResult = await runSentimentBacktest(ticker, initialCapital, startDate, endDate);
    const riskResult = await runRiskBacktest(ticker, initialCapital, startDate, endDate);
    const mixedResult = await runMixedBacktest(ticker, initialCapital, startDate, endDate);
    
    // 合并结果
    return {
      // 使用混合策略的交易记录
      equityCurve: mixedResult.equityCurve,
      metrics: mixedResult.metrics,
      trades: mixedResult.trades,
      // 所有策略的权益曲线和指标
      results: {
        '价值策略': {
          equityCurve: valueResult.equityCurve,
          metrics: valueResult.metrics
        },
        '技术策略': {
          equityCurve: technicalResult.equityCurve,
          metrics: technicalResult.metrics
        },
        '情绪策略': {
          equityCurve: sentimentResult.equityCurve,
          metrics: sentimentResult.metrics
        },
        '风险策略': {
          equityCurve: riskResult.equityCurve,
          metrics: riskResult.metrics
        },
        '混合策略': {
          equityCurve: mixedResult.equityCurve,
          metrics: mixedResult.metrics
        }
      }
    };
  } catch (error) {
    console.error('策略比较失败:', error);
    throw error;
  }
} 