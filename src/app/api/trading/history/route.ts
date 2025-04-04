import { getTradeHistory } from '@/actions/trading';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 请求验证Schema
const requestSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
  limit: z.number().int().positive().optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  ticker: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    // 从URL获取参数
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const ticker = url.searchParams.get('ticker');
    
    // 准备参数对象
    const params = {
      userId: userId || '',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      ticker: ticker || undefined
    };
    
    // 验证参数
    const validation = requestSchema.safeParse(params);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: '无效的请求参数', 
          details: validation.error.issues 
        }, 
        { status: 400 }
      );
    }
    
    // 调用获取交易历史服务
    const result = await getTradeHistory(validation.data.userId);
    
    // 返回结果
    return NextResponse.json({
      success: true,
      data: result
    }, { status: 200 });
  } catch (error) {
    console.error('获取交易历史API错误:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `服务器内部错误: ${error instanceof Error ? error.message : String(error)}` 
      }, 
      { status: 500 }
    );
  }
} 