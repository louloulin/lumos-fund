import { NextResponse } from 'next/server';
import { mastra } from '@/mastra';

export async function POST(req: Request) {
  try {
    // 解析请求数据
    const body = await req.json();
    const { ticker, portfolio } = body;
    
    if (!ticker) {
      return NextResponse.json(
        { error: '缺少股票代码' },
        { status: 400 }
      );
    }
    
    // 获取工作流
    const workflow = mastra.getWorkflow('tradingDecisionWorkflow');
    
    // 执行工作流
    const result = await workflow.execute({
      context: {
        ticker,
        portfolio: portfolio || { cash: 0, positions: [] },
        data: {
          // 数据将由工具动态获取，此处可提供缓存或预加载数据
        }
      }
    });
    
    // 返回分析结果
    return NextResponse.json({
      fundamentalAnalysis: result.fundamentalAnalysis,
      technicalAnalysis: result.technicalAnalysis,
      sentimentAnalysis: result.sentimentAnalysis,
      portfolioDecision: result.portfolioDecision
    }, { status: 200 });
  } catch (error) {
    console.error('分析API错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理请求时出错' },
      { status: 500 }
    );
  }
}

// 支持流式响应的API
export async function OPTIONS(req: Request) {
  try {
    // 解析请求数据
    const body = await req.json();
    const { ticker, question, analysisType } = body;
    
    if (!ticker) {
      return NextResponse.json(
        { error: '缺少股票代码' },
        { status: 400 }
      );
    }
    
    // 根据分析类型选择代理
    let agent;
    if (analysisType === 'sentiment') {
      agent = mastra.getAgent('sentimentAnalysisAgent');
    } else if (analysisType === 'technical') {
      agent = mastra.getAgent('technicalAnalysisAgent');
    } else {
      // 默认使用价值投资代理
      agent = mastra.getAgent('valueInvestingAgent');
    }
    
    // 创建提示词
    const prompt = question || `分析 ${ticker} 股票，提供投资建议`;
    
    // 生成流式响应
    const stream = await agent.stream(prompt);
    
    // 返回流式响应
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error('流式API错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理流式请求时出错' },
      { status: 500 }
    );
  }
} 