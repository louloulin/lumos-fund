import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getInvestmentStrategy, saveStrategyPreferences, getStrategyHistory } from '@/actions/strategy';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('strategyRecommendationAPI');

// 验证请求参数的 Schema
const recommendationRequestSchema = z.object({
  ticker: z.string().min(1).max(10),
  riskTolerance: z.enum(['low', 'moderate', 'high']),
  investmentHorizon: z.enum(['short', 'medium', 'long']),
  marketCondition: z.enum(['bull', 'bear', 'neutral', 'volatile']).optional(),
  userId: z.string().optional()
});

const preferencesRequestSchema = z.object({
  userId: z.string().min(1),
  riskTolerance: z.enum(['low', 'moderate', 'high']),
  investmentHorizon: z.enum(['short', 'medium', 'long']),
  marketView: z.enum(['bull', 'bear', 'neutral', 'volatile']).optional(),
  preferredStrategies: z.array(z.string()).optional()
});

/**
 * 获取投资策略推荐
 * POST /api/strategy-recommendation
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const requestData = await request.json();
    
    // 验证请求参数
    const validationResult = recommendationRequestSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      logger.warn('无效的请求参数', { errors: validationResult.error.format() });
      
      return NextResponse.json(
        {
          success: false,
          error: '无效的请求参数',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }
    
    const { ticker, riskTolerance, investmentHorizon, marketCondition, userId } = validationResult.data;
    
    // 调用策略推荐功能
    const result = await getInvestmentStrategy({
      ticker,
      riskTolerance,
      investmentHorizon,
      marketCondition
    });
    
    // 如果指定了用户ID，可以在这里保存查询历史记录
    // 这里略过实现，实际项目中应该保存到数据库
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('处理策略推荐请求失败', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '处理请求失败',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 获取用户策略历史或保存偏好
 * GET /api/strategy-recommendation?userId=xxx&limit=10
 * PUT /api/strategy-recommendation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: userId'
        },
        { status: 400 }
      );
    }
    
    const result = await getStrategyHistory(
      userId,
      limit ? parseInt(limit, 10) : 10
    );
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('获取策略历史失败', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '获取策略历史失败',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 解析请求体
    const requestData = await request.json();
    
    // 验证请求参数
    const validationResult = preferencesRequestSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      logger.warn('无效的请求参数', { errors: validationResult.error.format() });
      
      return NextResponse.json(
        {
          success: false,
          error: '无效的请求参数',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }
    
    const result = await saveStrategyPreferences(validationResult.data);
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('保存策略偏好失败', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '保存策略偏好失败',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 