import { NextRequest, NextResponse } from 'next/server';
import { startTradingAgent } from '@/mastra/agents/agent';
import { analyzeStock } from '@/mastra/agents/analyzeAgent';

/**
 * 处理AI交易代理的API请求
 */
export async function POST(req: NextRequest) {
  try {
    const { action, params = {} } = await req.json();
    
    if (!action) {
      return NextResponse.json(
        { error: "请求中缺少action字段" },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'startAgent':
        // 启动交易代理
        const { initialCash, riskProfile, timeHorizon } = params;
        result = await startTradingAgent(
          initialCash || 100000,
          riskProfile || 'moderate',
          timeHorizon || 'medium'
        );
        break;
        
      case 'analyzeStock':
        // 分析单个股票
        const { ticker, startDate, endDate } = params;
        
        if (!ticker) {
          return NextResponse.json(
            { error: "缺少必要的ticker参数" },
            { status: 400 }
          );
        }
        
        result = await analyzeStock(
          ticker,
          startDate || getDateDaysAgo(180),
          endDate || getTodayDate()
        );
        break;
        
      default:
        return NextResponse.json(
          { error: `不支持的操作: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('处理Mastra AI请求时出错:', error);
    
    return NextResponse.json(
      { error: `服务器错误: ${error?.message || '未知错误'}` },
      { status: 500 }
    );
  }
}

/**
 * 获取今天的日期（YYYY-MM-DD格式）
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 获取n天前的日期（YYYY-MM-DD格式）
 */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
} 