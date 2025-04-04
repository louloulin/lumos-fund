import { executeTrade } from '@/actions/trading';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 请求验证Schema
const requestSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
  ticker: z.string().min(1, "股票代码不能为空"),
  action: z.enum(['buy', 'sell', 'hold']),
  quantity: z.number().positive("数量必须大于0"),
  price: z.number().positive("价格必须大于0").optional(),
  stopLoss: z.number().positive("止损价格必须大于0").optional(),
  takeProfit: z.number().positive("止盈价格必须大于0").optional(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    
    // 验证请求参数
    const validation = requestSchema.safeParse(body);
    
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
    
    // 提取参数
    const { userId, ticker, action, quantity, price, stopLoss, takeProfit, notes } = validation.data;
    
    // 调用交易执行服务
    const result = await executeTrade({
      userId,
      ticker,
      action,
      quantity,
      price,
      stopLoss,
      takeProfit,
      notes
    });
    
    // 返回结果
    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });
  } catch (error) {
    console.error('交易执行API错误:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `服务器内部错误: ${error instanceof Error ? error.message : String(error)}` 
      }, 
      { status: 500 }
    );
  }
} 