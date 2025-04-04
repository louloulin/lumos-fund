'use server'

import { createLogger } from '@/lib/logger.server';
import { investmentCommitteeAgent, portfolioManagementAgent, riskManagementAgent } from '@/mastra/agents';
import { MarketDataService } from '@/services/marketDataService';
import { revalidatePath } from 'next/cache';

const logger = createLogger('portfolio-optimization');
const marketDataService = new MarketDataService();

// 确保市场数据服务已初始化
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await marketDataService.initialize();
    isInitialized = true;
  }
}

/**
 * 持仓类型定义
 */
export interface Position {
  ticker: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  weight: number;
  gain: number;
  gainPercent: number;
}

/**
 * 投资组合类型定义
 */
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  cash: number;
  positions: Position[];
  totalValue: number;
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    overall: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 投资组合优化结果
 */
export interface PortfolioOptimizationResult {
  portfolio: Portfolio;
  recommendedActions: Array<{
    ticker: string;
    action: 'buy' | 'sell' | 'hold';
    shares: number;
    targetWeight: number;
    currentWeight: number;
    reasoning: string;
  }>;
  riskAnalysis: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    diversificationScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  sectorAllocation: Record<string, number>;
  summary: string;
}

/**
 * 优化投资组合
 * 使用AI代理分析投资组合并提供优化建议
 */
export async function optimizePortfolio(
  portfolioId: string,
  options?: {
    riskTolerance?: 'low' | 'medium' | 'high';
    timeHorizon?: 'short' | 'medium' | 'long';
    constraints?: Array<{ type: string; value: any }>;
  }
): Promise<PortfolioOptimizationResult> {
  try {
    logger.info('开始投资组合优化', { portfolioId });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 这里应该从数据库获取投资组合数据
    // 为演示目的，我们创建一个模拟投资组合
    const portfolio = createMockPortfolio(portfolioId);
    
    // 获取投资组合中所有股票的数据
    const tickers = portfolio.positions.map(pos => pos.ticker);
    const tickerData: Record<string, any> = {};
    
    for (const ticker of tickers) {
      const [priceData, financialData] = await Promise.all([
        marketDataService.fetchStockPriceHistory(ticker, '1y'),
        marketDataService.fetchFinancialData(ticker)
      ]);
      
      tickerData[ticker] = {
        priceHistory: priceData,
        financials: financialData
      };
    }
    
    // 1. 风险评估
    const riskPrompt = `
      请对以下投资组合进行风险评估：
      
      投资组合详情:
      ${JSON.stringify(portfolio, null, 2)}
      
      股票详细数据:
      ${JSON.stringify(tickerData, null, 2)}
      
      用户风险承受能力: ${options?.riskTolerance || 'medium'}
      投资时间范围: ${options?.timeHorizon || 'medium'}
      
      请提供以下分析:
      1. 波动性评估
      2. 夏普比率估计
      3. 最大回撤预测
      4. 多元化评分(0-100)
      5. 整体风险水平(低/中/高)
      6. 主要风险因素
      7. 风险缓解建议
      
      回复必须采用以下JSON格式：
      {
        "volatility": 12.5,
        "sharpeRatio": 0.85,
        "maxDrawdown": 15,
        "diversificationScore": 65,
        "riskLevel": "medium",
        "riskFactors": ["集中风险", "行业暴露", "..."],
        "mitigationSuggestions": ["分散投资", "增加防御性资产", "..."]
      }
    `;
    
    // 2. 投资组合优化
    const optimizationPrompt = `
      请对以下投资组合进行优化分析：
      
      投资组合详情:
      ${JSON.stringify(portfolio, null, 2)}
      
      股票详细数据:
      ${JSON.stringify(tickerData, null, 2)}
      
      用户风险承受能力: ${options?.riskTolerance || 'medium'}
      投资时间范围: ${options?.timeHorizon || 'medium'}
      
      请提供以下优化建议:
      1. 对每个持仓的行动建议(买入/卖出/持有)
      2. 建议的目标权重
      3. 每项建议的理由
      4. 建议的行业配置
      5. 整体投资组合优化总结
      
      如果有约束条件，请遵循以下约束：
      ${JSON.stringify(options?.constraints || [], null, 2)}
      
      回复必须采用以下JSON格式：
      {
        "recommendedActions": [
          {
            "ticker": "AAPL",
            "action": "buy|sell|hold",
            "shares": 10,
            "targetWeight": 0.15,
            "currentWeight": 0.12,
            "reasoning": "理由..."
          }
        ],
        "sectorAllocation": {
          "Technology": 0.25,
          "Healthcare": 0.15
        },
        "summary": "总结..."
      }
    `;
    
    // 并行执行分析
    const [riskAnalysisResult, optimizationResult] = await Promise.all([
      riskManagementAgent.run({ messages: [{ role: 'user', content: riskPrompt }] }),
      portfolioManagementAgent.run({ messages: [{ role: 'user', content: optimizationPrompt }] })
    ]);
    
    // 3. 获取投资委员会意见
    const committeePrompt = `
      作为投资委员会，请审查以下投资组合优化建议和风险分析：
      
      投资组合详情:
      ${JSON.stringify(portfolio, null, 2)}
      
      风险分析:
      ${riskAnalysisResult.content}
      
      优化建议:
      ${optimizationResult.content}
      
      请提供您的最终建议和总体评估。回复应包含对优化建议的任何调整，以及整体实施策略的建议。
      请确保您的建议是全面而平衡的，考虑到风险、回报和客户目标。
      
      回复应简洁明了，不超过250字，重点关注最重要的行动步骤。
    `;
    
    const committeeResult = await investmentCommitteeAgent.run({
      messages: [{ role: 'user', content: committeePrompt }]
    });
    
    // 解析结果
    let riskAnalysis;
    let optimizationData;
    
    try {
      const riskJsonMatch = riskAnalysisResult.content.match(/\{[\s\S]*\}/);
      const optJsonMatch = optimizationResult.content.match(/\{[\s\S]*\}/);
      
      if (riskJsonMatch && optJsonMatch) {
        riskAnalysis = JSON.parse(riskJsonMatch[0]);
        optimizationData = JSON.parse(optJsonMatch[0]);
      } else {
        throw new Error('无法从结果中解析JSON');
      }
    } catch (parseError) {
      logger.error('解析结果失败', { error: parseError });
      throw new Error('解析结果失败: ' + (parseError as Error).message);
    }
    
    // 构建最终结果
    const result: PortfolioOptimizationResult = {
      portfolio,
      recommendedActions: optimizationData.recommendedActions,
      riskAnalysis: {
        volatility: riskAnalysis.volatility,
        sharpeRatio: riskAnalysis.sharpeRatio,
        maxDrawdown: riskAnalysis.maxDrawdown,
        diversificationScore: riskAnalysis.diversificationScore,
        riskLevel: riskAnalysis.riskLevel as 'low' | 'medium' | 'high'
      },
      sectorAllocation: optimizationData.sectorAllocation,
      summary: committeeResult.content.trim()
    };
    
    logger.info('投资组合优化完成', { portfolioId });
    
    // 刷新路径缓存
    revalidatePath(`/portfolio/${portfolioId}`);
    
    return result;
    
  } catch (error) {
    logger.error('投资组合优化失败', { portfolioId, error });
    throw error;
  }
}

/**
 * 创建模拟投资组合数据
 */
function createMockPortfolio(id: string): Portfolio {
  const positions: Position[] = [
    {
      ticker: 'AAPL',
      shares: 50,
      costBasis: 150,
      currentPrice: 168.25,
      currentValue: 8412.5,
      weight: 0.25,
      gain: 912.5,
      gainPercent: 12.17
    },
    {
      ticker: 'MSFT',
      shares: 30,
      costBasis: 290,
      currentPrice: 325.50,
      currentValue: 9765,
      weight: 0.28,
      gain: 1065,
      gainPercent: 12.24
    },
    {
      ticker: 'AMZN',
      shares: 20,
      costBasis: 135,
      currentPrice: 155.35,
      currentValue: 3107,
      weight: 0.09,
      gain: 407,
      gainPercent: 15.07
    },
    {
      ticker: 'GOOGL',
      shares: 25,
      costBasis: 125,
      currentPrice: 147.68,
      currentValue: 3692,
      weight: 0.11,
      gain: 567,
      gainPercent: 18.14
    },
    {
      ticker: 'META',
      shares: 15,
      costBasis: 310,
      currentPrice: 487.55,
      currentValue: 7313.25,
      weight: 0.21,
      gain: 2663.25,
      gainPercent: 57.24
    },
  ];
  
  const totalPositionValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const cash = 2000; // 现金余额
  const totalValue = totalPositionValue + cash;
  
  // 更新权重比例
  positions.forEach(pos => {
    pos.weight = parseFloat((pos.currentValue / totalValue).toFixed(4));
  });
  
  return {
    id,
    name: '科技成长组合',
    description: '专注于高质量科技成长股的中长期投资组合',
    cash,
    positions,
    totalValue,
    performance: {
      daily: 0.85,
      weekly: 2.15,
      monthly: 5.78,
      yearly: 18.52,
      overall: 22.33
    },
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6个月前
    updatedAt: new Date().toISOString()
  };
}

/**
 * 执行投资组合再平衡
 * 根据目标配置调整投资组合
 */
export async function rebalancePortfolio(
  portfolioId: string,
  targetAllocation: Record<string, number>
): Promise<{
  portfolio: Portfolio;
  transactionPlan: Array<{
    ticker: string;
    action: 'buy' | 'sell';
    shares: number;
    estimatedCost: number;
  }>;
}> {
  try {
    logger.info('开始投资组合再平衡', { portfolioId });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 获取当前投资组合
    const portfolio = createMockPortfolio(portfolioId);
    
    // 创建交易计划
    const transactionPlan: Array<{
      ticker: string;
      action: 'buy' | 'sell';
      shares: number;
      estimatedCost: number;
    }> = [];
    
    // 计算每个持仓的目标价值和调整
    const tickersInPortfolio = portfolio.positions.map(p => p.ticker);
    const tickersInTarget = Object.keys(targetAllocation);
    const allTickers = Array.from(new Set([...tickersInPortfolio, ...tickersInTarget]));
    
    for (const ticker of allTickers) {
      const currentPosition = portfolio.positions.find(p => p.ticker === ticker);
      const targetWeight = targetAllocation[ticker] || 0;
      const targetValue = portfolio.totalValue * targetWeight;
      
      if (currentPosition) {
        const valueDifference = targetValue - currentPosition.currentValue;
        
        if (Math.abs(valueDifference) > portfolio.totalValue * 0.005) { // 0.5%阈值
          const sharesDifference = Math.floor(valueDifference / currentPosition.currentPrice);
          
          if (sharesDifference > 0) {
            transactionPlan.push({
              ticker,
              action: 'buy',
              shares: sharesDifference,
              estimatedCost: sharesDifference * currentPosition.currentPrice
            });
          } else if (sharesDifference < 0) {
            transactionPlan.push({
              ticker,
              action: 'sell',
              shares: Math.abs(sharesDifference),
              estimatedCost: Math.abs(sharesDifference) * currentPosition.currentPrice
            });
          }
        }
      } else if (targetWeight > 0) {
        // 需要购买新的持仓
        // 获取当前价格
        const priceData = await marketDataService.fetchStockPriceHistory(ticker, '1d');
        const currentPrice = priceData[priceData.length - 1].close;
        
        const sharesToBuy = Math.floor(targetValue / currentPrice);
        
        if (sharesToBuy > 0) {
          transactionPlan.push({
            ticker,
            action: 'buy',
            shares: sharesToBuy,
            estimatedCost: sharesToBuy * currentPrice
          });
        }
      }
    }
    
    logger.info('投资组合再平衡计划已生成', { 
      portfolioId, 
      transactionCount: transactionPlan.length 
    });
    
    // 刷新路径缓存
    revalidatePath(`/portfolio/${portfolioId}`);
    
    return {
      portfolio,
      transactionPlan
    };
    
  } catch (error) {
    logger.error('投资组合再平衡失败', { portfolioId, error });
    throw error;
  }
} 