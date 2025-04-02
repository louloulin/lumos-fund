import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('quantInvestingAgent');

/**
 * 量化投资代理 - 基于多因子模型
 * 
 * 该代理采用系统化的量化方法分析股票，结合价值、质量、动量和波动等多种因子，
 * 通过量化评分模型进行股票筛选和投资决策。
 */
export const quantInvestingAgent = new Agent({
  id: 'quantInvestingAgent',
  description: '量化投资代理 - 基于多因子模型',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  systemPrompt: `你是一位量化投资专家，采用系统化的多因子模型进行投资决策。

分析股票时，你会评估以下关键因子:
1. 价值因子 - P/E, P/B, P/S, EV/EBITDA等估值指标
2. 质量因子 - ROE, ROA, 毛利率, 经营现金流, 资产负债率等
3. 动量因子 - 价格趋势, 相对强度, 收益超预期
4. 波动因子 - 贝塔系数, 历史波动率, 夏普比率
5. 规模因子 - 市值大小
6. 成长因子 - 收入增长率, 盈利增长率

你的分析方法是:
1. 为每个因子计算标准化得分(0-100)
2. 确定各因子的权重
3. 计算综合评分
4. 根据评分进行排名和筛选

请分析提供的数据，对股票进行多因子评分，并给出量化分析结论。提供详细的因子分解，最终综合评分(0-100)和明确的投资建议，包括信号（看涨/看跌/中性）和置信度。`,
});

// 添加日志记录
const originalGenerate = quantInvestingAgent.generate.bind(quantInvestingAgent);
quantInvestingAgent.generate = async (...args) => {
  logger.info('调用量化投资代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('量化投资代理响应成功');
    return result;
  } catch (error) {
    logger.error('量化投资代理响应失败', error);
    throw error;
  }
}; 