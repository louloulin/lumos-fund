'use server';

import { createLogger } from '@/lib/logger.server';
import { Portfolio, Position } from '@/types/trading';
import { mockTradingService } from '@/services/mockTradingService';
import { MockMarketDataService } from '@/services/mockMarketDataService';
import { portfolioAnalysisAgent } from '@/mastra/index';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('performance-dashboard');

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  // Return metrics
  totalReturn: number;
  annualizedReturn: number;
  periodReturns: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    ytd: number;
    yearly: number;
  };
  
  // Risk metrics
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  downsideDeviation: number;
  sortinoRatio: number;
  
  // Portfolio composition
  sectorAllocation: Record<string, number>;
  assetAllocation: Record<string, number>;
  topHoldings: {
    ticker: string;
    name: string;
    weight: number;
    return: number;
    contribution: number;
  }[];
  
  // Benchmark comparison
  benchmarkReturn: number;
  alpha: number;
  beta: number;
  trackingError: number;
  informationRatio: number;
  
  // Time series data
  equityCurve: { date: string; value: number }[];
  drawdownCurve: { date: string; value: number }[];
  
  // Health metrics
  concentrationRisk: number;
  liquidityScore: number;
  correlationMatrix?: number[][];
  rebalanceNeeded: boolean;
  cash: number;
  
  // Forward-looking metrics
  expectedReturn: number;
  expectedVolatility: number;
  stressTestResults: {
    scenario: string;
    impact: number;
  }[];
}

/**
 * Performance insights interface
 */
export interface PerformanceInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keyMetrics: {
    name: string;
    value: number | string;
    interpretation: string;
  }[];
}

/**
 * Calculate performance metrics for a portfolio
 */
export async function calculatePortfolioPerformance(
  portfolioId: string,
  options?: {
    benchmark?: string;
    timeframe?: 'week' | 'month' | 'quarter' | 'year' | 'ytd' | 'all';
    includeForwardLooking?: boolean;
    includeStressTests?: boolean;
  }
): Promise<{
  success: boolean;
  metrics?: PerformanceMetrics;
  error?: string;
}> {
  try {
    logger.info('Calculating portfolio performance', { portfolioId, options });
    
    // Ensure trading service is initialized
    await mockTradingService.initialize();
    
    // Get portfolio data
    const portfolio = mockTradingService.getPortfolio(portfolioId);
    
    if (!portfolio) {
      return {
        success: false,
        error: `Portfolio with ID ${portfolioId} not found`
      };
    }
    
    // Initialize market data service
    const marketDataService = new MockMarketDataService();
    await marketDataService.initialize();
    
    // Default options
    const timeframe = options?.timeframe || 'month';
    const benchmark = options?.benchmark || 'SPY';
    const includeForwardLooking = options?.includeForwardLooking || true;
    const includeStressTests = options?.includeStressTests || true;
    
    // Generate mock performance data
    // In a real app, this would use actual historical data and calculations
    const metrics = await generatePerformanceMetrics(
      portfolio,
      marketDataService,
      {
        timeframe,
        benchmark,
        includeForwardLooking,
        includeStressTests
      }
    );
    
    logger.info('Portfolio performance calculated', { portfolioId });
    
    return {
      success: true,
      metrics
    };
  } catch (error) {
    logger.error('Error calculating portfolio performance', { portfolioId, error });
    return {
      success: false,
      error: `Failed to calculate portfolio performance: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Generate AI-powered insights from portfolio performance
 */
export async function generatePerformanceInsights(
  portfolioId: string,
  metrics?: PerformanceMetrics
): Promise<{
  success: boolean;
  insights?: PerformanceInsights;
  error?: string;
}> {
  try {
    logger.info('Generating portfolio performance insights', { portfolioId });
    
    // Get portfolio and metrics if not provided
    let performanceMetrics = metrics;
    if (!performanceMetrics) {
      const result = await calculatePortfolioPerformance(portfolioId);
      if (!result.success || !result.metrics) {
        return {
          success: false,
          error: result.error || 'Failed to calculate performance metrics'
        };
      }
      performanceMetrics = result.metrics;
    }
    
    // Get portfolio
    await mockTradingService.initialize();
    const portfolio = mockTradingService.getPortfolio(portfolioId);
    
    if (!portfolio) {
      return {
        success: false,
        error: `Portfolio with ID ${portfolioId} not found`
      };
    }
    
    // Generate insights using AI
    const insights = await generateAIInsights(portfolio, performanceMetrics);
    
    logger.info('Portfolio performance insights generated', { portfolioId });
    
    return {
      success: true,
      insights
    };
  } catch (error) {
    logger.error('Error generating portfolio performance insights', { portfolioId, error });
    return {
      success: false,
      error: `Failed to generate portfolio performance insights: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Calculate attribution analysis to understand performance contributors
 */
export async function calculateAttributionAnalysis(
  portfolioId: string,
  options?: {
    level: 'asset' | 'sector' | 'factor';
    timeframe?: 'week' | 'month' | 'quarter' | 'year' | 'ytd' | 'all';
  }
): Promise<{
  success: boolean;
  attribution?: {
    level: 'asset' | 'sector' | 'factor';
    totalReturn: number;
    components: {
      name: string;
      allocation: number;
      return: number;
      contribution: number;
      contributionPercent: number;
    }[];
  };
  error?: string;
}> {
  try {
    logger.info('Calculating attribution analysis', { portfolioId, options });
    
    // Ensure trading service is initialized
    await mockTradingService.initialize();
    
    // Get portfolio data
    const portfolio = mockTradingService.getPortfolio(portfolioId);
    
    if (!portfolio) {
      return {
        success: false,
        error: `Portfolio with ID ${portfolioId} not found`
      };
    }
    
    // Default options
    const level = options?.level || 'asset';
    const timeframe = options?.timeframe || 'month';
    
    // Get mock market data service
    const marketDataService = new MockMarketDataService();
    await marketDataService.initialize();
    
    // Generate attribution data
    // In a real app, this would calculate actual attribution analysis
    const attribution = await generateAttributionAnalysis(
      portfolio,
      marketDataService,
      {
        level,
        timeframe
      }
    );
    
    logger.info('Attribution analysis calculated', { portfolioId, level });
    
    return {
      success: true,
      attribution: {
        level,
        totalReturn: attribution.totalReturn,
        components: attribution.components
      }
    };
  } catch (error) {
    logger.error('Error calculating attribution analysis', { portfolioId, error });
    return {
      success: false,
      error: `Failed to calculate attribution analysis: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Generate historical portfolio performance data for a specific timeframe
 */
export async function getHistoricalPerformance(
  portfolioId: string,
  timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month',
  includeBenchmark: boolean = true,
  benchmark: string = 'SPY'
): Promise<{
  success: boolean;
  data?: {
    portfolio: { date: string; value: number }[];
    benchmark?: { date: string; value: number }[];
    relativeDifference?: { date: string; value: number }[];
  };
  error?: string;
}> {
  try {
    logger.info('Getting historical performance', { portfolioId, timeframe, benchmark });
    
    // Generate mock historical data based on timeframe
    // In a real app, this would fetch actual historical data
    const portfolioData = generateMockHistoricalData(timeframe, 100000);
    
    let benchmarkData: { date: string; value: number }[] = [];
    let relativeDifference: { date: string; value: number }[] = [];
    
    if (includeBenchmark) {
      // Generate benchmark data with some difference from portfolio
      benchmarkData = generateMockHistoricalData(timeframe, 100000, 0.8);
      
      // Calculate relative performance (portfolio vs benchmark)
      relativeDifference = portfolioData.map((point, index) => ({
        date: point.date,
        value: (point.value / benchmarkData[index].value - 1) * 100 // percentage difference
      }));
    }
    
    logger.info('Historical performance data generated', { portfolioId, timeframe });
    
    return {
      success: true,
      data: {
        portfolio: portfolioData,
        benchmark: includeBenchmark ? benchmarkData : undefined,
        relativeDifference: includeBenchmark ? relativeDifference : undefined
      }
    };
  } catch (error) {
    logger.error('Error getting historical performance', { portfolioId, timeframe, error });
    return {
      success: false,
      error: `Failed to get historical performance: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Helper functions

/**
 * Generate mock performance metrics
 */
async function generatePerformanceMetrics(
  portfolio: Portfolio,
  marketDataService: MockMarketDataService,
  options: {
    timeframe: string;
    benchmark: string;
    includeForwardLooking: boolean;
    includeStressTests: boolean;
  }
): Promise<PerformanceMetrics> {
  // Mock data generation - in a real app, we would calculate these from actual data
  
  // Calculate basic portfolio stats
  const positions = portfolio.positions || [];
  const totalValue = portfolio.totalValue || 0;
  
  // Generate sector allocation based on positions
  const sectorAllocation: Record<string, number> = {
    'Technology': 0,
    'Healthcare': 0,
    'Financial': 0,
    'Consumer': 0,
    'Industrial': 0,
    'Energy': 0,
    'Utilities': 0,
    'Materials': 0,
    'Communication': 0,
    'Real Estate': 0
  };
  
  // Generate asset allocation
  const assetAllocation: Record<string, number> = {
    'Stocks': 0.95,
    'Bonds': 0,
    'Cash': portfolio.cash / totalValue,
    'Other': 0
  };
  
  // Assign random sectors to positions based on ticker
  positions.forEach(position => {
    const ticker = position.ticker;
    const weight = (position.shares * position.currentPrice) / totalValue;
    
    // Deterministic sector assignment based on ticker
    let sector = 'Technology';
    
    if (ticker.startsWith('A') || ticker.startsWith('M')) {
      sector = 'Technology';
    } else if (ticker.startsWith('J') || ticker.startsWith('P')) {
      sector = 'Healthcare';
    } else if (ticker.startsWith('B') || ticker.startsWith('V')) {
      sector = 'Financial';
    } else if (ticker.startsWith('C') || ticker.startsWith('T')) {
      sector = 'Consumer';
    } else if (ticker.startsWith('D') || ticker.startsWith('I')) {
      sector = 'Industrial';
    } else if (ticker.startsWith('X') || ticker.startsWith('E')) {
      sector = 'Energy';
    } else if (ticker.startsWith('U') || ticker.startsWith('N')) {
      sector = 'Utilities';
    } else if (ticker.startsWith('F') || ticker.startsWith('Y')) {
      sector = 'Materials';
    } else if (ticker.startsWith('G') || ticker.startsWith('S')) {
      sector = 'Communication';
    } else {
      sector = 'Real Estate';
    }
    
    sectorAllocation[sector] += weight;
    assetAllocation['Stocks'] += weight;
  });
  
  // Generate Top Holdings
  const topHoldings = positions
    .map(position => {
      const weight = (position.shares * position.currentPrice) / totalValue;
      // Generate a random return for this position
      const posReturn = (Math.random() * 0.4) - 0.1; // -10% to +30%
      
      return {
        ticker: position.ticker,
        name: position.name || `${position.ticker} Inc.`,
        weight,
        return: posReturn,
        contribution: weight * posReturn
      };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
  
  // Generate equity curve
  const days = getDaysForTimeframe(options.timeframe);
  const equityCurve = generateMockHistoricalData('day', totalValue, 1, days);
  
  // Generate drawdown curve based on equity curve
  const drawdownCurve = equityCurve.map(point => {
    // Calculate a drawdown value that's a percentage of the value
    const drawdownPercent = Math.random() * 0.1; // 0% to 10% drawdown
    return {
      date: point.date,
      value: point.value * drawdownPercent * -1
    };
  });
  
  // Generate metrics values
  const totalReturn = Math.random() * 0.5 - 0.1; // -10% to 40%
  const annualizedReturn = totalReturn / (days / 365);
  
  // Generate period returns with some correlation
  const periodReturns = {
    daily: (Math.random() * 0.02) - 0.01, // -1% to 1%
    weekly: (Math.random() * 0.04) - 0.01, // -1% to 3%
    monthly: (Math.random() * 0.08) - 0.02, // -2% to 6%
    quarterly: (Math.random() * 0.15) - 0.03, // -3% to 12%
    ytd: (Math.random() * 0.25) - 0.05, // -5% to 20%
    yearly: totalReturn
  };
  
  // Generate risk metrics
  const volatility = Math.random() * 0.2; // 0% to 20%
  const sharpeRatio = (annualizedReturn - 0.01) / volatility; // Using 1% as risk-free rate
  const maxDrawdown = -1 * (Math.random() * 0.2); // -20% to 0%
  const downsideDeviation = volatility * 0.6; // Typically lower than regular volatility
  const sortinoRatio = (annualizedReturn - 0.01) / downsideDeviation;
  
  // Generate benchmark metrics
  const benchmarkReturn = totalReturn * (Math.random() * 0.5 + 0.5); // 50% to 100% of portfolio return
  const beta = 0.5 + Math.random() * 1; // 0.5 to 1.5
  const alpha = annualizedReturn - (0.01 + beta * (benchmarkReturn - 0.01));
  const trackingError = Math.random() * 0.08; // 0% to 8%
  const informationRatio = alpha / trackingError;
  
  // Generate health metrics
  const concentrationRisk = Math.max(0, Math.min(1, totalValue > 0 ? 
    positions.reduce((max, pos) => Math.max(max, (pos.shares * pos.currentPrice) / totalValue), 0) : 0));
  const liquidityScore = Math.random(); // 0 to 1
  const rebalanceNeeded = Math.random() > 0.5; // 50% chance
  
  // Generate forward-looking metrics if requested
  let expectedReturn = 0;
  let expectedVolatility = 0;
  let stressTestResults: { scenario: string; impact: number }[] = [];
  
  if (options.includeForwardLooking) {
    expectedReturn = Math.random() * 0.12 + 0.02; // 2% to 14%
    expectedVolatility = Math.random() * 0.15 + 0.05; // 5% to 20%
  }
  
  // Generate stress test results if requested
  if (options.includeStressTests) {
    stressTestResults = [
      { scenario: 'Market Crash', impact: -0.25 - Math.random() * 0.15 }, // -25% to -40%
      { scenario: 'Economic Recession', impact: -0.15 - Math.random() * 0.1 }, // -15% to -25%
      { scenario: 'Interest Rate Spike', impact: -0.1 - Math.random() * 0.05 }, // -10% to -15%
      { scenario: 'Inflation Surge', impact: -0.08 - Math.random() * 0.07 }, // -8% to -15%
      { scenario: 'Sector Rotation', impact: -0.05 - Math.random() * 0.05 } // -5% to -10%
    ];
  }
  
  return {
    // Return metrics
    totalReturn,
    annualizedReturn,
    periodReturns,
    
    // Risk metrics
    volatility,
    sharpeRatio,
    maxDrawdown,
    downsideDeviation,
    sortinoRatio,
    
    // Portfolio composition
    sectorAllocation,
    assetAllocation,
    topHoldings,
    
    // Benchmark comparison
    benchmarkReturn,
    alpha,
    beta,
    trackingError,
    informationRatio,
    
    // Time series data
    equityCurve,
    drawdownCurve,
    
    // Health metrics
    concentrationRisk,
    liquidityScore,
    rebalanceNeeded,
    cash: portfolio.cash,
    
    // Forward-looking metrics
    expectedReturn,
    expectedVolatility,
    stressTestResults
  };
}

/**
 * Generate AI insights about portfolio performance
 */
async function generateAIInsights(
  portfolio: Portfolio,
  metrics: PerformanceMetrics
): Promise<PerformanceInsights> {
  try {
    // Prepare prompt for AI
    const prompt = `
      I need an analysis of the following investment portfolio:
      
      Portfolio Summary:
      - Total Value: $${portfolio.totalValue.toFixed(2)}
      - Cash: $${portfolio.cash.toFixed(2)} (${(portfolio.cash / portfolio.totalValue * 100).toFixed(2)}%)
      - Number of positions: ${portfolio.positions.length}
      
      Performance Metrics:
      - Total Return: ${(metrics.totalReturn * 100).toFixed(2)}%
      - Annualized Return: ${(metrics.annualizedReturn * 100).toFixed(2)}%
      - Volatility: ${(metrics.volatility * 100).toFixed(2)}%
      - Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
      - Maximum Drawdown: ${(metrics.maxDrawdown * 100).toFixed(2)}%
      - Alpha: ${(metrics.alpha * 100).toFixed(2)}%
      - Beta: ${metrics.beta.toFixed(2)}
      
      Top Holdings:
      ${metrics.topHoldings.map(h => `- ${h.ticker}: ${(h.weight * 100).toFixed(2)}%, Return: ${(h.return * 100).toFixed(2)}%`).join('\n')}
      
      Sector Allocation:
      ${Object.entries(metrics.sectorAllocation)
        .filter(([_, weight]) => weight > 0)
        .map(([sector, weight]) => `- ${sector}: ${(weight * 100).toFixed(2)}%`)
        .join('\n')}
      
      Based on this information, please provide:
      1. A concise summary of the portfolio's performance
      2. 3-5 key strengths of this portfolio
      3. 3-5 key weaknesses or areas of concern
      4. 3-5 specific recommendations for improvement
      5. A list of 5 key metrics with their interpretation (what they mean for this portfolio)
      
      Format your response as a JSON object with these fields: summary, strengths, weaknesses, recommendations, and keyMetrics.
      Each keyMetric should have name, value, and interpretation fields.
    `;
    
    // Get insights from AI
    const agentResponse = await portfolioAnalysisAgent.generate(prompt);
    const jsonMatch = agentResponse.text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]);
      return {
        summary: insights.summary || "No summary available",
        strengths: insights.strengths || [],
        weaknesses: insights.weaknesses || [],
        recommendations: insights.recommendations || [],
        keyMetrics: insights.keyMetrics || []
      };
    } else {
      // If AI response parsing fails, generate fallback insights
      return generateFallbackInsights(portfolio, metrics);
    }
  } catch (error) {
    logger.error('Error generating AI insights', { error });
    return generateFallbackInsights(portfolio, metrics);
  }
}

/**
 * Generate fallback insights if AI fails
 */
function generateFallbackInsights(
  portfolio: Portfolio,
  metrics: PerformanceMetrics
): PerformanceInsights {
  // Generate a basic summary based on metrics
  const performanceDesc = metrics.totalReturn > 0 ? "positive" : "negative";
  const volatilityDesc = metrics.volatility > 0.15 ? "high" : metrics.volatility > 0.1 ? "moderate" : "low";
  const diversificationDesc = metrics.topHoldings[0]?.weight > 0.2 ? "concentrated" : "diversified";
  
  return {
    summary: `This portfolio has shown ${performanceDesc} performance with ${volatilityDesc} volatility. The portfolio is relatively ${diversificationDesc} across sectors.`,
    strengths: [
      metrics.sharpeRatio > 1 ? "Above average risk-adjusted returns" : "Reasonable asset allocation",
      metrics.alpha > 0 ? "Positive alpha generation" : "Sector diversification",
      metrics.rebalanceNeeded ? "Due for rebalancing which could improve performance" : "Well balanced allocation"
    ],
    weaknesses: [
      metrics.volatility > 0.15 ? "Higher than optimal volatility" : "Could improve returns",
      metrics.maxDrawdown < -0.15 ? "Significant maximum drawdown" : "Some concentration risk",
      metrics.concentrationRisk > 0.2 ? "Overconcentration in top holdings" : "Limited exposure to some sectors"
    ],
    recommendations: [
      "Consider rebalancing the portfolio to target allocations",
      "Review and potentially reduce exposure to underperforming assets",
      "Consider increasing diversification across sectors",
      metrics.cash / portfolio.totalValue > 0.1 ? "Deploy excess cash to investment opportunities" : "Maintain current cash levels for opportunities",
      "Review risk exposure in stress scenarios"
    ],
    keyMetrics: [
      {
        name: "Sharpe Ratio",
        value: metrics.sharpeRatio.toFixed(2),
        interpretation: metrics.sharpeRatio > 1 
          ? "Strong risk-adjusted performance" 
          : "Moderate risk-adjusted performance"
      },
      {
        name: "Alpha",
        value: (metrics.alpha * 100).toFixed(2) + "%",
        interpretation: metrics.alpha > 0 
          ? "Portfolio outperformed risk-adjusted benchmark" 
          : "Portfolio underperformed risk-adjusted benchmark"
      },
      {
        name: "Beta",
        value: metrics.beta.toFixed(2),
        interpretation: metrics.beta > 1 
          ? "Higher market sensitivity than benchmark" 
          : "Lower market sensitivity than benchmark"
      },
      {
        name: "Max Drawdown",
        value: (metrics.maxDrawdown * 100).toFixed(2) + "%",
        interpretation: metrics.maxDrawdown > -0.1 
          ? "Good downside protection" 
          : "Significant downside risk"
      },
      {
        name: "Concentration Risk",
        value: (metrics.concentrationRisk * 100).toFixed(2) + "%",
        interpretation: metrics.concentrationRisk > 0.2 
          ? "High concentration in top holdings" 
          : "Good diversification across holdings"
      }
    ]
  };
}

/**
 * Generate mock attribution analysis
 */
async function generateAttributionAnalysis(
  portfolio: Portfolio,
  marketDataService: MockMarketDataService,
  options: {
    level: 'asset' | 'sector' | 'factor';
    timeframe: string;
  }
): Promise<{
  totalReturn: number;
  components: {
    name: string;
    allocation: number;
    return: number;
    contribution: number;
    contributionPercent: number;
  }[];
}> {
  // Mock total return
  const totalReturn = Math.random() * 0.3; // 0% to 30%
  
  let components: {
    name: string;
    allocation: number;
    return: number;
    contribution: number;
    contributionPercent: number;
  }[] = [];
  
  if (options.level === 'asset') {
    // Attribution by asset
    components = portfolio.positions.map(position => {
      const allocation = (position.shares * position.currentPrice) / portfolio.totalValue;
      const assetReturn = (Math.random() * 0.5) - 0.1; // -10% to 40%
      const contribution = allocation * assetReturn;
      
      return {
        name: position.ticker,
        allocation,
        return: assetReturn,
        contribution,
        contributionPercent: (contribution / totalReturn) * 100
      };
    });
  } else if (options.level === 'sector') {
    // Attribution by sector
    const sectors = [
      'Technology', 'Healthcare', 'Financial', 'Consumer', 
      'Industrial', 'Energy', 'Utilities', 'Materials'
    ];
    
    // Create random sector allocation that adds up to 1
    let remainingAllocation = 1;
    components = sectors.map((sector, index) => {
      const isLast = index === sectors.length - 1;
      const allocation = isLast ? remainingAllocation : Math.random() * remainingAllocation * 0.5;
      remainingAllocation -= allocation;
      
      const sectorReturn = (Math.random() * 0.5) - 0.1; // -10% to 40%
      const contribution = allocation * sectorReturn;
      
      return {
        name: sector,
        allocation,
        return: sectorReturn,
        contribution,
        contributionPercent: (contribution / totalReturn) * 100
      };
    }).filter(s => s.allocation > 0);
  } else {
    // Attribution by factor
    const factors = [
      'Value', 'Growth', 'Quality', 'Momentum', 
      'Size', 'Volatility', 'Yield', 'Liquidity'
    ];
    
    // Create random factor allocation that adds up to 1
    let remainingAllocation = 1;
    components = factors.map((factor, index) => {
      const isLast = index === factors.length - 1;
      const allocation = isLast ? remainingAllocation : Math.random() * remainingAllocation * 0.5;
      remainingAllocation -= allocation;
      
      const factorReturn = (Math.random() * 0.5) - 0.1; // -10% to 40%
      const contribution = allocation * factorReturn;
      
      return {
        name: factor,
        allocation,
        return: factorReturn,
        contribution,
        contributionPercent: (contribution / totalReturn) * 100
      };
    }).filter(f => f.allocation > 0);
  }
  
  // Sort by contribution
  components.sort((a, b) => b.contribution - a.contribution);
  
  return {
    totalReturn,
    components
  };
}

/**
 * Generate mock historical data for a portfolio
 */
function generateMockHistoricalData(
  timeframe: string,
  initialValue: number,
  volatilityFactor: number = 1,
  days: number = 0
): { date: string; value: number }[] {
  // Determine number of data points based on timeframe
  const numPoints = days > 0 ? days : getDaysForTimeframe(timeframe);
  
  const data: { date: string; value: number }[] = [];
  let currentValue = initialValue;
  const now = new Date();
  
  for (let i = numPoints; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    // Add some random walk to the value
    const change = (Math.random() - 0.48) * 0.02 * currentValue * volatilityFactor;
    currentValue += change;
    
    // Ensure value doesn't go too low
    currentValue = Math.max(currentValue, initialValue * 0.5);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: currentValue
    });
  }
  
  return data;
}

/**
 * Get number of days for a timeframe
 */
function getDaysForTimeframe(timeframe: string): number {
  switch (timeframe) {
    case 'day': return 1;
    case 'week': return 7;
    case 'month': return 30;
    case 'quarter': return 90;
    case 'year': return 365;
    case 'ytd': {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    }
    case 'all': return 1095; // 3 years
    default: return 30;
  }
} 