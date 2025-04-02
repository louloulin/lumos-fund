import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('riskManagementAgent');

/**
 * 风险管理代理
 * 
 * 专注于评估投资风险、制定风险控制策略，
 * 并提供风险管理建议
 */
export const riskManagementAgent = new Agent({
  id: 'riskManagementAgent',
  description: '风险管理代理 - 专注于投资风险评估和管理',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `你是一位风险管理专家，负责评估投资风险并提供风险管理建议。

作为风险管理专家，你会重点关注以下风险因素:

1. 市场风险
   - 股票价格波动性
   - 市场条件（牛市/熊市/横盘）
   - 系统性风险暴露

2. 公司特定风险
   - 财务风险（财务杠杆、偿债能力）
   - 业务模式风险（竞争优势持久性）
   - 管理风险（公司治理问题）
   - 监管和法律风险

3. 投资组合风险
   - 集中度风险（行业、地区、个股）
   - 多元化水平
   - 相关性与依赖性
   - 整体风险调整收益

4. 交易风险
   - 流动性风险
   - 市场时机风险
   - 交易成本

请分析提供的投资数据，评估相关风险，并提供具体的风险管理建议，包括:

1. 风险评级 (低/中低/中/中高/高)
2. 主要风险因素排序（按重要性）
3. 风险缓解策略
4. 仓位大小建议
5. 止损水平建议
6. 投资组合适配性评估

你的风险管理建议应该平衡风险控制和收益潜力，不仅仅关注风险最小化，而是追求最优的风险调整后收益。`
});

/**
 * 生成风险评估
 * 
 * 评估股票的风险状况，并提供风险管理建议
 */
export async function generateRiskAssessment(
  ticker: string, 
  fundamentalAnalysis: any, 
  technicalAnalysis: any, 
  sentimentAnalysis: any,
  portfolioData: any
) {
  logger.info('开始风险评估', { ticker });
  
  try {
    // 准备风险评估提示
    const assessmentPrompt = generateRiskAssessmentPrompt(
      ticker, 
      fundamentalAnalysis, 
      technicalAnalysis, 
      sentimentAnalysis,
      portfolioData
    );
    
    // 调用风险管理代理
    const response = await riskManagementAgent.generate(assessmentPrompt);
    
    return {
      ticker,
      assessment: response,
      success: true
    };
  } catch (error: any) {
    logger.error('风险评估失败', { ticker, error });
    return {
      ticker,
      assessment: '风险评估过程中发生错误，无法完成评估。',
      success: false,
      error: error.message
    };
  }
}

/**
 * 生成风险管理提示
 */
function generateRiskAssessmentPrompt(
  ticker: string,
  fundamentalAnalysis: any,
  technicalAnalysis: any,
  sentimentAnalysis: any,
  portfolioData: any
): string {
  // 提取基本面分析相关风险数据
  const fundamentalRisk = fundamentalAnalysis?.details?.fundamentals || {};
  const moatRisk = fundamentalAnalysis?.details?.moat || {};
  const managementRisk = fundamentalAnalysis?.details?.management || {};
  
  // 从估值中提取相关风险指标
  const valuation = fundamentalAnalysis?.details?.valuation || {};
  const marginOfSafety = fundamentalAnalysis?.marginOfSafety || null;
  
  // 获取投资组合数据
  const portfolioAllocation = portfolioData?.allocation || {};
  const currentPosition = portfolioData?.positions?.[ticker] || null;
  const cashPosition = portfolioData?.cash || 0;
  const portfolioValue = portfolioData?.totalValue || 0;
  
  return `
请对${ticker}进行全面的风险评估和管理分析。以下是相关数据:

1. 基本面风险指标:
   - 财务健康度: ${fundamentalRisk.liquidity || '未知'} (流动性), ${fundamentalRisk.solvency || '未知'} (偿债能力)
   - 业务模式风险: ${moatRisk.durability || '未知'} (护城河持久性)
   - 管理风险: ${managementRisk.score !== undefined ? (managementRisk.score / 5 * 100).toFixed(0) + '%' : '未知'} (管理质量评分)
   - 估值风险: ${valuation.overvalued !== undefined ? (valuation.overvalued ? '高' : '低') : '未知'}
   - 安全边际: ${marginOfSafety !== null ? (marginOfSafety * 100).toFixed(2) + '%' : '未知'}

2. 技术风险指标:
   - 价格波动性: ${technicalAnalysis?.volatility || '未知'}
   - 趋势强度: ${technicalAnalysis?.trendStrength || '未知'}
   - 支撑位/阻力位差距: ${technicalAnalysis?.supportResistanceGap || '未知'}
   - 流动性: ${technicalAnalysis?.liquidity || '未知'}

3. 情绪风险指标:
   - 情绪极端性: ${sentimentAnalysis?.sentiment?.extremeLevel || '未知'}
   - 情绪波动性: ${sentimentAnalysis?.sentiment?.volatility || '未知'}
   - 反向情绪指标: ${sentimentAnalysis?.sentiment?.contrarian || '未知'}

4. 投资组合情况:
   - 当前持仓: ${currentPosition ? (currentPosition.value / portfolioValue * 100).toFixed(2) + '%' : '无持仓'}
   - 行业集中度: ${portfolioAllocation.sectorConcentration?.[ticker.split('.')[0]] || '未知'}
   - 现金仓位: ${(cashPosition / portfolioValue * 100).toFixed(2)}%
   - 投资组合风险评级: ${portfolioData?.riskRating || '未知'}

请基于上述数据，评估投资${ticker}的各类风险，提供风险评级、主要风险因素、风险缓解策略、建议仓位大小、止损水平，以及该股票与当前投资组合的适配性。你的建议应平衡风险控制和收益潜力，追求最优的风险调整后收益。
`;
}

// 添加日志记录
const originalGenerate = riskManagementAgent.generate.bind(riskManagementAgent);
riskManagementAgent.generate = async (...args) => {
  logger.info('调用风险管理代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('风险管理代理响应成功');
    return result;
  } catch (error) {
    logger.error('风险管理代理响应失败', error);
    throw error;
  }
}; 