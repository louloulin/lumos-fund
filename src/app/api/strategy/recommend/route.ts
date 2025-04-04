import { getInvestmentStrategy } from '@/actions/strategy';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 请求验证Schema
const requestSchema = z.object({
  ticker: z.string().min(1, "股票代码不能为空"),
  riskTolerance: z.enum(['low', 'moderate', 'high']),
  investmentHorizon: z.enum(['short', 'medium', 'long']),
  marketCondition: z.enum(['bull', 'bear', 'neutral', 'volatile']).optional(),
  userId: z.string().optional()
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
    const { ticker, riskTolerance, investmentHorizon, marketCondition, userId } = validation.data;
    
    // 调用策略推荐服务
    const result = await getInvestmentStrategy({
      ticker,
      riskTolerance,
      investmentHorizon,
      marketCondition,
      userId
    });
    
    // 返回结果
    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });
  } catch (error) {
    console.error('策略推荐API错误:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `服务器内部错误: ${error instanceof Error ? error.message : String(error)}` 
      }, 
      { status: 500 }
    );
  }
} 