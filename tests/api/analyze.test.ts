import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../src/app/api/analyze/route';
import { createMockRequest, mockWorkflowExecution } from './test-utils';

// 模拟工作流
vi.mock('../../src/mastra/workflows/tradingDecisionWorkflow', () => {
  const { mockWorkflowExecution } = require('./test-utils');
  return {
    tradingDecisionWorkflow: mockWorkflowExecution({
      fundamentalAnalysis: {
        signal: 'bullish',
        confidence: 85,
        reasoning: '基本面强劲',
      },
      technicalAnalysis: {
        signal: 'bullish',
        confidence: 75,
        reasoning: '技术指标看涨',
      },
      portfolioDecision: {
        action: 'buy',
        shares: 10,
        confidence: 80,
        reasoning: '建议适度买入',
        signal: 'bullish',
      }
    })
  };
});

describe('analyze API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return analysis results for valid ticker', async () => {
    // 创建模拟请求
    const request = createMockRequest('POST', {
      ticker: 'AAPL',
      portfolio: {
        cash: 100000,
        positions: [
          { ticker: 'MSFT', shares: 20, avgPrice: 345.72 }
        ]
      }
    });

    // 调用API路由处理函数
    const response = await POST(request);
    const data = await response.json();

    // 验证响应
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('fundamentalAnalysis');
    expect(data).toHaveProperty('technicalAnalysis');
    expect(data).toHaveProperty('portfolioDecision');
    
    // 验证工作流被正确调用
    const { tradingDecisionWorkflow } = require('../../src/mastra/workflows/tradingDecisionWorkflow');
    expect(tradingDecisionWorkflow.execute).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully', async () => {
    // 模拟工作流执行失败
    const { tradingDecisionWorkflow } = require('../../src/mastra/workflows/tradingDecisionWorkflow');
    tradingDecisionWorkflow.execute.mockRejectedValueOnce(new Error('模拟错误'));

    // 创建模拟请求
    const request = createMockRequest('POST', { ticker: 'INVALID' });

    // 调用API路由处理函数
    const response = await POST(request);
    const data = await response.json();

    // 验证错误响应
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
  });
}); 