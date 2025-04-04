'use server';

import { createLogger } from '@/lib/logger.server';
import { MockMarketDataService } from '@/services/mockMarketDataService';
import { riskManagementAgent } from '@/mastra/index';

const logger = createLogger('risk-assessment');

// VaR result interface
export interface VaRResult {
  value: number;
  percentile: number;
  confidenceLevel: number;
  horizon: string;
  methodology: 'historical' | 'parametric' | 'monte-carlo';
}

// CVaR result interface
export interface CVaRResult {
  value: number;
  confidenceLevel: number;
  horizon: string;
  expectedShortfall: number;
  methodology: 'historical' | 'parametric' | 'monte-carlo';
}

// Risk assessment result
export interface RiskAssessmentResult {
  portfolioId: string;
  timestamp: string;
  valueAtRisk: VaRResult;
  conditionalValueAtRisk: CVaRResult;
  stressTestResults: Array<{
    scenario: string;
    expectedLoss: number;
    probabilityOfOccurrence: number;
    impactedAssets: string[];
  }>;
  volatilityMetrics: {
    portfolioVolatility: number;
    benchmarkVolatility: number;
    relativeVolatility: number;
    volatilityTrend: 'increasing' | 'decreasing' | 'stable';
  };
  riskContributors: Array<{
    ticker: string;
    contribution: number;
    sensitivity: number;
  }>;
  downsideRiskMetrics: {
    downsideDeviation: number;
    sortino: number;
    maxDrawdown: number;
    recoveryTime: number | null;
  };
  riskSummary: string;
}

/**
 * Calculate Value at Risk (VaR) for a portfolio
 * VaR represents the maximum potential loss within a specified confidence level over a given time horizon
 */
async function calculateValueAtRisk(
  portfolioId: string,
  confidenceLevel: number = 0.95,
  horizon: '1d' | '5d' | '10d' | '20d' = '1d',
  methodology: 'historical' | 'parametric' | 'monte-carlo' = 'historical'
): Promise<VaRResult> {
  logger.info('Calculating VaR', { portfolioId, confidenceLevel, horizon, methodology });
  
  // Get portfolio and market data
  const portfolio = await fetchPortfolio(portfolioId);
  const marketDataService = new MockMarketDataService();
  await marketDataService.initialize();
  
  // Extract tickers and weights
  const tickers = portfolio.holdings.map(h => h.ticker);
  const weights: Record<string, number> = {};
  portfolio.holdings.forEach(h => {
    weights[h.ticker] = h.marketValue / portfolio.totalValue;
  });
  
  // Fetch historical prices for all tickers
  const historicalData: Record<string, number[][]> = {};
  
  for (const ticker of tickers) {
    const priceHistory = await marketDataService.fetchStockPriceHistory(ticker, '1y');
    historicalData[ticker] = priceHistory.map(p => [new Date(p.date).getTime(), p.close]);
  }
  
  try {
    switch (methodology) {
      case 'historical':
        return calculateHistoricalVaR(portfolio, historicalData, weights, confidenceLevel, horizon);
      case 'parametric':
        return calculateParametricVaR(portfolio, historicalData, weights, confidenceLevel, horizon);
      case 'monte-carlo':
        return calculateMonteCarloVaR(portfolio, historicalData, weights, confidenceLevel, horizon);
      default:
        return calculateHistoricalVaR(portfolio, historicalData, weights, confidenceLevel, horizon);
    }
  } catch (error) {
    logger.error('Error calculating VaR', { error });
    throw new Error(`Failed to calculate VaR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate Conditional Value at Risk (CVaR) - also known as Expected Shortfall
 * CVaR represents the expected loss given that the loss exceeds VaR
 */
async function calculateConditionalValueAtRisk(
  portfolioId: string,
  confidenceLevel: number = 0.95,
  horizon: '1d' | '5d' | '10d' | '20d' = '1d',
  methodology: 'historical' | 'parametric' | 'monte-carlo' = 'historical'
): Promise<CVaRResult> {
  logger.info('Calculating CVaR', { portfolioId, confidenceLevel, horizon, methodology });
  
  // Get portfolio and market data
  const portfolio = await fetchPortfolio(portfolioId);
  const marketDataService = new MockMarketDataService();
  await marketDataService.initialize();
  
  // Extract tickers and weights
  const tickers = portfolio.holdings.map(h => h.ticker);
  const weights: Record<string, number> = {};
  portfolio.holdings.forEach(h => {
    weights[h.ticker] = h.marketValue / portfolio.totalValue;
  });
  
  // Fetch historical prices for all tickers
  const historicalData: Record<string, number[][]> = {};
  
  for (const ticker of tickers) {
    const priceHistory = await marketDataService.fetchStockPriceHistory(ticker, '1y');
    historicalData[ticker] = priceHistory.map(p => [new Date(p.date).getTime(), p.close]);
  }
  
  try {
    // First calculate VaR
    const varResult = await calculateValueAtRisk(portfolioId, confidenceLevel, horizon, methodology);
    
    switch (methodology) {
      case 'historical':
        return calculateHistoricalCVaR(portfolio, historicalData, weights, confidenceLevel, horizon, varResult);
      case 'parametric':
        return calculateParametricCVaR(portfolio, historicalData, weights, confidenceLevel, horizon, varResult);
      case 'monte-carlo':
        return calculateMonteCarloCVaR(portfolio, historicalData, weights, confidenceLevel, horizon, varResult);
      default:
        return calculateHistoricalCVaR(portfolio, historicalData, weights, confidenceLevel, horizon, varResult);
    }
  } catch (error) {
    logger.error('Error calculating CVaR', { error });
    throw new Error(`Failed to calculate CVaR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate historical Value at Risk
 */
function calculateHistoricalVaR(
  portfolio: any,
  historicalData: Record<string, number[][]>,
  weights: Record<string, number>,
  confidenceLevel: number,
  horizon: string
): VaRResult {
  // Calculate daily returns for each asset
  const returns: Record<string, number[]> = {};
  
  for (const ticker in historicalData) {
    const prices = historicalData[ticker].map(p => p[1]);
    const dailyReturns = [];
    
    for (let i = 1; i < prices.length; i++) {
      dailyReturns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    returns[ticker] = dailyReturns;
  }
  
  // Calculate weighted portfolio returns
  const portfolioReturns: number[] = [];
  const numDays = Math.min(...Object.values(returns).map(r => r.length));
  
  for (let i = 0; i < numDays; i++) {
    let dailyReturn = 0;
    
    for (const ticker in returns) {
      if (i < returns[ticker].length) {
        dailyReturn += returns[ticker][i] * weights[ticker];
      }
    }
    
    portfolioReturns.push(dailyReturn);
  }
  
  // Sort returns to find the percentile
  portfolioReturns.sort((a, b) => a - b);
  
  // Calculate VaR at the given confidence level
  const index = Math.floor(portfolioReturns.length * (1 - confidenceLevel));
  const percentile = portfolioReturns[index];
  
  // Scale VaR to the given horizon
  const horizonScaleFactor = getHorizonScaleFactor(horizon);
  const varValue = -percentile * portfolio.totalValue * Math.sqrt(horizonScaleFactor);
  
  return {
    value: varValue,
    percentile: -percentile,
    confidenceLevel,
    horizon,
    methodology: 'historical'
  };
}

/**
 * Calculate parametric Value at Risk
 */
function calculateParametricVaR(
  portfolio: any,
  historicalData: Record<string, number[][]>,
  weights: Record<string, number>,
  confidenceLevel: number,
  horizon: string
): VaRResult {
  // Calculate daily returns for each asset
  const returns: Record<string, number[]> = {};
  
  for (const ticker in historicalData) {
    const prices = historicalData[ticker].map(p => p[1]);
    const dailyReturns = [];
    
    for (let i = 1; i < prices.length; i++) {
      dailyReturns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    returns[ticker] = dailyReturns;
  }
  
  // Calculate weighted portfolio returns
  const portfolioReturns: number[] = [];
  const numDays = Math.min(...Object.values(returns).map(r => r.length));
  
  for (let i = 0; i < numDays; i++) {
    let dailyReturn = 0;
    
    for (const ticker in returns) {
      if (i < returns[ticker].length) {
        dailyReturn += returns[ticker][i] * weights[ticker];
      }
    }
    
    portfolioReturns.push(dailyReturn);
  }
  
  // Calculate mean and standard deviation of portfolio returns
  const mean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
  const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / portfolioReturns.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate Z-score for the given confidence level
  const zScore = calculateZScore(confidenceLevel);
  
  // Calculate parametric VaR
  const horizonScaleFactor = getHorizonScaleFactor(horizon);
  const varValue = portfolio.totalValue * stdDev * zScore * Math.sqrt(horizonScaleFactor);
  
  return {
    value: varValue,
    percentile: stdDev * zScore,
    confidenceLevel,
    horizon,
    methodology: 'parametric'
  };
}

/**
 * Calculate Monte Carlo Value at Risk
 */
function calculateMonteCarloVaR(
  portfolio: any,
  historicalData: Record<string, number[][]>,
  weights: Record<string, number>,
  confidenceLevel: number,
  horizon: string
): VaRResult {
  // Calculate daily returns for each asset
  const returns: Record<string, number[]> = {};
  
  for (const ticker in historicalData) {
    const prices = historicalData[ticker].map(p => p[1]);
    const dailyReturns = [];
    
    for (let i = 1; i < prices.length; i++) {
      dailyReturns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    returns[ticker] = dailyReturns;
  }
  
  // Calculate mean and standard deviation for each asset
  const meanReturns: Record<string, number> = {};
  const stdDevs: Record<string, number> = {};
  
  for (const ticker in returns) {
    const mean = returns[ticker].reduce((sum, r) => sum + r, 0) / returns[ticker].length;
    const variance = returns[ticker].reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns[ticker].length;
    const stdDev = Math.sqrt(variance);
    
    meanReturns[ticker] = mean;
    stdDevs[ticker] = stdDev;
  }
  
  // Run Monte Carlo simulation
  const numSimulations = 10000;
  const simulatedReturns: number[] = [];
  
  for (let i = 0; i < numSimulations; i++) {
    let portfolioReturn = 0;
    
    for (const ticker in weights) {
      // Generate random return from normal distribution
      const randomReturn = generateNormalRandom(meanReturns[ticker], stdDevs[ticker]);
      portfolioReturn += randomReturn * weights[ticker];
    }
    
    simulatedReturns.push(portfolioReturn);
  }
  
  // Sort simulated returns to find the percentile
  simulatedReturns.sort((a, b) => a - b);
  
  // Calculate VaR at the given confidence level
  const index = Math.floor(simulatedReturns.length * (1 - confidenceLevel));
  const percentile = simulatedReturns[index];
  
  // Scale VaR to the given horizon
  const horizonScaleFactor = getHorizonScaleFactor(horizon);
  const varValue = -percentile * portfolio.totalValue * Math.sqrt(horizonScaleFactor);
  
  return {
    value: varValue,
    percentile: -percentile,
    confidenceLevel,
    horizon,
    methodology: 'monte-carlo'
  };
}

/**
 * Calculate historical Conditional Value at Risk
 */
function calculateHistoricalCVaR(
  portfolio: any,
  historicalData: Record<string, number[][]>,
  weights: Record<string, number>,
  confidenceLevel: number,
  horizon: string,
  varResult: VaRResult
): CVaRResult {
  // Calculate daily returns for each asset
  const returns: Record<string, number[]> = {};
  
  for (const ticker in historicalData) {
    const prices = historicalData[ticker].map(p => p[1]);
    const dailyReturns = [];
    
    for (let i = 1; i < prices.length; i++) {
      dailyReturns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    returns[ticker] = dailyReturns;
  }
  
  // Calculate weighted portfolio returns
  const portfolioReturns: number[] = [];
  const numDays = Math.min(...Object.values(returns).map(r => r.length));
  
  for (let i = 0; i < numDays; i++) {
    let dailyReturn = 0;
    
    for (const ticker in returns) {
      if (i < returns[ticker].length) {
        dailyReturn += returns[ticker][i] * weights[ticker];
      }
    }
    
    portfolioReturns.push(dailyReturn);
  }
  
  // Sort returns
  portfolioReturns.sort((a, b) => a - b);
  
  // Find returns below VaR
  const varThreshold = -varResult.percentile;
  const returnsBelowVaR = portfolioReturns.filter(r => r < varThreshold);
  
  // Calculate average of returns below VaR
  const cvarPercentile = returnsBelowVaR.reduce((sum, r) => sum + r, 0) / returnsBelowVaR.length;
  
  // Scale CVaR to the given horizon
  const horizonScaleFactor = getHorizonScaleFactor(horizon);
  const cvarValue = -cvarPercentile * portfolio.totalValue * Math.sqrt(horizonScaleFactor);
  
  return {
    value: cvarValue,
    confidenceLevel,
    horizon,
    expectedShortfall: cvarValue - varResult.value,
    methodology: 'historical'
  };
}

/**
 * Calculate parametric Conditional Value at Risk
 */
function calculateParametricCVaR(
  portfolio: any,
  historicalData: Record<string, number[][]>,
  weights: Record<string, number>,
  confidenceLevel: number,
  horizon: string,
  varResult: VaRResult
): CVaRResult {
  // Calculate daily returns for each asset
  const returns: Record<string, number[]> = {};
  
  for (const ticker in historicalData) {
    const prices = historicalData[ticker].map(p => p[1]);
    const dailyReturns = [];
    
    for (let i = 1; i < prices.length; i++) {
      dailyReturns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    returns[ticker] = dailyReturns;
  }
  
  // Calculate weighted portfolio returns
  const portfolioReturns: number[] = [];
  const numDays = Math.min(...Object.values(returns).map(r => r.length));
  
  for (let i = 0; i < numDays; i++) {
    let dailyReturn = 0;
    
    for (const ticker in returns) {
      if (i < returns[ticker].length) {
        dailyReturn += returns[ticker][i] * weights[ticker];
      }
    }
    
    portfolioReturns.push(dailyReturn);
  }
  
  // Calculate mean and standard deviation of portfolio returns
  const mean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
  const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / portfolioReturns.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate Z-score for the given confidence level
  const zScore = calculateZScore(confidenceLevel);
  
  // Calculate CVaR based on the formula for normal distribution
  const zScorePDFAtCutoff = Math.exp(-(zScore ** 2) / 2) / Math.sqrt(2 * Math.PI);
  const cvarPercentile = stdDev * (zScorePDFAtCutoff / (1 - confidenceLevel));
  
  // Scale CVaR to the given horizon
  const horizonScaleFactor = getHorizonScaleFactor(horizon);
  const cvarValue = portfolio.totalValue * cvarPercentile * Math.sqrt(horizonScaleFactor);
  
  return {
    value: cvarValue,
    confidenceLevel,
    horizon,
    expectedShortfall: cvarValue - varResult.value,
    methodology: 'parametric'
  };
}

/**
 * Calculate Monte Carlo Conditional Value at Risk
 */
function calculateMonteCarloCVaR(
  portfolio: any,
  historicalData: Record<string, number[][]>,
  weights: Record<string, number>,
  confidenceLevel: number,
  horizon: string,
  varResult: VaRResult
): CVaRResult {
  // Calculate daily returns for each asset
  const returns: Record<string, number[]> = {};
  
  for (const ticker in historicalData) {
    const prices = historicalData[ticker].map(p => p[1]);
    const dailyReturns = [];
    
    for (let i = 1; i < prices.length; i++) {
      dailyReturns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    returns[ticker] = dailyReturns;
  }
  
  // Calculate mean and standard deviation for each asset
  const meanReturns: Record<string, number> = {};
  const stdDevs: Record<string, number> = {};
  
  for (const ticker in returns) {
    const mean = returns[ticker].reduce((sum, r) => sum + r, 0) / returns[ticker].length;
    const variance = returns[ticker].reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns[ticker].length;
    const stdDev = Math.sqrt(variance);
    
    meanReturns[ticker] = mean;
    stdDevs[ticker] = stdDev;
  }
  
  // Run Monte Carlo simulation
  const numSimulations = 10000;
  const simulatedReturns: number[] = [];
  
  for (let i = 0; i < numSimulations; i++) {
    let portfolioReturn = 0;
    
    for (const ticker in weights) {
      // Generate random return from normal distribution
      const randomReturn = generateNormalRandom(meanReturns[ticker], stdDevs[ticker]);
      portfolioReturn += randomReturn * weights[ticker];
    }
    
    simulatedReturns.push(portfolioReturn);
  }
  
  // Sort simulated returns to find the percentile
  simulatedReturns.sort((a, b) => a - b);
  
  // Calculate returns below VaR
  const varThreshold = -varResult.percentile;
  const returnsBelowVaR = simulatedReturns.filter(r => r < varThreshold);
  
  // Calculate average of returns below VaR
  const cvarPercentile = returnsBelowVaR.reduce((sum, r) => sum + r, 0) / returnsBelowVaR.length;
  
  // Scale CVaR to the given horizon
  const horizonScaleFactor = getHorizonScaleFactor(horizon);
  const cvarValue = -cvarPercentile * portfolio.totalValue * Math.sqrt(horizonScaleFactor);
  
  return {
    value: cvarValue,
    confidenceLevel,
    horizon,
    expectedShortfall: cvarValue - varResult.value,
    methodology: 'monte-carlo'
  };
}

/**
 * Calculate Z-score for a given confidence level
 */
function calculateZScore(confidenceLevel: number): number {
  // Approximation of the inverse standard normal CDF
  const p = 1 - confidenceLevel;
  const a1 = -3.969683028665376e+01;
  const a2 = 2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 = 1.383577518672690e+02;
  const a5 = -3.066479806614716e+01;
  const a6 = 2.506628277459239e+00;
  
  const b1 = -5.447609879822406e+01;
  const b2 = 1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 = 6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;
  
  const c1 = -7.784894002430293e-03;
  const c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00;
  const c4 = -2.549732539343734e+00;
  const c5 = 4.374664141464968e+00;
  const c6 = 2.938163982698783e+00;
  
  const d1 = 7.784695709041462e-03;
  const d2 = 3.224671290700398e-01;
  const d3 = 2.445134137142996e+00;
  const d4 = 3.754408661907416e+00;
  
  let q, r;
  
  if (p < 0.02425) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p < 0.97575) {
    q = p - 0.5;
    r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
}

/**
 * Generate random number from normal distribution
 */
function generateNormalRandom(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Get scale factor for different time horizons
 */
function getHorizonScaleFactor(horizon: string): number {
  switch (horizon) {
    case '1d': return 1;
    case '5d': return 5;
    case '10d': return 10;
    case '20d': return 20;
    default: return 1;
  }
}

/**
 * Main action for portfolio risk assessment
 */
export async function assessPortfolioRisk(
  portfolioId: string,
  options: {
    confidenceLevel?: number;
    horizon?: '1d' | '5d' | '10d' | '20d';
    methodology?: 'historical' | 'parametric' | 'monte-carlo';
    includeStressTests?: boolean;
    includeRiskContribution?: boolean;
  } = {}
): Promise<RiskAssessmentResult | { error: string }> {
  logger.info('Starting portfolio risk assessment', { portfolioId, options });
  
  try {
    // Default options
    const confidenceLevel = options.confidenceLevel || 0.95;
    const horizon = options.horizon || '1d';
    const methodology = options.methodology || 'historical';
    
    // Calculate VaR and CVaR
    const varResult = await calculateValueAtRisk(portfolioId, confidenceLevel, horizon, methodology);
    const cvarResult = await calculateConditionalValueAtRisk(portfolioId, confidenceLevel, horizon, methodology);
    
    // Get portfolio data
    const portfolio = await fetchPortfolio(portfolioId);
    
    // Use risk management agent for additional assessment
    const marketDataService = new MockMarketDataService();
    await marketDataService.initialize();
    
    // Fetch historical prices for all tickers
    const tickers = portfolio.holdings.map((h: any) => h.ticker);
    const historicalData: Record<string, any[]> = {};
    
    for (const ticker of tickers) {
      historicalData[ticker] = await marketDataService.fetchStockPriceHistory(ticker, '1y');
    }
    
    // Prepare agent prompt for risk assessment
    const agentPrompt = `
      Please provide a comprehensive risk assessment for the following portfolio:
      
      Portfolio Details:
      - ID: ${portfolioId}
      - Total Value: $${portfolio.totalValue.toFixed(2)}
      - Value at Risk (${confidenceLevel * 100}%, ${horizon}): $${varResult.value.toFixed(2)}
      - Conditional Value at Risk (${confidenceLevel * 100}%, ${horizon}): $${cvarResult.value.toFixed(2)}
      
      Holdings:
      ${portfolio.holdings.map((h: any) => 
        `- ${h.ticker}: ${h.quantity} shares, $${h.marketValue.toFixed(2)} (${(h.marketValue / portfolio.totalValue * 100).toFixed(2)}% of portfolio)`
      ).join('\n')}
      
      Please provide the following:
      
      1. Volatility metrics (portfolio volatility, benchmark volatility, relative volatility, volatility trend)
      2. Downside risk metrics (downside deviation, Sortino ratio, max drawdown, recovery time estimate)
      3. ${options.includeStressTests ? 'Stress test scenarios (at least 3) with expected losses' : 'Brief stress test summary'}
      4. ${options.includeRiskContribution ? 'Risk contribution analysis for each holding' : 'Top 3 risk contributors'}
      5. Overall risk assessment summary
      
      Format your response as valid JSON that I can parse. Use the following structure:
      {
        "volatilityMetrics": {
          "portfolioVolatility": number,
          "benchmarkVolatility": number,
          "relativeVolatility": number,
          "volatilityTrend": "increasing" | "decreasing" | "stable"
        },
        "downsideRiskMetrics": {
          "downsideDeviation": number,
          "sortino": number,
          "maxDrawdown": number,
          "recoveryTime": number | null
        },
        "stressTestResults": [
          {
            "scenario": string,
            "expectedLoss": number,
            "probabilityOfOccurrence": number,
            "impactedAssets": string[]
          }
        ],
        "riskContributors": [
          {
            "ticker": string,
            "contribution": number,
            "sensitivity": number
          }
        ],
        "riskSummary": string
      }
    `;
    
    // Get risk assessment from agent
    const agentResponse = await riskManagementAgent.generate(agentPrompt);
    
    // Parse JSON response from agent
    const jsonMatch = agentResponse.text.match(/\{[\s\S]*\}/);
    let agentAnalysis = {};
    
    if (jsonMatch) {
      try {
        agentAnalysis = JSON.parse(jsonMatch[0]);
      } catch (error) {
        logger.error('Failed to parse agent response', { error });
      }
    }
    
    // Combine all results
    return {
      portfolioId,
      timestamp: new Date().toISOString(),
      valueAtRisk: varResult,
      conditionalValueAtRisk: cvarResult,
      volatilityMetrics: (agentAnalysis as any).volatilityMetrics || {
        portfolioVolatility: 0,
        benchmarkVolatility: 0,
        relativeVolatility: 0,
        volatilityTrend: 'stable'
      },
      downsideRiskMetrics: (agentAnalysis as any).downsideRiskMetrics || {
        downsideDeviation: 0,
        sortino: 0,
        maxDrawdown: 0,
        recoveryTime: null
      },
      stressTestResults: (agentAnalysis as any).stressTestResults || [],
      riskContributors: (agentAnalysis as any).riskContributors || [],
      riskSummary: (agentAnalysis as any).riskSummary || 'No risk summary available'
    };
  } catch (error) {
    logger.error('Portfolio risk assessment failed', { portfolioId, error });
    return {
      error: `Failed to assess portfolio risk: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Mock function to fetch portfolio data
 * In a real app, this would retrieve data from a database
 */
async function fetchPortfolio(portfolioId: string): Promise<any> {
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