import { createLogger } from '@/lib/logger.server';
import { generateHistoricalPrices } from '@/lib/mocks';
import { quantInvestingAgent } from '@/mastra/agents/quantInvestingAgent';
import { valueInvestingAgent } from '@/mastra/agents/valueInvestingAgent';
import { trendInvestingAgent } from '@/mastra/agents/trendInvestingAgent';
import { growthInvestingAgent } from '@/mastra/agents/growthInvestingAgent';

const logger = createLogger('backtester');

// 价格数据类型
export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 交易类型
export type TradeAction = 'buy' | 'sell' | 'hold';

// 交易信号类型
export interface TradeSignal {
  action: TradeAction;
  ticker: string;
  price: number;
  quantity?: number;
  confidence?: number;
  reasoning?: string;
}

// 交易记录类型
export interface Trade {
  date: string;
  action: TradeAction;
  ticker: string;
  price: number;
  quantity: number;
  value: number;
  profit?: number;
}

// 投资组合状态
export interface PortfolioState {
  cash: number;
  holdings: Array<{
    ticker: string;
    quantity: number;
    costBasis: number;
  }>;
  trades: Trade[];
  value: number;
  equityCurve: Array<{
    date: string;
    value: number;
  }>;
}

// 回测策略接口
export interface BacktestStrategy {
  name: string;
  description: string;
  generateSignal: (data: PriceData, date: string, portfolio?: PortfolioState) => Promise<TradeSignal | null>;
}

// 回测选项
export interface BacktestOptions {
  ticker: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
  strategy: BacktestStrategy;
  parameters?: Record<string, any>;
}

// 回测结果
export interface BacktestResult {
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number;
  returns: number;
  annualizedReturns: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: Trade[];
  equityCurve: Array<{
    date: string;
    value: number;
  }>;
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
  };
}

/**
 * 回测系统实现类
 */
export class Backtester {
  // 模拟历史价格数据
  private generateHistoricalPrices(ticker: string, startDate: string, endDate: string): PriceData[] {
    return generateHistoricalPrices(ticker, startDate, endDate);
  }
  
  /**
   * 执行交易逻辑
   */
  private executeTrade(
    portfolio: PortfolioState,
    action: TradeAction,
    ticker: string,
    price: number,
    date: string,
    confidence = 0.5
  ): void {
    // 如果是持有，不执行任何操作
    if (action === 'hold') {
      return;
    }
    
    // 查找该股票的持仓
    const holdingIndex = portfolio.holdings.findIndex(h => h.ticker === ticker);
    const holding = holdingIndex >= 0 ? portfolio.holdings[holdingIndex] : null;
    
    if (action === 'buy') {
      // 买入操作，使用资金的比例由置信度决定
      const fundsToUse = portfolio.cash * Math.min(confidence, 0.9); // 最多使用90%的现金
      if (fundsToUse <= 0) {
        return; // 没有资金可用
      }
      
      const quantity = Math.floor(fundsToUse / price);
      if (quantity <= 0) {
        return; // 资金不足以购买一股
      }
      
      const cost = quantity * price;
      
      // 更新投资组合
      if (holding) {
        // 已有持仓，更新成本基础和数量
        const newQuantity = holding.quantity + quantity;
        const newCostBasis = (holding.costBasis * holding.quantity + cost) / newQuantity;
        portfolio.holdings[holdingIndex] = {
          ...holding,
          quantity: newQuantity,
          costBasis: newCostBasis
        };
      } else {
        // 新增持仓
        portfolio.holdings.push({
          ticker,
          quantity,
          costBasis: price
        });
      }
      
      // 减少现金
      portfolio.cash -= cost;
      
      // 记录交易
      portfolio.trades.push({
        date,
        action: 'buy',
        ticker,
        price,
        quantity,
        value: cost
      });
      
    } else if (action === 'sell' && holding) {
      // 卖出操作，依据置信度决定卖出比例
      const sellRatio = Math.min(confidence, 1.0); // 最多全部卖出
      const quantityToSell = Math.floor(holding.quantity * sellRatio);
      
      if (quantityToSell <= 0) {
        return; // 没有足够的股票可卖
      }
      
      const revenue = quantityToSell * price;
      const cost = quantityToSell * holding.costBasis;
      const profit = revenue - cost;
      
      // 更新投资组合
      if (quantityToSell < holding.quantity) {
        // 部分卖出
        portfolio.holdings[holdingIndex] = {
          ...holding,
          quantity: holding.quantity - quantityToSell
        };
      } else {
        // 全部卖出，移除持仓
        portfolio.holdings.splice(holdingIndex, 1);
      }
      
      // 增加现金
      portfolio.cash += revenue;
      
      // 记录交易
      portfolio.trades.push({
        date,
        action: 'sell',
        ticker,
        price,
        quantity: quantityToSell,
        value: revenue,
        profit
      });
    }
  }
  
  /**
   * 计算投资组合价值
   */
  private calculatePortfolioValue(portfolio: PortfolioState, currentData: PriceData): number {
    const holdingsValue = portfolio.holdings.reduce(
      (sum, holding) => sum + holding.quantity * currentData.close,
      0
    );
    return portfolio.cash + holdingsValue;
  }
  
  /**
   * 计算回测性能指标
   */
  private calculatePerformanceMetrics(
    equityCurve: Array<{ date: string; value: number }>,
    initialCapital: number
  ): {
    finalValue: number;
    returns: number;
    annualizedReturns: number;
    maxDrawdown: number;
    sharpeRatio: number;
    metrics: any;
  } {
    if (equityCurve.length === 0) {
      return {
        finalValue: initialCapital,
        returns: 0,
        annualizedReturns: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        metrics: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          averageWin: 0,
          averageLoss: 0,
          profitFactor: 0,
          maxConsecutiveWins: 0,
          maxConsecutiveLosses: 0
        }
      };
    }
    
    const finalValue = equityCurve[equityCurve.length - 1].value;
    const returns = (finalValue - initialCapital) / initialCapital;
    
    // 计算年化收益率（假设252个交易日/年）
    const days = equityCurve.length;
    const annualizedReturns = Math.pow(1 + returns, 252 / days) - 1;
    
    // 计算最大回撤
    let maxDrawdown = 0;
    let peak = equityCurve[0].value;
    
    for (const point of equityCurve) {
      if (point.value > peak) {
        peak = point.value;
      } else {
        const drawdown = (peak - point.value) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    // 计算每日收益率
    const dailyReturns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn = (equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value;
      dailyReturns.push(dailyReturn);
    }
    
    // 计算夏普比率 (假设无风险收益率为0)
    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const stdDailyReturn = Math.sqrt(
      dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length
    );
    const sharpeRatio = stdDailyReturn === 0 ? 0 : (avgDailyReturn * Math.sqrt(252)) / stdDailyReturn;
    
    // 这里可以添加更多的性能指标计算
    return {
      finalValue,
      returns,
      annualizedReturns,
      maxDrawdown,
      sharpeRatio,
      metrics: {
        totalTrades: 0, // 实际应用中需要根据交易记录计算
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0
      }
    };
  }
  
  /**
   * 运行回测
   */
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

/**
 * 基于AI代理的回测策略
 */
export class AIAgentBacktestStrategy implements BacktestStrategy {
  name: string;
  description: string;
  private agent: any;
  private ticker: string;
  
  constructor(agent: any, ticker: string) {
    this.agent = agent;
    this.ticker = ticker;
    this.name = `${agent.name} Strategy`;
    this.description = `基于${agent.name}的AI代理回测策略`;
  }
  
  /**
   * 使用AI代理生成交易信号
   */
  async generateSignal(data: PriceData, date: string, portfolio?: PortfolioState): Promise<TradeSignal | null> {
    try {
      // 构建上下文
      const context = {
        ticker: this.ticker,
        date: date,
        price: data.close,
        priceHistory: {
          close: [data.close],
          open: [data.open],
          high: [data.high],
          low: [data.low],
          volume: [data.volume],
          date: [date]
        },
        portfolioState: portfolio ? {
          cash: portfolio.cash,
          holdings: portfolio.holdings,
          currentValue: portfolio.value
        } : null
      };
      
      // 咨询AI代理
      const response = await this.agent.generate(
        `请分析股票 ${this.ticker} 在 ${date} 的情况，并给出交易建议。价格: ${data.close}`
      );
      
      // 解析响应
      // 简单解析文本中的关键词来确定信号
      const text = response.text.toLowerCase();
      
      let action: TradeAction = 'hold';
      if (text.includes('买入') || text.includes('购买') || text.includes('buy')) {
        action = 'buy';
      } else if (text.includes('卖出') || text.includes('出售') || text.includes('sell')) {
        action = 'sell';
      }
      
      // 提取置信度
      let confidence = 0.5; // 默认置信度
      const confidenceMatch = text.match(/置信度[:\s]*(\d+)%/) || text.match(/confidence[:\s]*(\d+)%/);
      if (confidenceMatch && confidenceMatch[1]) {
        confidence = parseInt(confidenceMatch[1], 10) / 100;
      }
      
      return {
        action,
        ticker: this.ticker,
        price: data.close,
        confidence,
        reasoning: response.text
      };
    } catch (error) {
      logger.error(`AI代理策略生成信号失败`, { error, ticker: this.ticker, date });
      return {
        action: 'hold',
        ticker: this.ticker,
        price: data.close,
        confidence: 0,
        reasoning: 'AI代理响应出错，默认持有'
      };
    }
  }
}

// 策略工厂 - 创建各种预定义的策略
export const BacktestStrategyFactory = {
  createValueStrategy: (ticker: string) => {
    return new AIAgentBacktestStrategy(valueInvestingAgent, ticker);
  },
  
  createGrowthStrategy: (ticker: string) => {
    return new AIAgentBacktestStrategy(growthInvestingAgent, ticker);
  },
  
  createTrendStrategy: (ticker: string) => {
    return new AIAgentBacktestStrategy(trendInvestingAgent, ticker);
  },
  
  createQuantStrategy: (ticker: string) => {
    return new AIAgentBacktestStrategy(quantInvestingAgent, ticker);
  }
}; 