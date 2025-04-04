import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('statisticalArbitrageTool');

// 定义接口类型
interface PriceData {
  ticker: string;
  dates: string[];
  prices: number[];
  period: string;
}

interface Correlation {
  coefficient: number;
  strength: string;
  interpretation: string;
}

interface Cointegration {
  isCointegrated: boolean;
  confidence: number;
  coefficientOfVariation: number;
  interpretation: string;
}

interface SpreadData {
  date: string;
  spread: number;
  zScore: number;
}

interface SpreadAnalysis {
  spreadData: SpreadData[];
  zScore: number;
  spreadMean: number;
  spreadStd: number;
}

interface TradingSignal {
  signalType: string;
  actions: {
    ticker1: string;
    ticker2: string;
  };
  zScore: number;
  confidence: number;
  interpretation: string;
}

interface BacktestResults {
  tradeCount: number;
  winRate: number;
  averageReturn: number;
  totalReturn: number;
  sharpeRatio: number;
  interpretation: string;
}

interface ArbitrageOpportunity {
  opportunity: string;
  confidence: number;
  summary: string;
  recommendation: string;
}

interface ArbitrageData {
  ticker1: string;
  ticker2: string;
  correlation: Correlation;
  cointegration: Cointegration;
  zScore: number;
  signal: TradingSignal;
  backtest: BacktestResults;
}

/**
 * 统计套利工具
 * 
 * 提供统计套利分析功能，包括：
 * - 配对交易机会分析
 * - 相关性和协整性测试
 * - 价格差异统计分析
 * - Z-score计算和套利信号生成
 */
export const statisticalArbitrageTool = createTool({
  name: 'statisticalArbitrageTool',
  description: '分析股票对的统计关系，发现潜在的套利机会，提供交易信号',
  schema: z.object({
    ticker1: z.string().describe('第一支股票代码'),
    ticker2: z.string().describe('第二支股票代码'),
    period: z.enum(['1m', '3m', '6m', '1y']).default('6m').describe('分析周期'),
    lookbackDays: z.number().int().min(20).max(500).default(180).describe('回溯天数'),
    thresholdZScore: z.number().min(1).max(3).default(2).describe('Z-score阈值，用于生成交易信号')
  }),
  execute: async ({ ticker1, ticker2, period, lookbackDays, thresholdZScore }: { 
    ticker1: string; 
    ticker2: string; 
    period: string; 
    lookbackDays: number; 
    thresholdZScore: number 
  }) => {
    try {
      logger.info('执行统计套利分析', { ticker1, ticker2, period, lookbackDays });
      
      // 模拟获取历史价格数据
      const priceData1 = await fetchHistoricalPrices(ticker1, period);
      const priceData2 = await fetchHistoricalPrices(ticker2, period);
      
      // 计算相关性
      const correlation = calculateCorrelation(priceData1, priceData2);
      
      // 计算协整性
      const cointegration = calculateCointegration(priceData1, priceData2);
      
      // 计算价差和Z-score
      const { spreadData, zScore, spreadMean, spreadStd } = calculateSpread(priceData1, priceData2);
      
      // 生成交易信号
      const signal = generateTradingSignal(zScore, thresholdZScore);
      
      // 计算回测结果
      const backtest = calculateBacktestResults(spreadData, thresholdZScore);
      
      // 提供综合分析
      const analysis = analyzeArbitrageOpportunity({
        ticker1,
        ticker2,
        correlation,
        cointegration,
        zScore,
        signal,
        backtest
      });
      
      return {
        ticker1,
        ticker2,
        timestamp: new Date().toISOString(),
        statistics: {
          correlation,
          cointegration,
          spreadMean,
          spreadStd,
          currentZScore: zScore
        },
        signal,
        backtest,
        analysis
      };
    } catch (error) {
      logger.error('统计套利分析失败', { ticker1, ticker2, error });
      throw new Error(`统计套利分析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

/**
 * 模拟获取历史价格数据
 */
async function fetchHistoricalPrices(ticker: string, period: string): Promise<PriceData> {
  // 生成模拟价格数据 - 在实际应用中应替换为真实API调用
  // 这里生成的数据会具有一定的随机性，但也保持一定的趋势性
  const days = period === '1m' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : 365;
  const prices: number[] = [];
  
  let price = 100 + Math.random() * 100; // 随机起始价格
  const volatility = 0.01 + Math.random() * 0.02; // 随机波动率
  const trend = (Math.random() - 0.5) * 0.001; // 随机趋势
  
  for (let i = 0; i < days; i++) {
    price = price * (1 + trend + volatility * (Math.random() - 0.5));
    prices.push(price);
  }
  
  return {
    ticker,
    dates: Array.from({ length: days }, (_, i: number) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      return date.toISOString().split('T')[0];
    }),
    prices,
    period
  };
}

/**
 * 计算两个价格序列之间的相关性
 */
function calculateCorrelation(priceData1: PriceData, priceData2: PriceData): Correlation {
  const prices1 = priceData1.prices;
  const prices2 = priceData2.prices;
  const n = Math.min(prices1.length, prices2.length);
  
  // 计算收益率（简单的日收益率）
  const returns1: number[] = [];
  const returns2: number[] = [];
  
  for (let i = 1; i < n; i++) {
    returns1.push(prices1[i] / prices1[i-1] - 1);
    returns2.push(prices2[i] / prices2[i-1] - 1);
  }
  
  // 计算相关系数
  const mean1 = returns1.reduce((a, b) => a + b, 0) / returns1.length;
  const mean2 = returns2.reduce((a, b) => a + b, 0) / returns2.length;
  
  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;
  
  for (let i = 0; i < returns1.length; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }
  
  const correlationCoefficient = numerator / Math.sqrt(denominator1 * denominator2);
  
  const correlationStrength = 
    Math.abs(correlationCoefficient) > 0.7 ? 'strong' :
    Math.abs(correlationCoefficient) > 0.5 ? 'moderate' :
    Math.abs(correlationCoefficient) > 0.3 ? 'weak' : 'negligible';
  
  return {
    coefficient: correlationCoefficient,
    strength: correlationStrength,
    interpretation: correlationCoefficient > 0 
      ? `正相关(${correlationStrength})，两支股票倾向于一起上涨或下跌`
      : `负相关(${correlationStrength})，一支股票上涨时，另一支倾向于下跌`
  };
}

/**
 * 计算协整性（简化版）
 * 注意：在实际应用中，应使用正规的协整性测试方法，如ADF测试或约翰森测试
 */
function calculateCointegration(priceData1: PriceData, priceData2: PriceData): Cointegration {
  const prices1 = priceData1.prices;
  const prices2 = priceData2.prices;
  const n = Math.min(prices1.length, prices2.length);
  
  // 简化的协整测试：检查价格比率的稳定性
  const priceRatios: number[] = [];
  
  for (let i = 0; i < n; i++) {
    priceRatios.push(prices1[i] / prices2[i]);
  }
  
  // 计算比率的均值和标准差
  const mean = priceRatios.reduce((a, b) => a + b, 0) / n;
  const variance = priceRatios.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  // 计算变异系数（标准差/均值），用作稳定性指标
  const coefficientOfVariation = stdDev / mean;
  
  // 根据变异系数判断协整性
  // 注意：这是简化的方法，真实应用中应使用统计检验
  let isCointegrated = false;
  let confidence = 0;
  
  if (coefficientOfVariation < 0.05) {
    isCointegrated = true;
    confidence = 90;
  } else if (coefficientOfVariation < 0.1) {
    isCointegrated = true;
    confidence = 70;
  } else if (coefficientOfVariation < 0.15) {
    isCointegrated = true;
    confidence = 50;
  }
  
  return {
    isCointegrated,
    confidence,
    coefficientOfVariation,
    interpretation: isCointegrated
      ? `两支股票可能具有协整关系，置信度${confidence}%`
      : `两支股票可能不具有显著的协整关系，不适合进行配对交易`
  };
}

/**
 * 计算价差和Z-score
 */
function calculateSpread(priceData1: PriceData, priceData2: PriceData): SpreadAnalysis {
  const prices1 = priceData1.prices;
  const prices2 = priceData2.prices;
  const n = Math.min(prices1.length, prices2.length);
  const dates = priceData1.dates.slice(0, n);
  
  // 简化的价差计算：这里使用简单的价格比率
  // 真实应用中，应基于回归模型或其他统计模型计算更精确的价差
  const spreads: number[] = [];
  
  for (let i = 0; i < n; i++) {
    spreads.push(prices1[i] / prices2[i]);
  }
  
  // 计算均值和标准差
  const spreadMean = spreads.reduce((a, b) => a + b, 0) / n;
  const spreadVariance = spreads.reduce((a, b) => a + Math.pow(b - spreadMean, 2), 0) / n;
  const spreadStd = Math.sqrt(spreadVariance);
  
  // 计算当前Z-score
  const currentSpread = spreads[spreads.length - 1];
  const zScore = (currentSpread - spreadMean) / spreadStd;
  
  // 组装价差数据
  const spreadData = dates.map((date, i) => ({
    date,
    spread: spreads[i],
    zScore: (spreads[i] - spreadMean) / spreadStd
  }));
  
  return {
    spreadData,
    zScore,
    spreadMean,
    spreadStd
  };
}

/**
 * 生成交易信号
 */
function generateTradingSignal(zScore: number, threshold: number): TradingSignal {
  let signalType = 'neutral';
  let action1 = 'hold';
  let action2 = 'hold';
  
  if (zScore > threshold) {
    signalType = 'divergence';
    action1 = 'sell';
    action2 = 'buy';
  } else if (zScore < -threshold) {
    signalType = 'divergence';
    action1 = 'buy';
    action2 = 'sell';
  } else if (Math.abs(zScore) < 0.5) {
    signalType = 'convergence';
    action1 = 'hold';
    action2 = 'hold';
  }
  
  const confidence = Math.min(95, Math.round(50 + Math.abs(zScore) * 15));
  
  return {
    signalType,
    actions: {
      ticker1: action1,
      ticker2: action2
    },
    zScore,
    confidence,
    interpretation: signalType === 'divergence'
      ? `价差已偏离均值${Math.abs(zScore).toFixed(2)}个标准差，可能存在套利机会，置信度${confidence}%`
      : signalType === 'convergence'
        ? `价差接近均值，套利机会有限`
        : `价差处于正常波动范围内，无明显信号`
  };
}

/**
 * 计算回测结果
 */
function calculateBacktestResults(spreadData: SpreadData[], threshold: number): BacktestResults {
  // 统计过去的交易信号和潜在收益
  let trades = 0;
  let winningTrades = 0;
  let totalReturn = 0;
  
  for (let i = 30; i < spreadData.length - 10; i++) {
    // 检测开仓信号
    if (Math.abs(spreadData[i].zScore) > threshold) {
      // 确定方向
      const direction = spreadData[i].zScore > 0 ? -1 : 1; // 正zScore做空价差，负zScore做多价差
      
      // 寻找平仓点
      let exitIndex = -1;
      for (let j = i + 1; j < spreadData.length; j++) {
        if (direction * spreadData[j].zScore <= 0) { // 穿越均值
          exitIndex = j;
          break;
        }
      }
      
      // 如果找到平仓点
      if (exitIndex !== -1) {
        trades++;
        
        // 计算收益（简化计算）
        const entrySpread = spreadData[i].spread;
        const exitSpread = spreadData[exitIndex].spread;
        const tradeReturn = direction * (exitSpread - entrySpread) / entrySpread;
        
        totalReturn += tradeReturn;
        
        if (tradeReturn > 0) {
          winningTrades++;
        }
        
        // 移动索引到平仓点之后
        i = exitIndex;
      }
    }
  }
  
  // 计算胜率和平均收益
  const winRate = trades > 0 ? winningTrades / trades : 0;
  const averageReturn = trades > 0 ? totalReturn / trades : 0;
  
  // 简化的夏普比率计算
  const sharpeRatio = averageReturn / (Math.sqrt(trades) * 0.1);
  
  return {
    tradeCount: trades,
    winRate,
    averageReturn,
    totalReturn,
    sharpeRatio,
    interpretation: trades > 0
      ? `历史回测显示${trades}次交易信号，胜率${(winRate * 100).toFixed(1)}%，平均收益${(averageReturn * 100).toFixed(2)}%`
      : `历史数据中未发现足够的交易信号`
  };
}

/**
 * 综合分析套利机会
 */
function analyzeArbitrageOpportunity(data: ArbitrageData): ArbitrageOpportunity {
  const { ticker1, ticker2, correlation, cointegration, zScore, signal, backtest } = data;
  
  // 基于协整性、相关性和当前信号评估套利机会
  let opportunity = 'none';
  let confidence = 0;
  
  // 符合条件的套利机会
  if (
    cointegration.isCointegrated && 
    Math.abs(correlation.coefficient) > 0.5 &&
    Math.abs(zScore) > 1.5
  ) {
    opportunity = 'strong';
    confidence = Math.min(
      90, 
      Math.round((cointegration.confidence + backtest.winRate * 100 + Math.abs(zScore) * 10) / 3)
    );
  } 
  // 潜在的套利机会
  else if (
    cointegration.isCointegrated && 
    Math.abs(correlation.coefficient) > 0.3 &&
    Math.abs(zScore) > 1
  ) {
    opportunity = 'moderate';
    confidence = Math.min(
      70, 
      Math.round((cointegration.confidence + backtest.winRate * 100 + Math.abs(zScore) * 10) / 3)
    );
  }
  // 弱套利机会
  else if (cointegration.isCointegrated) {
    opportunity = 'weak';
    confidence = Math.min(
      50, 
      Math.round((cointegration.confidence + backtest.winRate * 100) / 2)
    );
  }
  
  // 生成总结建议
  let summary = '';
  let recommendation = '';
  
  if (opportunity === 'strong') {
    summary = `${ticker1}和${ticker2}构成强套利机会，相关系数${correlation.coefficient.toFixed(2)}，当前Z-score：${zScore.toFixed(2)}`;
    recommendation = `建议按照信号执行配对交易，${signal.actions.ticker1} ${ticker1}，${signal.actions.ticker2} ${ticker2}`;
  } else if (opportunity === 'moderate') {
    summary = `${ticker1}和${ticker2}构成中等套利机会，相关系数${correlation.coefficient.toFixed(2)}，当前Z-score：${zScore.toFixed(2)}`;
    recommendation = signal.signalType === 'divergence'
      ? `可考虑按照信号执行配对交易，但建议使用较小仓位`
      : `暂时观望，等待更强的套利信号`;
  } else {
    summary = `${ticker1}和${ticker2}不构成明确的套利机会，相关系数${correlation.coefficient.toFixed(2)}，当前Z-score：${zScore.toFixed(2)}`;
    recommendation = `不建议进行配对交易，可继续监控价差变化`;
  }
  
  return {
    opportunity,
    confidence,
    summary,
    recommendation
  };
} 