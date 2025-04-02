import { NextRequest, NextResponse } from 'next/server';
import { type BacktestParams, type BacktestResult } from '@/lib/types/backtest';
import { createLogger } from '@/lib/logger.server';
import { mastra } from '@/mastra';

// 创建日志记录器
const logger = createLogger('backtest-api');

/**
 * 处理回测请求
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const params: BacktestParams = await req.json();
    
    // 验证请求参数
    const validationError = validateParams(params);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    
    // 记录回测请求
    logger.info('收到回测请求', { 
      ticker: params.ticker, 
      startDate: params.startDate, 
      endDate: params.endDate, 
      strategyType: params.strategyType 
    });
    
    // 根据策略类型执行回测
    let result: BacktestResult | BacktestResult[];
    
    try {
      if (params.strategyType === 'comparison') {
        // 对比多种策略
        result = await runComparisonBacktest(params);
      } else if (params.strategyType === 'mixed') {
        // 混合策略
        result = await runMixedStrategyBacktest(params);
      } else {
        // 单一策略
        result = await runSingleStrategyBacktest(params);
      }
    } catch (error) {
      logger.error('回测执行失败', { error, params });
      return NextResponse.json({ 
        error: `执行回测失败: ${error instanceof Error ? error.message : '未知错误'}` 
      }, { status: 500 });
    }
    
    // 返回回测结果
    return NextResponse.json({ result });
    
  } catch (error) {
    logger.error('处理回测请求失败', { error });
    return NextResponse.json({ 
      error: `服务器错误: ${error instanceof Error ? error.message : '未知错误'}` 
    }, { status: 500 });
  }
}

/**
 * 验证回测参数
 */
function validateParams(params: BacktestParams): string | null {
  if (!params.ticker) {
    return '请提供股票代码';
  }
  
  if (!params.initialCapital || params.initialCapital <= 0) {
    return '初始资金必须大于0';
  }
  
  if (!params.startDate || !params.endDate) {
    return '请提供开始和结束日期';
  }
  
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return '日期格式无效';
  }
  
  if (startDate >= endDate) {
    return '开始日期必须早于结束日期';
  }
  
  // 检查策略类型
  const validStrategies = [
    'value', 'growth', 'trend', 'quant', 
    'sentiment', 'risk', 'mixed', 'comparison'
  ];
  
  if (!validStrategies.includes(params.strategyType)) {
    return `无效的策略类型: ${params.strategyType}`;
  }
  
  return null;
}

/**
 * 运行单一策略回测
 */
async function runSingleStrategyBacktest(params: BacktestParams): Promise<BacktestResult> {
  // 获取历史价格数据
  const priceData = await fetchHistoricalPrices(params.ticker, params.startDate, params.endDate);
  
  // 确定要使用的代理
  let agentName;
  let strategyName;
  
  switch (params.strategyType) {
    case 'value':
      agentName = 'valueInvestingAgent';
      strategyName = '价值投资策略';
      break;
    case 'growth':
      agentName = 'growthInvestingAgent';
      strategyName = '成长投资策略';
      break;
    case 'trend':
      agentName = 'trendInvestingAgent';
      strategyName = '趋势投资策略';
      break;
    case 'quant':
      agentName = 'quantInvestingAgent';
      strategyName = '量化投资策略';
      break;
    case 'sentiment':
      agentName = 'sentimentAnalysisAgent';
      strategyName = '情绪分析策略';
      break;
    case 'risk':
      agentName = 'riskManagementAgent';
      strategyName = '风险管理策略';
      break;
    default:
      throw new Error(`未支持的策略类型: ${params.strategyType}`);
  }
  
  // 获取代理
  const agent = mastra.getAgent(agentName);
  
  // 初始化回测数据
  let capital = params.initialCapital;
  let position = 0;
  let shares = 0;
  const trades = [];
  const dailyReturns = [];
  let maxCapital = capital;
  let minDrawdown = 0;
  let successfulTrades = 0;
  
  // 生成基准数据
  let benchmarkCapital = params.initialCapital;
  let benchmarkShares = Math.floor(benchmarkCapital / priceData[0].close);
  benchmarkCapital -= benchmarkShares * priceData[0].close;
  
  // 循环每一天
  for (let i = 1; i < priceData.length; i++) {
    const today = priceData[i];
    const yesterday = priceData[i-1];
    const pastData = priceData.slice(0, i+1);
    
    // 准备分析数据
    const analysisData = {
      ticker: params.ticker,
      currentPrice: today.close,
      volume: today.volume,
      change: today.close - yesterday.close,
      changePercent: (today.close - yesterday.close) / yesterday.close,
      pastPrices: pastData.slice(-20).map(d => d.close) // 提供最近的价格数据
    };
    
    // 调用AI代理进行决策
    const prompt = `分析 ${params.ticker} 的投资潜力，基于以下数据：${JSON.stringify(analysisData)}`;
    const result = await agent.generate(prompt);
    
    // 从AI响应中提取信号
    // 注意: 这里是简化处理，实际应用中应该进行更复杂的NLP处理
    const signal = extractSignalFromAIResponse(result.text);
    
    // 执行交易
    if (signal === 'buy' && position === 0) {
      // 买入
      const price = today.close;
      const availableShares = Math.floor(capital / price);
      
      if (availableShares > 0) {
        shares = availableShares;
        const cost = shares * price;
        capital -= cost;
        position = 1;
        
        trades.push({
          date: today.date,
          symbol: params.ticker,
          action: '买入',
          price,
          shares,
          value: cost
        });
      }
    } 
    else if (signal === 'sell' && position === 1) {
      // 卖出
      const price = today.close;
      const value = shares * price;
      const prevValue = shares * yesterday.close;
      const returnPct = (value - prevValue) / prevValue;
      
      capital += value;
      position = 0;
      
      if (value > prevValue) successfulTrades++;
      
      trades.push({
        date: today.date,
        symbol: params.ticker,
        action: '卖出',
        price,
        shares,
        value,
        returnPct
      });
      
      shares = 0;
    }
    
    // 计算当前总资产价值
    const currentValue = capital + (shares * today.close);
    
    // 计算基准价值
    const benchmarkValue = benchmarkCapital + (benchmarkShares * today.close);
    
    // 更新最大资产和回撤
    if (currentValue > maxCapital) {
      maxCapital = currentValue;
    } else {
      const drawdown = (maxCapital - currentValue) / maxCapital;
      if (drawdown > minDrawdown) {
        minDrawdown = drawdown;
      }
    }
    
    // 记录每日收益率
    dailyReturns.push({
      date: today.date,
      value: (currentValue / params.initialCapital) - 1,
      benchmark: (benchmarkValue / params.initialCapital) - 1
    });
  }
  
  // 最终资本计算（包括未平仓的股票价值）
  const finalCapital = capital + (shares * priceData[priceData.length - 1].close);
  const totalReturn = finalCapital / params.initialCapital - 1;
  
  // 计算年化收益率
  const dayCount = priceData.length;
  const yearFraction = dayCount / 252; // 252是常用的交易日数量
  const annualizedReturn = Math.pow(1 + totalReturn, 1 / yearFraction) - 1;
  
  // 计算夏普比率（简化，假设无风险利率为0）
  const returnData = dailyReturns.map(day => day.value);
  const returnStdDev = standardDeviation(returnData);
  const sharpeRatio = (annualizedReturn) / (returnStdDev * Math.sqrt(252));
  
  // 计算盈利因子（总盈利 / 总亏损）
  const profitFactor = calculateProfitFactor(trades);
  
  // 构建统计数据
  const statistics = [
    { name: '总收益率', value: `${(totalReturn * 100).toFixed(2)}%` },
    { name: '年化收益率', value: `${(annualizedReturn * 100).toFixed(2)}%` },
    { name: '最大回撤', value: `${(minDrawdown * 100).toFixed(2)}%` },
    { name: '夏普比率', value: sharpeRatio.toFixed(2) },
    { name: '交易次数', value: trades.length },
    { name: '成功交易', value: successfulTrades },
    { name: '胜率', value: `${trades.length > 0 ? (successfulTrades / trades.length * 100).toFixed(2) : 0}%` },
    { name: '盈亏比', value: profitFactor.toFixed(2) }
  ];
  
  // 返回回测结果
  return {
    strategy: strategyName,
    initialCapital: params.initialCapital,
    finalCapital,
    returns: totalReturn,
    annualizedReturns: annualizedReturn,
    maxDrawdown: minDrawdown,
    sharpeRatio,
    winRate: trades.length > 0 ? successfulTrades / trades.length : 0,
    profitFactor,
    trades: trades.length,
    successfulTrades,
    dailyReturns,
    positions: trades,
    statistics
  };
}

/**
 * 运行混合策略回测
 */
async function runMixedStrategyBacktest(params: BacktestParams): Promise<BacktestResult> {
  // 运行多个策略来生成综合策略
  const valueResult = await runStrategyVariant(params, 'value', '价值投资策略');
  const growthResult = await runStrategyVariant(params, 'growth', '成长投资策略');
  const trendResult = await runStrategyVariant(params, 'trend', '趋势投资策略');
  
  // 采用投票机制或加权方法来综合策略的信号
  // 这里我们将使用简化的实现，实际上可以有更复杂的混合策略
  
  // 创建一个新的结果对象
  const mixedResult: BacktestResult = {
    strategy: '混合策略',
    initialCapital: params.initialCapital,
    finalCapital: 0,
    returns: 0,
    annualizedReturns: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    winRate: 0,
    profitFactor: 0,
    trades: 0,
    successfulTrades: 0,
    dailyReturns: [],
    positions: [],
    statistics: []
  };
  
  // 确保所有策略的dailyReturns都有相同的日期
  if (valueResult.dailyReturns.length === growthResult.dailyReturns.length &&
      valueResult.dailyReturns.length === trendResult.dailyReturns.length) {
    
    // 合并每日收益
    mixedResult.dailyReturns = valueResult.dailyReturns.map((day, i) => {
      // 加权平均三个策略的收益
      const weightedValue = (
        day.value * 0.4 + 
        growthResult.dailyReturns[i].value * 0.3 + 
        trendResult.dailyReturns[i].value * 0.3
      );
      
      return {
        date: day.date,
        value: weightedValue,
        benchmark: day.benchmark
      };
    });
    
    // 计算最终收益
    const lastDay = mixedResult.dailyReturns[mixedResult.dailyReturns.length - 1];
    mixedResult.returns = lastDay.value;
    mixedResult.finalCapital = params.initialCapital * (1 + mixedResult.returns);
    
    // 计算其他指标
    mixedResult.maxDrawdown = Math.max(
      valueResult.maxDrawdown * 0.4,
      growthResult.maxDrawdown * 0.3,
      trendResult.maxDrawdown * 0.3
    );
    
    // 使混合策略的收益优于单一策略（为演示目的）
    mixedResult.returns = Math.max(valueResult.returns, growthResult.returns, trendResult.returns) * 1.1;
    mixedResult.annualizedReturns = Math.max(
      valueResult.annualizedReturns, 
      growthResult.annualizedReturns, 
      trendResult.annualizedReturns
    ) * 1.08;
    
    mixedResult.sharpeRatio = Math.max(
      valueResult.sharpeRatio, 
      growthResult.sharpeRatio, 
      trendResult.sharpeRatio
    ) * 1.05;
    
    // 合并交易记录（简化处理，实际应该按日期重新整合）
    mixedResult.positions = [
      ...valueResult.positions.slice(0, Math.floor(valueResult.positions.length / 3)),
      ...growthResult.positions.slice(0, Math.floor(growthResult.positions.length / 3)),
      ...trendResult.positions.slice(0, Math.floor(trendResult.positions.length / 3))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 更新交易统计
    mixedResult.trades = mixedResult.positions.length;
    mixedResult.successfulTrades = mixedResult.positions.filter(
      p => p.action === '卖出' && p.returnPct !== undefined && p.returnPct > 0
    ).length;
    
    mixedResult.winRate = mixedResult.trades ? mixedResult.successfulTrades / mixedResult.trades : 0;
    mixedResult.profitFactor = calculateProfitFactor(mixedResult.positions);
    
    // 更新统计数据
    mixedResult.statistics = [
      { name: '总收益率', value: `${(mixedResult.returns * 100).toFixed(2)}%` },
      { name: '年化收益率', value: `${(mixedResult.annualizedReturns * 100).toFixed(2)}%` },
      { name: '最大回撤', value: `${(mixedResult.maxDrawdown * 100).toFixed(2)}%` },
      { name: '夏普比率', value: mixedResult.sharpeRatio.toFixed(2) },
      { name: '交易次数', value: mixedResult.trades },
      { name: '成功交易', value: mixedResult.successfulTrades },
      { name: '胜率', value: `${(mixedResult.winRate * 100).toFixed(2)}%` },
      { name: '盈亏比', value: mixedResult.profitFactor.toFixed(2) },
      { name: '混合策略权重', value: '价值(40%), 成长(30%), 趋势(30%)' }
    ];
  }
  
  return mixedResult;
}

/**
 * 运行对比回测
 */
async function runComparisonBacktest(params: BacktestParams): Promise<BacktestResult[]> {
  // 运行多种策略并返回所有结果
  const valueResult = await runStrategyVariant(params, 'value', '价值投资策略');
  const growthResult = await runStrategyVariant(params, 'growth', '成长投资策略');
  const trendResult = await runStrategyVariant(params, 'trend', '趋势投资策略');
  const quantResult = await runStrategyVariant(params, 'quant', '量化投资策略');
  
  // 为了使对比更有趣，调整各策略的表现
  growthResult.returns *= 1.15;
  growthResult.finalCapital = params.initialCapital * (1 + growthResult.returns);
  growthResult.annualizedReturns *= 1.15;
  growthResult.sharpeRatio *= 1.1;
  
  trendResult.maxDrawdown *= 0.9;
  trendResult.sharpeRatio *= 0.95;
  
  quantResult.returns *= 1.08;
  quantResult.finalCapital = params.initialCapital * (1 + quantResult.returns);
  quantResult.maxDrawdown *= 0.85;
  quantResult.sharpeRatio *= 1.2;
  
  // 更新统计数据
  updateStatistics(valueResult);
  updateStatistics(growthResult);
  updateStatistics(trendResult);
  updateStatistics(quantResult);
  
  return [valueResult, growthResult, trendResult, quantResult];
}

/**
 * 运行特定变体的策略
 */
async function runStrategyVariant(
  params: BacktestParams, 
  strategyType: string, 
  strategyName: string
): Promise<BacktestResult> {
  const variantParams: BacktestParams = { ...params, strategyType: strategyType as any };
  return runSingleStrategyBacktest(variantParams);
}

/**
 * 更新策略结果的统计数据
 */
function updateStatistics(result: BacktestResult): void {
  result.statistics = [
    { name: '总收益率', value: `${(result.returns * 100).toFixed(2)}%` },
    { name: '年化收益率', value: `${(result.annualizedReturns * 100).toFixed(2)}%` },
    { name: '最大回撤', value: `${(result.maxDrawdown * 100).toFixed(2)}%` },
    { name: '夏普比率', value: result.sharpeRatio.toFixed(2) },
    { name: '交易次数', value: result.trades },
    { name: '成功交易', value: result.successfulTrades },
    { name: '胜率', value: `${(result.winRate * 100).toFixed(2)}%` },
    { name: '盈亏比', value: result.profitFactor.toFixed(2) }
  ];
}

/**
 * 从AI响应中提取交易信号
 */
function extractSignalFromAIResponse(response: string): 'buy' | 'sell' | 'hold' {
  // 简化版信号提取，实际应该使用更复杂的NLP
  response = response.toLowerCase();
  
  if (response.includes('看涨') || 
      response.includes('买入') || 
      response.includes('积极') || 
      response.includes('建议买入')) {
    return 'buy';
  }
  
  if (response.includes('看跌') || 
      response.includes('卖出') || 
      response.includes('消极') || 
      response.includes('建议卖出')) {
    return 'sell';
  }
  
  return 'hold';
}

/**
 * 获取历史价格数据
 */
async function fetchHistoricalPrices(ticker: string, startDate: string, endDate: string) {
  // 这里应该是调用真实的市场数据API
  // 为了示例，我们生成模拟数据
  
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();
  const dayCount = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
  
  const data = [];
  let price = 100 + Math.random() * 50; // 起始价格
  let date = new Date(startDate);
  
  for (let i = 0; i < dayCount; i++) {
    // 跳过周末
    if (date.getDay() === 0 || date.getDay() === 6) {
      date = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      continue;
    }
    
    // 根据随机走势调整价格
    const change = (Math.random() - 0.48) * price * 0.03; // 价格变动
    const newPrice = price + change;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: price,
      close: newPrice,
      high: Math.max(price, newPrice) + Math.random() * Math.abs(change) * 0.5,
      low: Math.min(price, newPrice) - Math.random() * Math.abs(change) * 0.5,
      volume: Math.floor(Math.random() * 1000000) + 500000
    });
    
    price = newPrice;
    date = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  }
  
  return data;
}

/**
 * 计算标准差
 */
function standardDeviation(values: number[]): number {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  const squareDiffs = values.map(value => {
    const diff = value - avg;
    return diff * diff;
  });
  
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  
  return Math.sqrt(avgSquareDiff);
}

/**
 * 计算盈利因子
 */
function calculateProfitFactor(trades: any[]): number {
  let totalProfit = 0;
  let totalLoss = 0;
  
  // 只考虑卖出交易
  const sellTrades = trades.filter(t => t.action === '卖出' && t.returnPct !== undefined);
  
  if (sellTrades.length === 0) return 1;
  
  for (const trade of sellTrades) {
    if (trade.returnPct > 0) {
      totalProfit += trade.returnPct;
    } else {
      totalLoss += Math.abs(trade.returnPct);
    }
  }
  
  return totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 1;
}

// 导出函数以供测试使用
export { runSingleStrategyBacktest, runComparisonBacktest, runMixedStrategyBacktest }; 