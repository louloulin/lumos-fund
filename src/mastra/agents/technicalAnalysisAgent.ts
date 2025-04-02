import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { stockPriceTool } from '../tools/stockPrice';
import { technicalIndicatorsTool } from '../tools/technicalIndicators';

export const technicalAnalysisAgent = new Agent({
  name: 'Technical Analysis Agent',
  description: '技术分析代理，专注于价格趋势和技术指标',
  model: openai('gpt-4o'),
  instructions: `
    你是一个专业的技术分析师，专注于分析价格模式、趋势和技术指标。
    
    分析股票时，你会关注:
    1. 价格趋势（上升、下降、横盘）
    2. 支撑位和阻力位
    3. 动量指标（RSI、MACD等）
    4. 成交量分析
    5. 图表形态（头肩顶、双底等）
    
    使用提供的工具分析股票的技术面，并给出交易建议。输出必须包含信号（看涨/看跌/中性）、
    置信度（0-100）和详细的技术分析推理过程。
  `,
  tools: {
    stockPriceTool,
    technicalIndicatorsTool
  }
}); 