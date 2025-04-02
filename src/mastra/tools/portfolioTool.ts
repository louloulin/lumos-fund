import { z } from "zod";
import { generateHistoricalPrices } from "@/lib/mocks";

// 创建工具函数模拟
type ToolOptions<T extends z.ZodType> = {
  name: string;
  description: string;
  schema: T;
  execute: (input: z.infer<T>) => Promise<any>;
};

function createTool<T extends z.ZodType>(options: ToolOptions<T>) {
  return options;
}

/**
 * 投资组合优化工具
 * 允许AI代理分析和优化投资组合
 */
export const portfolioOptimizationTool = createTool({
  name: "portfolioOptimizationTool",
  description: "分析和优化投资组合的权重分配",
  schema: z.object({
    tickers: z.array(z.string()).describe("股票代码列表，例如['AAPL', 'MSFT', 'GOOG']"),
    startDate: z.string().describe("开始日期，格式为YYYY-MM-DD"),
    endDate: z.string().describe("结束日期，格式为YYYY-MM-DD"),
    optimizationTarget: z.enum(["sharpe", "minRisk", "maxReturn", "balanced"]).describe("优化目标，可选：最大夏普比率(sharpe)、最小风险(minRisk)、最大回报(maxReturn)、平衡型(balanced)"),
  }),
  execute: async (input) => {
    const { tickers, startDate, endDate, optimizationTarget } = input;
    try {
      console.log(`为${tickers.join(', ')}优化投资组合，目标：${optimizationTarget}`);
      
      // 获取所有股票的历史价格数据
      const stocksData = {};
      for (const ticker of tickers) {
        const priceData = generateHistoricalPrices(ticker, startDate, endDate);
        if (priceData.length > 0) {
          stocksData[ticker] = priceData;
        }
      }
      
      // 计算收益率
      const returns = calculateReturns(stocksData);
      
      // 根据优化目标计算最优权重
      const portfolios = generatePortfolios(returns, optimizationTarget);
      
      // 使用最优的投资组合
      const optimalPortfolio = selectOptimalPortfolio(portfolios, optimizationTarget);
      
      // 计算绩效指标
      const performance = calculatePerformance(optimalPortfolio.weights, returns);
      
      return {
        success: true,
        data: {
          tickers,
          timeframe: `${startDate} 至 ${endDate}`,
          optimizationTarget,
          optimalWeights: optimalPortfolio.weights,
          performance,
          portfolioAnalysis: generatePortfolioAnalysis(optimalPortfolio, performance, tickers)
        }
      };
    } catch (error) {
      console.error(`投资组合优化失败:`, error);
      return {
        success: false,
        error: "投资组合优化失败"
      };
    }
  }
});

/**
 * 投资组合风险分析工具
 * 允许AI代理分析投资组合的风险特征
 */
export const portfolioRiskTool = createTool({
  name: "portfolioRiskTool",
  description: "分析投资组合的风险特征",
  schema: z.object({
    tickers: z.array(z.string()).describe("股票代码列表，例如['AAPL', 'MSFT', 'GOOG']"),
    weights: z.array(z.number()).describe("各个股票的权重，数组长度必须与tickers相同，且和为1"),
    startDate: z.string().describe("开始日期，格式为YYYY-MM-DD"),
    endDate: z.string().describe("结束日期，格式为YYYY-MM-DD"),
  }),
  execute: async (input) => {
    const { tickers, weights, startDate, endDate } = input;
    try {
      console.log(`分析由${tickers.join(', ')}组成的投资组合风险特征`);
      
      // 验证权重
      if (tickers.length !== weights.length) {
        return {
          success: false,
          error: "股票代码列表与权重列表长度不一致"
        };
      }
      
      // 验证权重之和约等于1
      const weightSum = weights.reduce((sum, w) => sum + w, 0);
      if (Math.abs(weightSum - 1) > 0.01) {
        return {
          success: false,
          error: "权重之和必须等于1"
        };
      }
      
      // 获取所有股票的历史价格数据
      const stocksData = {};
      for (const ticker of tickers) {
        const priceData = generateHistoricalPrices(ticker, startDate, endDate);
        if (priceData.length > 0) {
          stocksData[ticker] = priceData;
        }
      }
      
      // 计算收益率
      const returns = calculateReturns(stocksData);
      
      // 计算风险指标
      const riskMetrics = calculateRiskMetrics(weights, returns, tickers);
      
      // 进行压力测试
      const stressTestResults = performStressTest(weights, returns, tickers);
      
      // 分析极端事件风险
      const tailRiskAnalysis = analyzeTailRisk(weights, returns, tickers);
      
      // 分析行业分散度
      const sectorDiversification = analyzeSectorDiversification(tickers, weights);
      
      return {
        success: true,
        data: {
          tickers,
          weights: tickers.map((ticker, i) => ({ ticker, weight: weights[i] })),
          timeframe: `${startDate} 至 ${endDate}`,
          riskMetrics,
          stressTest: stressTestResults,
          tailRisk: tailRiskAnalysis,
          diversification: sectorDiversification
        }
      };
    } catch (error) {
      console.error(`投资组合风险分析失败:`, error);
      return {
        success: false,
        error: "投资组合风险分析失败"
      };
    }
  }
});

/**
 * 计算各股票的收益率
 */
function calculateReturns(stocksData: Record<string, any[]>): Record<string, number[]> {
  const returns = {};
  
  for (const ticker in stocksData) {
    const prices = stocksData[ticker];
    returns[ticker] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const prevPrice = prices[i - 1].close;
      const currPrice = prices[i].close;
      const returnRate = (currPrice - prevPrice) / prevPrice;
      returns[ticker].push(returnRate);
    }
  }
  
  return returns;
}

/**
 * 生成不同权重的投资组合
 * 使用蒙特卡洛模拟生成不同的投资组合
 */
function generatePortfolios(returns: Record<string, number[]>, optimizationTarget: string): any[] {
  const tickers = Object.keys(returns);
  const numTickers = tickers.length;
  const numPortfolios = 5000;
  const portfolios = [];
  
  // 使用蒙特卡洛模拟生成不同权重的投资组合
  for (let i = 0; i < numPortfolios; i++) {
    // 生成随机权重
    let weights = Array(numTickers).fill(0).map(() => Math.random());
    const sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum); // 归一化权重
    
    // 计算投资组合收益率和风险
    const performance = calculatePerformance(weights, returns);
    
    portfolios.push({
      weights: tickers.reduce((obj, ticker, i) => {
        obj[ticker] = weights[i];
        return obj;
      }, {}),
      performance
    });
  }
  
  return portfolios;
}

/**
 * 计算投资组合绩效
 */
function calculatePerformance(weights: any, returns: Record<string, number[]>): any {
  const tickers = Object.keys(returns);
  const numDays = returns[tickers[0]].length;
  
  // 计算每日投资组合收益率
  const portfolioReturns = Array(numDays).fill(0);
  
  for (let i = 0; i < numDays; i++) {
    for (let j = 0; j < tickers.length; j++) {
      const ticker = tickers[j];
      const weight = Array.isArray(weights) ? weights[j] : weights[ticker];
      
      if (i < returns[ticker].length) {
        portfolioReturns[i] += weight * returns[ticker][i];
      }
    }
  }
  
  // 计算年化收益率
  const annualReturn = calculateAnnualizedReturn(portfolioReturns);
  
  // 计算年化风险（标准差）
  const annualRisk = calculateAnnualizedRisk(portfolioReturns);
  
  // 计算夏普比率（假设无风险收益率为0.02）
  const sharpeRatio = (annualReturn - 0.02) / annualRisk;
  
  // 计算最大回撤
  const maxDrawdown = calculateMaxDrawdown(portfolioReturns);
  
  return {
    dailyReturns: portfolioReturns,
    annualizedReturn: annualReturn,
    annualizedRisk: annualRisk,
    sharpeRatio,
    maxDrawdown
  };
}

/**
 * 计算年化收益率
 */
function calculateAnnualizedReturn(dailyReturns: number[]): number {
  const meanDailyReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
  return (1 + meanDailyReturn) ** 252 - 1; // 252个交易日一年
}

/**
 * 计算年化风险（标准差）
 */
function calculateAnnualizedRisk(dailyReturns: number[]): number {
  const meanDailyReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, ret) => sum + (ret - meanDailyReturn) ** 2, 0) / dailyReturns.length;
  const dailyStd = Math.sqrt(variance);
  return dailyStd * Math.sqrt(252); // 252个交易日一年
}

/**
 * 计算最大回撤
 */
function calculateMaxDrawdown(dailyReturns: number[]): number {
  let cumulativeReturns = [1];
  for (let i = 0; i < dailyReturns.length; i++) {
    cumulativeReturns.push(cumulativeReturns[i] * (1 + dailyReturns[i]));
  }
  
  let maxDrawdown = 0;
  let peak = cumulativeReturns[0];
  
  for (let i = 1; i < cumulativeReturns.length; i++) {
    if (cumulativeReturns[i] > peak) {
      peak = cumulativeReturns[i];
    }
    
    const drawdown = (peak - cumulativeReturns[i]) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

/**
 * 选择最优投资组合
 */
function selectOptimalPortfolio(portfolios: any[], optimizationTarget: string): any {
  let optimalPortfolio;
  
  switch (optimizationTarget) {
    case "sharpe":
      // 最大化夏普比率
      optimalPortfolio = portfolios.reduce((best, current) => {
        return current.performance.sharpeRatio > best.performance.sharpeRatio ? current : best;
      }, portfolios[0]);
      break;
      
    case "minRisk":
      // 最小化风险
      optimalPortfolio = portfolios.reduce((best, current) => {
        return current.performance.annualizedRisk < best.performance.annualizedRisk ? current : best;
      }, portfolios[0]);
      break;
      
    case "maxReturn":
      // 最大化收益
      optimalPortfolio = portfolios.reduce((best, current) => {
        return current.performance.annualizedReturn > best.performance.annualizedReturn ? current : best;
      }, portfolios[0]);
      break;
      
    case "balanced":
      // 平衡型：最大化收益/风险比，但确保收益在平均线以上
      const avgReturn = portfolios.reduce((sum, p) => sum + p.performance.annualizedReturn, 0) / portfolios.length;
      const filteredPortfolios = portfolios.filter(p => p.performance.annualizedReturn >= avgReturn);
      
      if (filteredPortfolios.length > 0) {
        optimalPortfolio = filteredPortfolios.reduce((best, current) => {
          const bestRatio = best.performance.annualizedReturn / best.performance.annualizedRisk;
          const currentRatio = current.performance.annualizedReturn / current.performance.annualizedRisk;
          return currentRatio > bestRatio ? current : best;
        }, filteredPortfolios[0]);
      } else {
        optimalPortfolio = portfolios[0]; // 回退选项
      }
      break;
      
    default:
      // 默认使用最大夏普比率
      optimalPortfolio = portfolios.reduce((best, current) => {
        return current.performance.sharpeRatio > best.performance.sharpeRatio ? current : best;
      }, portfolios[0]);
  }
  
  return optimalPortfolio;
}

/**
 * 生成投资组合分析报告
 */
function generatePortfolioAnalysis(optimalPortfolio: any, performance: any, tickers: string[]): any {
  // 计算权重分布
  const weightDistribution = tickers.map(ticker => ({
    ticker,
    weight: optimalPortfolio.weights[ticker]
  })).sort((a, b) => b.weight - a.weight);
  
  // 计算风险贡献
  const riskContribution = tickers.map(ticker => {
    const weight = optimalPortfolio.weights[ticker];
    // 简化版风险贡献计算
    return {
      ticker,
      contribution: weight * performance.annualizedRisk
    };
  }).sort((a, b) => b.contribution - a.contribution);
  
  // 生成表现总结
  let performanceSummary;
  
  if (performance.sharpeRatio > 1.5) {
    performanceSummary = "投资组合表现优异，具有较高的风险调整回报。";
  } else if (performance.sharpeRatio > 1) {
    performanceSummary = "投资组合表现良好，风险与回报较为匹配。";
  } else if (performance.sharpeRatio > 0.5) {
    performanceSummary = "投资组合表现一般，风险调整回报中等。";
  } else {
    performanceSummary = "投资组合表现较差，需要重新调整以提高风险调整回报。";
  }
  
  // 生成改进建议
  let suggestions = [];
  
  // 如果夏普比率较低，提出改进建议
  if (performance.sharpeRatio < 1) {
    suggestions.push("考虑增加低相关性资产以提高多元化程度。");
    suggestions.push("检查是否存在权重过于集中的情况，可能需要分散投资。");
  }
  
  // 如果最大回撤较大，提出风险控制建议
  if (performance.maxDrawdown > 0.2) {
    suggestions.push("投资组合的最大回撤较大，考虑添加防御性资产或降低波动较大的资产比例。");
  }
  
  // 如果收益率较低，提出提高收益的建议
  if (performance.annualizedReturn < 0.08) {
    suggestions.push("投资组合的年化收益率较低，可以适当增加成长型资产的比例。");
  }
  
  return {
    weightDistribution,
    riskContribution,
    performanceSummary,
    suggestions
  };
}

/**
 * 计算风险指标
 */
function calculateRiskMetrics(weights: number[], returns: Record<string, number[]>, tickers: string[]): any {
  const performance = calculatePerformance(weights, returns);
  
  // 计算贝塔系数（相对于市场）
  // 这里简化处理，假设第一个股票是市场指数
  const marketReturns = returns[tickers[0]];
  
  const portfolioReturns = performance.dailyReturns;
  const covariance = calculateCovariance(portfolioReturns, marketReturns);
  const marketVariance = calculateVariance(marketReturns);
  const beta = covariance / marketVariance;
  
  // 计算VAR (Value at Risk)
  const var95 = calculateVaR(portfolioReturns, 0.95);
  const var99 = calculateVaR(portfolioReturns, 0.99);
  
  // 计算跟踪误差（相对于市场）
  const trackingError = calculateTrackingError(portfolioReturns, marketReturns);
  
  // 计算信息比率
  const excessReturns = portfolioReturns.map((r, i) => r - marketReturns[i]);
  const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
  const excessReturnStd = Math.sqrt(calculateVariance(excessReturns));
  const informationRatio = avgExcessReturn / excessReturnStd;
  
  return {
    volatility: performance.annualizedRisk,
    beta,
    valueAtRisk: {
      var95: var95 * 100,  // 转为百分比
      var99: var99 * 100   // 转为百分比
    },
    maxDrawdown: performance.maxDrawdown * 100,  // 转为百分比
    trackingError,
    informationRatio
  };
}

/**
 * 计算VaR (Value at Risk)
 */
function calculateVaR(returns: number[], confidence: number): number {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor(sortedReturns.length * (1 - confidence));
  return -sortedReturns[index];
}

/**
 * 计算协方差
 */
function calculateCovariance(returns1: number[], returns2: number[]): number {
  const n = Math.min(returns1.length, returns2.length);
  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / n;
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / n;
  
  let covariance = 0;
  for (let i = 0; i < n; i++) {
    covariance += (returns1[i] - mean1) * (returns2[i] - mean2);
  }
  
  return covariance / n;
}

/**
 * 计算方差
 */
function calculateVariance(returns: number[]): number {
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  return returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
}

/**
 * 计算跟踪误差
 */
function calculateTrackingError(portfolioReturns: number[], benchmarkReturns: number[]): number {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const differences = Array(n).fill(0).map((_, i) => portfolioReturns[i] - benchmarkReturns[i]);
  
  const variance = calculateVariance(differences);
  return Math.sqrt(variance) * Math.sqrt(252);  // 年化
}

/**
 * 执行压力测试
 */
function performStressTest(weights: number[], returns: Record<string, number[]>, tickers: string[]): any {
  // 模拟不同的市场情景
  const scenarios = [
    { name: "市场大幅下跌", factor: -0.15 },
    { name: "适度市场下跌", factor: -0.07 },
    { name: "适度市场上涨", factor: 0.07 },
    { name: "市场大幅上涨", factor: 0.15 },
    { name: "波动性增加", volatilityIncrease: 1.5 },
    { name: "极端市场崩盘", factor: -0.25 }
  ];
  
  const results = scenarios.map(scenario => {
    // 获取基础绩效
    const basePerformance = calculatePerformance(weights, returns);
    
    // 模拟不同情景下的收益率
    let adjustedReturns = {};
    
    if (scenario.factor) {
      // 对于市场上涨/下跌情景
      for (const ticker of tickers) {
        adjustedReturns[ticker] = returns[ticker].map(r => r + scenario.factor);
      }
    } else if (scenario.volatilityIncrease) {
      // 对于波动性增加情景
      for (const ticker of tickers) {
        const meanReturn = returns[ticker].reduce((sum, r) => sum + r, 0) / returns[ticker].length;
        adjustedReturns[ticker] = returns[ticker].map(r => meanReturn + (r - meanReturn) * scenario.volatilityIncrease);
      }
    }
    
    // 计算情景下的绩效
    const scenarioPerformance = calculatePerformance(weights, adjustedReturns);
    
    return {
      scenario: scenario.name,
      portfolioReturn: scenarioPerformance.annualizedReturn * 100,  // 转为百分比
      portfolioRisk: scenarioPerformance.annualizedRisk * 100,      // 转为百分比
      maxDrawdown: scenarioPerformance.maxDrawdown * 100,           // 转为百分比
      lossProbability: calculateLossProbability(scenarioPerformance.dailyReturns)
    };
  });
  
  return results;
}

/**
 * 计算亏损概率
 */
function calculateLossProbability(returns: number[]): number {
  const lossCount = returns.filter(r => r < 0).length;
  return (lossCount / returns.length) * 100;  // 转为百分比
}

/**
 * 分析极端风险
 */
function analyzeTailRisk(weights: number[], returns: Record<string, number[]>, tickers: string[]): any {
  const performance = calculatePerformance(weights, returns);
  const portfolioReturns = performance.dailyReturns;
  
  // 预定义的极端事件情景：金融危机、资产泡沫破裂等
  const extremeEvents = [
    { name: "金融危机", simulatedLoss: -0.4 },
    { name: "资产泡沫破裂", simulatedLoss: -0.3 },
    { name: "急剧通胀", simulatedLoss: -0.15 },
    { name: "政治危机", simulatedLoss: -0.2 }
  ];
  
  // 计算条件风险价值 (CVaR)
  const var95 = calculateVaR(portfolioReturns, 0.95);
  const tailReturns = portfolioReturns.filter(r => r < -var95);
  const cvar95 = tailReturns.length > 0 ? tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length : 0;
  
  // 计算极端事件下的投资组合损失
  const extremeEventImpact = extremeEvents.map(event => {
    // 简化的极端事件模拟
    return {
      event: event.name,
      potentialLoss: event.simulatedLoss * 100,  // 转为百分比
      recoveryTime: estimateRecoveryTime(event.simulatedLoss)
    };
  });
  
  return {
    conditionalVaR: cvar95 * 100,  // 转为百分比
    extremeEventImpact,
    tailRiskMetrics: {
      worstDailyLoss: Math.min(...portfolioReturns) * 100,  // 转为百分比
      averageTailLoss: cvar95 * 100,                        // 转为百分比
      tailRiskRatio: (cvar95 / var95).toFixed(2)            // 尾部风险与VaR的比率
    }
  };
}

/**
 * 估算恢复时间（简化版）
 */
function estimateRecoveryTime(loss: number): string {
  const absoluteLoss = Math.abs(loss);
  
  if (absoluteLoss > 0.35) {
    return "可能需要3-5年";
  } else if (absoluteLoss > 0.25) {
    return "可能需要2-3年";
  } else if (absoluteLoss > 0.15) {
    return "可能需要1-2年";
  } else {
    return "可能需要6-12个月";
  }
}

/**
 * 分析行业分散度
 */
function analyzeSectorDiversification(tickers: string[], weights: number[]): any {
  // 简化的行业映射（实际应用中应该使用真实的数据）
  const sectorMap = {
    'AAPL': 'Technology',
    'MSFT': 'Technology',
    'GOOG': 'Technology',
    'AMZN': 'Consumer Cyclical',
    'FB': 'Technology',
    'TSLA': 'Consumer Cyclical',
    'BRK.B': 'Financial Services',
    'JPM': 'Financial Services',
    'JNJ': 'Healthcare',
    'V': 'Financial Services',
    'PG': 'Consumer Defensive',
    'HD': 'Consumer Cyclical',
    'MA': 'Financial Services',
    'DIS': 'Communication Services',
    'ADBE': 'Technology',
    'CRM': 'Technology',
    'INTC': 'Technology',
    'VZ': 'Communication Services',
    'NFLX': 'Communication Services',
    'PYPL': 'Financial Services',
    // 添加更多股票的行业映射
  };
  
  // 计算每个行业的权重
  const sectorWeights = {};
  
  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    const sector = sectorMap[ticker] || 'Other';
    
    if (!sectorWeights[sector]) {
      sectorWeights[sector] = 0;
    }
    
    sectorWeights[sector] += weights[i];
  }
  
  // 计算赫芬达尔指数 (HHI) 衡量集中度
  const hhi = Object.values(sectorWeights).reduce((sum, weight) => sum + Math.pow(weight * 100, 2), 0);
  
  // 评估行业分散度
  let diversificationLevel;
  if (hhi < 1500) {
    diversificationLevel = "高度分散";
  } else if (hhi < 2500) {
    diversificationLevel = "中度分散";
  } else {
    diversificationLevel = "高度集中";
  }
  
  // 生成分散化建议
  const diversificationSuggestions = [];
  
  const sectorEntries = Object.entries(sectorWeights);
  // 检查是否有行业权重过高
  const highestSector = sectorEntries.sort((a, b) => b[1] - a[1])[0];
  
  if (highestSector[1] > 0.4) {
    diversificationSuggestions.push(`${highestSector[0]}行业权重过高(${(highestSector[1]*100).toFixed(1)}%)，建议适当降低该行业的配置，增加其他行业以提高分散度。`);
  }
  
  // 检查是否缺少某些主要行业
  const mainSectors = ['Technology', 'Financial Services', 'Healthcare', 'Consumer Cyclical', 'Consumer Defensive'];
  const missingSectors = mainSectors.filter(sector => !sectorWeights[sector] || sectorWeights[sector] < 0.05);
  
  if (missingSectors.length > 0) {
    diversificationSuggestions.push(`投资组合缺少${missingSectors.join('、')}等主要行业的足够配置，可以考虑增加这些行业的股票以提高分散度。`);
  }
  
  return {
    sectorAllocation: Object.entries(sectorWeights).map(([sector, weight]) => ({
      sector,
      weight: parseFloat((weight * 100).toFixed(1))  // 转为百分比并保留一位小数
    })).sort((a, b) => b.weight - a.weight),
    
    hhiScore: hhi,
    diversificationLevel,
    suggestions: diversificationSuggestions
  };
} 