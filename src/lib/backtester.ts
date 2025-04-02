import { createLogger } from './logger.server';

const logger = createLogger('backtester');

export interface BacktestOptions {
  ticker: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
  strategy: Strategy;
}

export interface Strategy {
  name: string;
  type: 'value' | 'technical' | 'sentiment' | 'mixed';
  params: Record<string, any>;
  generateSignal: (data: any, date: string) => Promise<{ action: string; confidence: number }>;
}

export interface TradeRecord {
  date: string;
  ticker: string;
  action: string;
  price: number;
  shares: number;
  value: number;
  fees: number;
}

export interface PortfolioState {
  cash: number;
  holdings: {
    ticker: string;
    shares: number;
    averageCost: number;
  }[];
  trades: TradeRecord[];
  value: number;
  equityCurve: { date: string; value: number }[];
}

export interface BacktestResult {
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number;
  returns: number;
  annualizedReturns: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: TradeRecord[];
  equityCurve: { date: string; value: number }[];
  metrics: Record<string, any>;
}

export class Backtester {
  // 模拟历史价格数据
  private generateHistoricalPrices(ticker: string, startDate: string, endDate: string): any[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const priceData = [];
    
    // 模拟起始价格，介于50和200之间
    let currentPrice = 50 + Math.random() * 150;
    const volatility = 0.015; // 日波动率

    // 生成交易日数据
    let currentDate = new Date(start);
    while (currentDate <= end) {
      // 跳过周末
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // 生成当日价格变化率（正态分布）
        const change = (Math.random() * 2 - 1) * volatility;
        currentPrice = currentPrice * (1 + change);
        
        // 生成高低开收价
        const open = currentPrice * (1 + (Math.random() * 0.01 - 0.005));
        const high = Math.max(open, currentPrice) * (1 + Math.random() * 0.01);
        const low = Math.min(open, currentPrice) * (1 - Math.random() * 0.01);
        
        // 生成成交量
        const volume = Math.floor(100000 + Math.random() * 10000000);
        
        priceData.push({
          date: currentDate.toISOString().split('T')[0],
          ticker,
          open,
          high,
          low,
          close: currentPrice,
          volume,
          change: change * 100,
          changePercent: change * 100
        });
      }
      
      // 下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return priceData;
  }
  
  // 计算投资组合价值
  private calculatePortfolioValue(portfolio: PortfolioState, priceData: any): number {
    const { date, close } = priceData;
    let holdingsValue = 0;
    
    // 计算持仓市值
    for (const holding of portfolio.holdings) {
      if (holding.ticker === priceData.ticker && holding.shares > 0) {
        holdingsValue += holding.shares * close;
      }
    }
    
    return portfolio.cash + holdingsValue;
  }
  
  // 执行交易
  private executeTrade(
    portfolio: PortfolioState, 
    action: string, 
    ticker: string, 
    price: number, 
    date: string, 
    confidence: number
  ): void {
    const commissionRate = 0.001; // 0.1% 交易费率
    
    // 基于信号强度确定交易量
    const actionStrength = Math.min(Math.max(confidence / 100, 0.1), 1);
    
    if (action === 'buy' || action === 'long') {
      // 计算可用资金（考虑费用）
      const availableCash = portfolio.cash * actionStrength;
      if (availableCash <= 0) return;

      // 计算可买入的股数 (四舍五入到整数)
      let sharesToBuy = Math.floor(availableCash / (price * (1 + commissionRate)));
      if (sharesToBuy <= 0) return;
      
      // 计算交易费用和总成本
      const fees = price * sharesToBuy * commissionRate;
      const totalCost = price * sharesToBuy + fees;
      
      // 更新投资组合
      portfolio.cash -= totalCost;
      
      // 查找或创建持仓记录
      const existingHolding = portfolio.holdings.find(h => h.ticker === ticker);
      if (existingHolding) {
        // 更新平均成本
        const totalShares = existingHolding.shares + sharesToBuy;
        const totalInvestment = existingHolding.shares * existingHolding.averageCost + sharesToBuy * price;
        existingHolding.averageCost = totalInvestment / totalShares;
        existingHolding.shares = totalShares;
      } else {
        // 创建新持仓
        portfolio.holdings.push({
          ticker,
          shares: sharesToBuy,
          averageCost: price
        });
      }
      
      // 记录交易
      portfolio.trades.push({
        date,
        ticker,
        action: 'buy',
        price,
        shares: sharesToBuy,
        value: price * sharesToBuy,
        fees
      });
      
      logger.info(`${date}: 买入 ${ticker} ${sharesToBuy} 股，价格: $${price.toFixed(2)}`);
      
    } else if (action === 'sell' || action === 'short') {
      // 查找持仓
      const holdingIndex = portfolio.holdings.findIndex(h => h.ticker === ticker);
      if (holdingIndex === -1) return;
      
      const holding = portfolio.holdings[holdingIndex];
      const sharesToSell = Math.floor(holding.shares * actionStrength);
      if (sharesToSell <= 0) return;
      
      // 计算交易费用和总收入
      const revenue = price * sharesToSell;
      const fees = revenue * commissionRate;
      const netRevenue = revenue - fees;
      
      // 更新投资组合
      portfolio.cash += netRevenue;
      holding.shares -= sharesToSell;
      
      // 如果全部卖出，删除持仓
      if (holding.shares <= 0) {
        portfolio.holdings.splice(holdingIndex, 1);
      }
      
      // 记录交易
      portfolio.trades.push({
        date,
        ticker,
        action: 'sell',
        price,
        shares: sharesToSell,
        value: revenue,
        fees
      });
      
      logger.info(`${date}: 卖出 ${ticker} ${sharesToSell} 股，价格: $${price.toFixed(2)}`);
    }
  }
  
  // 计算回测性能指标
  private calculatePerformanceMetrics(
    equityCurve: { date: string; value: number }[],
    initialCapital: number
  ): {
    finalValue: number;
    returns: number;
    annualizedReturns: number;
    maxDrawdown: number;
    sharpeRatio: number;
    metrics: Record<string, any>;
  } {
    if (equityCurve.length === 0) {
      return {
        finalValue: initialCapital,
        returns: 0,
        annualizedReturns: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        metrics: {}
      };
    }
    
    // 计算最终价值和总回报率
    const finalValue = equityCurve[equityCurve.length - 1].value;
    const totalReturn = (finalValue - initialCapital) / initialCapital;
    
    // 计算年化回报率
    const startDate = new Date(equityCurve[0].date);
    const endDate = new Date(equityCurve[equityCurve.length - 1].date);
    const yearFraction = (endDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / yearFraction) - 1;
    
    // 计算最大回撤
    let maxDrawdown = 0;
    let peak = equityCurve[0].value;
    
    for (let i = 1; i < equityCurve.length; i++) {
      const currentValue = equityCurve[i].value;
      peak = Math.max(peak, currentValue);
      const drawdown = (peak - currentValue) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    // 计算每日回报率
    const dailyReturns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prevValue = equityCurve[i - 1].value;
      const currValue = equityCurve[i].value;
      dailyReturns.push((currValue - prevValue) / prevValue);
    }
    
    // 计算夏普比率（假设无风险收益率为0%）
    const meanDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const stdDailyReturn = Math.sqrt(
      dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanDailyReturn, 2), 0) / dailyReturns.length
    );
    const sharpeRatio = meanDailyReturn / stdDailyReturn * Math.sqrt(252); // 年化
    
    return {
      finalValue,
      returns: totalReturn,
      annualizedReturns: annualizedReturn,
      maxDrawdown,
      sharpeRatio,
      metrics: {
        totalTradingDays: equityCurve.length,
        volatility: stdDailyReturn * Math.sqrt(252), // 年化波动率
        // 其他指标...
      }
    };
  }
  
  // 运行回测
  public async runBacktest(options: BacktestOptions): Promise<BacktestResult> {
    const { ticker, initialCapital, startDate, endDate, strategy } = options;
    
    logger.info(`开始回测 ${ticker}: ${strategy.name}, 从 ${startDate} 到 ${endDate}`);
    
    // 生成历史价格数据
    const priceData = this.generateHistoricalPrices(ticker, startDate, endDate);
    
    // 初始化投资组合
    const portfolio: PortfolioState = {
      cash: initialCapital,
      holdings: [],
      trades: [],
      value: initialCapital,
      equityCurve: [{ date: startDate, value: initialCapital }]
    };
    
    // 按日期遍历价格数据
    for (const dailyData of priceData) {
      // 生成交易信号
      const signal = await strategy.generateSignal(dailyData, dailyData.date);
      
      // 执行交易
      if (signal && signal.action !== 'hold') {
        this.executeTrade(
          portfolio, 
          signal.action, 
          ticker, 
          dailyData.close, 
          dailyData.date,
          signal.confidence
        );
      }
      
      // 更新投资组合价值
      const portfolioValue = this.calculatePortfolioValue(portfolio, dailyData);
      portfolio.value = portfolioValue;
      portfolio.equityCurve.push({ date: dailyData.date, value: portfolioValue });
    }
    
    // 计算性能指标
    const metrics = this.calculatePerformanceMetrics(portfolio.equityCurve, initialCapital);
    
    return {
      startDate,
      endDate,
      initialCapital,
      finalValue: metrics.finalValue,
      returns: metrics.returns,
      annualizedReturns: metrics.annualizedReturns,
      maxDrawdown: metrics.maxDrawdown,
      sharpeRatio: metrics.sharpeRatio,
      trades: portfolio.trades,
      equityCurve: portfolio.equityCurve,
      metrics: metrics.metrics
    };
  }
} 