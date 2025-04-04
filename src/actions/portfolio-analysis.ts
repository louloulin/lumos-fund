'use server'

import { createLogger } from '@/lib/logger.server';
import {
  valueInvestingAgent,
  growthInvestingAgent,
  quantInvestingAgent,
  technicalAnalysisAgent,
  investmentCommitteeAgent,
  riskManagementAgent
} from '@/mastra/agents';
import { MockMarketDataService } from '@/services/mockMarketDataService';
import { revalidatePath } from 'next/cache';
import { Position, Portfolio } from './portfolio-optimization';

const logger = createLogger('portfolio-analysis');
const marketDataService = new MockMarketDataService();

// 确保市场数据服务已初始化
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await marketDataService.initialize();
    isInitialized = true;
  }
}

/**
 * 投资组合分析结果
 */
export interface PortfolioAnalysisResult {
  portfolio: Portfolio;
  holdingsAnalysis: Record<string, {
    ticker: string;
    recommendation: 'buy' | 'hold' | 'sell' | 'reduce' | 'increase';
    timeHorizon: 'short' | 'medium' | 'long';
    valueAssessment: {
      score: number; // 0-100
      analysis: string;
    };
    growthProspects: {
      score: number; // 0-100
      analysis: string;
    };
    technicalOutlook: {
      score: number; // 0-100
      analysis: string;
    };
    riskAssessment: {
      level: 'low' | 'medium' | 'high';
      analysis: string;
    };
  }>;
  overallAssessment: {
    diversification: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    sectorAllocation: Record<string, number>;
    expectedReturn: {
      short: number;
      medium: number;
      long: number;
    };
    weaknesses: string[];
    strengths: string[];
  };
  recommendations: {
    immediate: string;
    shortTerm: string;
    longTerm: string;
  };
}

/**
 * 分析投资组合
 * 使用多个AI代理综合分析整个投资组合
 */
export async function analyzePortfolio(
  portfolioId: string
): Promise<PortfolioAnalysisResult> {
  try {
    logger.info('开始投资组合分析', { portfolioId });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 这里应该从数据库获取投资组合数据
    // 为演示目的，我们使用与portfolio-optimization.ts相同的模拟数据
    const portfolio = createMockPortfolio(portfolioId);
    
    // 获取投资组合中所有股票的数据
    const holdingsAnalysis: Record<string, any> = {};
    const tickers = portfolio.positions.map(pos => pos.ticker);
    
    // 并行分析每个持仓
    await Promise.all(tickers.map(async (ticker) => {
      try {
        // 获取股票数据
        const [priceData, financialData, newsData] = await Promise.all([
          marketDataService.fetchStockPriceHistory(ticker),
          marketDataService.fetchFinancialData(ticker),
          marketDataService.fetchNewsData(ticker, 15)
        ]);
        
        // 1. 价值分析 - 使用价值投资代理
        const valuePrompt = `
          请对${ticker}从价值投资角度进行分析。以下是可用数据:
          
          股价数据:
          ${JSON.stringify(priceData.slice(-30), null, 2)}
          
          财务数据:
          ${JSON.stringify(financialData, null, 2)}
          
          请提供:
          1. 内在价值评估
          2. 安全边际分析
          3. 估值指标评价（P/E, P/B, P/S, FCF等）
          4. 财务健康状况评估
          5. 价值投资角度的建议（买入/持有/卖出）
          6. 价值投资评分(0-100)
          
          以JSON格式返回:
          {
            "recommendation": "buy|hold|sell|reduce|increase",
            "timeHorizon": "short|medium|long",
            "score": 75,
            "analysis": "简要分析..."
          }
        `;
        
        // 2. 成长前景分析 - 使用成长投资代理
        const growthPrompt = `
          请对${ticker}从成长投资角度进行分析。以下是可用数据:
          
          股价数据:
          ${JSON.stringify(priceData.slice(-30), null, 2)}
          
          财务数据:
          ${JSON.stringify(financialData, null, 2)}
          
          新闻数据:
          ${JSON.stringify(newsData, null, 2)}
          
          请提供:
          1. 收入增长评估
          2. 盈利增长评估
          3. 市场份额和业务扩张前景
          4. 创新能力与竞争优势
          5. 成长投资角度的建议（买入/持有/卖出）
          6. 成长潜力评分(0-100)
          
          以JSON格式返回:
          {
            "recommendation": "buy|hold|sell|reduce|increase",
            "timeHorizon": "short|medium|long",
            "score": 75,
            "analysis": "简要分析..."
          }
        `;
        
        // 3. 技术面分析 - 使用技术分析代理
        const technicalPrompt = `
          请对${ticker}从技术分析角度进行分析。以下是可用数据:
          
          股价数据:
          ${JSON.stringify(priceData, null, 2)}
          
          请提供:
          1. 主要趋势判断
          2. 关键支撑与阻力位
          3. 技术指标分析（如RSI、MACD等）
          4. 图表形态识别
          5. 技术分析角度的建议（买入/持有/卖出）
          6. 技术面评分(0-100)
          
          以JSON格式返回:
          {
            "recommendation": "buy|hold|sell|reduce|increase",
            "timeHorizon": "short|medium|long",
            "score": 75,
            "analysis": "简要分析..."
          }
        `;
        
        // 4. 风险评估 - 使用风险管理代理
        const riskPrompt = `
          请对${ticker}进行风险评估。以下是可用数据:
          
          股价数据:
          ${JSON.stringify(priceData, null, 2)}
          
          财务数据:
          ${JSON.stringify(financialData, null, 2)}
          
          新闻数据:
          ${JSON.stringify(newsData, null, 2)}
          
          请提供:
          1. 波动性分析
          2. 行业与市场风险评估
          3. 财务风险评估
          4. 流动性风险
          5. 整体风险水平（低/中/高）
          6. 风险分析概述
          
          以JSON格式返回:
          {
            "level": "low|medium|high",
            "analysis": "简要分析..."
          }
        `;
        
        // 并行运行所有分析
        const [valueResult, growthResult, technicalResult, riskResult] = await Promise.all([
          valueInvestingAgent.run({ messages: [{ role: 'user', content: valuePrompt }] }),
          growthInvestingAgent.run({ messages: [{ role: 'user', content: growthPrompt }] }),
          technicalAnalysisAgent.run({ messages: [{ role: 'user', content: technicalPrompt }] }),
          riskManagementAgent.run({ messages: [{ role: 'user', content: riskPrompt }] })
        ]);
        
        // 解析结果
        const valueAnalysis = parseJsonFromResponse(valueResult.content);
        const growthAnalysis = parseJsonFromResponse(growthResult.content);
        const technicalAnalysis = parseJsonFromResponse(technicalResult.content);
        const riskAnalysis = parseJsonFromResponse(riskResult.content);
        
        // 存储分析结果
        holdingsAnalysis[ticker] = {
          ticker,
          recommendation: determineOverallRecommendation(valueAnalysis, growthAnalysis, technicalAnalysis),
          timeHorizon: determineTimeHorizon(valueAnalysis, growthAnalysis, technicalAnalysis),
          valueAssessment: {
            score: valueAnalysis.score || 50,
            analysis: valueAnalysis.analysis || "数据不足以进行详细分析"
          },
          growthProspects: {
            score: growthAnalysis.score || 50,
            analysis: growthAnalysis.analysis || "数据不足以进行详细分析"
          },
          technicalOutlook: {
            score: technicalAnalysis.score || 50,
            analysis: technicalAnalysis.analysis || "数据不足以进行详细分析"
          },
          riskAssessment: {
            level: riskAnalysis.level || "medium",
            analysis: riskAnalysis.analysis || "数据不足以进行详细分析"
          }
        };
      } catch (error) {
        logger.error(`分析${ticker}时出错`, { error });
        // 出错时使用占位数据
        holdingsAnalysis[ticker] = {
          ticker,
          recommendation: 'hold',
          timeHorizon: 'medium',
          valueAssessment: { score: 50, analysis: "分析过程中出错" },
          growthProspects: { score: 50, analysis: "分析过程中出错" },
          technicalOutlook: { score: 50, analysis: "分析过程中出错" },
          riskAssessment: { level: 'medium', analysis: "分析过程中出错" }
        };
      }
    }));
    
    // 对整个投资组合进行综合分析
    const portfolioAnalysisPrompt = `
      请对以下投资组合进行全面分析：
      
      投资组合概览:
      ${JSON.stringify({
        name: portfolio.name,
        description: portfolio.description,
        totalValue: portfolio.totalValue,
        cash: portfolio.cash,
        positionsCount: portfolio.positions.length
      }, null, 2)}
      
      持仓分析:
      ${JSON.stringify(holdingsAnalysis, null, 2)}
      
      请提供:
      1. 投资组合多样化评分(0-100)
      2. 整体风险水平(低/中/高)
      3. 行业配置分析（各行业权重）
      4. 预期收益率（短期、中期、长期）
      5. 投资组合主要优势（3-5点）
      6. 投资组合主要劣势（3-5点）
      7. 建议调整（立即、短期、长期）
      
      以JSON格式返回:
      {
        "diversification": 75,
        "riskLevel": "medium",
        "sectorAllocation": {
          "Technology": 0.45,
          "Healthcare": 0.25,
          "Consumer": 0.15,
          "Financial": 0.10,
          "Other": 0.05
        },
        "expectedReturn": {
          "short": 5.2,
          "medium": 8.7,
          "long": 12.3
        },
        "strengths": ["多样化程度良好", "技术行业配置合理", "价值与成长平衡"],
        "weaknesses": ["过度依赖科技股", "现金比例过低", "缺乏防御性资产"],
        "recommendations": {
          "immediate": "增加现金储备至10%",
          "shortTerm": "降低AAPL持仓比例，增加医疗健康股票",
          "longTerm": "建立周期性资产敞口，考虑小型国际市场配置"
        }
      }
    `;
    
    const committeeResult = await investmentCommitteeAgent.run({
      messages: [{ role: 'user', content: portfolioAnalysisPrompt }]
    });
    
    // 解析投资委员会结果
    const portfolioAssessment = parseJsonFromResponse(committeeResult.content);
    
    // 构建最终结果
    const result: PortfolioAnalysisResult = {
      portfolio,
      holdingsAnalysis,
      overallAssessment: {
        diversification: portfolioAssessment.diversification || 65,
        riskLevel: portfolioAssessment.riskLevel || 'medium',
        sectorAllocation: portfolioAssessment.sectorAllocation || { 'Technology': 0.8, 'Other': 0.2 },
        expectedReturn: portfolioAssessment.expectedReturn || { short: 4, medium: 8, long: 12 },
        weaknesses: portfolioAssessment.weaknesses || ["数据不足"],
        strengths: portfolioAssessment.strengths || ["数据不足"]
      },
      recommendations: portfolioAssessment.recommendations || {
        immediate: "需要更多数据以提供建议",
        shortTerm: "需要更多数据以提供建议",
        longTerm: "需要更多数据以提供建议"
      }
    };
    
    logger.info('投资组合分析完成', { portfolioId });
    
    // 刷新路径缓存
    revalidatePath(`/portfolio/${portfolioId}/analysis`);
    
    return result;
    
  } catch (error) {
    logger.error('投资组合分析失败', { portfolioId, error });
    throw error;
  }
}

/**
 * 解析JSON响应
 */
function parseJsonFromResponse(response: string): any {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    logger.error('解析JSON响应失败', { error, response });
    return {};
  }
}

/**
 * 确定整体推荐
 */
function determineOverallRecommendation(value: any, growth: any, technical: any): 'buy' | 'hold' | 'sell' | 'reduce' | 'increase' {
  // 简单计算：基于三个分析的推荐结果
  const recommendations = [value.recommendation, growth.recommendation, technical.recommendation].filter(Boolean);
  
  if (recommendations.length === 0) return 'hold';
  
  const counts = {
    buy: recommendations.filter(r => r === 'buy' || r === 'increase').length,
    sell: recommendations.filter(r => r === 'sell' || r === 'reduce').length,
    hold: recommendations.filter(r => r === 'hold').length
  };
  
  // 如果超过一半的分析建议买入
  if (counts.buy > recommendations.length / 2) return 'buy';
  // 如果超过一半的分析建议卖出
  if (counts.sell > recommendations.length / 2) return 'sell';
  // 如果所有分析都持有
  if (counts.hold === recommendations.length) return 'hold';
  
  // 默认保守建议
  return 'hold';
}

/**
 * 确定时间范围
 */
function determineTimeHorizon(value: any, growth: any, technical: any): 'short' | 'medium' | 'long' {
  // 综合各分析的时间范围
  // 价值投资通常偏长期，技术分析通常偏短期，成长分析中长期都有
  
  const horizons = [value.timeHorizon, growth.timeHorizon, technical.timeHorizon].filter(Boolean);
  
  if (horizons.length === 0) return 'medium';
  
  const counts = {
    short: horizons.filter(h => h === 'short').length,
    medium: horizons.filter(h => h === 'medium').length,
    long: horizons.filter(h => h === 'long').length
  };
  
  // 返回出现最多的时间范围
  const maxCount = Math.max(counts.short, counts.medium, counts.long);
  
  if (counts.short === maxCount) return 'short';
  if (counts.long === maxCount) return 'long';
  return 'medium';
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