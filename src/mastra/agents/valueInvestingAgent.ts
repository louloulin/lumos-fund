import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';
import { analyzeMoatTool } from '../tools/valueAnalysisTools';
import { calculateIntrinsicValueTool } from '../tools/valuationTools';
import { analyzeFundamentalsTool } from '../tools/fundamentalTools';
import { analyzeConsistencyTool } from '../tools/consistencyTools';
import { analyzeManagementTool } from '../tools/managementTools';

const logger = createLogger('valueInvestingAgent');

/**
 * 价值投资代理 - 模拟沃伦·巴菲特投资风格
 * 
 * 巴菲特专注于寻找具有持久竞争优势、管理优秀、价值被低估的企业，
 * 采用长期持有策略，强调安全边际和价值投资原则。
 */
export const valueInvestingAgent = new Agent({
  id: 'valueInvestingAgent',
  description: '价值投资代理 - 模拟沃伦·巴菲特投资风格',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `你是一位价值投资专家，采用沃伦·巴菲特的投资风格和思维方式。

作为股票分析师，你会重点关注以下因素:
1. 经济护城河 - 公司是否拥有持久的竞争优势
2. 管理层质量 - 管理团队诚信度、资本分配能力和股东回报记录
3. 业务可理解性 - 企业模式是否简单易懂
4. 长期盈利能力和资本回报 - ROE、ROIC等指标
5. 财务健康度 - 负债水平、现金流状况、利息覆盖率
6. 财务一致性 - 业绩的可预测性和稳定性
7. 安全边际 - 当前股价是否明显低于内在价值

根据巴菲特的理念，应该"像买入企业一样买入股票"，长期持有优质企业，而不是短期交易。

当分析股票时，你会结合以下工具生成的分析结果:
- 护城河分析工具 (analyzeMoatTool) - 评估公司竞争优势的强度和持久性
- 内在价值计算工具 (calculateIntrinsicValueTool) - 使用多种估值方法计算公司价值
- A基本面分析工具 (analyzeFundamentalsTool) - 评估公司财务健康度和盈利能力
- 财务一致性分析工具 (analyzeConsistencyTool) - 分析公司业绩的稳定性和可预测性
- 管理层质量分析工具 (analyzeManagementTool) - 评估管理团队的资本分配能力

请分析工具提供的数据，给出明确的投资建议，包括:
1. 投资信号 (看涨/看跌/中性)
2. 置信度 (0-100%)
3. 安全边际
4. 详细分析理由

最终推荐应基于综合分析，特别强调安全边际 - 如果没有足够的安全边际，即使是优质公司也不应推荐投资。`,
  tools: {
    analyzeMoatTool,
    calculateIntrinsicValueTool,
    analyzeFundamentalsTool,
    analyzeConsistencyTool,
    analyzeManagementTool
  }
});

/**
 * 生成价值投资分析
 * 
 * 整合多个分析工具的结果，提供巴菲特风格的价值投资分析
 */
export async function generateValueInvestingAnalysis(ticker: string, data: any) {
  logger.info('开始价值投资分析', { ticker });
  
  try {
    // 初始化分析结果
    const analysis = {
      ticker,
      signal: 'neutral' as 'bullish' | 'bearish' | 'neutral',
      confidence: 50,
      intrinsicValue: null as number | null,
      currentPrice: data.currentPrice || 0,
      marginOfSafety: null as number | null,
      totalScore: 0,
      maxPossibleScore: 25,
      details: {
        fundamentals: null,
        moat: null,
        consistency: null,
        management: null,
        valuation: null
      },
      summary: '',
      failedAnalysis: false
    };
    
    // 1. 分析基本面
    const fundamentalsResult = await analyzeFundamentalsTool.execute({ 
      ticker, 
      metrics: data.financialMetrics 
    });
    analysis.details.fundamentals = fundamentalsResult;
    
    // 2. 分析护城河
    const moatResult = await analyzeMoatTool.execute({ 
      ticker, 
      financialData: data.financialData 
    });
    analysis.details.moat = moatResult;
    
    // 3. 分析财务一致性
    const consistencyResult = await analyzeConsistencyTool.execute({ 
      ticker, 
      financialHistory: data.financialHistory 
    });
    analysis.details.consistency = consistencyResult;
    
    // 4. 分析管理层质量
    const managementResult = await analyzeManagementTool.execute({ 
      ticker, 
      managementData: data.managementData 
    });
    analysis.details.management = managementResult;
    
    // 5. 计算内在价值
    const valuationResult = await calculateIntrinsicValueTool.execute({ 
      ticker, 
      financialData: data.financialData,
      growthRate: data.estimatedGrowthRate
    });
    analysis.details.valuation = valuationResult;
    analysis.intrinsicValue = valuationResult.intrinsicValue;
    
    // 计算总得分
    analysis.totalScore = 
      (fundamentalsResult.score || 0) + 
      (moatResult.score || 0) + 
      (consistencyResult.score || 0) + 
      (managementResult.score || 0);
    
    // 计算安全边际
    if (valuationResult.intrinsicValue !== null && data.currentPrice) {
      analysis.marginOfSafety = (valuationResult.intrinsicValue - data.currentPrice) / data.currentPrice;
    } else {
      analysis.marginOfSafety = null;
    }
    
    // 生成投资信号和置信度
    if (analysis.totalScore >= 0.7 * analysis.maxPossibleScore && 
        analysis.marginOfSafety !== null && 
        analysis.marginOfSafety >= 0.3) {
      // 高质量 + 足够安全边际 = 强烈看涨
      analysis.signal = 'bullish';
      analysis.confidence = Math.min(90, 65 + analysis.totalScore / analysis.maxPossibleScore * 25);
    } else if (analysis.totalScore >= 0.6 * analysis.maxPossibleScore && 
              analysis.marginOfSafety !== null && 
              analysis.marginOfSafety > 0.1) {
      // 良好质量 + 一定安全边际 = 看涨
      analysis.signal = 'bullish';
      analysis.confidence = Math.min(75, 55 + analysis.totalScore / analysis.maxPossibleScore * 20);
    } else if (analysis.totalScore <= 0.3 * analysis.maxPossibleScore || 
              (analysis.marginOfSafety !== null && analysis.marginOfSafety < -0.2)) {
      // 低质量或显著高估 = 看跌
      analysis.signal = 'bearish';
      analysis.confidence = Math.min(80, 60 + (1 - analysis.totalScore / analysis.maxPossibleScore) * 20);
    } else {
      // 其他情况 = 中性
      analysis.signal = 'neutral';
      analysis.confidence = 50 + Math.abs((analysis.totalScore / analysis.maxPossibleScore - 0.5) * 20);
    }
    
    // 生成总结
    analysis.summary = generateValueInvestingSummary(analysis);
    
    return analysis;
  } catch (error) {
    logger.error('价值投资分析失败', error);
    return {
      ticker,
      signal: 'neutral',
      confidence: 30,
      failedAnalysis: true,
      summary: '分析过程中发生错误，无法完成完整分析。'
    };
  }
}

/**
 * 生成价值投资分析总结
 */
function generateValueInvestingSummary(analysis: any): string {
  // 基本信息
  let summary = `${analysis.ticker} 价值投资分析总结:\n`;
  
  // 公司质量评估
  const qualityPercentage = (analysis.totalScore / analysis.maxPossibleScore) * 100;
  let qualityAssessment = '';
  
  if (qualityPercentage >= 80) {
    qualityAssessment = '卓越公司';
  } else if (qualityPercentage >= 65) {
    qualityAssessment = '优质公司';
  } else if (qualityPercentage >= 50) {
    qualityAssessment = '良好公司';
  } else if (qualityPercentage >= 35) {
    qualityAssessment = '一般公司';
  } else {
    qualityAssessment = '质量较差公司';
  }
  
  summary += `公司质量: ${qualityAssessment} (${analysis.totalScore.toFixed(1)}/${analysis.maxPossibleScore}分)\n`;
  
  // 添加护城河信息
  if (analysis.details.moat) {
    summary += `护城河: ${analysis.details.moat.moatType || '无明显护城河'}, `;
    summary += `持久性: ${analysis.details.moat.durability || '未知'}\n`;
  }
  
  // 价值评估
  if (analysis.intrinsicValue !== null) {
    summary += `内在价值估计: $${analysis.intrinsicValue.toFixed(2)}/股, `;
    summary += `当前价格: $${analysis.currentPrice.toFixed(2)}/股\n`;
    
    if (analysis.marginOfSafety !== null) {
      const safetyMarginPercentage = (analysis.marginOfSafety * 100).toFixed(1);
      if (analysis.marginOfSafety > 0) {
        summary += `安全边际: ${safetyMarginPercentage}% (低估)\n`;
      } else {
        summary += `安全边际: ${safetyMarginPercentage}% (高估)\n`;
      }
    }
  }
  
  // 投资结论
  summary += `投资结论: ${analysis.signal === 'bullish' ? '看涨' : analysis.signal === 'bearish' ? '看跌' : '中性'} `;
  summary += `(置信度: ${analysis.confidence.toFixed(0)}%)\n`;
  
  // 关键亮点或警告
  if (analysis.signal === 'bullish') {
    summary += `\n投资价值: `;
    if (analysis.details.fundamentals && analysis.details.fundamentals.score >= 7) {
      summary += `强劲的财务表现、`;
    }
    if (analysis.details.moat && analysis.details.moat.score >= 3) {
      summary += `坚固的竞争优势、`;
    }
    if (analysis.details.consistency && analysis.details.consistency.score >= 3.5) {
      summary += `稳定可预测的业绩、`;
    }
    if (analysis.details.management && analysis.details.management.score >= 3.5) {
      summary += `优秀的管理团队、`;
    }
    if (analysis.marginOfSafety && analysis.marginOfSafety > 0.3) {
      summary += `显著的安全边际、`;
    }
    // 移除末尾的逗号并替换为句号
    summary = summary.slice(0, -1) + '。';
  } else if (analysis.signal === 'bearish') {
    summary += `\n风险因素: `;
    if (analysis.details.fundamentals && analysis.details.fundamentals.score < 4) {
      summary += `财务表现不佳、`;
    }
    if (analysis.details.moat && analysis.details.moat.score < 2) {
      summary += `缺乏竞争优势、`;
    }
    if (analysis.details.consistency && analysis.details.consistency.score < 2) {
      summary += `业绩不稳定、`;
    }
    if (analysis.details.management && analysis.details.management.score < 2) {
      summary += `管理层存在问题、`;
    }
    if (analysis.marginOfSafety && analysis.marginOfSafety < -0.1) {
      summary += `过高估值、`;
    }
    // 移除末尾的逗号并替换为句号
    summary = summary.slice(0, -1) + '。';
  }
  
  return summary;
}

// 添加日志记录
const originalGenerate = valueInvestingAgent.generate.bind(valueInvestingAgent);
valueInvestingAgent.generate = async (...args) => {
  logger.info('调用价值投资代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('价值投资代理响应成功');
    return result;
  } catch (error) {
    logger.error('价值投资代理响应失败', error);
    throw error;
  }
}; 