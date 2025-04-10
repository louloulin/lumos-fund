'use server';

import { createLogger } from '@/lib/logger.server';
import { Strategy, PriceData, TradeSignal, PortfolioState } from './backtestService';
import { MarketDataService } from './marketDataService';

// 创建日志记录器
const logger = createLogger('backtest-strategies');

/**
 * 移动平均线计算
 */
function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }
  
  const recentPrices = prices.slice(-period);
  return recentPrices.reduce((sum, price) => sum + price, 0) / period;
}

/**
 * RSI计算
 */
function calculateRSI(prices: number[], period: number): number {
  if (prices.length <= period) {
    return 50;
  }
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  if (losses === 0) {
    return 100;
  }
  
  const relativeStrength = gains / losses;
  return 100 - (100 / (1 + relativeStrength));
}

/**
 * 布林带计算
 */
function calculateBollingerBands(prices: number[], period: number, deviations: number): { upper: number, middle: number, lower: number } {
  const sma = calculateMA(prices, period);
  
  // 计算标准差
  let sumSquaredDeviation = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    sumSquaredDeviation += Math.pow(prices[i] - sma, 2);
  }
  
  const standardDeviation = Math.sqrt(sumSquaredDeviation / period);
  
  return {
    upper: sma + (standardDeviation * deviations),
    middle: sma,
    lower: sma - (standardDeviation * deviations)
  };
}

/**
 * 计算MACD
 */
function calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { macd: number, signal: number, histogram: number } {
  if (prices.length < slowPeriod + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  
  // 计算快线EMA
  const fastEMA = calculateEMA(prices, fastPeriod);
  
  // 计算慢线EMA
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // 计算MACD线
  const macdLine = fastEMA - slowEMA;
  
  // 计算信号线 (MACD的EMA)
  const macdValues = [];
  for (let i = 0; i < signalPeriod; i++) {
    // 简化：模拟前几天的MACD值以计算EMA
    macdValues.push(macdLine);
  }
  const signalLine = calculateEMA([...macdValues, macdLine], signalPeriod);
  
  // 计算柱状图
  const histogram = macdLine - signalLine;
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram
  };
}

/**
 * 计算EMA (指数移动平均线)
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }
  
  const k = 2 / (period + 1);
  
  // 使用SMA作为第一个EMA值
  let ema = calculateMA(prices.slice(0, period), period);
  
  // 计算剩余价格的EMA
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
  }
  
  return ema;
}

/**
 * 动量计算
 */
function calculateMomentum(prices: number[], period: number): number {
  if (prices.length <= period) {
    return 0;
  }
  
  const currentPrice = prices[prices.length - 1];
  const pastPrice = prices[prices.length - 1 - period];
  
  return (currentPrice / pastPrice) - 1;
}

/**
 * 价值投资策略
 */
export const valueStrategy: Strategy = {
  name: '价值投资策略',
  description: '基于基本面指标的长期投资策略，寻找低估且具有增长潜力的资产',
  
  generateSignal: async (priceData: PriceData, date: string, portfolio?: PortfolioState): Promise<TradeSignal | null> => {
    try {
      // 在实际实现中，这里应该调用财务数据API获取PE、PB等基本面指标
      // 这里使用模拟数据作为示例
      const simulatedPE = 15 + Math.sin(new Date(date).getTime() / 8640000000) * 10;
      const simulatedPB = 2 + Math.cos(new Date(date).getTime() / 8640000000) * 1;
      const simulatedDividendYield = 0.03 + Math.sin(new Date(date).getTime() / 4320000000) * 0.01;
      
      // 评估基本面
      const isPELow = simulatedPE < 15;
      const isPBLow = simulatedPB < 2;
      const isDividendHigh = simulatedDividendYield > 0.03;
      
      // 价格趋势
      const isUptrendingPrice = priceData.close > priceData.open;
      
      // 决策逻辑
      if (isPELow && isPBLow && isDividendHigh) {
        // 基本面良好，适合买入
        if (portfolio && !portfolio.holdings.some(h => h.ticker === priceData.ticker)) {
          // 没有持仓，买入
          const suggestedQuantity = Math.floor(portfolio.cash * 0.95 / priceData.close);
          return {
            action: 'buy',
            ticker: priceData.ticker,
            quantity: suggestedQuantity,
            confidence: 0.8,
            reasoning: '低PE、低PB、高股息，基本面良好'
          };
        }
      } else if (portfolio && portfolio.holdings.some(h => h.ticker === priceData.ticker)) {
        // 有持仓但基本面转差，考虑卖出
        if (!isPELow && !isPBLow && !isDividendHigh) {
          return {
            action: 'sell',
            ticker: priceData.ticker,
            confidence: 0.7,
            reasoning: '基本面指标转差，建议卖出'
          };
        }
      }
      
      return {
        action: 'hold',
        ticker: priceData.ticker,
        confidence: 0.6,
        reasoning: '基本面指标未达到买入或卖出阈值'
      };
    } catch (error) {
      logger.error(`生成价值投资信号失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
};

/**
 * 趋势跟踪策略
 */
export const trendFollowingStrategy: Strategy = {
  name: '趋势跟踪策略',
  description: '使用移动平均线和动量指标跟踪中长期趋势，在趋势形成时入场，趋势衰竭时离场',
  
  generateSignal: async (priceData: PriceData, date: string, portfolio?: PortfolioState): Promise<TradeSignal | null> => {
    try {
      // 检查是否有足够的历史数据
      if (!priceData || !priceData.date) {
        return null;
      }
      
      // 在实际实现中，应该从数据服务获取历史价格
      // 以下为模拟历史价格获取
      const marketDataService = new MarketDataService();
      const history = await marketDataService.fetchStockPriceHistory(priceData.ticker, '60d', date);
      
      if (history.length < 50) {
        return null;
      }
      
      // 提取历史收盘价
      const closePrices = history.map(item => item.close);
      
      // 计算移动平均线
      const ma20 = calculateMA(closePrices, 20);
      const ma50 = calculateMA(closePrices, 50);
      
      // 计算MACD
      const macd = calculateMACD(closePrices);
      
      // 计算相对强弱指标(RSI)
      const rsi = calculateRSI(closePrices, 14);
      
      // 计算动量
      const momentum = calculateMomentum(closePrices, 10);
      
      // 趋势信号
      const isMaUptrend = ma20 > ma50;
      const isMacdPositive = macd.histogram > 0;
      const isStrengthening = rsi > 50 && rsi < 70;
      const hasPositiveMomentum = momentum > 0;
      
      // 综合信号评分 (0-100)
      let signalScore = 0;
      signalScore += isMaUptrend ? 25 : 0;
      signalScore += isMacdPositive ? 25 : 0;
      signalScore += isStrengthening ? 25 : 0;
      signalScore += hasPositiveMomentum ? 25 : 0;
      
      // 决策逻辑
      if (signalScore >= 75) {
        // 强烈的买入信号
        if (portfolio && !portfolio.holdings.some(h => h.ticker === priceData.ticker)) {
          // 没有持仓，买入
          const suggestedQuantity = Math.floor(portfolio.cash * 0.9 / priceData.close);
          return {
            action: 'buy',
            ticker: priceData.ticker,
            quantity: suggestedQuantity,
            confidence: signalScore / 100,
            reasoning: '强烈上升趋势，多个指标确认'
          };
        }
      } else if (signalScore <= 25) {
        // 强烈的卖出信号
        if (portfolio && portfolio.holdings.some(h => h.ticker === priceData.ticker)) {
          return {
            action: 'sell',
            ticker: priceData.ticker,
            confidence: (100 - signalScore) / 100,
            reasoning: '趋势衰竭，多个指标确认下行趋势'
          };
        }
      }
      
      return {
        action: 'hold',
        ticker: priceData.ticker,
        confidence: 0.5,
        reasoning: '趋势不明确，持仓观望'
      };
    } catch (error) {
      logger.error(`生成趋势跟踪信号失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
};

/**
 * 均值回归策略
 */
export const meanReversionStrategy: Strategy = {
  name: '均值回归策略',
  description: '基于价格偏离均值过度会回归的原理，使用布林带和超买超卖指标寻找交易机会',
  
  generateSignal: async (priceData: PriceData, date: string, portfolio?: PortfolioState): Promise<TradeSignal | null> => {
    try {
      // 检查是否有足够的历史数据
      if (!priceData || !priceData.date) {
        return null;
      }
      
      // 在实际实现中，应该从数据服务获取历史价格
      const marketDataService = new MarketDataService();
      const history = await marketDataService.fetchStockPriceHistory(priceData.ticker, '30d', date);
      
      if (history.length < 20) {
        return null;
      }
      
      // 提取历史收盘价
      const closePrices = history.map(item => item.close);
      
      // 计算布林带 (20日, 2标准差)
      const bollingerBands = calculateBollingerBands(closePrices, 20, 2);
      
      // 计算RSI
      const rsi = calculateRSI(closePrices, 14);
      
      // 当前价格与布林带关系
      const currentPrice = priceData.close;
      const isNearLowerBand = currentPrice < bollingerBands.lower * 1.02;
      const isNearUpperBand = currentPrice > bollingerBands.upper * 0.98;
      
      // RSI超买超卖判断
      const isOversold = rsi < 30;
      const isOverbought = rsi > 70;
      
      // 决策逻辑
      if (isNearLowerBand && isOversold) {
        // 超卖信号，考虑买入
        if (portfolio && !portfolio.holdings.some(h => h.ticker === priceData.ticker)) {
          const suggestedQuantity = Math.floor(portfolio.cash * 0.8 / priceData.close);
          return {
            action: 'buy',
            ticker: priceData.ticker,
            quantity: suggestedQuantity,
            confidence: 0.7 + (30 - rsi) / 100, // 信心值随RSI降低而提高
            reasoning: '价格接近布林带下轨，RSI超卖，预期回归均值'
          };
        }
      } else if (isNearUpperBand && isOverbought) {
        // 超买信号，考虑卖出
        if (portfolio && portfolio.holdings.some(h => h.ticker === priceData.ticker)) {
          return {
            action: 'sell',
            ticker: priceData.ticker,
            confidence: 0.7 + (rsi - 70) / 100, // 信心值随RSI升高而提高
            reasoning: '价格接近布林带上轨，RSI超买，预期回归均值'
          };
        }
      }
      
      return {
        action: 'hold',
        ticker: priceData.ticker,
        confidence: 0.5,
        reasoning: '价格在合理区间内，无明显均值回归信号'
      };
    } catch (error) {
      logger.error(`生成均值回归信号失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
};

/**
 * 风险管理策略
 */
export const riskManagementStrategy: Strategy = {
  name: '风险管理策略',
  description: '基于波动率和止损止盈的风险控制策略，注重资金的保全和风险的控制',
  
  generateSignal: async (priceData: PriceData, date: string, portfolio?: PortfolioState): Promise<TradeSignal | null> => {
    try {
      // 检查是否有足够的历史数据
      if (!priceData || !priceData.date || !portfolio) {
        return null;
      }
      
      // 在实际实现中，应该从数据服务获取历史价格
      const marketDataService = new MarketDataService();
      const history = await marketDataService.fetchStockPriceHistory(priceData.ticker, '30d', date);
      
      if (history.length < 20) {
        return null;
      }
      
      // 提取历史收盘价
      const closePrices = history.map(item => item.close);
      
      // 计算波动率（过去20天的标准差/平均价格）
      const mean = closePrices.reduce((sum, price) => sum + price, 0) / closePrices.length;
      const variance = closePrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / closePrices.length;
      const volatility = Math.sqrt(variance) / mean;
      
      // 计算过去10天的最高价和最低价
      const recentHighest = Math.max(...closePrices.slice(-10));
      const recentLowest = Math.min(...closePrices.slice(-10));
      
      // 找到该股票的持仓
      const holding = portfolio.holdings.find(h => h.ticker === priceData.ticker);
      
      // 风险管理决策逻辑
      if (holding) {
        // 已有持仓，检查止盈止损条件
        const profitLoss = (priceData.close - holding.entryPrice) / holding.entryPrice;
        
        // 止损条件：亏损超过8%或价格低于近期最低点95%
        if (profitLoss < -0.08 || priceData.close < recentLowest * 0.95) {
          return {
            action: 'sell',
            ticker: priceData.ticker,
            confidence: 0.9,
            reasoning: '触发止损条件，控制亏损'
          };
        }
        
        // 止盈条件：盈利超过20%或价格高于近期最高点的98%且波动率增加
        if (profitLoss > 0.2 || (priceData.close > recentHighest * 0.98 && volatility > 0.08)) {
          return {
            action: 'sell',
            ticker: priceData.ticker,
            confidence: 0.8,
            reasoning: '达到预期收益目标，波动率增加，获利了结'
          };
        }
        
        // 部分获利条件：盈利超过12%且未达到止盈标准
        if (profitLoss > 0.12 && profitLoss < 0.2) {
          const sellQuantity = Math.floor(holding.quantity * 0.3); // 卖出30%的持仓
          if (sellQuantity > 0) {
            return {
              action: 'sell',
              ticker: priceData.ticker,
              quantity: sellQuantity,
              confidence: 0.7,
              reasoning: '部分获利，降低风险暴露'
            };
          }
        }
      } else {
        // 无持仓，考虑建仓时机
        // 低波动率环境，且价格处于支撑位附近时买入
        if (volatility < 0.05 && priceData.close < recentLowest * 1.05) {
          const suggestedQuantity = Math.floor(portfolio.cash * 0.6 / priceData.close); // 使用60%资金
          return {
            action: 'buy',
            ticker: priceData.ticker,
            quantity: suggestedQuantity,
            confidence: 0.7,
            reasoning: '低波动率环境，价格接近支撑位，风险可控'
          };
        }
      }
      
      return {
        action: 'hold',
        ticker: priceData.ticker,
        confidence: 0.6,
        reasoning: '当前风险收益比不佳，持仓观望'
      };
    } catch (error) {
      logger.error(`生成风险管理信号失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
};

/**
 * 混合策略 - 结合多种策略的信号
 */
export const hybridStrategy: Strategy = {
  name: '混合策略',
  description: '结合价值、趋势和均值回归的综合策略，根据不同市场环境调整策略权重',
  
  generateSignal: async (priceData: PriceData, date: string, portfolio?: PortfolioState): Promise<TradeSignal | null> => {
    try {
      // 获取各策略的信号
      const valueSignal = await valueStrategy.generateSignal(priceData, date, portfolio);
      const trendSignal = await trendFollowingStrategy.generateSignal(priceData, date, portfolio);
      const revertSignal = await meanReversionStrategy.generateSignal(priceData, date, portfolio);
      const riskSignal = await riskManagementStrategy.generateSignal(priceData, date, portfolio);
      
      // 检查各策略是否生成了有效信号
      if (!valueSignal || !trendSignal || !revertSignal || !riskSignal) {
        return null;
      }
      
      // 定义策略权重
      const weights = {
        value: 0.25,
        trend: 0.30,
        revert: 0.20,
        risk: 0.25
      };
      
      // 计算加权行动类型
      const actions = {
        buy: 0,
        sell: 0,
        hold: 0
      };
      
      // 累加加权得分
      if (valueSignal.action === 'buy') actions.buy += weights.value * (valueSignal.confidence || 0.5);
      else if (valueSignal.action === 'sell') actions.sell += weights.value * (valueSignal.confidence || 0.5);
      else actions.hold += weights.value * (valueSignal.confidence || 0.5);
      
      if (trendSignal.action === 'buy') actions.buy += weights.trend * (trendSignal.confidence || 0.5);
      else if (trendSignal.action === 'sell') actions.sell += weights.trend * (trendSignal.confidence || 0.5);
      else actions.hold += weights.trend * (trendSignal.confidence || 0.5);
      
      if (revertSignal.action === 'buy') actions.buy += weights.revert * (revertSignal.confidence || 0.5);
      else if (revertSignal.action === 'sell') actions.sell += weights.revert * (revertSignal.confidence || 0.5);
      else actions.hold += weights.revert * (revertSignal.confidence || 0.5);
      
      if (riskSignal.action === 'buy') actions.buy += weights.risk * (riskSignal.confidence || 0.5);
      else if (riskSignal.action === 'sell') actions.sell += weights.risk * (riskSignal.confidence || 0.5);
      else actions.hold += weights.risk * (riskSignal.confidence || 0.5);
      
      // 确定最终行动
      let finalAction: 'buy' | 'sell' | 'hold' = 'hold';
      let maxScore = actions.hold;
      
      if (actions.buy > maxScore) {
        maxScore = actions.buy;
        finalAction = 'buy';
      }
      
      if (actions.sell > maxScore) {
        maxScore = actions.sell;
        finalAction = 'sell';
      }
      
      // 计算最终置信度
      const confidence = maxScore / Math.max(weights.value + weights.trend + weights.revert + weights.risk, 0.0001);
      
      // 生成交易量建议
      let quantity;
      if (finalAction === 'buy' && portfolio) {
        // 根据置信度调整买入资金比例
        const investRatio = 0.3 + (confidence * 0.5); // 置信度越高，投入资金比例越大
        quantity = Math.floor(portfolio.cash * investRatio / priceData.close);
      } else if (finalAction === 'sell' && portfolio) {
        const holding = portfolio.holdings.find(h => h.ticker === priceData.ticker);
        if (holding) {
          // 根据置信度决定卖出比例
          const sellRatio = 0.5 + (confidence * 0.5); // 置信度越高，卖出比例越大
          quantity = Math.floor(holding.quantity * sellRatio);
        }
      }
      
      // 构建推理过程
      let reasoning = `混合策略综合分析：\n`;
      reasoning += `价值策略(${(weights.value * 100).toFixed(0)}%权重): ${valueSignal.action} (${valueSignal.reasoning})\n`;
      reasoning += `趋势策略(${(weights.trend * 100).toFixed(0)}%权重): ${trendSignal.action} (${trendSignal.reasoning})\n`;
      reasoning += `均值策略(${(weights.revert * 100).toFixed(0)}%权重): ${revertSignal.action} (${revertSignal.reasoning})\n`;
      reasoning += `风控策略(${(weights.risk * 100).toFixed(0)}%权重): ${riskSignal.action} (${riskSignal.reasoning})\n`;
      reasoning += `最终建议: ${finalAction}，置信度: ${(confidence * 100).toFixed(0)}%`;
      
      return {
        action: finalAction,
        ticker: priceData.ticker,
        quantity,
        confidence,
        reasoning
      };
    } catch (error) {
      logger.error(`生成混合策略信号失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
};

// 导出所有策略
export const strategies = {
  value: valueStrategy,
  trendFollowing: trendFollowingStrategy,
  meanReversion: meanReversionStrategy,
  riskManagement: riskManagementStrategy,
  hybrid: hybridStrategy
}; 