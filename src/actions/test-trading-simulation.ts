'use server';

import { createLogger } from '@/lib/logger.server';
import {
  createSimulatedPortfolio,
  executeSimulatedTrade,
  executeSimulatedAlgorithmicTrade,
  getTradeExecutionStrategy
} from './trading-simulation';

const logger = createLogger('test-trading-simulation');

/**
 * Test basic simulated trading functionality
 */
export async function testBasicTrading(): Promise<{
  success: boolean;
  results: {
    portfolioCreation: any;
    buyOrder: any;
    sellOrder: any;
    finalPortfolio: any;
  };
  executionTime: number;
}> {
  logger.info('Starting basic trading tests');
  const startTime = Date.now();
  
  try {
    // Test 1: Create a portfolio
    logger.info('Creating test portfolio');
    const portfolioCreation = await createSimulatedPortfolio(100000);
    
    if (!portfolioCreation.success || !portfolioCreation.portfolioId) {
      throw new Error('Failed to create test portfolio');
    }
    
    const portfolioId = portfolioCreation.portfolioId;
    
    // Test 2: Execute a buy order
    logger.info('Executing buy order');
    const buyOrder = await executeSimulatedTrade(
      portfolioId,
      'AAPL',
      'buy',
      100
    );
    
    // Test 3: Execute a sell order
    logger.info('Executing sell order');
    const sellOrder = await executeSimulatedTrade(
      portfolioId,
      'AAPL',
      'sell',
      50
    );
    
    // Get final portfolio state
    const finalPortfolioResponse = await getSimulatedPortfolio(portfolioId);
    const finalPortfolio = finalPortfolioResponse.success 
      ? finalPortfolioResponse.portfolio 
      : { error: 'Failed to get final portfolio state' };
    
    const executionTime = Date.now() - startTime;
    logger.info('Basic trading tests completed', { executionTime });
    
    return {
      success: true,
      results: {
        portfolioCreation,
        buyOrder,
        sellOrder,
        finalPortfolio
      },
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Basic trading tests failed', { error, executionTime });
    
    return {
      success: false,
      results: {
        portfolioCreation: { error: 'Test failed' },
        buyOrder: { error: 'Test failed' },
        sellOrder: { error: 'Test failed' },
        finalPortfolio: { error: 'Test failed' }
      },
      executionTime
    };
  }
}

/**
 * Helper function to get simulated portfolio by ID
 */
async function getSimulatedPortfolio(portfolioId: string) {
  const { getSimulatedPortfolio } = await import('./trading-simulation');
  return getSimulatedPortfolio(portfolioId);
}

/**
 * Test different slippage models
 */
export async function testSlippageModels(): Promise<{
  success: boolean;
  results: {
    fixedSlippage: any;
    proportionalSlippage: any;
    probabilisticSlippage: any;
    volumeBasedSlippage: any;
    comparison: {
      highestSlippage: string;
      lowestSlippage: string;
      slippageValues: {
        fixed: number;
        proportional: number;
        probabilistic: number;
        volumeBased: number;
      };
    };
  };
}> {
  logger.info('Starting slippage model tests');
  
  try {
    // Create a test portfolio
    const portfolioCreation = await createSimulatedPortfolio();
    
    if (!portfolioCreation.success || !portfolioCreation.portfolioId) {
      throw new Error('Failed to create test portfolio');
    }
    
    const portfolioId = portfolioCreation.portfolioId;
    
    // Test fixed slippage
    logger.info('Testing fixed slippage model');
    const fixedSlippage = await executeSimulatedTrade(
      portfolioId,
      'MSFT',
      'buy',
      100,
      'market',
      {
        slippageModel: 'fixed'
      }
    );
    
    // Test proportional slippage
    logger.info('Testing proportional slippage model');
    const proportionalSlippage = await executeSimulatedTrade(
      portfolioId,
      'MSFT',
      'buy',
      100,
      'market',
      {
        slippageModel: 'proportional'
      }
    );
    
    // Test probabilistic slippage
    logger.info('Testing probabilistic slippage model');
    const probabilisticSlippage = await executeSimulatedTrade(
      portfolioId,
      'MSFT',
      'buy',
      100,
      'market',
      {
        slippageModel: 'probabilistic'
      }
    );
    
    // Test volume-based slippage
    logger.info('Testing volume-based slippage model');
    const volumeBasedSlippage = await executeSimulatedTrade(
      portfolioId,
      'MSFT',
      'buy',
      100,
      'market',
      {
        slippageModel: 'volume-based'
      }
    );
    
    // Compare slippage values
    const slippageValues = {
      fixed: fixedSlippage.slippagePercentage,
      proportional: proportionalSlippage.slippagePercentage,
      probabilistic: probabilisticSlippage.slippagePercentage,
      volumeBased: volumeBasedSlippage.slippagePercentage
    };
    
    // Find highest and lowest slippage models
    const slippageEntries = Object.entries(slippageValues);
    slippageEntries.sort((a, b) => b[1] - a[1]);
    
    const highestSlippage = slippageEntries[0][0];
    const lowestSlippage = slippageEntries[slippageEntries.length - 1][0];
    
    logger.info('Slippage model tests completed');
    
    return {
      success: true,
      results: {
        fixedSlippage,
        proportionalSlippage,
        probabilisticSlippage,
        volumeBasedSlippage,
        comparison: {
          highestSlippage,
          lowestSlippage,
          slippageValues
        }
      }
    };
  } catch (error) {
    logger.error('Slippage model tests failed', { error });
    
    return {
      success: false,
      results: {
        fixedSlippage: { error: 'Test failed' },
        proportionalSlippage: { error: 'Test failed' },
        probabilisticSlippage: { error: 'Test failed' },
        volumeBasedSlippage: { error: 'Test failed' },
        comparison: {
          highestSlippage: 'test failed',
          lowestSlippage: 'test failed',
          slippageValues: {
            fixed: 0,
            proportional: 0,
            probabilistic: 0,
            volumeBased: 0
          }
        }
      }
    };
  }
}

/**
 * Test algorithm trading execution
 */
export async function testAlgorithmicTrading(): Promise<{
  success: boolean;
  results: {
    twapExecution: any;
    vwapExecution: any;
    povExecution: any;
    strategy: any;
    comparison: {
      bestPrice: string;
      executionTimes: {
        twap: number;
        vwap: number;
        pov: number;
      };
    };
  };
}> {
  logger.info('Starting algorithmic trading tests');
  
  try {
    // Create a test portfolio
    const portfolioCreation = await createSimulatedPortfolio(1000000);
    
    if (!portfolioCreation.success || !portfolioCreation.portfolioId) {
      throw new Error('Failed to create test portfolio');
    }
    
    const portfolioId = portfolioCreation.portfolioId;
    
    // Get execution strategy recommendation
    logger.info('Getting execution strategy');
    const strategyRecommendation = await getTradeExecutionStrategy(
      'AAPL',
      'buy',
      1000,
      185.0,
      'medium',
      'medium'
    );
    
    // Test TWAP execution
    logger.info('Testing TWAP execution');
    const twapStartTime = Date.now();
    const twapExecution = await executeSimulatedAlgorithmicTrade(
      portfolioId,
      'AAPL',
      'buy',
      1000,
      'twap',
      {
        numSlices: 5,
        durationMinutes: 5 // Use a shorter time for testing
      }
    );
    const twapExecutionTime = Date.now() - twapStartTime;
    
    // Test VWAP execution
    logger.info('Testing VWAP execution');
    const vwapStartTime = Date.now();
    const vwapExecution = await executeSimulatedAlgorithmicTrade(
      portfolioId,
      'GOOG',
      'buy',
      1000,
      'vwap',
      {
        numSlices: 5,
        durationMinutes: 5 // Use a shorter time for testing
      }
    );
    const vwapExecutionTime = Date.now() - vwapStartTime;
    
    // Test POV execution
    logger.info('Testing POV execution');
    const povStartTime = Date.now();
    const povExecution = await executeSimulatedAlgorithmicTrade(
      portfolioId,
      'MSFT',
      'buy',
      1000,
      'pov',
      {
        numSlices: 5,
        durationMinutes: 5, // Use a shorter time for testing
        maxParticipationRate: 0.1
      }
    );
    const povExecutionTime = Date.now() - povStartTime;
    
    // Compare execution prices
    const prices = {
      twap: twapExecution.success ? twapExecution.averageExecutedPrice : 0,
      vwap: vwapExecution.success ? vwapExecution.averageExecutedPrice : 0,
      pov: povExecution.success ? povExecution.averageExecutedPrice : 0
    };
    
    // Find best price (lowest for buy orders)
    const bestPrice = Object.entries(prices)
      .filter(([_, price]) => price > 0)
      .sort((a, b) => a[1] - b[1])[0][0];
    
    logger.info('Algorithmic trading tests completed');
    
    return {
      success: true,
      results: {
        twapExecution,
        vwapExecution,
        povExecution,
        strategy: strategyRecommendation,
        comparison: {
          bestPrice,
          executionTimes: {
            twap: twapExecutionTime,
            vwap: vwapExecutionTime,
            pov: povExecutionTime
          }
        }
      }
    };
  } catch (error) {
    logger.error('Algorithmic trading tests failed', { error });
    
    return {
      success: false,
      results: {
        twapExecution: { error: 'Test failed' },
        vwapExecution: { error: 'Test failed' },
        povExecution: { error: 'Test failed' },
        strategy: { error: 'Test failed' },
        comparison: {
          bestPrice: 'test failed',
          executionTimes: {
            twap: 0,
            vwap: 0,
            pov: 0
          }
        }
      }
    };
  }
}

/**
 * Test different order types
 */
export async function testOrderTypes(): Promise<{
  success: boolean;
  results: {
    marketOrder: any;
    limitOrder: any;
    stopOrder: any;
    stopLimitOrder: any;
    comparison: {
      fastestExecution: string;
      orderExecutionTimes: {
        market: number;
        limit: number;
        stop: number;
        stopLimit: number;
      };
    };
  };
}> {
  logger.info('Starting order type tests');
  
  try {
    // Create a test portfolio
    const portfolioCreation = await createSimulatedPortfolio();
    
    if (!portfolioCreation.success || !portfolioCreation.portfolioId) {
      throw new Error('Failed to create test portfolio');
    }
    
    const portfolioId = portfolioCreation.portfolioId;
    
    // Test market order
    logger.info('Testing market order');
    const marketStartTime = Date.now();
    const marketOrder = await executeSimulatedTrade(
      portfolioId,
      'AAPL',
      'buy',
      100,
      'market'
    );
    const marketExecutionTime = Date.now() - marketStartTime;
    
    // Test limit order
    logger.info('Testing limit order');
    const limitStartTime = Date.now();
    const limitOrder = await executeSimulatedTrade(
      portfolioId,
      'AAPL',
      'buy',
      100,
      'limit',
      {
        limitPrice: 180.0
      }
    );
    const limitExecutionTime = Date.now() - limitStartTime;
    
    // Test stop order
    logger.info('Testing stop order');
    const stopStartTime = Date.now();
    const stopOrder = await executeSimulatedTrade(
      portfolioId,
      'AAPL',
      'sell',
      50,
      'stop',
      {
        stopPrice: 175.0
      }
    );
    const stopExecutionTime = Date.now() - stopStartTime;
    
    // Test stop-limit order
    logger.info('Testing stop-limit order');
    const stopLimitStartTime = Date.now();
    const stopLimitOrder = await executeSimulatedTrade(
      portfolioId,
      'AAPL',
      'sell',
      50,
      'stop-limit',
      {
        stopPrice: 175.0,
        limitPrice: 170.0
      }
    );
    const stopLimitExecutionTime = Date.now() - stopLimitStartTime;
    
    // Compare execution times
    const executionTimes = {
      market: marketExecutionTime,
      limit: limitExecutionTime,
      stop: stopExecutionTime,
      stopLimit: stopLimitExecutionTime
    };
    
    // Find fastest execution
    const fastestExecution = Object.entries(executionTimes)
      .sort((a, b) => a[1] - b[1])[0][0];
    
    logger.info('Order type tests completed');
    
    return {
      success: true,
      results: {
        marketOrder,
        limitOrder,
        stopOrder,
        stopLimitOrder,
        comparison: {
          fastestExecution,
          orderExecutionTimes: executionTimes
        }
      }
    };
  } catch (error) {
    logger.error('Order type tests failed', { error });
    
    return {
      success: false,
      results: {
        marketOrder: { error: 'Test failed' },
        limitOrder: { error: 'Test failed' },
        stopOrder: { error: 'Test failed' },
        stopLimitOrder: { error: 'Test failed' },
        comparison: {
          fastestExecution: 'test failed',
          orderExecutionTimes: {
            market: 0,
            limit: 0,
            stop: 0,
            stopLimit: 0
          }
        }
      }
    };
  }
} 