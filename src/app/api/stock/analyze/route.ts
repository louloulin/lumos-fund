import { NextResponse } from 'next/server';
import { mastra, stockAgent, valueInvestingAgent, growthInvestingAgent, trendInvestingAgent } from '@/mastra';

export async function POST(request: Request) {
  try {
    const { symbol, analysisType = 'all' } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // 根据分析类型选择代理
    const analyses = [];
    
    switch (analysisType) {
      case 'value':
        analyses.push(await valueInvestingAgent.generate(`分析${symbol}的投资价值`));
        break;
      case 'growth':
        analyses.push(await growthInvestingAgent.generate(`分析${symbol}的成长性`));
        break;
      case 'trend':
        analyses.push(await trendInvestingAgent.generate(`分析${symbol}的技术走势`));
        break;
      case 'all':
      default:
        // 并行执行所有分析
        analyses.push(...await Promise.all([
          stockAgent.generate(`全面分析${symbol}的投资机会`),
          valueInvestingAgent.generate(`分析${symbol}的投资价值`),
          growthInvestingAgent.generate(`分析${symbol}的成长性`),
          trendInvestingAgent.generate(`分析${symbol}的技术走势`)
        ]));
        break;
    }

    // 整合分析结果
    const result = {
      symbol,
      timestamp: new Date().toISOString(),
      analyses: analyses.map(analysis => ({
        type: analysis.agent,
        content: analysis.text,
        confidence: extractConfidence(analysis.text)
      }))
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Stock analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze stock' },
      { status: 500 }
    );
  }
}

// 从分析文本中提取置信度分数
function extractConfidence(text: string): number {
  const confidenceMatch = text.match(/置信度[：:]\s*(\d+)/);
  return confidenceMatch ? parseInt(confidenceMatch[1], 10) : 50;
} 