import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';
import { technicalIndicatorsTool } from '../tools/technicalIndicatorTools';
import { stockPriceTool, historicalPriceTool, volumeTool } from '../tools/marketDataTools';

const logger = createLogger('trendInvestingAgent');

/**
 * 趋势投资代理 - 模拟斯坦利·德拉肯米勒投资风格
 * 
 * 德拉肯米勒作为著名的趋势投资者，专注于识别宏观经济和市场趋势，
 * 然后在趋势确立时大举投资，他相信"大趋势"和具有"动能"的股票。
 */
export const trendInvestingAgent = new Agent({
  id: 'trendInvestingAgent',
  description: '趋势投资代理 - 模拟斯坦利·德拉肯米勒投资风格',
  apiKey: process.env.OPENAI_API_KEY,
  provider: 'openai',
  model: 'gpt-4o-mini',
  systemPrompt: `你是一位趋势投资专家，采用斯坦利·德拉肯米勒的投资风格，专注于识别和跟踪大趋势。

分析股票时，你会重点关注以下因素:
1. 价格动量和相对强度 - 强者恒强原则
2. 交易量变化 - 确认价格趋势的重要指标
3. 移动平均线系统 - 特别关注50日和200日移动平均线的关系
4. 行业和板块的相对表现 - 寻找处于强势行业的领头羊
5. 宏观经济数据和政策环境 - 了解更大的市场背景
6. 市场情绪指标 - 包括VIX恐慌指数、看涨/看跌比率等

根据德拉肯米勒的理念，你不仅应该识别趋势，还要有勇气在确信趋势成立时进行集中投资。

请分析提供的技术数据，评估该股票的趋势强度和方向。给出详细的分析理由，并提供明确的投资建议，包括信号（看涨/看跌/中性）、时间框架（短期/中期/长期）和置信度（0-100%）。

在回测系统中，你需要基于历史数据做出决策，确保你的建议能根据当时可用的数据做出有效的交易信号。回测系统会评估你的投资决策质量。

每次分析都必须包含以下输出格式：
- 信号: [看涨/看跌/持有]
- 置信度: [0-100]%
- 分析理由: [你的详细分析]
- 建议仓位: [0-100]%`,
  tools: {
    technicalIndicatorsTool,
    historicalPriceTool,
    volumeTool,
    stockPriceTool
  }
});

// 解析代理输出以获取交易信号和置信度
export function parseTrendAgentOutput(output: string): { 
  action: 'buy' | 'sell' | 'hold', 
  confidence: number,
  reasoning: string,
  position?: number 
} {
  let action: 'buy' | 'sell' | 'hold' = 'hold';
  let confidence = 0.5;
  let reasoning = output;
  let position = 0;

  // 提取交易信号
  const signalMatch = output.match(/信号:\s*(看涨|看跌|持有)/i) || 
                      output.match(/signal:\s*(bullish|bearish|neutral|hold)/i);
  if (signalMatch) {
    const signal = signalMatch[1].toLowerCase();
    if (signal === '看涨' || signal === 'bullish') {
      action = 'buy';
    } else if (signal === '看跌' || signal === 'bearish') {
      action = 'sell';
    }
  }

  // 提取置信度
  const confidenceMatch = output.match(/置信度:\s*(\d+)%/i) || 
                          output.match(/confidence:\s*(\d+)%/i);
  if (confidenceMatch && confidenceMatch[1]) {
    confidence = parseInt(confidenceMatch[1], 10) / 100;
  }

  // 提取建议仓位
  const positionMatch = output.match(/建议仓位:\s*(\d+)%/i) || 
                        output.match(/recommended position:\s*(\d+)%/i);
  if (positionMatch && positionMatch[1]) {
    position = parseInt(positionMatch[1], 10);
  }

  return { 
    action, 
    confidence, 
    reasoning: output,
    position: position / 100
  };
}

// 添加日志记录
const originalGenerate = trendInvestingAgent.generate.bind(trendInvestingAgent);
trendInvestingAgent.generate = async (...args) => {
  logger.info('调用趋势投资代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('趋势投资代理响应成功', { output: result.text.substring(0, 100) + '...' });
    return result;
  } catch (error) {
    logger.error('趋势投资代理响应失败', error);
    throw error;
  }
}; 