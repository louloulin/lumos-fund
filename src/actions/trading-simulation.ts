'use server';

import { createLogger } from '@/lib/logger.server';
import { mockTradingService } from '@/services/mockTradingService';

const logger = createLogger('trading-simulation');

/**
 * Execute a simulated trade with all market friction factors
 */
export async function executeSimulatedTrade(
  portfolioId: string,
  ticker: string,
  action: 'buy' | 'sell',
  quantity: number,
  orderType: 'market' | 'limit' | 'stop' | 'stop-limit' = 'market',
  options?: {
    limitPrice?: number;
    stopPrice?: number;
    timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok';
    slippageModel?: 'fixed' | 'proportional' | 'probabilistic' | 'volume-based';
    transactionCostModel?: 'fixed' | 'percentage' | 'tiered';
  }
) {
  try {
    logger.info('Executing simulated trade', { portfolioId, ticker, action, quantity });
    
    // Ensure service is initialized
    await mockTradingService.initialize();
    
    // Execute trade with realistic market simulation
    const result = await mockTradingService.executeTrade({
      portfolioId,
      ticker,
      action,
      quantity,
      orderType,
      limitPrice: options?.limitPrice,
      stopPrice: options?.stopPrice,
      timeInForce: options?.timeInForce || 'day',
      simulationOptions: {
        slippageModel: options?.slippageModel,
        transactionCostModel: options?.transactionCostModel
      }
    });
    
    logger.info('Simulated trade executed', { 
      success: result.success, 
      ticker, 
      executedPrice: result.executedPrice,
      slippage: result.slippage,
      transactionCost: result.transactionCost
    });
    
    return result;
  } catch (error) {
    logger.error('Error executing simulated trade', { portfolioId, ticker, error });
    throw new Error(`Failed to execute simulated trade: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get simulated portfolio data
 */
export async function getSimulatedPortfolio(portfolioId: string) {
  try {
    // Ensure service is initialized
    await mockTradingService.initialize();
    
    // Get portfolio
    const portfolio = mockTradingService.getPortfolio(portfolioId);
    
    if (!portfolio) {
      return {
        success: false,
        error: `Portfolio with ID ${portfolioId} not found`
      };
    }
    
    return {
      success: true,
      portfolio
    };
  } catch (error) {
    logger.error('Error getting simulated portfolio', { portfolioId, error });
    return {
      success: false,
      error: `Failed to get simulated portfolio: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get an optimal execution strategy for a trade using AI
 */
export async function getTradeExecutionStrategy(
  ticker: string,
  action: 'buy' | 'sell',
  quantity: number,
  expectedPrice: number,
  marketVolatility: 'low' | 'medium' | 'high' = 'medium',
  urgency: 'low' | 'medium' | 'high' = 'medium'
) {
  try {
    logger.info('Getting trade execution strategy', { ticker, action, quantity });
    
    // Ensure service is initialized
    await mockTradingService.initialize();
    
    // Get strategy from AI agent
    const strategy = await mockTradingService.getExecutionStrategy({
      ticker,
      action,
      quantity,
      expectedPrice,
      marketVolatility,
      urgency
    });
    
    return {
      success: true,
      strategy
    };
  } catch (error) {
    logger.error('Error getting trade execution strategy', { ticker, action, error });
    return {
      success: false,
      error: `Failed to get trade execution strategy: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Execute a simulated block trade with TWAP or VWAP algorithm
 */
export async function executeSimulatedAlgorithmicTrade(
  portfolioId: string,
  ticker: string,
  action: 'buy' | 'sell',
  totalQuantity: number,
  algorithm: 'twap' | 'vwap' | 'pov' = 'twap',
  options?: {
    numSlices?: number;
    durationMinutes?: number;
    maxParticipationRate?: number;
    priceLimit?: number;
  }
) {
  try {
    logger.info('Executing simulated algorithmic trade', { 
      portfolioId, 
      ticker, 
      action, 
      totalQuantity,
      algorithm 
    });
    
    // Ensure service is initialized
    await mockTradingService.initialize();
    
    // Set default values
    const numSlices = options?.numSlices || 5;
    const durationMinutes = options?.durationMinutes || 60;
    const sliceInterval = Math.floor(durationMinutes / numSlices) * 60 * 1000; // Convert to milliseconds
    
    // Calculate slice size (equal for TWAP, can be variable for VWAP)
    const sliceSize = Math.floor(totalQuantity / numSlices);
    
    // For storing results
    const executionResults = [];
    let remainingQuantity = totalQuantity;
    let totalExecutedQuantity = 0;
    let totalCost = 0;
    let averageExecutedPrice = 0;
    
    // Execute slices
    for (let i = 0; i < numSlices && remainingQuantity > 0; i++) {
      // Calculate current slice quantity (may adjust for last slice to account for rounding)
      const currentSliceQuantity = (i === numSlices - 1) 
        ? remainingQuantity 
        : sliceSize;
      
      if (currentSliceQuantity <= 0) continue;
      
      // Wait for the appropriate interval (except for the first slice)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, sliceInterval));
      }
      
      // Execute the slice
      const sliceResult = await mockTradingService.executeTrade({
        portfolioId,
        ticker,
        action,
        quantity: currentSliceQuantity,
        orderType: 'market',
        timeInForce: 'day',
        simulationOptions: {
          // Smaller slices should have less market impact
          marketImpactFactor: 0.0002 * (currentSliceQuantity / totalQuantity),
        }
      });
      
      executionResults.push(sliceResult);
      
      if (sliceResult.success) {
        remainingQuantity -= sliceResult.quantity;
        totalExecutedQuantity += sliceResult.quantity;
        totalCost += sliceResult.totalCost;
      }
    }
    
    // Calculate average executed price
    if (totalExecutedQuantity > 0) {
      averageExecutedPrice = totalCost / totalExecutedQuantity;
    }
    
    return {
      success: true,
      algorithm,
      ticker,
      action,
      requestedQuantity: totalQuantity,
      executedQuantity: totalExecutedQuantity,
      remainingQuantity,
      averageExecutedPrice,
      totalCost,
      executionTime: durationMinutes,
      slices: executionResults
    };
  } catch (error) {
    logger.error('Error executing simulated algorithmic trade', { portfolioId, ticker, error });
    return {
      success: false,
      error: `Failed to execute simulated algorithmic trade: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Create a simulated portfolio with initial cash
 */
export async function createSimulatedPortfolio(initialCash: number = 100000) {
  try {
    logger.info('Creating simulated portfolio', { initialCash });
    
    // Ensure service is initialized
    await mockTradingService.initialize();
    
    // Generate portfolio ID
    const portfolioId = `portfolio-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Execute initial deposit
    await mockTradingService.executeTrade({
      portfolioId,
      ticker: '',
      action: 'buy', // Not used for initialization
      quantity: 0,
      orderType: 'market',
      timeInForce: 'day'
    });
    
    // Get the created portfolio
    const portfolio = mockTradingService.getPortfolio(portfolioId);
    
    // Adjust initial cash if needed
    if (portfolio && initialCash !== 100000) {
      portfolio.cash = initialCash;
      portfolio.totalValue = initialCash;
    }
    
    return {
      success: true,
      portfolioId,
      portfolio
    };
  } catch (error) {
    logger.error('Error creating simulated portfolio', { error });
    return {
      success: false,
      error: `Failed to create simulated portfolio: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 