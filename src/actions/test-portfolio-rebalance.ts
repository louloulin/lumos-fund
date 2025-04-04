'use server';

import { createLogger } from '@/lib/logger.server';
import { aiRebalancePortfolio, scheduleRebalance, cancelScheduledRebalance } from './index';

const logger = createLogger('test-portfolio-rebalance');

/**
 * Test portfolio rebalancing with different scenarios
 */
export async function testPortfolioRebalance(): Promise<{
  success: boolean;
  results: {
    standardRebalance: any;
    forceRebalance: any;
    riskAdjustedRebalance: any;
    schedulingTest: any;
    cancellationTest: any;
  };
  executionTime: number;
}> {
  logger.info('Starting portfolio rebalance tests');
  const startTime = Date.now();
  
  try {
    // Test 1: Standard rebalance
    logger.info('Testing standard portfolio rebalance');
    const standardRebalance = await aiRebalancePortfolio('test-portfolio-1', {});
    
    // Test 2: Force rebalance even when not needed
    logger.info('Testing forced portfolio rebalance');
    const forceRebalance = await aiRebalancePortfolio('test-portfolio-1', {
      forceRebalance: true
    });
    
    // Test 3: Rebalance with risk adjustment
    logger.info('Testing risk-adjusted portfolio rebalance');
    const riskAdjustedRebalance = await aiRebalancePortfolio('test-portfolio-2', {
      riskAdjust: true
    });
    
    // Test 4: Schedule a rebalance
    logger.info('Testing scheduled rebalance');
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 7); // Schedule for one week later
    
    const schedulingTest = await scheduleRebalance(
      'test-portfolio-1',
      scheduleDate.toISOString(),
      {
        frequency: 'monthly',
        riskAdjust: true
      }
    );
    
    // Test 5: Cancel a scheduled rebalance
    logger.info('Testing cancellation of scheduled rebalance');
    const cancellationTest = await cancelScheduledRebalance(
      schedulingTest.scheduleId || 'sched_123456789'
    );
    
    const executionTime = Date.now() - startTime;
    logger.info('Portfolio rebalance tests completed', { executionTime });
    
    // Return a comprehensive test result
    return {
      success: true,
      results: {
        standardRebalance,
        forceRebalance,
        riskAdjustedRebalance,
        schedulingTest,
        cancellationTest
      },
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Portfolio rebalance tests failed', { error, executionTime });
    
    return {
      success: false,
      results: {
        standardRebalance: { error: 'Test failed' },
        forceRebalance: { error: 'Test failed' },
        riskAdjustedRebalance: { error: 'Test failed' },
        schedulingTest: { error: 'Test failed' },
        cancellationTest: { error: 'Test failed' }
      },
      executionTime
    };
  }
}

/**
 * Test rebalancing with different portfolio types
 */
export async function testPortfolioTypeRebalance(): Promise<{
  success: boolean;
  results: {
    conservativePortfolio: any;
    aggressivePortfolio: any;
    incomePortfolio: any;
  };
}> {
  logger.info('Starting portfolio type rebalance tests');
  
  try {
    // Test rebalancing on a conservative portfolio
    logger.info('Testing conservative portfolio rebalance');
    const conservativePortfolio = await aiRebalancePortfolio('conservative-portfolio', {
      riskAdjust: true
    });
    
    // Test rebalancing on an aggressive growth portfolio
    logger.info('Testing aggressive portfolio rebalance');
    const aggressivePortfolio = await aiRebalancePortfolio('aggressive-portfolio', {
      forceRebalance: true
    });
    
    // Test rebalancing on an income-focused portfolio
    logger.info('Testing income portfolio rebalance');
    const incomePortfolio = await aiRebalancePortfolio('income-portfolio', {});
    
    logger.info('Portfolio type rebalance tests completed');
    
    return {
      success: true,
      results: {
        conservativePortfolio,
        aggressivePortfolio,
        incomePortfolio
      }
    };
  } catch (error) {
    logger.error('Portfolio type rebalance tests failed', { error });
    
    return {
      success: false,
      results: {
        conservativePortfolio: { error: 'Test failed' },
        aggressivePortfolio: { error: 'Test failed' },
        incomePortfolio: { error: 'Test failed' }
      }
    };
  }
}

/**
 * Test portfolio rebalance performance
 */
export async function testRebalancePerformance(): Promise<{
  success: boolean;
  results: {
    smallPortfolio: { executionTime: number; instructionCount: number };
    mediumPortfolio: { executionTime: number; instructionCount: number };
    largePortfolio: { executionTime: number; instructionCount: number };
  };
}> {
  logger.info('Starting portfolio rebalance performance tests');
  
  try {
    // Test with different portfolio sizes
    
    // Small portfolio (5-10 holdings)
    const smallStart = Date.now();
    const smallResult = await aiRebalancePortfolio('small-portfolio', {});
    const smallTime = Date.now() - smallStart;
    
    // Medium portfolio (20-30 holdings)
    const mediumStart = Date.now();
    const mediumResult = await aiRebalancePortfolio('medium-portfolio', {});
    const mediumTime = Date.now() - mediumStart;
    
    // Large portfolio (50+ holdings)
    const largeStart = Date.now();
    const largeResult = await aiRebalancePortfolio('large-portfolio', {});
    const largeTime = Date.now() - largeStart;
    
    logger.info('Portfolio rebalance performance tests completed');
    
    const smallInstructionCount = 'instructions' in smallResult 
      ? (smallResult as any).instructions.length 
      : 0;
      
    const mediumInstructionCount = 'instructions' in mediumResult
      ? (mediumResult as any).instructions.length
      : 0;
      
    const largeInstructionCount = 'instructions' in largeResult
      ? (largeResult as any).instructions.length
      : 0;
    
    return {
      success: true,
      results: {
        smallPortfolio: { 
          executionTime: smallTime,
          instructionCount: smallInstructionCount
        },
        mediumPortfolio: {
          executionTime: mediumTime,
          instructionCount: mediumInstructionCount
        },
        largePortfolio: {
          executionTime: largeTime,
          instructionCount: largeInstructionCount
        }
      }
    };
  } catch (error) {
    logger.error('Portfolio rebalance performance tests failed', { error });
    
    return {
      success: false,
      results: {
        smallPortfolio: { executionTime: 0, instructionCount: 0 },
        mediumPortfolio: { executionTime: 0, instructionCount: 0 },
        largePortfolio: { executionTime: 0, instructionCount: 0 }
      }
    };
  }
} 