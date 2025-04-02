import { NextResponse } from 'next/server';
import { mastra } from '@/mastra';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('api-analyze');

/**
 * 处理股票分析请求
 */
export async function POST(req: Request) {
  try {
    // 解析请求数据
    const body = await req.json();
    const { ticker, analysisType } = body;
    
    if (!ticker) {
      return NextResponse.json(
        { error: '缺少股票代码' },
        { status: 400 }
      );
    }
    
    logger.info(`API分析请求: ${ticker}, 类型: ${analysisType || 'all'}`);
    
    // 根据分析类型选择代理
    const agentName = getAgentName(analysisType);
    const agent = mastra.getAgent(agentName);
    
    // 创建提示词
    const prompt = `分析 ${ticker} 股票，提供${getAnalysisTypeDescription(analysisType)}分析`;
    
    // 非流式请求，返回完整结果
    const result = await agent.generate(prompt);
    
    // 返回分析结果
    return NextResponse.json({
      success: true,
      data: result.text || result
    }, { status: 200 });
  } catch (error) {
    logger.error('分析API错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理请求时出错' },
      { status: 500 }
    );
  }
}

/**
 * 处理流式分析请求
 */
export async function GET(req: Request) {
  try {
    // 从URL参数获取数据
    const url = new URL(req.url);
    const ticker = url.searchParams.get('ticker');
    const analysisType = url.searchParams.get('type');
    
    if (!ticker) {
      return NextResponse.json(
        { error: '缺少股票代码' },
        { status: 400 }
      );
    }
    
    logger.info(`API流式分析请求: ${ticker}, 类型: ${analysisType || 'value'}`);
    
    // 根据分析类型选择代理
    const agentName = getAgentName(analysisType);
    const agent = mastra.getAgent(agentName);
    
    // 创建提示词
    const prompt = `分析 ${ticker} 股票，提供${getAnalysisTypeDescription(analysisType)}分析`;
    
    // 生成流式响应
    const stream = await agent.stream(prompt);
    
    // 返回流式响应
    return stream.toDataStreamResponse();
  } catch (error) {
    logger.error('流式API错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理流式请求时出错' },
      { status: 500 }
    );
  }
}

/**
 * 根据分析类型获取代理名称
 */
function getAgentName(analysisType: string | null): string {
  switch (analysisType) {
    case 'technical':
      return 'technicalAnalysisAgent';
    case 'sentiment':
      return 'sentimentAnalysisAgent';
    case 'portfolio':
      return 'portfolioManagementAgent';
    case 'value':
    default:
      return 'valueInvestingAgent';
  }
}

/**
 * 获取分析类型的描述
 */
function getAnalysisTypeDescription(analysisType: string | null): string {
  switch (analysisType) {
    case 'technical':
      return '技术面';
    case 'sentiment':
      return '市场情绪';
    case 'portfolio':
      return '投资组合';
    case 'value':
    default:
      return '价值投资';
  }
} 