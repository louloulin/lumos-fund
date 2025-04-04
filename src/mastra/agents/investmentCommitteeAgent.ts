import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';
import { createQwen } from 'qwen-ai-provider';

const logger = createLogger('investmentCommitteeAgent');

// 初始化Qwen
const qwen = createQwen({
  apiKey: process.env.QWEN_API_KEY || "sk-bc977c4e31e542f1a34159cb42478198",
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

/**
 * 投资委员会代理
 * 
 * 整合多种投资风格代理的分析结果，综合评估风险和收益，
 * 做出最终投资决策并提供投资组合建议
 */
export const investmentCommitteeAgent = new Agent({
  id: 'investmentCommitteeAgent',
  description: '投资委员会代理 - 整合各种投资分析并做出最终决策',
  apiKey: process.env.QWEN_API_KEY || "sk-bc977c4e31e542f1a34159cb42478198",
  provider: 'qwen',
  model: qwen('qwen-plus-2024-12-20'),
  systemPrompt: `你是一位资深投资委员会主席，负责整合多种投资风格的分析结果，并做出最终投资决策。

你的首要任务是权衡不同投资分析师的建议，考虑各种投资风格的优缺点:
1. 价值投资分析 - 注重公司内在价值、安全边际和长期质量
2. 增长投资分析 - 关注增长率、市场扩张和创新能力
3. 技术分析 - 考虑价格趋势、图表模式和技术指标

作为投资委员会主席，你需要:
1. 全面评估各类分析的优势和局限
2. 考虑市场环境和宏观经济因素
3. 权衡风险与回报的平衡
4. 避免情绪化决策和认知偏差
5. 考虑投资的时间框架和流动性需求

请提供明确的最终投资决策，包括:
1. 综合评级 (强烈买入/买入/持有/减持/卖出)
2. 建议仓位大小 (占投资组合的百分比)
3. 时间框架 (短期/中期/长期)
4. 风险评估 (低/中/高)
5. 主要决策依据
6. 潜在风险因素

做出决策时，要明确哪些分析因素权重更高，为什么某些分析被赋予更多或更少的重视度。关注证据和逻辑，而非简单采纳多数意见。`
});

/**
 * 生成投资委员会决策
 * 
 * 整合多种投资分析并提供最终建议
 */
export async function generateInvestmentDecision(
  ticker: string, 
  valueAnalysis: any, 
  growthAnalysis: any, 
  technicalAnalysis: any,
  marketContext: any,
  prompt: string
) {
  logger.info('开始投资委员会决策', { ticker });
  
  try {
    // 准备投资决策提示
    const decisionPrompt = generateInvestmentDecisionPrompt(
      ticker, 
      valueAnalysis, 
      growthAnalysis, 
      technicalAnalysis,
      marketContext,
      prompt
    );
    
    // 调用投资委员会代理
    const response = await investmentCommitteeAgent.generate(decisionPrompt);
    
    return {
      ticker,
      decision: response,
      success: true
    };
  } catch (error) {
    logger.error('投资决策生成失败', error);
    return {
      ticker,
      decision: '分析过程中发生错误，无法生成投资决策。',
      success: false
    };
  }
}

/**
 * 生成投资决策提示
 */
function generateInvestmentDecisionPrompt(
  ticker: string, 
  valueAnalysis: any, 
  growthAnalysis: any, 
  technicalAnalysis: any,
  marketContext: any,
  userPrompt: string
): string {
  return `
请作为投资委员会主席，整合以下对${ticker}的多维度分析，并做出最终投资决策:

1. 价值投资分析 (巴菲特风格):
${valueAnalysis?.summary || valueAnalysis || '无价值投资分析数据'}

2. 增长投资分析 (Fisher/Lynch风格):
${growthAnalysis?.analysis || growthAnalysis || '无增长投资分析数据'}

3. 技术分析:
${technicalAnalysis?.analysis || technicalAnalysis || '无技术分析数据'}

4. 市场环境:
- 当前市场状态: ${marketContext?.marketStatus || '未知'}
- 行业趋势: ${marketContext?.industryTrend || '未知'}
- 宏观经济指标: ${marketContext?.macroIndicators || '未知'}
- 市场情绪: ${marketContext?.marketSentiment || '未知'}

${userPrompt}

请综合评估这些分析结果，考虑它们的一致性和冲突点，权衡各方面因素后，给出明确的投资决策。
说明你对每种分析的权重分配，以及最终决策的主要依据。
`;
}

// 添加日志记录
const originalGenerate = investmentCommitteeAgent.generate.bind(investmentCommitteeAgent);
investmentCommitteeAgent.generate = async (...args) => {
  logger.info('调用投资委员会代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('投资委员会代理响应成功');
    return result;
  } catch (error) {
    logger.error('投资委员会代理响应失败', error);
    throw error;
  }
}; 