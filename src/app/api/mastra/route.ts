import { NextRequest, NextResponse } from 'next/server';
import { startTradingAgent } from '@/mastra/agents/agent';
import { analyzeStock } from '@/mastra/agents/analyzeAgent';
import { mastra } from '@/mastra';

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
      
      case 'callAgent':
        // 直接调用特定的Mastra代理
        const { agent, prompt, options } = params;
        
        if (!agent || !prompt) {
          return NextResponse.json(
            { error: "缺少必要的agent或prompt参数" },
            { status: 400 }
          );
        }
        
        try {
          const targetAgent = mastra.getAgent(agent);
          if (!targetAgent) {
            return NextResponse.json(
              { error: `找不到指定的代理: ${agent}` },
              { status: 404 }
            );
          }
          
          const agentResult = await targetAgent.generate(prompt, options);
          result = {
            agentName: agent,
            response: agentResult.text,
            raw: agentResult.raw
          };
        } catch (error: any) {
          return NextResponse.json(
            { error: `调用代理${agent}时出错: ${error.message}` },
            { status: 500 }
          );
        }
        break;
        
      case 'runWorkflow':
        // 执行Mastra工作流
        const { workflow, context } = params;
        
        if (!workflow || !context) {
          return NextResponse.json(
            { error: "缺少必要的workflow或context参数" },
            { status: 400 }
          );
        }
        
        try {
          const targetWorkflow = mastra.getWorkflow(workflow);
          if (!targetWorkflow) {
            return NextResponse.json(
              { error: `找不到指定的工作流: ${workflow}` },
              { status: 404 }
            );
          }
          
          result = await targetWorkflow.execute({ context });
        } catch (error: any) {
          return NextResponse.json(
            { error: `执行工作流${workflow}时出错: ${error.message}` },
            { status: 500 }
          );
        }
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