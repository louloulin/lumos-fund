import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getInvestmentStrategy } from '@/actions/strategy';
import { NextRequest, NextResponse } from 'next/server';

// Mock策略Action
jest.mock('@/actions/strategy', () => ({
  getInvestmentStrategy: jest.fn()
}));

describe('策略推荐API测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  async function createMockRequest(body: any) {
    return new NextRequest('http://localhost:3000/api/strategy/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }
  
  it('应该正常处理有效请求参数', async () => {
    // 模拟策略推荐响应
    const mockRecommendation = {
      success: true,
      data: {
        agentResponse: '策略推荐内容...',
        strategyData: {
          ticker: 'AAPL',
          recommendation: {
            primaryStrategy: 'value',
            secondaryStrategy: 'growth'
          }
        }
      }
    };
    
    (getInvestmentStrategy as jest.Mock).mockResolvedValue(mockRecommendation);
    
    // 创建测试请求
    const request = await createMockRequest({
      ticker: 'AAPL',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketCondition: 'neutral'
    });
    
    // 引入要测试的处理函数
    const { POST } = await import('@/app/api/strategy/recommend/route');
    const response = await POST(request);
    
    // 验证结果
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toEqual(mockRecommendation);
    
    // 验证调用参数
    expect(getInvestmentStrategy).toHaveBeenCalledWith({
      ticker: 'AAPL',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium',
      marketCondition: 'neutral'
    });
  });
  
  it('应该处理无效请求参数', async () => {
    // 创建无效请求
    const request = await createMockRequest({
      // 缺少必要参数
      ticker: 'AAPL'
    });
    
    // 引入要测试的处理函数
    const { POST } = await import('@/app/api/strategy/recommend/route');
    const response = await POST(request);
    
    // 验证错误响应
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
  
  it('应该处理服务端错误', async () => {
    // 模拟服务错误
    (getInvestmentStrategy as jest.Mock).mockRejectedValue(new Error('服务器内部错误'));
    
    // 创建测试请求
    const request = await createMockRequest({
      ticker: 'AAPL',
      riskTolerance: 'moderate',
      investmentHorizon: 'medium'
    });
    
    // 引入要测试的处理函数
    const { POST } = await import('@/app/api/strategy/recommend/route');
    const response = await POST(request);
    
    // 验证错误响应
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('服务器内部错误');
  });
}); 