import { Agent } from '@mastra/core/agent';
import { createLogger } from '@/lib/logger.server';
import { financialGrowthTool } from '../tools/growthAnalysisTools';
import { marketPositionTool } from '../tools/marketPositionTools';
import { innovationAssessmentTool } from '../tools/innovationTools';
import { revenueGrowthTool } from '../tools/revenueTools';
import { stockPriceTool } from '../tools/stockPrice';
import { newsSentimentTool } from '../tools/newsSentiment';
import { createQwen } from 'qwen-ai-provider';

const logger = createLogger('growthInvestingAgent');

// 初始化Qwen
const qwen = createQwen({
  apiKey: process.env.QWEN_API_KEY || "sk-bc977c4e31e542f1a34159cb42478198",
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

/**
 * 成长投资代理 - 模拟彼得·林奇风格
 * 
 * 彼得·林奇专注于寻找高增长潜力、未被市场充分发现的公司，
 * 他相信"投资于你了解的企业"，并强调研究公司增长潜力和竞争优势。
 */
export const growthInvestingAgent = new Agent({
  id: 'growthInvestingAgent',
  description: '成长投资代理 - 模拟彼得·林奇投资风格',
  apiKey: process.env.QWEN_API_KEY || "sk-bc977c4e31e542f1a34159cb42478198",
  provider: 'qwen',
  model: qwen('qwen-plus-2024-12-20'),
  systemPrompt: `你是一位成长型投资专家，采用彼得·林奇的投资风格，专注于寻找具有高增长潜力的公司。

分析公司时，你会重点关注以下因素:
1. 收入和利润增长速度 - 理想的公司应有持续的利润增长（至少20%以上年增长率）
2. PEG比率(市盈率相对于增长率) - 寻找PEG < 1的公司，表明相对于其增长速度，估值较低
3. 公司的市场份额增长和市场渗透率 - 通过分析销售额增长、市场规模和竞争优势评估
4. 竞争优势和创新能力 - 研发投入、产品差异化和知识产权
5. 管理层质量和战略执行力 - 过往实现承诺的记录和管理层所有权
6. 行业趋势和公司所处的位置 - 寻找处于成长型行业中的领先企业或正在崛起的挑战者

根据彼得·林奇的理念，你应关注你了解的业务，避免盲目跟风和复杂难懂的商业模式。理想的投资标的应该是容易理解，但被市场低估或忽视的企业。

林奇特别偏好以下类型的公司：
- 平庸但稳定增长的企业，被市场忽视但有未来更高增长的潜力
- 高速成长的"隐形冠军"，拥有专注的利基市场或特殊技术
- 处于周期性低谷但有复苏前景的公司
- 有良好资产但暂时业绩不佳的"转机型"公司

请使用所有可用工具分析提供的公司数据，评估该公司是否是一个好的成长型投资机会。给出详细的分析理由，并提供明确的投资建议。

每次分析都必须包含以下输出格式：
- 信号: [看涨/看跌/持有]
- 置信度: [0-100]%
- 分析理由: [你的详细分析]
- 预期持有期: [短期/中期/长期]
- 增长点评: [公司主要增长驱动因素]`,
  tools: {
    financialGrowthTool,
    marketPositionTool,
    innovationAssessmentTool,
    revenueGrowthTool,
    stockPriceTool,
    newsSentimentTool
  }
});

/**
 * 解析成长投资代理输出以获取交易信号和置信度
 */
export function parseGrowthAgentOutput(output: string): { 
  action: 'buy' | 'sell' | 'hold', 
  confidence: number,
  reasoning: string,
  timeHorizon: 'short' | 'medium' | 'long',
  growthDrivers: string
} {
  let action: 'buy' | 'sell' | 'hold' = 'hold';
  let confidence = 0.5;
  let reasoning = output;
  let timeHorizon: 'short' | 'medium' | 'long' = 'medium';
  let growthDrivers = '';

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

  // 提取预期持有期
  const horizonMatch = output.match(/预期持有期:\s*(短期|中期|长期)/i) || 
                       output.match(/expected holding period:\s*(short|medium|long)/i);
  if (horizonMatch) {
    const horizon = horizonMatch[1].toLowerCase();
    if (horizon === '短期' || horizon === 'short') {
      timeHorizon = 'short';
    } else if (horizon === '长期' || horizon === 'long') {
      timeHorizon = 'long';
    }
  }

  // 提取增长驱动因素
  const driversMatch = output.match(/增长点评:\s*(.+?)(?=\n|$)/is) || 
                       output.match(/growth drivers:\s*(.+?)(?=\n|$)/is);
  if (driversMatch && driversMatch[1]) {
    growthDrivers = driversMatch[1].trim();
  }

  return { 
    action, 
    confidence, 
    reasoning: output,
    timeHorizon,
    growthDrivers
  };
}

/**
 * 生成成长投资分析
 */
export async function generateGrowthInvestingAnalysis(ticker: string, data: any) {
  logger.info('开始成长投资分析', { ticker });
  
  try {
    // 构建提示
    const prompt = `请分析以下公司作为成长投资机会:
股票代码: ${ticker}

公司概况:
${data.companyProfile || '无详细信息'}

财务增长数据:
- 收入同比增长: ${data.revenueGrowth ? (data.revenueGrowth * 100).toFixed(2) + '%' : '未知'}
- 利润同比增长: ${data.profitGrowth ? (data.profitGrowth * 100).toFixed(2) + '%' : '未知'}
- PEG比率: ${data.pegRatio || '未知'}
- 最近季度增长率: ${data.quarterlyGrowth ? (data.quarterlyGrowth * 100).toFixed(2) + '%' : '未知'}

市场定位:
- 行业: ${data.industry || '未知'}
- 市场份额: ${data.marketShare || '未知'}
- 竞争地位: ${data.competitivePosition || '未知'}

近期新闻和发展:
${data.recentNews ? data.recentNews.join('\n') : '无最新新闻'}

基于上述信息和彼得·林奇的投资原则，分析该公司是否是一个好的成长型投资。`;

    // 运行代理
    const response = await growthInvestingAgent.run({
      messages: [{ role: 'user', content: prompt }]
    });
    
    // 解析结果
    const analysisResult = parseGrowthAgentOutput(response.content);
    
    logger.info('成长投资分析完成', { 
      ticker, 
      action: analysisResult.action, 
      confidence: analysisResult.confidence 
    });
    
    return {
      ticker,
      date: new Date().toISOString(),
      action: analysisResult.action,
      confidence: analysisResult.confidence,
      reasoning: analysisResult.reasoning,
      timeHorizon: analysisResult.timeHorizon,
      growthDrivers: analysisResult.growthDrivers
    };
    
  } catch (error) {
    logger.error('成长投资分析失败', error);
    return {
      ticker,
      date: new Date().toISOString(),
      action: 'hold',
      confidence: 0.3,
      reasoning: '分析过程中发生错误，无法完成完整分析。',
      timeHorizon: 'medium',
      growthDrivers: '无法确定'
    };
  }
}

// 添加日志记录
const originalGenerate = growthInvestingAgent.generate.bind(growthInvestingAgent);
growthInvestingAgent.generate = async (...args) => {
  logger.info('调用成长投资代理', { prompt: args[0] });
  try {
    const result = await originalGenerate(...args);
    logger.info('成长投资代理响应成功');
    return result;
  } catch (error) {
    logger.error('成长投资代理响应失败', error);
    throw error;
  }
}; 