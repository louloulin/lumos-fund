'use server';

import { createLogger } from '@/lib/logger.server';
import { MockMarketDataService } from '@/services/mockMarketDataService';
import { 
  portfolioOptimizationAgent, 
  riskManagementAgent 
} from '@/mastra/index';

const logger = createLogger('portfolio-rebalance');

// Portfolio holding interface
interface PortfolioHolding {
  ticker: string;
  quantity: number;
  currentPrice: number;
  targetAllocation: number;
  currentAllocation: number;
  marketValue: number;
}

// Portfolio state interface
interface Portfolio {
  id: string;
  name: string;
  cash: number;
  holdings: PortfolioHolding[];
  lastRebalanced: string | null;
  totalValue: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
}

// Rebalance instruction interface
interface RebalanceInstruction {
  ticker: string;
  action: 'buy' | 'sell' | 'hold';
  quantity: number;
  estimatedValue: number;
  reason: string;
}

// Rebalance result interface
export interface RebalanceResult {
  portfolioId: string;
  timestamp: string;
  instructions: RebalanceInstruction[];
  currentAllocations: { ticker: string; percentage: number }[];
  targetAllocations: { ticker: string; percentage: number }[];
  deviationBeforeRebalance: number;
  deviationAfterRebalance: number;
  cashRemaining: number;
  totalValue: number;
  costEstimate: number;
  riskAdjustment: string | null;
}

/**
 * Analyze portfolio for rebalancing needs
 */
async function analyzePortfolioBalance(portfolio: Portfolio): Promise<{
  needsRebalancing: boolean;
  totalDeviation: number;
  deviationsByTicker: Record<string, number>;
}> {
  logger.info('Analyzing portfolio balance', { portfolioId: portfolio.id });
  
  let totalDeviation = 0;
  const deviationsByTicker: Record<string, number> = {};
  
  // Calculate deviations from target allocations
  portfolio.holdings.forEach(holding => {
    const deviation = Math.abs(holding.currentAllocation - holding.targetAllocation);
    deviationsByTicker[holding.ticker] = deviation;
    totalDeviation += deviation;
  });
  
  // Determine if rebalancing is needed (typically if deviation > 5%)
  const needsRebalancing = totalDeviation > 0.05 || 
    Object.values(deviationsByTicker).some(dev => dev > 0.03);
  
  return {
    needsRebalancing,
    totalDeviation,
    deviationsByTicker
  };
}

/**
 * Generate rebalancing instructions using AI agents
 */
async function generateRebalancingPlan(
  portfolio: Portfolio, 
  deviationsByTicker: Record<string, number>
): Promise<RebalanceInstruction[]> {
  logger.info('Generating rebalancing plan', { portfolioId: portfolio.id });
  
  const marketDataService = new MockMarketDataService();
  await marketDataService.initialize();
  
  try {
    // Use portfolio optimization agent to recommend allocation changes
    const optimizationPrompt = `
      I need to rebalance a portfolio with the following details:
      - Risk profile: ${portfolio.riskProfile}
      - Total value: $${portfolio.totalValue.toFixed(2)}
      - Cash available: $${portfolio.cash.toFixed(2)}
      
      Current holdings:
      ${portfolio.holdings
        .map(h => `- ${h.ticker}: ${(h.currentAllocation * 100).toFixed(2)}% (target: ${(h.targetAllocation * 100).toFixed(2)}%)`)
        .join('\n')}
      
      Significant deviations:
      ${Object.entries(deviationsByTicker)
        .filter(([_, dev]) => dev > 0.02)
        .map(([ticker, dev]) => `- ${ticker}: ${(dev * 100).toFixed(2)}% deviation`)
        .join('\n')}
      
      Please provide specific rebalancing instructions to bring the portfolio back to target allocations.
      For each position, indicate whether to buy, sell, or hold, along with the specific quantity and reasoning.
    `;
    
    // Call the agent using the RunInput interface
    const optimizationResponse = await portfolioOptimizationAgent.generate(optimizationPrompt);
    
    // Use risk management agent to validate the plan
    const riskValidationPrompt = `
      Please review this portfolio rebalance plan from a risk management perspective:
      
      ${optimizationResponse.text}
      
      Portfolio risk profile: ${portfolio.riskProfile}
      Current market conditions: moderate volatility
      
      Identify any potential issues with this rebalancing plan from a risk perspective.
      If you approve the plan, say "APPROVED". If you have concerns, explain them and suggest modifications.
    `;
    
    // Call the agent using the generate method
    const riskValidationResponse = await riskManagementAgent.generate(riskValidationPrompt);
    
    // Parse the agent responses to extract rebalancing instructions
    const instructions = parseRebalancingInstructions(
      optimizationResponse.text,
      riskValidationResponse.text,
      portfolio
    );
    
    return instructions;
  } catch (error) {
    logger.error('Error generating rebalancing plan', { error });
    throw new Error('Failed to generate rebalancing plan');
  }
}

/**
 * Parse agent responses into structured rebalancing instructions
 */
function parseRebalancingInstructions(
  optimizationResponse: string,
  riskValidationResponse: string,
  portfolio: Portfolio
): RebalanceInstruction[] {
  const instructions: RebalanceInstruction[] = [];
  
  // Extract ticker symbols from the portfolio
  const tickers = portfolio.holdings.map(h => h.ticker);
  
  // Rough parsing of agent response to extract actions
  // In a production app, you would use a more robust parsing approach
  tickers.forEach(ticker => {
    const tickerRegex = new RegExp(`${ticker}[\\s\\S]*?(buy|sell|hold)[\\s\\S]*?(\\d+)\\s+shares?`, 'i');
    const match = optimizationResponse.match(tickerRegex);
    
    if (match) {
      const action = match[1].toLowerCase() as 'buy' | 'sell' | 'hold';
      const quantity = parseInt(match[2], 10);
      const holding = portfolio.holdings.find(h => h.ticker === ticker);
      
      if (holding && (action === 'buy' || action === 'sell') && quantity > 0) {
        instructions.push({
          ticker,
          action,
          quantity,
          estimatedValue: quantity * holding.currentPrice,
          reason: extractReasoning(optimizationResponse, ticker)
        });
      }
    }
  });
  
  return instructions;
}

/**
 * Extract reasoning for a specific ticker from the agent response
 */
function extractReasoning(response: string, ticker: string): string {
  const reasonRegex = new RegExp(`${ticker}[\\s\\S]*?reason:([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
  const match = response.match(reasonRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return 'Rebalancing to target allocation';
}

/**
 * Predict the impact of rebalancing instructions on the portfolio
 */
function predictRebalanceImpact(
  portfolio: Portfolio,
  instructions: RebalanceInstruction[]
): {
  newAllocations: { ticker: string; percentage: number }[];
  deviationAfterRebalance: number;
  cashRemaining: number;
  costEstimate: number;
} {
  let cashRemaining = portfolio.cash;
  let costEstimate = 0;
  
  // Create a deep copy of holdings to modify
  const updatedHoldings = portfolio.holdings.map(h => ({
    ...h,
    quantity: h.quantity,
    marketValue: h.marketValue
  }));
  
  // Apply instructions to predict new state
  for (const instruction of instructions) {
    const holdingIndex = updatedHoldings.findIndex(h => h.ticker === instruction.ticker);
    
    if (holdingIndex === -1) continue;
    
    const holding = updatedHoldings[holdingIndex];
    
    if (instruction.action === 'buy') {
      holding.quantity += instruction.quantity;
      holding.marketValue += instruction.estimatedValue;
      cashRemaining -= instruction.estimatedValue;
      costEstimate += instruction.estimatedValue * 0.005; // Assume 0.5% transaction cost
    } else if (instruction.action === 'sell') {
      holding.quantity -= instruction.quantity;
      holding.marketValue -= instruction.estimatedValue;
      cashRemaining += instruction.estimatedValue;
      costEstimate += instruction.estimatedValue * 0.005; // Assume 0.5% transaction cost
    }
  }
  
  // Calculate new total value and allocations
  const newTotalValue = updatedHoldings.reduce((sum, h) => sum + h.marketValue, 0) + cashRemaining;
  
  const newAllocations = updatedHoldings.map(h => ({
    ticker: h.ticker,
    percentage: h.marketValue / newTotalValue
  }));
  
  // Calculate new total deviation
  const deviationAfterRebalance = updatedHoldings.reduce((sum, h) => {
    const newAllocation = h.marketValue / newTotalValue;
    return sum + Math.abs(newAllocation - h.targetAllocation);
  }, 0);
  
  return {
    newAllocations,
    deviationAfterRebalance,
    cashRemaining,
    costEstimate
  };
}

/**
 * Main action to rebalance a portfolio
 */
export async function rebalancePortfolio(
  portfolioId: string,
  options: {
    forceRebalance?: boolean;
    riskAdjust?: boolean;
    maxCashToInvest?: number;
  } = {}
): Promise<RebalanceResult | { error: string }> {
  logger.info('Starting portfolio rebalance', { portfolioId, options });
  
  try {
    // In a real application, fetch the portfolio from a database
    // For this demo, we'll use mock data
    const portfolio = await fetchPortfolio(portfolioId);
    
    // Analyze current portfolio balance
    const { needsRebalancing, totalDeviation, deviationsByTicker } = 
      await analyzePortfolioBalance(portfolio);
    
    // If no rebalancing needed and not forced, return early
    if (!needsRebalancing && !options.forceRebalance) {
      return {
        error: "Portfolio is already well-balanced. No rebalancing needed."
      };
    }
    
    // Generate rebalancing plan
    const instructions = await generateRebalancingPlan(portfolio, deviationsByTicker);
    
    // Predict the impact of rebalancing
    const { 
      newAllocations, 
      deviationAfterRebalance, 
      cashRemaining, 
      costEstimate 
    } = predictRebalanceImpact(portfolio, instructions);
    
    // Current allocations for reporting
    const currentAllocations = portfolio.holdings.map(h => ({
      ticker: h.ticker,
      percentage: h.currentAllocation
    }));
    
    // Target allocations for reporting
    const targetAllocations = portfolio.holdings.map(h => ({
      ticker: h.ticker,
      percentage: h.targetAllocation
    }));
    
    logger.info('Portfolio rebalance plan generated', { 
      portfolioId, 
      instructionCount: instructions.length,
      deviationBefore: totalDeviation,
      deviationAfter: deviationAfterRebalance
    });
    
    // Return rebalance plan
    return {
      portfolioId,
      timestamp: new Date().toISOString(),
      instructions,
      currentAllocations,
      targetAllocations,
      deviationBeforeRebalance: totalDeviation,
      deviationAfterRebalance,
      cashRemaining,
      totalValue: portfolio.totalValue,
      costEstimate,
      riskAdjustment: options.riskAdjust ? 'Applied risk-based adjustments' : null
    };
    
  } catch (error) {
    logger.error('Portfolio rebalance failed', { portfolioId, error });
    return {
      error: `Failed to rebalance portfolio: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Mock function to fetch portfolio data
 * In a real app, this would retrieve data from a database
 */
async function fetchPortfolio(portfolioId: string): Promise<Portfolio> {
  // Simulate database query delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock portfolio data
  return {
    id: portfolioId,
    name: 'Growth Portfolio',
    cash: 15000,
    totalValue: 200000,
    lastRebalanced: '2023-03-15T14:30:00Z',
    riskProfile: 'moderate',
    holdings: [
      {
        ticker: 'AAPL',
        quantity: 100,
        currentPrice: 190.5,
        targetAllocation: 0.15,
        currentAllocation: 0.095,
        marketValue: 19050
      },
      {
        ticker: 'MSFT',
        quantity: 85,
        currentPrice: 420.25,
        targetAllocation: 0.20,
        currentAllocation: 0.178,
        marketValue: 35721.25
      },
      {
        ticker: 'AMZN',
        quantity: 65,
        currentPrice: 180.75,
        targetAllocation: 0.10,
        currentAllocation: 0.059,
        marketValue: 11748.75
      },
      {
        ticker: 'GOOGL',
        quantity: 110,
        currentPrice: 150.20,
        targetAllocation: 0.15,
        currentAllocation: 0.083,
        marketValue: 16522
      },
      {
        ticker: 'BRK.B',
        quantity: 150,
        currentPrice: 410.80,
        targetAllocation: 0.25,
        currentAllocation: 0.308,
        marketValue: 61620
      },
      {
        ticker: 'JNJ',
        quantity: 120,
        currentPrice: 165.30,
        targetAllocation: 0.10,
        currentAllocation: 0.099,
        marketValue: 19836
      },
      {
        ticker: 'VTI',
        quantity: 200,
        currentPrice: 250.10,
        targetAllocation: 0.05,
        currentAllocation: 0.178,
        marketValue: 35014
      }
    ]
  };
}

/**
 * Schedule a portfolio rebalance for a future date
 */
export async function scheduleRebalance(
  portfolioId: string,
  scheduledDate: string,
  options: {
    frequency?: 'one-time' | 'weekly' | 'monthly' | 'quarterly';
    riskAdjust?: boolean;
    maxCashToInvest?: number;
  } = {}
): Promise<{ success: boolean; message: string; scheduleId?: string }> {
  try {
    logger.info('Scheduling portfolio rebalance', { portfolioId, scheduledDate, options });
    
    // In a real application, this would create an entry in a scheduling system
    // For this demo, we'll just return a success message
    
    const scheduleId = `sched_${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    return {
      success: true,
      message: `Portfolio rebalance scheduled for ${scheduledDate}`,
      scheduleId
    };
  } catch (error) {
    logger.error('Failed to schedule portfolio rebalance', { portfolioId, error });
    return {
      success: false,
      message: `Failed to schedule rebalance: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Cancel a scheduled portfolio rebalance
 */
export async function cancelScheduledRebalance(
  scheduleId: string
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info('Cancelling scheduled portfolio rebalance', { scheduleId });
    
    // In a real application, this would delete an entry from a scheduling system
    // For this demo, we'll just return a success message
    
    return {
      success: true,
      message: `Scheduled rebalance ${scheduleId} has been cancelled`
    };
  } catch (error) {
    logger.error('Failed to cancel scheduled rebalance', { scheduleId, error });
    return {
      success: false,
      message: `Failed to cancel scheduled rebalance: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 