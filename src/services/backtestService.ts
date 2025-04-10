import { createLogger } from '@/lib/logger.server';
import { MarketDataService } from './marketDataService';
import { portfolioAnalysisAgent } from '@/mastra/index';

// 创建日志记录器
const logger = createLogger('backtest-service');

// 日期格式化函数
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// 价格数据接口
export interface PriceData {
  date: string;
  open: number;
  high: number;
  close: number;
  low: number;
  volume: number;
}

// 投资组合持仓接口
export interface Holding {
  ticker: string;
  quantity: number;
  entryPrice: number;
  entryDate: string;
}

// 交易记录接口
export interface Trade {
  date: string;
  ticker: string;
  action: 'buy' | 'sell' | 'short' | 'cover';
  price: number;
  quantity: number;
  value: number;
  profit?: number;
  confidence?: number;
}

// 投资组合状态接口
export interface PortfolioState {
  cash: number;
  holdings: Holding[];
  trades: Trade[];
  value: number;
  equityCurve: { date: string; value: number }[];
}

// 交易信号接口
export interface TradeSignal {
  action: 'buy' | 'sell' | 'short' | 'cover' | 'hold';
  ticker: string;
  quantity?: number;
  confidence?: number;
  reasoning?: string;
}

// 策略接口
export interface Strategy {
  name: string;
  description: string;
  generateSignal: (priceData: PriceData, date: string, portfolio?: PortfolioState) => Promise<TradeSignal | null>;
}

// 回测选项接口
export interface BacktestOptions {
  ticker: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
  strategy: Strategy;
  slippage?: number; // 滑点百分比
  commission?: number; // 佣金百分比
}

// 回测结果接口
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
  equityCurve: { date: string; value: number }[];
  metrics: Record<string, number>;
}

// 性能指标计算结果接口
interface PerformanceMetricsResult {
  finalValue: number;
  returns: number;
  annualizedReturns: number;
  maxDrawdown: number;
  sharpeRatio: number;
  metrics: Record<string, number>;
}

/**
 * 回测服务类
 */
export class BacktestService {
  private marketDataService: MarketDataService;
  private portfolioAnalysisAgent: typeof portfolioAnalysisAgent;
  
  constructor() {
    this.marketDataService = new MarketDataService();
    this.portfolioAnalysisAgent = portfolioAnalysisAgent;
  }
  
  /**
   * 生成历史价格数据
   * 注意：在实际实现中，这应该调用市场数据服务获取真实数据
   */
  private async getHistoricalPrices(ticker: string, startDate: string, endDate: string): Promise<PriceData[]> {
    try {
      logger.info(`获取${ticker}从${startDate}到${endDate}的历史价格数据`);
      const period = `${startDate}/${endDate}`;
      const priceData = await this.marketDataService.fetchStockPriceHistory(ticker, period);
      
      return priceData.map(data => ({
        date: formatDate(new Date(data.date)),
        open: data.open,
        high: data.high,
        close: data.close,
        low: data.low,
        volume: data.volume
      }));
    } catch (error) {
      logger.error(`获取历史价格数据失败: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`获取历史价格数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 执行交易
   */
  private executeTrade(
    portfolio: PortfolioState,
    action: 'buy' | 'sell' | 'short' | 'cover' | 'hold',
    ticker: string,
    price: number,
    date: string,
    confidence?: number,
    quantity?: number,
    slippage: number = 0,
    commission: number = 0
  ): number {
    if (action === 'hold') {
      return 0;
    }
    
    // 计算实际执行价格（考虑滑点）
    const executionPrice = action === 'buy' || action === 'cover'
      ? price * (1 + slippage)  // 买入价格上浮
      : price * (1 - slippage); // 卖出价格下浮
    
    // 计算可用资金（考虑佣金）
    const availableCash = portfolio.cash / (1 + commission);
    
    let executedQuantity = 0;
    
    switch (action) {
      case 'buy':
        // 如果没有指定数量，则用全部可用资金买入
        if (!quantity) {
          quantity = Math.floor(availableCash / executionPrice);
        }
        
        // 检查资金是否足够
        const cost = quantity * executionPrice * (1 + commission);
        if (cost <= portfolio.cash) {
          // 更新投资组合
          portfolio.cash -= cost;
          portfolio.holdings.push({
            ticker,
            quantity,
            entryPrice: executionPrice,
            entryDate: date
          });
          
          // 记录交易
          portfolio.trades.push({
            date,
            ticker,
            action,
            price: executionPrice,
            quantity,
            value: cost,
            confidence
          });
          
          executedQuantity = quantity;
        }
        break;
        
      case 'sell':
        // 查找持仓
        const holdingIndex = portfolio.holdings.findIndex(h => h.ticker === ticker);
        if (holdingIndex !== -1) {
          const holding = portfolio.holdings[holdingIndex];
          
          // 如果没有指定数量，则卖出全部持仓
          if (!quantity) {
            quantity = holding.quantity;
          }
          
          // 确保数量不超过持仓
          quantity = Math.min(quantity, holding.quantity);
          
          // 计算交易价值和利润
          const value = quantity * executionPrice;
          const profit = value - (quantity * holding.entryPrice);
          const netValue = value * (1 - commission);
          
          // 更新投资组合
          portfolio.cash += netValue;
          
          // 更新或删除持仓
          if (quantity < holding.quantity) {
            holding.quantity -= quantity;
          } else {
            portfolio.holdings.splice(holdingIndex, 1);
          }
          
          // 记录交易
          portfolio.trades.push({
            date,
            ticker,
            action,
            price: executionPrice,
            quantity,
            value,
            profit,
            confidence
          });
          
          executedQuantity = quantity;
        }
        break;
        
      // 这里还可以添加short和cover的逻辑来支持做空操作
    }
    
    return executedQuantity;
  }
  
  /**
   * 计算投资组合价值
   */
  private calculatePortfolioValue(portfolio: PortfolioState, priceData: PriceData): number {
    // 现金加上持仓价值
    const holdingsValue = portfolio.holdings.reduce(
      (total, holding) => total + (holding.quantity * priceData.close),
      0
    );
    
    return portfolio.cash + holdingsValue;
  }
  
  /**
   * 计算性能指标
   */
  private calculatePerformanceMetrics(
    equityCurve: { date: string; value: number }[],
    initialCapital: number
  ): PerformanceMetricsResult {
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
    
    // 最终价值
    const finalValue = equityCurve[equityCurve.length - 1].value;
    
    // 总收益率
    const returns = (finalValue - initialCapital) / initialCapital;
    
    // 计算最大回撤
    let maxDrawdown = 0;
    let peak = equityCurve[0].value;
    
    for (const point of equityCurve) {
      if (point.value > peak) {
        peak = point.value;
      }
      
      const drawdown = (peak - point.value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // 计算年化收益率
    const startDate = new Date(equityCurve[0].date);
    const endDate = new Date(equityCurve[equityCurve.length - 1].date);
    const yearFraction = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    const annualizedReturns = yearFraction > 0
      ? Math.pow(1 + returns, 1 / yearFraction) - 1
      : 0;
    
    // 计算每日收益率
    const dailyReturns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prevValue = equityCurve[i - 1].value;
      const currentValue = equityCurve[i].value;
      dailyReturns.push((currentValue - prevValue) / prevValue);
    }
    
    // 计算夏普比率 (假设无风险收益率为2%)
    const riskFreeRate = 0.02 / 252; // 每日无风险收益率
    const excessReturns = dailyReturns.map(r => r - riskFreeRate);
    const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    
    const variance = excessReturns.reduce((sum, r) => sum + Math.pow(r - meanExcessReturn, 2), 0) / excessReturns.length;
    const stdDev = Math.sqrt(variance);
    
    const dailySharpe = meanExcessReturn / (stdDev || 1); // 防止除以0
    const annualizedSharpe = dailySharpe * Math.sqrt(252); // 年化夏普比率
    
    // 其他指标
    const metrics: Record<string, number> = {
      // 波动率（年化标准差）
      volatility: stdDev * Math.sqrt(252),
      
      // 收益风险比
      returnToRiskRatio: returns / (maxDrawdown || 1),
      
      // 索提诺比率（以最大回撤作为下行风险）
      sortinoRatio: (annualizedReturns - 0.02) / (maxDrawdown || 1),
      
      // 交易次数
      tradeCount: equityCurve.length > 0 ? equityCurve.length - 1 : 0,
    };
    
    return {
      finalValue,
      returns,
      annualizedReturns,
      maxDrawdown,
      sharpeRatio: annualizedSharpe,
      metrics
    };
  }
  
  /**
   * 运行回测
   */
  public async runBacktest(options: BacktestOptions): Promise<BacktestResult> {
    const { ticker, initialCapital, startDate, endDate, strategy, slippage = 0.001, commission = 0.0005 } = options;
    
    logger.info(`开始回测 ${ticker}: ${strategy.name}, 从 ${startDate} 到 ${endDate}`);
    
    try {
      // 获取历史价格数据
      const priceData = await this.getHistoricalPrices(ticker, startDate, endDate);
      
      if (priceData.length === 0) {
        throw new Error('没有找到足够的历史数据进行回测');
      }
      
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
        const signal = await strategy.generateSignal(dailyData, dailyData.date, portfolio);
        
        // 执行交易
        if (signal && signal.action !== 'hold') {
          this.executeTrade(
            portfolio,
            signal.action,
            ticker,
            dailyData.close,
            dailyData.date,
            signal.confidence,
            signal.quantity,
            slippage,
            commission
          );
        }
        
        // 更新投资组合价值
        const portfolioValue = this.calculatePortfolioValue(portfolio, dailyData);
        portfolio.value = portfolioValue;
        
        // 记录权益曲线
        portfolio.equityCurve.push({ 
          date: dailyData.date, 
          value: portfolioValue 
        });
      }
      
      // 计算性能指标
      const metrics = this.calculatePerformanceMetrics(portfolio.equityCurve, initialCapital);
      
      logger.info(`回测完成: ${ticker}, 最终价值: ${metrics.finalValue.toFixed(2)}, 收益率: ${(metrics.returns * 100).toFixed(2)}%`);
      
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
    } catch (error) {
      logger.error(`回测失败: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`回测失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 获取AI分析评估
   */
  public async getBacktestAnalysis(result: BacktestResult): Promise<string> {
    try {
      // 准备发送给AI的数据
      const portfolioData = {
        performance: {
          initialCapital: result.initialCapital,
          finalValue: result.finalValue,
          returns: result.returns,
          annualizedReturns: result.annualizedReturns,
          maxDrawdown: result.maxDrawdown,
          sharpeRatio: result.sharpeRatio,
          volatility: result.metrics.volatility,
          tradeCount: result.metrics.tradeCount
        },
        trades: result.trades.slice(-10), // 仅发送最近的10笔交易以减少Token使用
        equityCurve: result.equityCurve
          .filter((_, i, arr) => i % Math.ceil(arr.length / 20) === 0 || i === arr.length - 1) // 抽样以减少数据量
      };
      
      // 创建提示词
      const prompt = `
        请分析以下回测结果并提供详细评估:
        
        回测性能指标:
        - 初始资金: ${portfolioData.performance.initialCapital}
        - 最终价值: ${portfolioData.performance.finalValue}
        - 总收益率: ${(portfolioData.performance.returns * 100).toFixed(2)}%
        - 年化收益率: ${(portfolioData.performance.annualizedReturns * 100).toFixed(2)}%
        - 最大回撤: ${(portfolioData.performance.maxDrawdown * 100).toFixed(2)}%
        - 夏普比率: ${portfolioData.performance.sharpeRatio.toFixed(2)}
        - 波动率: ${(portfolioData.performance.volatility * 100).toFixed(2)}%
        - 交易次数: ${portfolioData.performance.tradeCount}
        
        最近交易:
        ${JSON.stringify(portfolioData.trades, null, 2)}
        
        请提供:
        1. 整体性能分析和评估
        2. 风险回报特征分析
        3. 交易策略效率评估
        4. 优势和改进空间
        5. 具体优化建议
      `;
      
      // 调用AI代理进行分析
      const analysisResponse = await this.portfolioAnalysisAgent.generate(prompt);
      return analysisResponse.text;
    } catch (error) {
      logger.error(`获取AI回测分析失败: ${error instanceof Error ? error.message : String(error)}`);
      return '无法获取AI分析评估，请稍后重试。';
    }
  }
  
  /**
   * 生成回测优化建议
   */
  public async getOptimizationSuggestions(strategy: Strategy, result: BacktestResult): Promise<string> {
    try {
      // 创建提示词
      const prompt = `
        请为以下交易策略提供优化建议:
        
        策略名称: ${strategy.name}
        策略描述: ${strategy.description}
        
        回测性能:
        - 总收益率: ${(result.returns * 100).toFixed(2)}%
        - 最大回撤: ${(result.maxDrawdown * 100).toFixed(2)}%
        - 夏普比率: ${result.sharpeRatio.toFixed(2)}
        
        请提供:
        1. 策略评估和主要问题诊断
        2. 改进策略参数的具体建议
        3. 风险管理优化方向
        4. 可能的创新或扩展思路
        5. 优先级排序的建议实施步骤
      `;
      
      // 调用AI代理生成优化建议
      const suggestionsResponse = await this.portfolioAnalysisAgent.generate(prompt);
      return suggestionsResponse.text;
    } catch (error) {
      logger.error(`获取策略优化建议失败: ${error instanceof Error ? error.message : String(error)}`);
      return '无法获取策略优化建议，请稍后重试。';
    }
  }
}

// 导出默认实例
export const backtestService = new BacktestService(); 