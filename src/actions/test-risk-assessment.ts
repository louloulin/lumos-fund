'use server';

import { createLogger } from '@/lib/logger.server';
import { assessPortfolioRisk } from './risk-assessment';

const logger = createLogger('test-risk-assessment');

/**
 * Test portfolio risk assessment with different methodologies
 */
export async function testRiskAssessment(): Promise<{
  success: boolean;
  results: {
    historicalMethod: any;
    parametricMethod: any;
    monteCarloMethod: any;
    stressTests: any;
  };
  executionTime: number;
}> {
  logger.info('Starting portfolio risk assessment tests');
  const startTime = Date.now();
  
  try {
    // Test 1: Historical VaR/CVaR method
    logger.info('Testing historical VaR/CVaR method');
    const historicalMethod = await assessPortfolioRisk('test-portfolio-1', {
      methodology: 'historical',
      confidenceLevel: 0.95,
      horizon: '10d'
    });
    
    // Test 2: Parametric VaR/CVaR method
    logger.info('Testing parametric VaR/CVaR method');
    const parametricMethod = await assessPortfolioRisk('test-portfolio-1', {
      methodology: 'parametric',
      confidenceLevel: 0.99,
      horizon: '1d'
    });
    
    // Test 3: Monte Carlo VaR/CVaR method
    logger.info('Testing Monte Carlo VaR/CVaR method');
    const monteCarloMethod = await assessPortfolioRisk('test-portfolio-2', {
      methodology: 'monte-carlo',
      confidenceLevel: 0.95,
      horizon: '5d'
    });
    
    // Test 4: Stress tests
    logger.info('Testing stress tests');
    const stressTests = await assessPortfolioRisk('test-portfolio-1', {
      includeStressTests: true,
      includeRiskContribution: true
    });
    
    const executionTime = Date.now() - startTime;
    logger.info('Portfolio risk assessment tests completed', { executionTime });
    
    // Return comprehensive test results
    return {
      success: true,
      results: {
        historicalMethod,
        parametricMethod,
        monteCarloMethod,
        stressTests
      },
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Portfolio risk assessment tests failed', { error, executionTime });
    
    return {
      success: false,
      results: {
        historicalMethod: { error: 'Test failed' },
        parametricMethod: { error: 'Test failed' },
        monteCarloMethod: { error: 'Test failed' },
        stressTests: { error: 'Test failed' }
      },
      executionTime
    };
  }
}

/**
 * Compare VaR/CVaR calculation methodologies
 */
export async function compareRiskMethodologies(): Promise<{
  success: boolean;
  results: {
    portfolio1Comparison: {
      portfolioId: string;
      historical: { var: number; cvar: number };
      parametric: { var: number; cvar: number };
      monteCarlo: { var: number; cvar: number };
      differences: {
        varMaxDiff: number;
        cvarMaxDiff: number;
        mostConservative: string;
      };
    };
    portfolio2Comparison: {
      portfolioId: string;
      historical: { var: number; cvar: number };
      parametric: { var: number; cvar: number };
      monteCarlo: { var: number; cvar: number };
      differences: {
        varMaxDiff: number;
        cvarMaxDiff: number;
        mostConservative: string;
      };
    };
  };
}> {
  logger.info('Starting risk methodology comparison');
  
  try {
    // Test different methodologies on portfolio 1
    const portfolio1Historical = await assessPortfolioRisk('test-portfolio-1', {
      methodology: 'historical'
    });
    
    const portfolio1Parametric = await assessPortfolioRisk('test-portfolio-1', {
      methodology: 'parametric'
    });
    
    const portfolio1MonteCarlo = await assessPortfolioRisk('test-portfolio-1', {
      methodology: 'monte-carlo'
    });
    
    // Test different methodologies on portfolio 2
    const portfolio2Historical = await assessPortfolioRisk('test-portfolio-2', {
      methodology: 'historical'
    });
    
    const portfolio2Parametric = await assessPortfolioRisk('test-portfolio-2', {
      methodology: 'parametric'
    });
    
    const portfolio2MonteCarlo = await assessPortfolioRisk('test-portfolio-2', {
      methodology: 'monte-carlo'
    });
    
    // Extract VaR and CVaR values for portfolio 1
    const p1HistoricalVaR = 'error' in portfolio1Historical 
      ? 0 
      : portfolio1Historical.valueAtRisk.value;
    
    const p1HistoricalCVaR = 'error' in portfolio1Historical 
      ? 0 
      : portfolio1Historical.conditionalValueAtRisk.value;
    
    const p1ParametricVaR = 'error' in portfolio1Parametric 
      ? 0 
      : portfolio1Parametric.valueAtRisk.value;
    
    const p1ParametricCVaR = 'error' in portfolio1Parametric 
      ? 0 
      : portfolio1Parametric.conditionalValueAtRisk.value;
    
    const p1MonteCarloVaR = 'error' in portfolio1MonteCarlo 
      ? 0 
      : portfolio1MonteCarlo.valueAtRisk.value;
    
    const p1MonteCarloCVaR = 'error' in portfolio1MonteCarlo 
      ? 0 
      : portfolio1MonteCarlo.conditionalValueAtRisk.value;
    
    // Extract VaR and CVaR values for portfolio 2
    const p2HistoricalVaR = 'error' in portfolio2Historical 
      ? 0 
      : portfolio2Historical.valueAtRisk.value;
    
    const p2HistoricalCVaR = 'error' in portfolio2Historical 
      ? 0 
      : portfolio2Historical.conditionalValueAtRisk.value;
    
    const p2ParametricVaR = 'error' in portfolio2Parametric 
      ? 0 
      : portfolio2Parametric.valueAtRisk.value;
    
    const p2ParametricCVaR = 'error' in portfolio2Parametric 
      ? 0 
      : portfolio2Parametric.conditionalValueAtRisk.value;
    
    const p2MonteCarloVaR = 'error' in portfolio2MonteCarlo 
      ? 0 
      : portfolio2MonteCarlo.valueAtRisk.value;
    
    const p2MonteCarloCVaR = 'error' in portfolio2MonteCarlo 
      ? 0 
      : portfolio2MonteCarlo.conditionalValueAtRisk.value;
    
    // Calculate differences for portfolio 1
    const p1VarValues = [p1HistoricalVaR, p1ParametricVaR, p1MonteCarloVaR];
    const p1CVarValues = [p1HistoricalCVaR, p1ParametricCVaR, p1MonteCarloCVaR];
    
    const p1VarMax = Math.max(...p1VarValues);
    const p1VarMin = Math.min(...p1VarValues.filter(v => v > 0));
    const p1VarMaxDiff = p1VarMax - p1VarMin;
    
    const p1CVarMax = Math.max(...p1CVarValues);
    const p1CVarMin = Math.min(...p1CVarValues.filter(v => v > 0));
    const p1CVarMaxDiff = p1CVarMax - p1CVarMin;
    
    const p1MostConservative = determineMostConservative(p1VarValues, p1CVarValues);
    
    // Calculate differences for portfolio 2
    const p2VarValues = [p2HistoricalVaR, p2ParametricVaR, p2MonteCarloVaR];
    const p2CVarValues = [p2HistoricalCVaR, p2ParametricCVaR, p2MonteCarloCVaR];
    
    const p2VarMax = Math.max(...p2VarValues);
    const p2VarMin = Math.min(...p2VarValues.filter(v => v > 0));
    const p2VarMaxDiff = p2VarMax - p2VarMin;
    
    const p2CVarMax = Math.max(...p2CVarValues);
    const p2CVarMin = Math.min(...p2CVarValues.filter(v => v > 0));
    const p2CVarMaxDiff = p2CVarMax - p2CVarMin;
    
    const p2MostConservative = determineMostConservative(p2VarValues, p2CVarValues);
    
    logger.info('Risk methodology comparison completed');
    
    return {
      success: true,
      results: {
        portfolio1Comparison: {
          portfolioId: 'test-portfolio-1',
          historical: { var: p1HistoricalVaR, cvar: p1HistoricalCVaR },
          parametric: { var: p1ParametricVaR, cvar: p1ParametricCVaR },
          monteCarlo: { var: p1MonteCarloVaR, cvar: p1MonteCarloCVaR },
          differences: {
            varMaxDiff: p1VarMaxDiff,
            cvarMaxDiff: p1CVarMaxDiff,
            mostConservative: p1MostConservative
          }
        },
        portfolio2Comparison: {
          portfolioId: 'test-portfolio-2',
          historical: { var: p2HistoricalVaR, cvar: p2HistoricalCVaR },
          parametric: { var: p2ParametricVaR, cvar: p2ParametricCVaR },
          monteCarlo: { var: p2MonteCarloVaR, cvar: p2MonteCarloCVaR },
          differences: {
            varMaxDiff: p2VarMaxDiff,
            cvarMaxDiff: p2CVarMaxDiff,
            mostConservative: p2MostConservative
          }
        }
      }
    };
  } catch (error) {
    logger.error('Risk methodology comparison failed', { error });
    
    return {
      success: false,
      results: {
        portfolio1Comparison: {
          portfolioId: 'test-portfolio-1',
          historical: { var: 0, cvar: 0 },
          parametric: { var: 0, cvar: 0 },
          monteCarlo: { var: 0, cvar: 0 },
          differences: {
            varMaxDiff: 0,
            cvarMaxDiff: 0,
            mostConservative: 'failed'
          }
        },
        portfolio2Comparison: {
          portfolioId: 'test-portfolio-2',
          historical: { var: 0, cvar: 0 },
          parametric: { var: 0, cvar: 0 },
          monteCarlo: { var: 0, cvar: 0 },
          differences: {
            varMaxDiff: 0,
            cvarMaxDiff: 0,
            mostConservative: 'failed'
          }
        }
      }
    };
  }
}

/**
 * Determine which methodology produces the most conservative risk assessment
 */
function determineMostConservative(
  varValues: number[], 
  cvarValues: number[]
): string {
  const [historicalVaR, parametricVaR, monteCarloVaR] = varValues;
  const [historicalCVaR, parametricCVaR, monteCarloCVaR] = cvarValues;
  
  // Calculate total risk measure for each methodology
  const historicalTotal = historicalVaR + historicalCVaR;
  const parametricTotal = parametricVaR + parametricCVaR;
  const monteCarloTotal = monteCarloVaR + monteCarloCVaR;
  
  if (historicalTotal >= parametricTotal && historicalTotal >= monteCarloTotal) {
    return 'historical';
  } else if (parametricTotal >= historicalTotal && parametricTotal >= monteCarloTotal) {
    return 'parametric';
  } else {
    return 'monte-carlo';
  }
} 