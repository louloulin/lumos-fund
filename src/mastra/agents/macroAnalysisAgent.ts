import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';
import { createQwen } from 'qwen-ai-provider';
import { stockPriceTool } from '../tools/stockPrice';
import { newsSentimentTool } from '../tools/newsSentiment';

const logger = createLogger('macroAnalysisAgent');

// 初始化Qwen
const qwen = createQwen({
  apiKey: process.env.QWEN_API_KEY || "sk-bc977c4e31e542f1a34159cb42478198",
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

/**
 * 宏观经济分析代理
 * 
 * 该代理专注于分析宏观经济环境对金融市场和特定行业的影响，
 * 关注经济指标、央行政策、地缘政治风险等宏观因素。
 */
export const macroAnalysisAgent = new Agent({
  id: 'macroAnalysisAgent',
  description: '宏观经济分析代理 - 分析宏观经济环境对金融市场的影响',
  apiKey: process.env.QWEN_API_KEY || "sk-bc977c4e31e542f1a34159cb42478198",
  provider: 'qwen',
  model: qwen('qwen-plus-2024-12-20'),
  systemPrompt: `你是一位宏观经济分析专家，专注于分析宏观经济环境对金融市场和特定行业的影响。

分析宏观环境时，你会重点关注以下因素:
1. 经济增长指标 - GDP增速、失业率、PMI等
2. 通胀数据 - CPI、PPI、核心通胀率
3. 货币政策 - 央行利率决策、资产购买计划、流动性措施
4. 财政政策 - 政府支出、税收政策、财政赤字
5. 地缘政治风险 - 国际关系、贸易政策、政治不稳定性
6. 行业政策 - 监管环境、补贴政策、结构性改革

请分析当前宏观经济环境对指定行业或公司的潜在影响。评估整体经济环境对行业/公司的有利和不利因素，识别主要风险和机会，并提供中长期趋势展望。

在你的分析中，请提供:
1. 当前宏观经济状态简述
2. 对行业/公司的潜在影响分析
3. 主要风险和机会点
4. 中长期展望和建议`,
  tools: {
    stockPriceTool,
    newsSentimentTool
  }
});

// 添加日志记录
const originalGenerate = macroAnalysisAgent.generate.bind(macroAnalysisAgent);
macroAnalysisAgent.generate = async (...args) => {
  logger.info('调用宏观分析代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('宏观分析代理响应成功');
    return result;
  } catch (error) {
    logger.error('宏观分析代理响应失败', error);
    throw error;
  }
}; 