import { expect, test, vi, describe, beforeEach, afterEach } from 'vitest';
import { executeTradeAnalysis } from '../src/mastra/workflows/tradingDecisionWorkflow';

// 模拟mastra执行环境
vi.mock('@mastra/core/workflow', () => {
  return {
    Workflow: vi.fn().mockImplementation(() => {
      return {
        addStep: vi.fn().mockReturnThis(),
        setTriggerSchema: vi.fn().mockReturnThis(),
        execute: vi.fn().mockImplementation(async () => {
          return {
            success: true,
            data: {
              ticker: 'AAPL',
              decision: {
                action: 'buy',
                confidence: 85,
                reasoning: '基于综合分析，AAPL具有强劲的基本面和技术面表现'
              },
              analyses: {
                fundamental: {
                  summary: '苹果公司财务状况稳健，现金流充足',
                  metrics: {
                    'P/E比率': 28.5,
                    '市值': '2.3万亿美元',
                    '收入增长': 0.12
                  },
                  outlook: '长期增长前景良好，服务业务持续扩张'
                },
                technical: {
                  summary: '目前处于上升趋势，突破关键阻力位',
                  indicators: {
                    'RSI': 62,
                    'MACD': 'bullish',
                    '50日移动平均线': '上升'
                  },
                  patterns: ['金叉形态', '突破上升三角形']
                },
                strategy: {
                  summary: '建议分批买入策略，设置止损保护',
                  entryPoints: ['当前价格', '回调至支撑位时'],
                  exitPoints: ['达到目标价', '跌破止损'],
                  stopLoss: 5,
                  takeProfit: 15
                }
              }
            }
          };
        })
      };
    })
  };
});

// 模拟代理执行
vi.mock('../src/mastra/agents/valueInvestingAgent', () => ({
  valueInvestingAgent: { id: 'value-investing' }
}));

vi.mock('../src/mastra/agents/technicalAnalysisAgent', () => ({
  technicalAnalysisAgent: { id: 'technical-analysis' }
}));

vi.mock('../src/mastra/agents/sentimentAnalysisAgent', () => ({
  sentimentAnalysisAgent: { id: 'sentiment-analysis' }
}));

vi.mock('../src/mastra/agents/riskManagementAgent', () => ({
  riskManagementAgent: { id: 'risk-management' }
}));

vi.mock('../src/mastra/agents/strategyRecommendationAgent', () => ({
  strategyRecommendationAgent: { id: 'strategy-recommendation' }
}));

describe('Trading Decision Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  test('should execute trade analysis with all analysis types', async () => {
    const result = await executeTradeAnalysis({
      ticker: 'AAPL',
      analysisTypes: ['fundamental', 'technical', 'sentiment', 'risk', 'strategy'],
      riskTolerance: 'medium',
      investmentHorizon: 'long',
      marketCondition: 'bull',
      portfolioData: {},
      userId: 'test-user'
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.data.ticker).toBe('AAPL');
    expect(result.data.decision).toBeDefined();
    expect(result.data.decision.action).toBe('buy');
    expect(result.data.analyses).toBeDefined();
    expect(result.data.analyses.fundamental).toBeDefined();
    expect(result.data.analyses.technical).toBeDefined();
    expect(result.data.analyses.strategy).toBeDefined();
  });
  
  test('should execute trade analysis with selected analysis types', async () => {
    const result = await executeTradeAnalysis({
      ticker: 'AAPL',
      analysisTypes: ['fundamental', 'technical'],
      riskTolerance: 'low',
      investmentHorizon: 'short',
      marketCondition: 'neutral',
      portfolioData: {},
      userId: 'test-user'
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.data.ticker).toBe('AAPL');
    expect(result.data.decision).toBeDefined();
  });
  
  test('should handle empty analysis types', async () => {
    const result = await executeTradeAnalysis({
      ticker: 'AAPL',
      analysisTypes: [],
      riskTolerance: 'medium',
      investmentHorizon: 'medium',
      marketCondition: 'bear',
      portfolioData: {},
      userId: 'test-user'
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
  
  test('should handle missing ticker', async () => {
    const executePromise = executeTradeAnalysis({
      ticker: '',
      analysisTypes: ['fundamental', 'technical'],
      riskTolerance: 'medium',
      investmentHorizon: 'medium',
      marketCondition: 'neutral',
      portfolioData: {},
      userId: 'test-user'
    });
    
    await expect(executePromise).rejects.toThrow();
  });
}); 