'use server'

import { createLogger } from '@/lib/logger.server';
import { 
  quantInvestingAgent,
  riskManagementAgent 
} from '@/mastra/agents';
import { MarketDataService } from '@/services/marketDataService';
import { revalidatePath } from 'next/cache';

const logger = createLogger('ai-factor-analysis');
const marketDataService = new MarketDataService();

// 确保市场数据服务已初始化
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await marketDataService.initialize();
    isInitialized = true;
  }
}

// 因子分析结果接口
export interface FactorAnalysisResult {
  ticker: string;
  date: string;
  factorScores: {
    value: number; // 0-100
    growth: number; // 0-100
    quality: number; // 0-100
    momentum: number; // 0-100
    volatility: number; // 0-100
    size: number; // 0-100
    overall: number; // 0-100
  };
  factorRankings: {
    topFactors: string[];
    bottomFactors: string[];
  };
  interpretation: {
    summary: string;
    valueAnalysis: string;
    growthAnalysis: string;
    qualityAnalysis: string;
    momentumAnalysis: string;
    volatilityAnalysis: string;
    sizeAnalysis: string;
  };
  investmentImplications: {
    suitability: 'high' | 'medium' | 'low';
    timeHorizon: 'short' | 'medium' | 'long';
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    recommendations: string[];
  };
}

/**
 * 分析股票的多因子表现
 * @param ticker 股票代码
 * @param factors 要分析的因子列表（可选）
 */
export async function analyzeStockFactors(
  ticker: string,
  factors: string[] = ['value', 'growth', 'quality', 'momentum', 'volatility', 'size']
): Promise<FactorAnalysisResult> {
  try {
    logger.info('开始多因子分析', { ticker, factors });
    
    // 确保市场数据服务已初始化
    await ensureInitialized();
    
    // 获取股票数据
    const [priceData, financialData, newsData] = await Promise.all([
      marketDataService.fetchStockPriceHistory(ticker, '1y'),
      marketDataService.fetchFinancialData(ticker),
      marketDataService.fetchNewsData(ticker, 30)
    ]);
    
    // 1. 分析价值因子（Value Factor）
    const valuePrompt = `
      请分析${ticker}的价值因子表现，基于以下数据：
      
      财务数据:
      ${JSON.stringify(financialData, null, 2)}
      
      价格数据:
      ${JSON.stringify(priceData.slice(-30), null, 2)}
      
      请评估以下价值指标：
      1. P/E比率（市盈率）
      2. P/B比率（市净率）
      3. P/S比率（市销率）
      4. 股息收益率
      5. 自由现金流收益率
      
      为价值因子给出一个0-100的综合得分，100表示价值因子极佳。
      提供详细分析和对投资决策的影响。
      
      以JSON格式输出：
      {
        "score": 75,
        "analysis": "详细分析...",
        "keyMetrics": {
          "pe": 15.2,
          "pb": 2.1,
          "ps": 3.5,
          "dividendYield": 2.3,
          "fcfYield": 5.1
        }
      }
    `;
    
    // 2. 分析成长因子（Growth Factor）
    const growthPrompt = `
      请分析${ticker}的成长因子表现，基于以下数据：
      
      财务数据:
      ${JSON.stringify(financialData, null, 2)}
      
      请评估以下成长指标：
      1. 收入增长率（过去3年）
      2. 盈利增长率（过去3年）
      3. 预期未来增长率
      4. 研发支出占比
      5. 毛利率增长
      
      为成长因子给出一个0-100的综合得分，100表示成长因子极佳。
      提供详细分析和对投资决策的影响。
      
      以JSON格式输出：
      {
        "score": 80,
        "analysis": "详细分析...",
        "keyMetrics": {
          "revenueGrowth": 15.2,
          "earningsGrowth": 18.5,
          "expectedGrowth": 12.3,
          "rdExpense": 8.7,
          "grossMarginTrend": "上升"
        }
      }
    `;
    
    // 3. 分析质量因子（Quality Factor）
    const qualityPrompt = `
      请分析${ticker}的质量因子表现，基于以下数据：
      
      财务数据:
      ${JSON.stringify(financialData, null, 2)}
      
      请评估以下质量指标：
      1. ROE（股本回报率）
      2. ROA（资产回报率）
      3. 净利润率
      4. 债务水平
      5. 会计质量（应计项目/总资产）
      
      为质量因子给出一个0-100的综合得分，100表示质量因子极佳。
      提供详细分析和对投资决策的影响。
      
      以JSON格式输出：
      {
        "score": 65,
        "analysis": "详细分析...",
        "keyMetrics": {
          "roe": 18.2,
          "roa": 8.5,
          "netMargin": 12.3,
          "debtToEquity": 0.8,
          "accountingQuality": "良好"
        }
      }
    `;
    
    // 4. 分析动量因子（Momentum Factor）
    const momentumPrompt = `
      请分析${ticker}的动量因子表现，基于以下数据：
      
      价格数据:
      ${JSON.stringify(priceData, null, 2)}
      
      请评估以下动量指标：
      1. 6个月价格动量
      2. 12个月价格动量
      3. 52周相对强度
      4. 价格相对于移动平均线的位置
      5. 成交量变化趋势
      
      为动量因子给出一个0-100的综合得分，100表示动量因子极佳。
      提供详细分析和对投资决策的影响。
      
      以JSON格式输出：
      {
        "score": 85,
        "analysis": "详细分析...",
        "keyMetrics": {
          "sixMonthMomentum": 12.5,
          "yearMomentum": 22.3,
          "relativeStrength": 75,
          "priceToMA": "高于",
          "volumeTrend": "上升"
        }
      }
    `;
    
    // 5. 分析波动率因子（Volatility Factor）
    const volatilityPrompt = `
      请分析${ticker}的波动率因子表现，基于以下数据：
      
      价格数据:
      ${JSON.stringify(priceData, null, 2)}
      
      请评估以下波动率指标：
      1. 历史波动率（年化）
      2. Beta值
      3. 最大回撤
      4. 价格振幅
      5. 相对于市场的波动性
      
      为波动率因子给出一个0-100的综合得分，100表示波动性最低（最稳定）。
      提供详细分析和对投资决策的影响。
      
      以JSON格式输出：
      {
        "score": 60,
        "analysis": "详细分析...",
        "keyMetrics": {
          "annualVolatility": 25.2,
          "beta": 1.2,
          "maxDrawdown": 18.5,
          "priceRange": "中等",
          "relativeVolatility": "高于市场"
        }
      }
    `;
    
    // 6. 分析规模因子（Size Factor）
    const sizePrompt = `
      请分析${ticker}的规模因子表现，基于以下数据：
      
      财务数据:
      ${JSON.stringify(financialData, null, 2)}
      
      请评估以下规模指标：
      1. 市值规模
      2. 行业内相对规模
      3. 资产规模
      4. 收入规模
      5. 交易量/流动性
      
      为规模因子给出一个0-100的综合得分，根据投资理念不同，可以偏好大型或小型股。
      提供详细分析和对投资决策的影响。
      
      以JSON格式输出：
      {
        "score": 70,
        "analysis": "详细分析...",
        "keyMetrics": {
          "marketCap": "大型股",
          "industryPosition": "行业领先",
          "totalAssets": "大型",
          "revenue": "高",
          "liquidity": "良好"
        }
      }
    `;
    
    // 并行执行所有因子分析
    const [valueResult, growthResult, qualityResult, momentumResult, volatilityResult, sizeResult] = 
      await Promise.all([
        quantInvestingAgent.run({ messages: [{ role: 'user', content: valuePrompt }] }),
        quantInvestingAgent.run({ messages: [{ role: 'user', content: growthPrompt }] }),
        quantInvestingAgent.run({ messages: [{ role: 'user', content: qualityPrompt }] }),
        quantInvestingAgent.run({ messages: [{ role: 'user', content: momentumPrompt }] }),
        quantInvestingAgent.run({ messages: [{ role: 'user', content: volatilityPrompt }] }),
        quantInvestingAgent.run({ messages: [{ role: 'user', content: sizePrompt }] })
      ]);
    
    // 解析所有结果
    const valueAnalysis = parseJsonFromAgentResponse(valueResult.content);
    const growthAnalysis = parseJsonFromAgentResponse(growthResult.content);
    const qualityAnalysis = parseJsonFromAgentResponse(qualityResult.content);
    const momentumAnalysis = parseJsonFromAgentResponse(momentumResult.content);
    const volatilityAnalysis = parseJsonFromAgentResponse(volatilityResult.content);
    const sizeAnalysis = parseJsonFromAgentResponse(sizeResult.content);
    
    // 汇总因子分析结果
    const factorScores = {
      value: valueAnalysis.score || 50,
      growth: growthAnalysis.score || 50,
      quality: qualityAnalysis.score || 50,
      momentum: momentumAnalysis.score || 50,
      volatility: volatilityAnalysis.score || 50,
      size: sizeAnalysis.score || 50,
      overall: 0 // 将在后面计算
    };
    
    // 计算整体得分（简单平均）
    factorScores.overall = Math.round(
      (factorScores.value + factorScores.growth + factorScores.quality + 
       factorScores.momentum + factorScores.volatility) / 5
    );
    
    // 排序因子
    const sortedFactors = Object.entries(factorScores)
      .filter(([key]) => key !== 'overall')
      .sort((a, b) => b[1] - a[1]);
    
    const topFactors = sortedFactors.slice(0, 2).map(([name]) => name);
    const bottomFactors = sortedFactors.slice(-2).map(([name]) => name);
    
    // 生成投资建议
    const recommendationPrompt = `
      请基于以下多因子分析结果，提供投资建议：
      
      股票: ${ticker}
      
      因子分析:
      - 价值因子: ${factorScores.value}/100 - ${valueAnalysis.analysis}
      - 成长因子: ${factorScores.growth}/100 - ${growthAnalysis.analysis}
      - 质量因子: ${factorScores.quality}/100 - ${qualityAnalysis.analysis}
      - 动量因子: ${factorScores.momentum}/100 - ${momentumAnalysis.analysis}
      - 波动率因子: ${factorScores.volatility}/100 - ${volatilityAnalysis.analysis}
      - 规模因子: ${factorScores.size}/100 - ${sizeAnalysis.analysis}
      
      整体得分: ${factorScores.overall}/100
      
      强项因子: ${topFactors.join(', ')}
      弱项因子: ${bottomFactors.join(', ')}
      
      请提供:
      1. 基于这些因子表现的综合分析
      2. 该股票适合哪种类型的投资者（保守型/适中型/激进型）
      3. 建议的投资时间范围（短期/中期/长期）
      4. 3-5个具体的投资建议
      
      以JSON格式输出：
      {
        "summary": "综合分析摘要",
        "suitability": "high/medium/low",
        "timeHorizon": "short/medium/long",
        "riskProfile": "conservative/moderate/aggressive",
        "recommendations": ["建议1", "建议2", "建议3", "建议4", "建议5"]
      }
    `;
    
    // 获取投资建议
    const recommendationResult = await riskManagementAgent.run({
      messages: [{ role: 'user', content: recommendationPrompt }]
    });
    
    // 解析投资建议
    const investmentImplications = parseJsonFromAgentResponse(recommendationResult.content);
    
    // 构建最终结果
    const result: FactorAnalysisResult = {
      ticker,
      date: new Date().toISOString(),
      factorScores,
      factorRankings: {
        topFactors,
        bottomFactors
      },
      interpretation: {
        summary: investmentImplications.summary || `${ticker}的多因子分析完成。`,
        valueAnalysis: valueAnalysis.analysis || '无价值因子分析数据',
        growthAnalysis: growthAnalysis.analysis || '无成长因子分析数据',
        qualityAnalysis: qualityAnalysis.analysis || '无质量因子分析数据',
        momentumAnalysis: momentumAnalysis.analysis || '无动量因子分析数据',
        volatilityAnalysis: volatilityAnalysis.analysis || '无波动率因子分析数据',
        sizeAnalysis: sizeAnalysis.analysis || '无规模因子分析数据'
      },
      investmentImplications: {
        suitability: investmentImplications.suitability || 'medium',
        timeHorizon: investmentImplications.timeHorizon || 'medium',
        riskProfile: investmentImplications.riskProfile || 'moderate',
        recommendations: investmentImplications.recommendations || []
      }
    };
    
    logger.info('多因子分析完成', { 
      ticker, 
      overallScore: result.factorScores.overall,
      topFactors: result.factorRankings.topFactors
    });
    
    // 刷新页面缓存
    revalidatePath(`/stocks/${ticker}/analysis`);
    
    return result;
    
  } catch (error) {
    logger.error('多因子分析失败', { ticker, error });
    throw error;
  }
}

/**
 * 从代理响应中解析JSON
 */
function parseJsonFromAgentResponse(response: string): any {
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
 * 批量分析多只股票的因子表现，并进行排名
 */
export async function rankStocksByFactors(
  tickers: string[],
  primaryFactor: 'value' | 'growth' | 'quality' | 'momentum' | 'volatility' | 'overall' = 'overall'
): Promise<{
  date: string;
  rankings: Array<{
    ticker: string;
    score: number;
    rank: number;
  }>;
  topStock: string;
  bottomStock: string;
  factorDescription: string;
}> {
  try {
    logger.info('开始批量因子排名分析', { 
      tickersCount: tickers.length, 
      primaryFactor 
    });
    
    // 并行分析所有股票
    const analysisPromises = tickers.map(ticker => analyzeStockFactors(ticker));
    const analysisResults = await Promise.all(analysisPromises);
    
    // 根据主要因子排序
    const rankings = analysisResults
      .map(result => ({
        ticker: result.ticker,
        score: result.factorScores[primaryFactor],
        rank: 0 // 将在排序后设置
      }))
      .sort((a, b) => b.score - a.score);
    
    // 设置排名
    rankings.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    // 获取首尾股票
    const topStock = rankings.length > 0 ? rankings[0].ticker : '';
    const bottomStock = rankings.length > 0 ? rankings[rankings.length - 1].ticker : '';
    
    // 获取因子描述
    const factorDescriptions: Record<string, string> = {
      value: '价值因子评估公司的估值水平，关注P/E、P/B等指标，寻找被低估的股票',
      growth: '成长因子评估公司的增长潜力，关注收入增长、盈利增长等指标',
      quality: '质量因子评估公司的业务质量，关注ROE、净利润率等指标',
      momentum: '动量因子评估价格趋势强度，关注过去6-12个月的价格走势',
      volatility: '波动率因子评估价格稳定性，低波动性通常表示较低风险',
      overall: '综合因子考虑多个方面的表现，提供平衡的多因子评分'
    };
    
    const result = {
      date: new Date().toISOString(),
      rankings,
      topStock,
      bottomStock,
      factorDescription: factorDescriptions[primaryFactor]
    };
    
    logger.info('批量因子排名分析完成', { 
      tickersCount: tickers.length, 
      topStock,
      bottomStock
    });
    
    // 刷新排名页面缓存
    revalidatePath(`/stocks/rankings/${primaryFactor}`);
    
    return result;
    
  } catch (error) {
    logger.error('批量因子排名分析失败', { 
      tickersCount: tickers.length, 
      primaryFactor,
      error 
    });
    throw error;
  }
} 