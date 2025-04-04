import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getQuantitativeAnalysis } from '@/actions/quantitative';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('quantitative-api');

// 参数验证模式
const requestSchema = z.object({
  ticker: z.string().min(1).max(10),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  investmentHorizon: z.enum(['short', 'medium', 'long']).default('medium'),
  marketCondition: z.enum(['bull', 'bear', 'neutral', 'volatile']).default('neutral'),
  analysisType: z.enum(['factors', 'technical', 'arbitrage', 'full']).default('full'),
  userId: z.string().optional(),
  arbitragePair: z.string().optional(),
});

// 统计套利参数验证
const arbitrageSchema = z.object({
  ticker1: z.string().min(1).max(10),
  ticker2: z.string().min(1).max(10),
  period: z.enum(['1m', '3m', '6m', '1y']).default('6m'),
  thresholdZScore: z.number().min(1).max(3).default(2),
});

/**
 * 量化分析API端点
 * 处理POST请求，根据提供的参数进行量化分析
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    logger.info('接收到量化分析请求', { body });

    // 验证请求参数
    const result = requestSchema.safeParse(body);
    if (!result.success) {
      logger.warn('请求参数验证失败', { errors: result.error.format() });
      return NextResponse.json(
        { 
          success: false, 
          error: '参数验证失败', 
          details: result.error.format() 
        }, 
        { status: 400 }
      );
    }

    const { 
      ticker, 
      riskTolerance, 
      investmentHorizon, 
      marketCondition, 
      analysisType,
      userId,
      arbitragePair
    } = result.data;

    // 针对统计套利的特殊处理
    if (analysisType === 'arbitrage' && arbitragePair) {
      const arbitrageResult = arbitrageSchema.safeParse({
        ticker1: ticker,
        ticker2: arbitragePair,
        period: '6m',
        thresholdZScore: 2
      });

      if (!arbitrageResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: '套利参数验证失败', 
            details: arbitrageResult.error.format() 
          }, 
          { status: 400 }
        );
      }
    }

    // 调用服务端action执行量化分析
    const analysis = await getQuantitativeAnalysis({
      ticker,
      riskTolerance,
      investmentHorizon,
      marketCondition,
      analysisType,
      arbitragePair,
      userId: userId || 'anonymous'
    });

    // 返回分析结果
    return NextResponse.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('量化分析处理失败', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: '量化分析处理失败', 
        message: error instanceof Error ? error.message : '未知错误' 
      }, 
      { status: 500 }
    );
  }
}

/**
 * 获取特定分析历史记录
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';
    const ticker = url.searchParams.get('ticker');
    
    if (!ticker) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: ticker' }, 
        { status: 400 }
      );
    }

    // 模拟获取历史分析记录
    // 在实际应用中，应从数据库查询相关记录
    const historyData = {
      ticker,
      userId,
      history: [
        {
          id: '1',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          analysisType: 'full',
          result: {
            signal: 'buy',
            confidence: 0.75,
            summary: '基于技术和基本面分析的买入信号'
          }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          analysisType: 'technical',
          result: {
            signal: 'neutral',
            confidence: 0.55,
            summary: '技术指标显示中性信号'
          }
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: historyData
    });
  } catch (error) {
    logger.error('获取分析历史失败', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: '获取分析历史失败', 
        message: error instanceof Error ? error.message : '未知错误' 
      }, 
      { status: 500 }
    );
  }
} 