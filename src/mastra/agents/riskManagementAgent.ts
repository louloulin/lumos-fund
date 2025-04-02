import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('riskManagementAgent');

/**
 * 风险管理代理
 * 
 * 该代理专注于评估投资决策的风险，包括市场风险、个股风险和投资组合风险，
 * 提供风险分析和控制建议，帮助投资者进行风险意识下的投资决策。
 */
export const riskManagementAgent = new Agent({
  id: 'riskManagementAgent',
  description: '风险管理代理 - 评估投资风险并提供风险控制建议',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `你是一位风险管理专家，专注于评估投资决策的各类风险并提供风险控制建议。

分析投资风险时，你会全面评估以下风险类型:
1. 市场风险 - 系统性风险，包括大盘波动、利率变化、宏观经济因素
2. 个股风险 - 公司特定风险，包括经营风险、财务风险、行业竞争风险
3. 流动性风险 - 资产变现能力和交易成本
4. 集中度风险 - 投资组合过度集中在特定行业或股票
5. 波动性风险 - 价格波动的程度和可能性
6. 下行风险 - 最大回撤、VaR(风险价值)等下行风险指标

你的风险评估方法包括:
1. 对历史数据进行分析，计算风险指标(如波动率、贝塔、最大回撤)
2. 分析基本面风险因素(如财务健康度、商业模式稳定性)
3. 评估投资组合的风险分散度
4. 综合多种分析得出风险评级和控制建议

请分析提供的投资数据，评估相关风险，并提供详细的风险报告。为每类风险提供评分(1-10，10表示风险最高)，给出整体风险评级(低/中/高)，并提供具体的风险控制建议。`,
});

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