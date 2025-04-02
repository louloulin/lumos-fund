import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tradingDecisionWorkflow } from '@/mastra/workflows/tradingDecisionWorkflow';
import { valueInvestingAgent } from '@/mastra/agents/valueInvestingAgent';
import { technicalAnalysisAgent } from '@/mastra/agents/technicalAnalysisAgent';
import { sentimentAnalysisAgent } from '@/mastra/agents/sentimentAnalysisAgent';
import { portfolioManagementAgent } from '@/mastra/agents/portfolioManagementAgent';

// 模拟代理
vi.mock('@/mastra/agents/valueInvestingAgent', () => ({
  valueInvestingAgent: {
    generate: vi.fn().mockResolvedValue({
      toString: () => '基本面分析: 看涨, 置信度: 80, 原因: 强劲的财务状况和增长前景'
    })
  }
}));

vi.mock('@/mastra/agents/technicalAnalysisAgent', () => ({
  technicalAnalysisAgent: {
    generate: vi.fn().mockResolvedValue({
      toString: () => '技术分析: 看涨, 置信度: 75, 原因: 上升趋势和强劲的成交量'
    })
  }
}));

vi.mock('@/mastra/agents/sentimentAnalysisAgent', () => ({
  sentimentAnalysisAgent: {
    generate: vi.fn().mockResolvedValue({
      toString: () => '情绪分析: 看涨, 置信度: 70, 原因: 积极的新闻报道和分析师评级'
    })
  }
}));

vi.mock('@/mastra/agents/portfolioManagementAgent', () => ({
  portfolioManagementAgent: {
    generate: vi.fn().mockResolvedValue({
      toString: () => '投资组合决策: 买入, 数量: 10, 置信度: 85, 原因: 多个维度的积极信号'
    })
  }
}));

describe('交易决策工作流', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该按顺序执行所有步骤并返回完整结果', async () => {
    // 模拟输入数据
    const context = {
      ticker: 'AAPL',
      portfolio: {
        cash: 10000,
        positions: [
          { ticker: 'MSFT', shares: 10, avgPrice: 300 }
        ]
      }
    };

    // 执行工作流
    const result = await tradingDecisionWorkflow.execute({ context });

    // 验证结果包含所有步骤的输出
    expect(result).toHaveProperty('fundamentalAnalysis');
    expect(result).toHaveProperty('technicalAnalysis');
    expect(result).toHaveProperty('sentimentAnalysis');
    expect(result).toHaveProperty('portfolioDecision');

    // 验证代理都被调用
    expect(valueInvestingAgent.generate).toHaveBeenCalledTimes(1);
    expect(technicalAnalysisAgent.generate).toHaveBeenCalledTimes(1);
    expect(sentimentAnalysisAgent.generate).toHaveBeenCalledTimes(1);
    expect(portfolioManagementAgent.generate).toHaveBeenCalledTimes(1);

    // 验证调用顺序
    const valueInvestingOrder = valueInvestingAgent.generate.mock.invocationCallOrder[0];
    const technicalAnalysisOrder = technicalAnalysisAgent.generate.mock.invocationCallOrder[0];
    const sentimentAnalysisOrder = sentimentAnalysisAgent.generate.mock.invocationCallOrder[0];
    const portfolioManagementOrder = portfolioManagementAgent.generate.mock.invocationCallOrder[0];

    expect(valueInvestingOrder).toBeLessThan(technicalAnalysisOrder);
    expect(technicalAnalysisOrder).toBeLessThan(sentimentAnalysisOrder);
    expect(sentimentAnalysisOrder).toBeLessThan(portfolioManagementOrder);

    // 验证投资组合决策代理收到了前面步骤的结果
    const portfolioCallArg = portfolioManagementAgent.generate.mock.calls[0][0];
    expect(portfolioCallArg).toContain('基本面分析');
    expect(portfolioCallArg).toContain('技术分析');
    expect(portfolioCallArg).toContain('情绪分析');
  });
}); 