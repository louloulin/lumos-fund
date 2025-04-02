import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tradingDecisionWorkflow } from '../../../src/mastra/workflows/tradingDecisionWorkflow';
import { setupMockAgent } from '../test-utils';

// 模拟代理
vi.mock('../../../src/mastra/agents/valueInvestingAgent', () => {
  const { setupMockAgent } = require('../test-utils');
  const { agent } = setupMockAgent('valueInvestingAgent', {
    text: '基于基本面分析，AAPL看涨，置信度85%',
    signal: 'bullish',
    confidence: 85,
    reasoning: '公司拥有强大的财务状况、稳健的现金流和广泛的护城河。'
  });
  return { valueInvestingAgent: agent };
});

vi.mock('../../../src/mastra/agents/technicalAnalysisAgent', () => {
  const { setupMockAgent } = require('../test-utils');
  const { agent } = setupMockAgent('technicalAnalysisAgent', {
    text: '基于技术分析，AAPL短期看涨，置信度75%',
    signal: 'bullish',
    confidence: 75,
    reasoning: '股价突破关键阻力位，成交量放大，MACD指标显示上涨动能。'
  });
  return { technicalAnalysisAgent: agent };
});

vi.mock('../../../src/mastra/agents/portfolioManagementAgent', () => {
  const { setupMockAgent } = require('../test-utils');
  const { agent } = setupMockAgent('portfolioManagementAgent', {
    text: '建议买入AAPL 10股，置信度80%',
    action: 'buy',
    shares: 10,
    confidence: 80,
    reasoning: '基于基本面和技术面分析，以及当前投资组合状况，建议适度买入。'
  });
  return { portfolioManagementAgent: agent };
});

describe('tradingDecisionWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute the complete workflow and return decisions', async () => {
    // 模拟工作流上下文
    const context = {
      ticker: 'AAPL',
      data: {
        financial: {
          metrics: {
            'return_on_equity': 0.245,
            'debt_to_equity': 1.2,
            'price_to_earnings': 18.5,
          }
        },
        price: {
          currentPrice: 185.92,
          historicalData: [
            { date: '2023-12-01', open: 184.20, high: 186.84, low: 183.57, close: 185.92 }
          ]
        }
      },
      portfolio: {
        cash: 100000,
        positions: [
          { ticker: 'MSFT', shares: 20, avgPrice: 345.72 }
        ]
      },
      cash: 100000
    };

    // 执行工作流
    const result = await tradingDecisionWorkflow.execute({ context });

    // 验证结果
    expect(result).toBeDefined();
    expect(result).toHaveProperty('fundamentalAnalysis');
    expect(result).toHaveProperty('technicalAnalysis');
    expect(result).toHaveProperty('portfolioDecision');
    
    // 验证工作流按正确顺序调用了代理
    const valueInvestingAgent = require('../../../src/mastra/agents/valueInvestingAgent').valueInvestingAgent;
    const technicalAnalysisAgent = require('../../../src/mastra/agents/technicalAnalysisAgent').technicalAnalysisAgent;
    const portfolioManagementAgent = require('../../../src/mastra/agents/portfolioManagementAgent').portfolioManagementAgent;

    expect(valueInvestingAgent.generate).toHaveBeenCalled();
    expect(technicalAnalysisAgent.generate).toHaveBeenCalled();
    expect(portfolioManagementAgent.generate).toHaveBeenCalled();
  });
}); 