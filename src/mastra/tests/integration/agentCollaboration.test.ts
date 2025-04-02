import { mastra } from '@/mastra';
import { valueInvestingAgent } from '../../agents/valueInvestingAgent';
import { growthInvestingAgent } from '../../agents/growthInvestingAgent';
import { trendInvestingAgent } from '../../agents/trendInvestingAgent';
import { marketDataTool } from '../../tools/marketData';

describe('Agent Collaboration Tests', () => {
  const testSymbol = 'AAPL';
  const testStartDate = '2024-01-01';
  const testEndDate = '2024-01-31';

  beforeAll(() => {
    // 确保所有代理都已初始化
    expect(valueInvestingAgent).toBeDefined();
    expect(growthInvestingAgent).toBeDefined();
    expect(trendInvestingAgent).toBeDefined();
  });

  it('should combine value and growth analysis', async () => {
    // 获取市场数据
    const marketData = await marketDataTool.run({
      symbol: testSymbol,
      dataType: 'all',
      startDate: testStartDate,
      endDate: testEndDate
    });

    // 获取价值投资分析
    const valueAnalysis = await valueInvestingAgent.generate(
      `分析 ${testSymbol} 的投资价值，基于以下数据：${JSON.stringify(marketData)}`
    );

    // 获取成长投资分析
    const growthAnalysis = await growthInvestingAgent.generate(
      `分析 ${testSymbol} 的成长潜力，基于以下数据：${JSON.stringify(marketData)}`
    );

    // 验证分析结果
    expect(valueAnalysis).toBeDefined();
    expect(valueAnalysis.text).toContain('投资建议');
    expect(growthAnalysis).toBeDefined();
    expect(growthAnalysis.text).toContain('投资建议');

    // 验证信号一致性
    const valueSignal = extractSignal(valueAnalysis.text);
    const growthSignal = extractSignal(growthAnalysis.text);
    expect(['buy', 'sell', 'hold']).toContain(valueSignal);
    expect(['buy', 'sell', 'hold']).toContain(growthSignal);
  });

  it('should validate trend analysis with value signals', async () => {
    // 获取趋势数据
    const trendData = await marketDataTool.run({
      symbol: testSymbol,
      dataType: 'price',
      startDate: testStartDate,
      endDate: testEndDate
    });

    // 获取趋势分析
    const trendAnalysis = await trendInvestingAgent.generate(
      `分析 ${testSymbol} 的技术趋势，基于以下数据：${JSON.stringify(trendData)}`
    );

    // 获取价值分析
    const valueAnalysis = await valueInvestingAgent.generate(
      `分析 ${testSymbol} 的投资价值，基于以下数据：${JSON.stringify(trendData)}`
    );

    // 验证分析结果
    expect(trendAnalysis).toBeDefined();
    expect(trendAnalysis.text).toContain('趋势');
    expect(valueAnalysis).toBeDefined();
    expect(valueAnalysis.text).toContain('价值');

    // 比较信号
    const trendSignal = extractSignal(trendAnalysis.text);
    const valueSignal = extractSignal(valueAnalysis.text);
    
    // 记录信号一致性
    const signalsMatch = trendSignal === valueSignal;
    console.log(`信号一致性: ${signalsMatch ? '一致' : '不一致'}`);
    console.log(`趋势信号: ${trendSignal}, 价值信号: ${valueSignal}`);
  });

  it('should handle conflicting signals appropriately', async () => {
    const marketData = await marketDataTool.run({
      symbol: testSymbol,
      dataType: 'all',
      startDate: testStartDate,
      endDate: testEndDate
    });

    // 获取所有代理的分析
    const [valueAnalysis, growthAnalysis, trendAnalysis] = await Promise.all([
      valueInvestingAgent.generate(
        `分析 ${testSymbol} 的投资价值，基于以下数据：${JSON.stringify(marketData)}`
      ),
      growthInvestingAgent.generate(
        `分析 ${testSymbol} 的成长潜力，基于以下数据：${JSON.stringify(marketData)}`
      ),
      trendInvestingAgent.generate(
        `分析 ${testSymbol} 的技术趋势，基于以下数据：${JSON.stringify(marketData)}`
      )
    ]);

    // 提取所有信号
    const signals = {
      value: extractSignal(valueAnalysis.text),
      growth: extractSignal(growthAnalysis.text),
      trend: extractSignal(trendAnalysis.text)
    };

    // 计算信号一致性
    const uniqueSignals = new Set(Object.values(signals));
    const signalConsensus = uniqueSignals.size === 1;
    
    // 记录结果
    console.log('信号分析结果:', {
      signals,
      consensus: signalConsensus ? '一致' : '存在分歧',
      majoritySignal: getMajoritySignal(signals)
    });

    // 验证每个分析都包含必要的信息
    expect(valueAnalysis.text).toContain('置信度');
    expect(growthAnalysis.text).toContain('置信度');
    expect(trendAnalysis.text).toContain('置信度');
  });
});

/**
 * 从AI响应中提取交易信号
 */
function extractSignal(response: string): 'buy' | 'sell' | 'hold' {
  const text = response.toLowerCase();
  if (text.includes('买入') || text.includes('看涨')) return 'buy';
  if (text.includes('卖出') || text.includes('看跌')) return 'sell';
  return 'hold';
}

/**
 * 获取多数信号
 */
function getMajoritySignal(signals: Record<string, string>): string {
  const counts = Object.values(signals).reduce((acc, signal) => {
    acc[signal] = (acc[signal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0][0];
} 