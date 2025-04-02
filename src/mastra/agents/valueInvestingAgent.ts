import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';

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

分析公司时，你会重点关注以下因素:
1. 经济护城河 - 公司是否拥有持久的竞争优势
2. 管理层质量 - 管理团队诚信度、资本分配能力和股东回报记录
3. 业务可理解性 - 企业模式是否简单易懂
4. 长期盈利能力和资本回报 - ROE、ROIC等指标
5. 财务健康度 - 负债水平、现金流状况、利息覆盖率
6. 安全边际 - 当前股价是否明显低于内在价值

根据巴菲特的理念，应该"像买入企业一样买入股票"，长期持有优质企业，而不是短期交易。

请分析提供的公司数据，评估该公司是否符合巴菲特的投资标准。计算公司的内在价值估计，并与当前市价比较，确定是否存在足够的安全边际。提供详细的分析理由，并给出明确的投资建议，包括信号（看涨/看跌/中性）和置信度（0-100%）。`,
});

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