'use server';

import { createLogger } from '@/lib/logger.server';
import { MockMarketDataService } from './mockMarketDataService';
import { executionAgent } from '@/mastra/index';
import { Transaction, Portfolio, Position, TradeResult } from '@/types/trading';
import { EventEmitter } from 'events';

const logger = createLogger('mock-trading-service');

/**
 * Trade execution parameters interface
 */
export interface TradeExecutionParams {
  portfolioId: string;
  ticker: string;
  action: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit' | 'stop' | 'stop-limit';
  limitPrice?: number;
  stopPrice?: number;
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  simulationOptions?: {
    slippageModel?: 'fixed' | 'proportional' | 'probabilistic' | 'volume-based';
    slippageFixed?: number;  // Fixed price slippage in dollars
    slippageProportional?: number;  // Proportional slippage as percentage
    slippageVolumeFactor?: number;  // For volume-based slippage
    marketImpactFactor?: number;  // Market impact as percentage of order size
    transactionCostModel?: 'fixed' | 'percentage' | 'tiered';
    fixedCommission?: number;  // Fixed commission per trade
    percentageCommission?: number;  // Percentage commission
    spreadFactor?: number;  // Bid-ask spread as percentage 
    latencyMs?: number;  // Simulated network latency in milliseconds
    executeWithAgent?: boolean;  // Use Mastra agent for execution strategy
    failureProbability?: number;  // Probability of order execution failure
  };
}

/**
 * Trade execution result interface
 */
export interface TradeExecutionResult {
  success: boolean;
  tradeId?: string;
  ticker: string;
  action: 'buy' | 'sell';
  quantity: number;
  requestedQuantity: number;
  executedPrice: number;
  marketPrice: number;
  slippage: number;
  slippagePercentage: number;
  transactionCost: number;
  totalCost: number;
  executedAt: string;
  status: 'completed' | 'partial' | 'failed' | 'canceled';
  message?: string;
  error?: string;
  executionDetails?: {
    orderType: 'market' | 'limit' | 'stop' | 'stop-limit';
    timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
    requestedPrice?: number;
    marketImpact?: number;
    executionLatency?: number;
    bidAskSpread?: number;
    partialExecutions?: Array<{
      quantity: number;
      price: number;
      timestamp: string;
    }>;
  };
}

/**
 * Mock trading service for simulating trade execution
 */
export class MockTradingService extends EventEmitter {
  private marketDataService: MockMarketDataService;
  private initialized: boolean = false;
  private mockTradeIdCounter: number = 1;
  private mockPortfolios: Map<string, Portfolio> = new Map();
  private defaultSimulationOptions = {
    slippageModel: 'proportional',
    slippageFixed: 0.02,  // $0.02 fixed slippage
    slippageProportional: 0.0015,  // 0.15% slippage
    slippageVolumeFactor: 0.00005,  // Volume-based slippage factor
    marketImpactFactor: 0.0002,  // Market impact as % of order size
    transactionCostModel: 'tiered',
    fixedCommission: 1.99,  // $1.99 per trade
    percentageCommission: 0.0035,  // 0.35% commission
    spreadFactor: 0.0005,  // 0.05% bid-ask spread
    latencyMs: 150,  // 150ms simulated latency
    executeWithAgent: false,
    failureProbability: 0.01  // 1% chance of failure
  };

  constructor() {
    super();
    this.marketDataService = new MockMarketDataService();
  }

  /**
   * Initialize the trading service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info('Initializing mock trading service');
    await this.marketDataService.initialize();
    this.initialized = true;
    logger.info('Mock trading service initialized');
  }

  /**
   * Execute a trade with realistic market simulation
   */
  public async executeTrade(params: TradeExecutionParams): Promise<TradeExecutionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    logger.info('Executing mock trade', { 
      ticker: params.ticker, 
      action: params.action, 
      quantity: params.quantity 
    });

    try {
      // Get current market price
      const stockData = await this.marketDataService.fetchStockData(params.ticker);
      const marketPrice = stockData.price;

      // Get portfolio (or create one if it doesn't exist)
      let portfolio = this.mockPortfolios.get(params.portfolioId);
      if (!portfolio) {
        portfolio = this.createMockPortfolio(params.portfolioId);
        this.mockPortfolios.set(params.portfolioId, portfolio);
      }

      // Merge default simulation options with provided options
      const simulationOptions = {
        ...this.defaultSimulationOptions,
        ...params.simulationOptions
      };

      // Simulate latency
      await this.simulateLatency(simulationOptions.latencyMs);

      // Check if order fails due to random failure
      if (Math.random() < simulationOptions.failureProbability) {
        return this.createFailedTradeResult(params, marketPrice, "Order execution failed due to market conditions");
      }

      // Calculate executed price with slippage
      const executedPrice = this.calculateExecutedPrice(
        params.ticker,
        params.action,
        params.quantity,
        marketPrice,
        simulationOptions
      );

      // Calculate transaction costs
      const transactionCost = this.calculateTransactionCost(
        params.quantity,
        executedPrice,
        simulationOptions
      );

      // Calculate total trade value
      const tradeValue = params.quantity * executedPrice;
      const totalCost = params.action === 'buy' ? tradeValue + transactionCost : tradeValue - transactionCost;

      // Check if the portfolio has enough cash for a buy order
      if (params.action === 'buy' && portfolio.cash < totalCost) {
        return this.createFailedTradeResult(params, marketPrice, "Insufficient funds for trade");
      }

      // Check if the portfolio has enough shares for a sell order
      if (params.action === 'sell') {
        const position = portfolio.positions.find(p => p.ticker === params.ticker);
        if (!position || position.shares < params.quantity) {
          return this.createFailedTradeResult(params, marketPrice, "Insufficient shares for sell order");
        }
      }

      // Generate execution details
      const bidAskSpread = marketPrice * simulationOptions.spreadFactor;
      const marketImpact = this.calculateMarketImpact(
        params.quantity,
        marketPrice,
        simulationOptions.marketImpactFactor
      );

      // Create execution details
      const executionDetails = {
        orderType: params.orderType,
        timeInForce: params.timeInForce,
        requestedPrice: params.orderType !== 'market' ? params.limitPrice : undefined,
        marketImpact,
        executionLatency: simulationOptions.latencyMs,
        bidAskSpread,
        partialExecutions: [
          {
            quantity: params.quantity,
            price: executedPrice,
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Update portfolio
      this.updatePortfolio(portfolio, params.ticker, params.action, params.quantity, executedPrice, transactionCost);

      // Create trade result
      const tradeId = `trade-${Date.now()}-${this.mockTradeIdCounter++}`;
      const executedAt = new Date().toISOString();
      const slippage = Math.abs(executedPrice - marketPrice);
      const slippagePercentage = (slippage / marketPrice) * 100;

      // Create and return the trade execution result
      return {
        success: true,
        tradeId,
        ticker: params.ticker,
        action: params.action,
        quantity: params.quantity,
        requestedQuantity: params.quantity,
        executedPrice,
        marketPrice,
        slippage,
        slippagePercentage,
        transactionCost,
        totalCost,
        executedAt,
        status: 'completed',
        executionDetails
      };
    } catch (error) {
      logger.error('Error executing mock trade', { params, error });
      return {
        success: false,
        ticker: params.ticker,
        action: params.action,
        quantity: 0,
        requestedQuantity: params.quantity,
        executedPrice: 0,
        marketPrice: 0,
        slippage: 0,
        slippagePercentage: 0,
        transactionCost: 0,
        totalCost: 0,
        executedAt: new Date().toISOString(),
        status: 'failed',
        error: `Trade execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Calculate executed price with slippage
   */
  private calculateExecutedPrice(
    ticker: string,
    action: 'buy' | 'sell',
    quantity: number,
    marketPrice: number,
    options: any
  ): number {
    let slippageAmount = 0;

    // Calculate slippage based on the selected model
    switch (options.slippageModel) {
      case 'fixed':
        slippageAmount = options.slippageFixed;
        break;
      case 'proportional':
        slippageAmount = marketPrice * options.slippageProportional;
        break;
      case 'probabilistic':
        // Normal distribution around the mean slippage
        const mean = marketPrice * options.slippageProportional;
        const stdDev = mean * 0.5;
        slippageAmount = this.normalRandom(mean, stdDev);
        break;
      case 'volume-based':
        // More shares = more slippage
        slippageAmount = marketPrice * options.slippageProportional * 
          (1 + (quantity * options.slippageVolumeFactor));
        break;
      default:
        slippageAmount = marketPrice * options.slippageProportional;
    }

    // Apply slippage in the correct direction based on action
    // Buys execute higher, sells execute lower
    return action === 'buy' 
      ? marketPrice + slippageAmount 
      : marketPrice - slippageAmount;
  }

  /**
   * Calculate transaction costs
   */
  private calculateTransactionCost(
    quantity: number,
    executedPrice: number,
    options: any
  ): number {
    const tradeValue = quantity * executedPrice;

    switch (options.transactionCostModel) {
      case 'fixed':
        return options.fixedCommission;
      case 'percentage':
        return tradeValue * options.percentageCommission;
      case 'tiered':
        // Tiered model: fixed fee + percentage, with minimum
        const baseFee = options.fixedCommission;
        const percentageFee = tradeValue * options.percentageCommission;
        return Math.max(baseFee, percentageFee);
      default:
        return options.fixedCommission;
    }
  }

  /**
   * Calculate market impact
   */
  private calculateMarketImpact(
    quantity: number,
    price: number,
    impactFactor: number
  ): number {
    // Simple model: impact increases with order size
    return quantity * price * impactFactor;
  }

  /**
   * Update portfolio after trade execution
   */
  private updatePortfolio(
    portfolio: Portfolio,
    ticker: string,
    action: 'buy' | 'sell',
    quantity: number,
    executedPrice: number,
    transactionCost: number
  ): void {
    const tradeValue = quantity * executedPrice;
    const totalCost = tradeValue + transactionCost;

    if (action === 'buy') {
      // Update cash
      portfolio.cash -= totalCost;

      // Update or add position
      const existingPosition = portfolio.positions.find(p => p.ticker === ticker);
      if (existingPosition) {
        // Calculate new average price
        const totalShares = existingPosition.shares + quantity;
        const totalCostBasis = (existingPosition.shares * existingPosition.avgPrice) + (quantity * executedPrice);
        existingPosition.avgPrice = totalCostBasis / totalShares;
        existingPosition.shares = totalShares;
        existingPosition.currentPrice = executedPrice;
      } else {
        // Add new position
        portfolio.positions.push({
          ticker,
          name: ticker, // In a real app, we would get the company name
          shares: quantity,
          avgPrice: executedPrice,
          currentPrice: executedPrice
        });
      }
    } else if (action === 'sell') {
      // Update cash
      portfolio.cash += (tradeValue - transactionCost);

      // Update position
      const existingPosition = portfolio.positions.find(p => p.ticker === ticker);
      if (existingPosition) {
        existingPosition.shares -= quantity;
        existingPosition.currentPrice = executedPrice;

        // Remove position if all shares sold
        if (existingPosition.shares <= 0) {
          portfolio.positions = portfolio.positions.filter(p => p.ticker !== ticker);
        }
      }
    }

    // Add transaction to history
    const transaction: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: action,
      ticker,
      shares: quantity,
      price: executedPrice,
      timestamp: new Date().toISOString()
    };

    portfolio.transactions.push(transaction);
    portfolio.lastUpdated = new Date().toISOString();

    // Recalculate total value
    this.recalculatePortfolioValue(portfolio);
  }

  /**
   * Recalculate portfolio total value
   */
  private recalculatePortfolioValue(portfolio: Portfolio): void {
    const positionsValue = portfolio.positions.reduce(
      (sum, position) => sum + (position.shares * position.currentPrice), 
      0
    );
    portfolio.totalValue = portfolio.cash + positionsValue;
  }

  /**
   * Simulate network latency
   */
  private async simulateLatency(latencyMs: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, latencyMs));
  }

  /**
   * Create a failed trade result
   */
  private createFailedTradeResult(
    params: TradeExecutionParams,
    marketPrice: number,
    message: string
  ): TradeExecutionResult {
    return {
      success: false,
      ticker: params.ticker,
      action: params.action,
      quantity: 0,
      requestedQuantity: params.quantity,
      executedPrice: 0,
      marketPrice,
      slippage: 0,
      slippagePercentage: 0,
      transactionCost: 0,
      totalCost: 0,
      executedAt: new Date().toISOString(),
      status: 'failed',
      message
    };
  }

  /**
   * Create a mock portfolio for testing
   */
  private createMockPortfolio(portfolioId: string): Portfolio {
    return {
      id: portfolioId,
      name: `Portfolio ${portfolioId}`,
      cash: 100000, // Start with $100K
      totalValue: 100000,
      lastUpdated: new Date().toISOString(),
      positions: [],
      performance: {
        day: 0,
        week: 0,
        month: 0,
        year: 0,
        total: 0
      },
      transactions: []
    };
  }

  /**
   * Generate random number from normal distribution
   */
  private normalRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Get a portfolio by ID
   */
  public getPortfolio(portfolioId: string): Portfolio | undefined {
    return this.mockPortfolios.get(portfolioId);
  }

  /**
   * Get all portfolios
   */
  public getAllPortfolios(): Portfolio[] {
    return Array.from(this.mockPortfolios.values());
  }

  /**
   * Get execution strategies using Mastra agent
   */
  public async getExecutionStrategy(params: {
    ticker: string;
    action: 'buy' | 'sell';
    quantity: number;
    expectedPrice: number;
    marketVolatility: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
  }): Promise<{
    strategy: string;
    orderTypes: string[];
    timeFrame: string;
    expectedSlippage: number;
    reasoning: string;
  }> {
    // Fetch market data for context
    const stockData = await this.marketDataService.fetchStockData(params.ticker);

    // Create prompt for execution agent
    const prompt = `
      I need an execution strategy for the following trade:
      
      - Ticker: ${params.ticker}
      - Action: ${params.action}
      - Quantity: ${params.quantity} shares
      - Current Price: $${stockData.price.toFixed(2)}
      - Expected Price: $${params.expectedPrice.toFixed(2)}
      - Daily Volume: ${stockData.volume.toLocaleString()} shares
      - Market Volatility: ${params.marketVolatility}
      - Execution Urgency: ${params.urgency}
      
      Please provide:
      1. Recommended execution strategy (TWAP, VWAP, percentage of volume, etc.)
      2. Suggested order types
      3. Optimal time frame for execution
      4. Expected slippage estimate
      5. Brief reasoning for the recommendation
      
      Format your response as a valid JSON object with these fields.
    `;

    try {
      // Get recommendation from agent
      const agentResponse = await executionAgent.generate(prompt);
      const jsonMatch = agentResponse.text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const strategy = JSON.parse(jsonMatch[0]);
        return {
          strategy: strategy.strategy || 'TWAP',
          orderTypes: strategy.orderTypes || ['limit'],
          timeFrame: strategy.timeFrame || '1 day',
          expectedSlippage: strategy.expectedSlippage || 0.1,
          reasoning: strategy.reasoning || 'Default strategy based on order size and market conditions'
        };
      } else {
        // Default response if parsing fails
        return {
          strategy: 'TWAP',
          orderTypes: ['limit'],
          timeFrame: '1 day',
          expectedSlippage: 0.1,
          reasoning: 'Default strategy based on order size and market conditions'
        };
      }
    } catch (error) {
      logger.error('Error getting execution strategy', { error });
      return {
        strategy: 'Market Order',
        orderTypes: ['market'],
        timeFrame: 'Immediate',
        expectedSlippage: 0.2,
        reasoning: 'Fallback strategy due to error in strategy generation'
      };
    }
  }
}

// Export singleton instance
export const mockTradingService = new MockTradingService(); 