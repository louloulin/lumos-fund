import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('revenueTools');

/**
 * 收入增长分析工具
 * 
 * 分析公司的收入增长特征，包括增长率、一致性、季度表现和未来预期，
 * 用于评估公司的增长质量和可持续性。
 */
export const revenueGrowthTool = createTool({
  name: 'revenueGrowthTool',
  description: '分析公司的收入增长特征',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    years: z.number().int().min(1).max(10).default(5).describe('分析年数')
  }),
  execute: async ({ ticker, years }: { ticker: string; years: number }) => {
    logger.info('执行收入增长分析', { ticker, years });
    
    try {
      // 模拟API调用或数据计算
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成收入历史数据
      const revenueHistory = generateRevenueHistory(ticker, years);
      
      // 分析季度表现
      const quarterlyPerformance = analyzeQuarterlyPerformance(ticker);
      
      // 分析收入组成和多样性
      const revenueComposition = analyzeRevenueComposition(ticker);
      
      // 生成未来收入预期
      const revenueForecast = generateRevenueForecast(revenueHistory);
      
      // 评分和分析
      const { score, analysis } = evaluateRevenueGrowth(revenueHistory, quarterlyPerformance, revenueComposition, revenueForecast);
      
      return {
        ticker,
        timestamp: new Date().toISOString(),
        revenueHistory,
        quarterlyPerformance,
        revenueComposition,
        revenueForecast,
        score, // 0-10分
        analysis
      };
    } catch (error: any) {
      logger.error('收入增长分析失败', { ticker, error });
      throw new Error(`收入增长分析失败: ${error.message}`);
    }
  }
});

/**
 * 生成收入历史数据
 */
function generateRevenueHistory(ticker: string, years: number): {
  yearly: Array<{
    year: number;
    revenue: number; // 百万美元
    growthRate: number;
  }>;
  cagr: number;
  consistency: number; // 0-1
  volatility: number;
} {
  // 为不同公司设置不同的基础增长率
  let baseRevenue: number; // 最新年份的收入，百万美元
  let baseGrowthRate: number;
  let baseConsistency: number;
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      baseRevenue = 380000; // 3800亿美元
      baseGrowthRate = 0.08; // 8%
      baseConsistency = 0.85; // 85%
      break;
    case 'MSFT':
      baseRevenue = 220000; // 2200亿美元
      baseGrowthRate = 0.16; // 16%
      baseConsistency = 0.90; // 90%
      break;
    case 'GOOGL':
      baseRevenue = 290000; // 2900亿美元
      baseGrowthRate = 0.18; // 18%
      baseConsistency = 0.82; // 82%
      break;
    case 'AMZN':
      baseRevenue = 510000; // 5100亿美元
      baseGrowthRate = 0.15; // 15%
      baseConsistency = 0.75; // 75%
      break;
    case 'META':
      baseRevenue = 130000; // 1300亿美元
      baseGrowthRate = 0.20; // 20%
      baseConsistency = 0.70; // 70%
      break;
    case 'TSLA':
      baseRevenue = 95000; // 950亿美元
      baseGrowthRate = 0.30; // 30%
      baseConsistency = 0.65; // 65%
      break;
    case 'NVDA':
      baseRevenue = 45000; // 450亿美元
      baseGrowthRate = 0.65; // 65%
      baseConsistency = 0.60; // 60%
      break;
    default:
      // 随机生成一个中等规模的收入
      baseRevenue = 10000 + Math.random() * 100000; // 100亿-1000亿美元
      baseGrowthRate = 0.05 + Math.random() * 0.20; // 5%-25%
      baseConsistency = 0.50 + Math.random() * 0.30; // 50%-80%
  }
  
  // 按年生成历史数据（从最新年份开始，倒推）
  const yearlyData = [];
  let currentRevenue = baseRevenue;
  
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < years; i++) {
    const year = currentYear - i;
    
    // 为每年添加一些随机波动，同时考虑一致性
    // 一致性越高，波动越小
    const volatilityFactor = 1 - baseConsistency; // 0.15 for AAPL (85% consistency)
    const yearlyVolatility = (Math.random() * 2 - 1) * volatilityFactor; // 在 -volatilityFactor 到 +volatilityFactor 之间
    
    const actualGrowthRate = baseGrowthRate * (1 + yearlyVolatility);
    
    if (i === 0) {
      // 最新年份的数据
      yearlyData.push({
        year,
        revenue: currentRevenue,
        growthRate: baseGrowthRate
      });
    } else {
      // 计算前一年的收入（当前收入除以 (1 + 增长率)）
      const previousRevenue = currentRevenue / (1 + actualGrowthRate);
      yearlyData.push({
        year,
        revenue: previousRevenue,
        growthRate: actualGrowthRate
      });
      currentRevenue = previousRevenue;
    }
  }
  
  // 反转数组，使其按时间顺序（从早到晚）
  yearlyData.reverse();
  
  // 计算CAGR（复合年增长率）
  const firstValue = yearlyData[0].revenue;
  const lastValue = yearlyData[yearlyData.length - 1].revenue;
  const cagr = Math.pow(lastValue / firstValue, 1 / (years - 1)) - 1;
  
  // 计算收入增长的波动性（增长率的标准差）
  const growthRates = yearlyData.map(d => d.growthRate);
  const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  const squaredDiffs = growthRates.map(rate => Math.pow(rate - avgGrowthRate, 2));
  const volatility = Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length);
  
  return {
    yearly: yearlyData,
    cagr,
    consistency: baseConsistency,
    volatility
  };
}

/**
 * 分析季度表现
 */
function analyzeQuarterlyPerformance(ticker: string): {
  lastFourQuarters: Array<{
    quarter: string;
    revenue: number;
    growthYoY: number;
    growthQoQ: number;
  }>;
  beatsEstimates: number; // 0-4, 打败分析师预期的季度数
  seasonality: 'high' | 'medium' | 'low';
  trend: 'accelerating' | 'stable' | 'decelerating';
} {
  // 为不同公司设置不同的季度数据特征
  let baseQuarterlyGrowth: number;
  let baseBeatsEstimates: number;
  let baseSeasonality: 'high' | 'medium' | 'low';
  let baseTrend: 'accelerating' | 'stable' | 'decelerating';
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      baseQuarterlyGrowth = 0.08; // 8%
      baseBeatsEstimates = 3; // 3/4季度超预期
      baseSeasonality = 'high'; // 高季节性（假日季度强劲）
      baseTrend = 'stable';
      break;
    case 'MSFT':
      baseQuarterlyGrowth = 0.16; // 16%
      baseBeatsEstimates = 4; // 4/4季度超预期
      baseSeasonality = 'low'; // 低季节性
      baseTrend = 'accelerating';
      break;
    case 'AMZN':
      baseQuarterlyGrowth = 0.15; // 15%
      baseBeatsEstimates = 3; // 3/4季度超预期
      baseSeasonality = 'high'; // 高季节性（假日季度强劲）
      baseTrend = 'stable';
      break;
    case 'META':
      baseQuarterlyGrowth = 0.20; // 20%
      baseBeatsEstimates = 2; // 2/4季度超预期
      baseSeasonality = 'medium'; // 中等季节性
      baseTrend = 'accelerating';
      break;
    case 'NVDA':
      baseQuarterlyGrowth = 0.65; // 65%
      baseBeatsEstimates = 4; // 4/4季度超预期
      baseSeasonality = 'low'; // 低季节性
      baseTrend = 'accelerating';
      break;
    default:
      // 随机生成数据
      baseQuarterlyGrowth = 0.05 + Math.random() * 0.15; // 5%-20%
      baseBeatsEstimates = Math.floor(Math.random() * 5); // 0-4季度超预期
      
      const seasonalities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
      baseSeasonality = seasonalities[Math.floor(Math.random() * seasonalities.length)];
      
      const trends: Array<'accelerating' | 'stable' | 'decelerating'> = ['accelerating', 'stable', 'decelerating'];
      baseTrend = trends[Math.floor(Math.random() * trends.length)];
  }
  
  // 生成最近四个季度的数据
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
  
  const quarters: Array<{
    quarter: string;
    revenue: number;
    growthYoY: number;
    growthQoQ: number;
    seasonalFactor: number;
  }> = [];
  
  for (let i = 0; i < 4; i++) {
    const quarterNum = ((currentQuarter - i - 1) % 4) + 1;
    const year = currentYear - Math.floor((i + currentQuarter - 1) / 4);
    const quarter = `${year}Q${quarterNum}`;
    
    // 季度调整因子
    let seasonalFactor = 1.0;
    if (baseSeasonality === 'high') {
      // 假设Q4是假日季度，收入较高
      if (quarterNum === 4) seasonalFactor = 1.2;
      else if (quarterNum === 1) seasonalFactor = 0.85;
    } else if (baseSeasonality === 'medium') {
      // 较温和的季节性
      if (quarterNum === 4) seasonalFactor = 1.1;
      else if (quarterNum === 1) seasonalFactor = 0.9;
    }
    
    // 趋势调整因子
    let trendFactor = 0;
    if (baseTrend === 'accelerating') {
      trendFactor = 0.02 * i; // 最近的季度增长率更高
    } else if (baseTrend === 'decelerating') {
      trendFactor = -0.02 * i; // 最近的季度增长率更低
    }
    
    // 计算该季度的同比增长率
    const growthYoY = Math.max(0, baseQuarterlyGrowth + trendFactor + (Math.random() * 0.04 - 0.02)); // ±2%随机波动
    
    // 计算环比增长（第一个季度使用估计值）
    let growthQoQ = 0;
    if (i === 3) {
      growthQoQ = (Math.random() * 0.1 - 0.05); // 随机值，±5%
    } else if (quarters.length > 0) {
      growthQoQ = (seasonalFactor * (1 + growthYoY) / quarters[quarters.length - 1].seasonalFactor) - 1;
    }
    
    // 生成收入值（以百万美元计）
    // 假设最近一个季度的收入占全年收入的约25%（调整季节性因素）
    let revenue = 0;
    if (i === 0) {
      if (ticker.toUpperCase() === 'AAPL') {
        revenue = 90000 * seasonalFactor;
      } else if (ticker.toUpperCase() === 'MSFT') {
        revenue = 55000 * seasonalFactor;
      } else if (ticker.toUpperCase() === 'AMZN') {
        revenue = 125000 * seasonalFactor;
      } else if (ticker.toUpperCase() === 'META') {
        revenue = 32000 * seasonalFactor;
      } else if (ticker.toUpperCase() === 'NVDA') {
        revenue = 11000 * seasonalFactor;
      } else if (ticker.toUpperCase() === 'GOOGL') {
        revenue = 72000 * seasonalFactor;
      } else {
        revenue = (5000 + Math.random() * 20000) * seasonalFactor;
      }
    } else {
      revenue = quarters[quarters.length - 1].revenue / (1 + growthQoQ);
    }
    
    quarters.push({
      quarter,
      revenue,
      growthYoY,
      growthQoQ,
      seasonalFactor // 仅用于计算，不会返回
    });
  }
  
  // 移除内部使用的字段
  const lastFourQuarters = quarters.reverse().map(q => ({
    quarter: q.quarter,
    revenue: q.revenue,
    growthYoY: q.growthYoY,
    growthQoQ: q.growthQoQ
  }));
  
  return {
    lastFourQuarters,
    beatsEstimates: baseBeatsEstimates,
    seasonality: baseSeasonality,
    trend: baseTrend
  };
}

/**
 * 分析收入组成和多样性
 */
function analyzeRevenueComposition(ticker: string): {
  segments: Array<{
    name: string;
    percentage: number;
    growthRate: number;
  }>;
  diversificationScore: number; // 0-10
  geographicDiversification: 'high' | 'medium' | 'low';
  topSegmentDependence: number; // 0-1, 对主要收入来源的依赖度
} {
  // 为不同公司设置不同的收入组成
  let baseSegments: Array<{
    name: string;
    percentage: number;
    growthRate: number;
  }>;
  let baseDiversification: number;
  let baseGeographicDiversification: 'high' | 'medium' | 'low';
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      baseSegments = [
        { name: 'iPhone', percentage: 0.52, growthRate: 0.05 },
        { name: '服务', percentage: 0.22, growthRate: 0.19 },
        { name: 'Mac', percentage: 0.10, growthRate: 0.10 },
        { name: 'iPad', percentage: 0.09, growthRate: 0.02 },
        { name: '可穿戴、家居和配件', percentage: 0.07, growthRate: 0.17 }
      ];
      baseDiversification = 6.5;
      baseGeographicDiversification = 'high';
      break;
    case 'MSFT':
      baseSegments = [
        { name: '智能云', percentage: 0.40, growthRate: 0.24 },
        { name: '生产力和业务流程', percentage: 0.33, growthRate: 0.15 },
        { name: '更多个人计算', percentage: 0.27, growthRate: 0.08 }
      ];
      baseDiversification = 7.0;
      baseGeographicDiversification = 'high';
      break;
    case 'GOOGL':
      baseSegments = [
        { name: '广告', percentage: 0.78, growthRate: 0.12 },
        { name: 'Google Cloud', percentage: 0.10, growthRate: 0.40 },
        { name: 'Google其他业务', percentage: 0.12, growthRate: 0.20 }
      ];
      baseDiversification = 4.0;
      baseGeographicDiversification = 'high';
      break;
    case 'AMZN':
      baseSegments = [
        { name: '在线商店', percentage: 0.45, growthRate: 0.12 },
        { name: '第三方卖家服务', percentage: 0.23, growthRate: 0.18 },
        { name: 'AWS', percentage: 0.17, growthRate: 0.30 },
        { name: '订阅服务', percentage: 0.08, growthRate: 0.15 },
        { name: '实体店', percentage: 0.04, growthRate: 0.10 },
        { name: '其他', percentage: 0.03, growthRate: 0.25 }
      ];
      baseDiversification = 7.5;
      baseGeographicDiversification = 'high';
      break;
    case 'META':
      baseSegments = [
        { name: '广告', percentage: 0.97, growthRate: 0.18 },
        { name: '其他业务', percentage: 0.03, growthRate: 0.35 }
      ];
      baseDiversification = 2.0;
      baseGeographicDiversification = 'high';
      break;
    case 'TSLA':
      baseSegments = [
        { name: '汽车销售', percentage: 0.85, growthRate: 0.30 },
        { name: '能源生产和储存', percentage: 0.07, growthRate: 0.40 },
        { name: '服务和其他', percentage: 0.08, growthRate: 0.25 }
      ];
      baseDiversification = 3.5;
      baseGeographicDiversification = 'medium';
      break;
    default:
      // 随机生成2-5个业务分部
      const segmentCount = 2 + Math.floor(Math.random() * 4);
      baseSegments = [];
      
      // 生成随机分部名称
      const segmentNames = [
        '产品销售', '服务', '订阅收入', '数字内容', '广告',
        '硬件', '软件', '云服务', '咨询服务', '授权',
        '数据服务', '金融服务', '企业解决方案', '消费者业务', '专业服务'
      ];
      
      // 打乱数组以确保随机选择
      const shuffledNames = [...segmentNames].sort(() => 0.5 - Math.random());
      
      // 随机分配百分比，确保总和为1
      let remainingPercentage = 1.0;
      for (let i = 0; i < segmentCount; i++) {
        const isLast = i === segmentCount - 1;
        
        // 最后一个分部获取剩余百分比，其他随机分配
        const percentage = isLast ? 
                         remainingPercentage : 
                         Math.min(remainingPercentage * 0.8, Math.max(0.05, Math.random() * remainingPercentage));
        
        // 随机增长率，5%-40%
        const growthRate = 0.05 + Math.random() * 0.35;
        
        baseSegments.push({
          name: shuffledNames[i],
          percentage,
          growthRate
        });
        
        remainingPercentage -= percentage;
      }
      
      // 按百分比排序（大到小）
      baseSegments.sort((a, b) => b.percentage - a.percentage);
      
      // 计算多样化评分
      // 考虑分部数量和主要分部的集中度
      const primarySegmentPercentage = baseSegments[0].percentage;
      baseDiversification = (segmentCount * 1.5) * (1 - primarySegmentPercentage * 0.5);
      
      // 随机地理多样化
      const geoDiversifications: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
      baseGeographicDiversification = geoDiversifications[Math.floor(Math.random() * geoDiversifications.length)];
  }
  
  // 添加一些随机波动
  const segments = baseSegments.map(segment => ({
    name: segment.name,
    percentage: Math.min(1, Math.max(0.01, segment.percentage * (1 + (Math.random() * 0.1 - 0.05)))), // ±5%
    growthRate: Math.max(0, segment.growthRate * (1 + (Math.random() * 0.2 - 0.1))) // ±10%
  }));
  
  // 规范化百分比，确保总和为1
  const totalPercentage = segments.reduce((sum, segment) => sum + segment.percentage, 0);
  segments.forEach(segment => {
    segment.percentage = segment.percentage / totalPercentage;
  });
  
  // 计算对主要收入来源的依赖度
  const topSegmentDependence = segments[0].percentage;
  
  // 添加一些随机波动到多样化评分
  const diversificationScore = Math.min(10, Math.max(1, baseDiversification * (1 + (Math.random() * 0.1 - 0.05))));
  
  return {
    segments,
    diversificationScore,
    geographicDiversification: baseGeographicDiversification,
    topSegmentDependence
  };
}

/**
 * 生成未来收入预期
 */
function generateRevenueForecast(revenueHistory: {
  yearly: Array<{
    year: number;
    revenue: number;
    growthRate: number;
  }>;
  cagr: number;
}): {
  nextYearRevenue: number;
  nextYearGrowthRate: number;
  fiveYearCAGR: number;
  analystConsensus: 'beat' | 'meet' | 'miss';
  confidence: 'high' | 'medium' | 'low';
} {
  // 获取最近的增长率和CAGR
  const recentGrowthRate = revenueHistory.yearly[revenueHistory.yearly.length - 1].growthRate;
  const cagr = revenueHistory.cagr;
  
  // 获取最新年份的收入
  const latestRevenue = revenueHistory.yearly[revenueHistory.yearly.length - 1].revenue;
  
  // 使用CAGR和最近增长率的加权平均来预测未来增长
  // 最近增长率的权重更高
  const nextYearGrowthRate = recentGrowthRate * 0.7 + cagr * 0.3;
  
  // 计算下一年的预期收入
  const nextYearRevenue = latestRevenue * (1 + nextYearGrowthRate);
  
  // 五年CAGR稍微调整，通常略低于当前增长率
  const fiveYearCAGR = Math.max(0.02, nextYearGrowthRate * (0.8 + Math.random() * 0.1)); // 80%-90%的当前增长率
  
  // 随机分析师一致预期
  const consensusOptions: Array<'beat' | 'meet' | 'miss'> = ['beat', 'meet', 'miss'];
  const weights = [0.5, 0.3, 0.2]; // 更倾向于超预期
  
  // 根据加权概率选择一致预期
  let analystConsensus: 'beat' | 'meet' | 'miss';
  const rand = Math.random();
  if (rand < weights[0]) {
    analystConsensus = consensusOptions[0]; // beat
  } else if (rand < weights[0] + weights[1]) {
    analystConsensus = consensusOptions[1]; // meet
  } else {
    analystConsensus = consensusOptions[2]; // miss
  }
  
  // 随机置信度
  const confidenceOptions: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
  const confidence = confidenceOptions[Math.floor(Math.random() * confidenceOptions.length)];
  
  return {
    nextYearRevenue,
    nextYearGrowthRate,
    fiveYearCAGR,
    analystConsensus,
    confidence
  };
}

/**
 * 评估收入增长
 */
function evaluateRevenueGrowth(
  revenueHistory: {
    cagr: number;
    consistency: number;
    volatility: number;
  },
  quarterlyPerformance: {
    beatsEstimates: number;
    trend: 'accelerating' | 'stable' | 'decelerating';
  },
  revenueComposition: {
    diversificationScore: number;
    topSegmentDependence: number;
  },
  revenueForecast: {
    nextYearGrowthRate: number;
    analystConsensus: 'beat' | 'meet' | 'miss';
  }
): {
  score: number;
  analysis: string;
} {
  // 基于历史CAGR评分 (0-3分)
  let cagrScore = 0;
  if (revenueHistory.cagr > 0.20) cagrScore = 3;
  else if (revenueHistory.cagr > 0.15) cagrScore = 2.5;
  else if (revenueHistory.cagr > 0.10) cagrScore = 2;
  else if (revenueHistory.cagr > 0.05) cagrScore = 1;
  else if (revenueHistory.cagr > 0) cagrScore = 0.5;
  
  // 基于收入一致性评分 (0-2分)
  let consistencyScore = 0;
  if (revenueHistory.consistency > 0.80) consistencyScore = 2;
  else if (revenueHistory.consistency > 0.60) consistencyScore = 1;
  else if (revenueHistory.consistency > 0.40) consistencyScore = 0.5;
  
  // 基于季度表现评分 (0-2分)
  let quarterlyScore = 0;
  // 打败预期的季度数
  quarterlyScore += Math.min(1, quarterlyPerformance.beatsEstimates * 0.25);
  
  // 考虑趋势
  if (quarterlyPerformance.trend === 'accelerating') quarterlyScore += 1;
  else if (quarterlyPerformance.trend === 'stable') quarterlyScore += 0.5;
  
  // 基于收入多样性评分 (0-2分)
  let diversityScore = 0;
  // 多样化评分(0-10)除以5，最高2分
  diversityScore += Math.min(2, revenueComposition.diversificationScore / 5);
  
  // 对主要收入来源的依赖度过高会扣分
  if (revenueComposition.topSegmentDependence > 0.80) diversityScore -= 1;
  else if (revenueComposition.topSegmentDependence > 0.60) diversityScore -= 0.5;
  
  diversityScore = Math.max(0, diversityScore); // 确保不低于0
  
  // 基于未来预期评分 (0-1分)
  let forecastScore = 0;
  // 未来增长率
  if (revenueForecast.nextYearGrowthRate > 0.25) forecastScore += 0.5;
  else if (revenueForecast.nextYearGrowthRate > 0.10) forecastScore += 0.3;
  else if (revenueForecast.nextYearGrowthRate > 0) forecastScore += 0.1;
  
  // 分析师预期
  if (revenueForecast.analystConsensus === 'beat') forecastScore += 0.5;
  else if (revenueForecast.analystConsensus === 'meet') forecastScore += 0.3;
  
  // 总得分 (0-10分)
  const totalScore = Math.min(10, cagrScore + consistencyScore + quarterlyScore + diversityScore + forecastScore);
  
  // 分析评价
  let analysis = '';
  
  if (totalScore >= 8) {
    analysis = `卓越的收入增长特征。${(revenueHistory.cagr * 100).toFixed(1)}%的历史CAGR，${(revenueHistory.consistency * 100).toFixed(1)}%的收入一致性，${
      quarterlyPerformance.trend === 'accelerating' ? '加速' : quarterlyPerformance.trend === 'stable' ? '稳定' : '减速'
    }的季度趋势，以及${revenueComposition.diversificationScore.toFixed(1)}分的收入多样化评分。预计下一年增长${(revenueForecast.nextYearGrowthRate * 100).toFixed(1)}%，分析师预期${
      revenueForecast.analystConsensus === 'beat' ? '超预期' : revenueForecast.analystConsensus === 'meet' ? '符合预期' : '低于预期'
    }。`;
  } else if (totalScore >= 6) {
    analysis = `强劲的收入增长特征。${(revenueHistory.cagr * 100).toFixed(1)}%的历史CAGR，具有较好的收入一致性和多样化。预计下一年增长${(revenueForecast.nextYearGrowthRate * 100).toFixed(1)}%。`;
  } else if (totalScore >= 4) {
    analysis = `一般的收入增长特征。${(revenueHistory.cagr * 100).toFixed(1)}%的历史CAGR，收入一致性和多样化中等。预计下一年增长${(revenueForecast.nextYearGrowthRate * 100).toFixed(1)}%。`;
  } else {
    analysis = `较弱的收入增长特征。${(revenueHistory.cagr * 100).toFixed(1)}%的历史CAGR，收入一致性低，多样化不足。预计下一年增长${(revenueForecast.nextYearGrowthRate * 100).toFixed(1)}%。`;
  }
  
  return {
    score: totalScore,
    analysis
  };
} 