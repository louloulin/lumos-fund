import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';
import { analyzeStock } from '@/mastra/workflows/stockAnalysisWorkflow';

const logger = createLogger('api:analyze');

// 请求体验证
const requestSchema = z.object({
  ticker: z.string().min(1).max(10),
  currentPosition: z.object({
    shares: z.number().optional(),
    value: z.number().optional(),
    costBasis: z.number().optional()
  }).optional()
});

/**
 * 股票分析API
 * 
 * 接收股票代码，执行全面分析并返回分析结果
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const body = await req.json();
    
    // 验证请求
    const result = requestSchema.safeParse(body);
    if (!result.success) {
      logger.warn('请求验证失败', { errors: result.error.format() });
      return NextResponse.json({ 
        success: false, 
        message: '无效的请求参数',
        errors: result.error.format()
      }, { status: 400 });
    }
    
    const { ticker, currentPosition } = result.data;
    logger.info('收到股票分析请求', { ticker });
    
    // 执行分析
    const analysis = await analyzeStock(ticker, { currentPosition });
    
    // 返回结果
    if (analysis.success) {
      return NextResponse.json({
        success: true,
        data: analysis
      });
    } else {
      logger.error('分析过程发生错误', { ticker, error: analysis.error });
      return NextResponse.json({
        success: false,
        message: analysis.message || '分析过程发生错误',
        error: analysis.error
      }, { status: 500 });
    }
  } catch (error: any) {
    logger.error('处理分析请求时发生异常', error);
    return NextResponse.json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * 支持的HTTP方法
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS'
    }
  });
} 