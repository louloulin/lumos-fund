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
  strategy: (data: StockData[]) => { signal: 'buy' | 'sell' | 'hold' }
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
      const { signal } = strategy(currentData);
      
      // 执行交易
      if (signal === 'buy' && cash > 0) {
        const sharesToBuy = Math.floor(cash / currentDay.close);
        if (sharesToBuy > 0) {
          trades.push({
            date: currentDay.date,
            type: 'buy',
            price: currentDay.close,
            shares: sharesToBuy
          });
          
          shares += sharesToBuy;
          cash -= sharesToBuy * currentDay.close;
        }
      } else if (signal === 'sell' && shares > 0) {
        const saleProceeds = shares * currentDay.close;
        const costBasis = trades
          .filter(t => t.type === 'buy')
          .reduce((sum, t) => sum + (t.price * t.shares), 0);
        
        const profit = saleProceeds - costBasis;
        
        trades.push({
          date: currentDay.date,
          type: 'sell',
          price: currentDay.close,
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
      equity = cash + (shares * currentDay.close);
      
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
  const technicalStrategy = (data: StockData[]): { signal: 'buy' | 'sell' | 'hold' } => {
    // 确保有足够的数据来计算指标
    if (data.length < 20) {
      return { signal: 'hold' };
    }
    
    // 计算技术指标
    const technicalIndicators = calculateTechnicalIndicators(data);
    const current = data[data.length - 1];
    const previousDay = data[data.length - 2];
    
    // 使用正确的属性名
    const ma20 = technicalIndicators.ma20 || [];
    const ma60 = technicalIndicators.ma60 || [];
    const rsi14 = technicalIndicators.rsi14 || [];
    
    const currentMA20 = ma20[ma20.length - 1];
    const previousMA20 = ma20[ma20.length - 2];
    const currentMA60 = ma60[ma60.length - 1];
    const previousMA60 = ma60[ma60.length - 2];
    const currentRSI = rsi14[rsi14.length - 1];
    
    // 简单的均线交叉策略
    if (currentMA20 && currentMA60 && previousMA20 && previousMA60) {
      if (previousMA20 < previousMA60 && currentMA20 > currentMA60) {
        // 短期均线上穿长期均线，买入信号
        return { signal: 'buy' };
      } else if (previousMA20 > previousMA60 && currentMA20 < currentMA60) {
        // 短期均线下穿长期均线，卖出信号
        return { signal: 'sell' };
      }
    }
    
    // RSI策略
    if (currentRSI !== null) {
      if (currentRSI > 70) {
        // RSI超买，卖出信号
        return { signal: 'sell' };
      } else if (currentRSI < 30) {
        // RSI超卖，买入信号
        return { signal: 'buy' };
      }
    }
    
    // 无明确信号
    return { signal: 'hold' };
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
  // 获取情绪数据
  const newsData = generateNewsData(ticker, startDate, endDate);
  
  // 情绪分析策略
  const sentimentStrategy = (data: StockData[]): { signal: 'buy' | 'sell' | 'hold' } => {
    const currentDate = data[data.length - 1].date;
    
    // 从情绪数据中找到最近的新闻
    const recentNews = newsData
      .filter(news => new Date(news.date) <= new Date(currentDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    
    // 计算情绪得分
    const sentimentScore = recentNews.reduce((score, news) => score + news.sentiment, 0) / (recentNews.length || 1);
    
    // 基于情绪得分的交易策略
    if (sentimentScore > 0.6) {
      // 积极情绪，买入信号
      return { signal: 'buy' };
    } else if (sentimentScore < -0.3) {
      // 消极情绪，卖出信号
      return { signal: 'sell' };
    }
    
    // 无明确信号
    return { signal: 'hold' };
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
  const riskStrategy = (data: StockData[]): { signal: 'buy' | 'sell' | 'hold' } => {
    // 确保有足够的数据
    if (data.length < 20) {
      return { signal: 'hold' };
    }
    
    const current = data[data.length - 1];
    const priceHistory = data.slice(-20).map(d => d.close);
    
    // 计算波动率（标准差）
    const mean = priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length;
    const variance = priceHistory.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / priceHistory.length;
    const volatility = Math.sqrt(variance) / mean; // 相对波动率
    
    // 计算过去10天的最高价
    const highestPrice = Math.max(...data.slice(-10).map(d => d.high));
    // 计算过去10天的最低价
    const lowestPrice = Math.min(...data.slice(-10).map(d => d.low));
    
    // 自适应风险管理策略
    if (volatility < 0.05 && current.close > mean * 1.05) {
      // 低波动率环境，且价格上升，买入
      return { signal: 'buy' };
    } else if (volatility > 0.1 || current.close < lowestPrice * 1.02) {
      // 高波动率环境，或价格接近近期低点，卖出
      return { signal: 'sell' };
    } else if (current.close > highestPrice * 0.95 && volatility > 0.08) {
      // 价格接近近期高点且波动率增加，卖出获利
      return { signal: 'sell' };
    }
    
    // 无明确信号
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
  // 获取财务指标和情绪数据
  const financials = generateFinancialMetrics(ticker);
  const newsData = generateNewsData(ticker, startDate, endDate);
  
  // 混合策略
  const mixedStrategy = (data: StockData[]): { signal: 'buy' | 'sell' | 'hold' } => {
    // 确保有足够的数据
    if (data.length < 20) {
      return { signal: 'hold' };
    }
    
    const current = data[data.length - 1];
    const previousDay = data[data.length - 2];
    
    // 计算技术指标
    const technicalIndicators = calculateTechnicalIndicators(data);
    const ma20 = technicalIndicators.ma20 || [];
    const ma60 = technicalIndicators.ma60 || [];
    const rsi14 = technicalIndicators.rsi14 || [];
    
    const currentMA20 = ma20[ma20.length - 1];
    const currentMA60 = ma60[ma60.length - 1];
    const currentRSI = rsi14[rsi14.length - 1];
    
    // 获取情绪指标
    const currentDate = current.date;
    const recentNews = newsData
      .filter(news => new Date(news.date) <= new Date(currentDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    const sentimentScore = recentNews.reduce((score, news) => score + news.sentiment, 0) / (recentNews.length || 1);
    
    // 综合多因素评分系统
    let score = 0;
    
    // 技术因素 (权重: 40%)
    if (currentMA20 && currentMA60 && currentMA20 > currentMA60) score += 2; // 短期均线在长期均线上方
    if (currentMA20 && current.close > currentMA20) score += 1; // 价格在短期均线上方
    if (currentRSI !== null) {
      if (currentRSI < 30) score += 2; // RSI超卖
      if (currentRSI > 70) score -= 2; // RSI超买
    }
    
    // 基本面因素 (权重: 30%)
    if (financials.pe_ratio < 15) score += 1.5; // PE较低
    if (financials.debt_to_equity < 1) score += 1; // 较低的负债率
    if (financials.profit_margin > 0.15) score += 1; // 较高的利润率
    
    // 情绪因素 (权重: 30%)
    score += sentimentScore * 3; // 情绪得分 (-1到1) * 3
    
    // 根据综合评分做出决策
    if (score > 4) {
      return { signal: 'buy' };
    } else if (score < -2) {
      return { signal: 'sell' };
    }
    
    // 无明确信号
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