import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('marketPositionTools');

/**
 * 市场定位分析工具
 * 
 * 分析公司在行业中的市场地位、市场份额变化和竞争优势，
 * 用于评估公司的增长前景和持续竞争力。
 */
export const marketPositionTool = createTool({
  name: 'marketPositionTool',
  description: '分析公司在行业中的市场地位和竞争优势',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    industry: z.string().optional().describe('行业分类'),
    competitors: z.array(z.string()).optional().describe('主要竞争对手')
  }),
  execute: async ({ ticker, industry, competitors }) => {
    logger.info('执行市场定位分析', { ticker, industry });
    
    try {
      // 模拟API调用或数据计算
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 自动确定行业和竞争对手
      if (!industry) {
        industry = determineIndustry(ticker);
      }
      
      if (!competitors || competitors.length === 0) {
        competitors = determineCompetitors(ticker, industry);
      }
      
      // 生成市场份额数据
      const marketShareData = generateMarketShareData(ticker, industry, competitors);
      
      // 分析竞争优势
      const competitiveAdvantages = analyzeCompetitiveAdvantages(ticker);
      
      // 分析增长机会
      const growthOpportunities = analyzeGrowthOpportunities(ticker, industry);
      
      // 评分和分析
      const { score, analysis } = evaluateMarketPosition(marketShareData, competitiveAdvantages, growthOpportunities);
      
      return {
        ticker,
        timestamp: new Date().toISOString(),
        industry,
        marketShare: marketShareData.marketShare,
        marketShareTrend: marketShareData.trend,
        competitiveAdvantages,
        growthOpportunities,
        competitors: marketShareData.competitorsData,
        score, // 0-10分
        analysis
      };
    } catch (error: any) {
      logger.error('市场定位分析失败', { ticker, error });
      throw new Error(`市场定位分析失败: ${error.message}`);
    }
  }
});

/**
 * 确定股票的行业
 */
function determineIndustry(ticker: string): string {
  // 为不同股票指定行业
  const industryMap: Record<string, string> = {
    'AAPL': '消费电子',
    'MSFT': '软件和云服务',
    'GOOGL': '互联网搜索和广告',
    'AMZN': '电子商务和云服务',
    'META': '社交媒体',
    'TSLA': '电动汽车',
    'NFLX': '流媒体视频',
    'AMD': '半导体',
    'NVDA': '半导体和AI',
    'INTC': '半导体'
  };
  
  return industryMap[ticker.toUpperCase()] || '科技';
}

/**
 * 确定公司的竞争对手
 */
function determineCompetitors(ticker: string, industry: string): string[] {
  // 为不同公司指定竞争对手
  const competitorsMap: Record<string, string[]> = {
    'AAPL': ['MSFT', 'GOOGL', 'SMSN.IL'], // Samsung
    'MSFT': ['GOOGL', 'AMZN', 'ORCL'],
    'GOOGL': ['META', 'MSFT', 'AMZN'],
    'AMZN': ['WMT', 'MSFT', 'BABA'],
    'META': ['SNAP', 'GOOGL', 'PINS'],
    'TSLA': ['F', 'GM', 'NIO'],
    'NFLX': ['DIS', 'AMZN', 'WBD'],
    'AMD': ['NVDA', 'INTC', 'ARM'],
    'NVDA': ['AMD', 'INTC', 'AMD'],
    'INTC': ['AMD', 'NVDA', 'ARM']
  };
  
  return competitorsMap[ticker.toUpperCase()] || ['未知竞争对手1', '未知竞争对手2', '未知竞争对手3'];
}

/**
 * 生成市场份额数据
 */
function generateMarketShareData(ticker: string, industry: string, competitors: string[]): {
  marketShare: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  growthRate: number;
  competitorsData: Array<{
    ticker: string;
    marketShare: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
} {
  // 为不同公司设置不同的基础市场份额
  let baseMarketShare: number;
  let baseTrend: 'increasing' | 'decreasing' | 'stable';
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      baseMarketShare = 0.20; // 20%
      baseTrend = 'stable';
      break;
    case 'MSFT':
      baseMarketShare = 0.35; // 35%
      baseTrend = 'increasing';
      break;
    case 'GOOGL':
      baseMarketShare = 0.65; // 65%（搜索市场）
      baseTrend = 'stable';
      break;
    case 'AMZN':
      baseMarketShare = 0.40; // 40%
      baseTrend = 'increasing';
      break;
    case 'META':
      baseMarketShare = 0.70; // 70%（社交媒体）
      baseTrend = 'decreasing';
      break;
    case 'TSLA':
      baseMarketShare = 0.18; // 18%（电动车市场）
      baseTrend = 'increasing';
      break;
    default:
      // 随机生成一个中等市场份额
      baseMarketShare = 0.10 + Math.random() * 0.20; // 10-30%
      
      // 随机趋势
      const trends: Array<'increasing' | 'decreasing' | 'stable'> = ['increasing', 'decreasing', 'stable'];
      baseTrend = trends[Math.floor(Math.random() * trends.length)];
  }
  
  // 添加一些随机波动
  const marketShare = baseMarketShare * (1 + (Math.random() * 0.1 - 0.05)); // ±5%
  
  // 计算市场份额增长率
  let growthRate: number;
  if (baseTrend === 'increasing') {
    growthRate = 0.05 + Math.random() * 0.10; // 5-15%
  } else if (baseTrend === 'decreasing') {
    growthRate = -0.10 + Math.random() * 0.07; // -10%到-3%
  } else {
    growthRate = -0.02 + Math.random() * 0.04; // -2%到+2%
  }
  
  // 生成竞争对手数据
  const competitorsData = competitors.map(comp => {
    // 生成竞争对手的市场份额和趋势
    let compMarketShare: number;
    let compTrend: 'increasing' | 'decreasing' | 'stable';
    
    // 主要竞争对手的特定市场份额
    if (comp === 'MSFT' && ticker === 'AAPL') {
      compMarketShare = 0.15; // 15%
      compTrend = 'increasing';
    } else if (comp === 'GOOGL' && ticker === 'META') {
      compMarketShare = 0.15; // 15%
      compTrend = 'increasing';
    } else if (comp === 'AMD' && ticker === 'INTC') {
      compMarketShare = 0.25; // 25%
      compTrend = 'increasing';
    } else {
      // 随机生成
      compMarketShare = Math.max(0.05, Math.min(0.40, (1 - marketShare) * Math.random()));
      
      // 随机趋势
      const trends: Array<'increasing' | 'decreasing' | 'stable'> = ['increasing', 'decreasing', 'stable'];
      compTrend = trends[Math.floor(Math.random() * trends.length)];
    }
    
    return {
      ticker: comp,
      marketShare: compMarketShare,
      trend: compTrend
    };
  });
  
  return {
    marketShare,
    trend: baseTrend,
    growthRate,
    competitorsData
  };
}

/**
 * 分析竞争优势
 */
function analyzeCompetitiveAdvantages(ticker: string): Array<{
  type: 'brand' | 'technology' | 'scale' | 'network' | 'cost' | 'switching_cost' | 'intellectual_property';
  strength: 'strong' | 'moderate' | 'weak';
  description: string;
}> {
  // 为不同公司设定竞争优势
  const advantages: Array<{
    type: 'brand' | 'technology' | 'scale' | 'network' | 'cost' | 'switching_cost' | 'intellectual_property';
    strength: 'strong' | 'moderate' | 'weak';
    description: string;
  }> = [];
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      advantages.push({
        type: 'brand',
        strength: 'strong',
        description: '强大的品牌忠诚度和高端品牌形象'
      });
      advantages.push({
        type: 'ecosystem',
        strength: 'strong',
        description: '整合良好的产品和服务生态系统'
      });
      advantages.push({
        type: 'technology',
        strength: 'strong',
        description: '领先的硬件设计和软件集成能力'
      });
      break;
      
    case 'MSFT':
      advantages.push({
        type: 'scale',
        strength: 'strong',
        description: '庞大的企业客户基础和深度市场渗透'
      });
      advantages.push({
        type: 'switching_cost',
        strength: 'strong',
        description: '高企业客户转换成本'
      });
      advantages.push({
        type: 'technology',
        strength: 'strong',
        description: '领先的云服务技术和AI集成'
      });
      break;
      
    case 'GOOGL':
      advantages.push({
        type: 'network',
        strength: 'strong',
        description: '强大的网络效应和搜索市场主导地位'
      });
      advantages.push({
        type: 'technology',
        strength: 'strong',
        description: '先进的AI和机器学习技术'
      });
      advantages.push({
        type: 'scale',
        strength: 'strong',
        description: '庞大的用户数据和广告网络'
      });
      break;
      
    case 'AMZN':
      advantages.push({
        type: 'scale',
        strength: 'strong',
        description: '庞大的物流网络和配送能力'
      });
      advantages.push({
        type: 'technology',
        strength: 'strong',
        description: '领先的电商技术和云计算服务'
      });
      advantages.push({
        type: 'network',
        strength: 'strong',
        description: '庞大的第三方卖家生态系统'
      });
      break;
      
    default:
      // 随机生成竞争优势
      const advantageTypes: Array<'brand' | 'technology' | 'scale' | 'network' | 'cost' | 'switching_cost' | 'intellectual_property'> = [
        'brand', 'technology', 'scale', 'network', 'cost', 'switching_cost', 'intellectual_property'
      ];
      
      const strengthLevels: Array<'strong' | 'moderate' | 'weak'> = ['strong', 'moderate', 'weak'];
      
      const descriptions: Record<string, string[]> = {
        'brand': ['强大的品牌认知度', '高品牌价值', '良好的品牌声誉'],
        'technology': ['技术领先优势', '创新研发能力', '专有技术'],
        'scale': ['规模经济效应', '市场规模优势', '全球业务覆盖'],
        'network': ['强大的网络效应', '庞大的用户基础', '合作伙伴生态系统'],
        'cost': ['低成本运营模式', '高效生产流程', '成本领先优势'],
        'switching_cost': ['高客户转换成本', '产品粘性', '长期客户关系'],
        'intellectual_property': ['强大的专利组合', '知识产权保护', '专有算法']
      };
      
      // 随机生成2-3个优势
      const advantageCount = 2 + Math.floor(Math.random() * 2);
      
      // 随机选择优势类型（不重复）
      const selectedTypes = [...advantageTypes].sort(() => 0.5 - Math.random()).slice(0, advantageCount);
      
      for (const type of selectedTypes) {
        const strength = strengthLevels[Math.floor(Math.random() * strengthLevels.length)];
        const descOptions = descriptions[type] || descriptions['technology'];
        const description = descOptions[Math.floor(Math.random() * descOptions.length)];
        
        advantages.push({ type, strength, description });
      }
  }
  
  return advantages;
}

/**
 * 分析增长机会
 */
function analyzeGrowthOpportunities(ticker: string, industry: string): Array<{
  opportunity: string;
  potential: 'high' | 'medium' | 'low';
  timeframe: 'short' | 'medium' | 'long';
}> {
  // 为不同公司设定增长机会
  const opportunities: Array<{
    opportunity: string;
    potential: 'high' | 'medium' | 'low';
    timeframe: 'short' | 'medium' | 'long';
  }> = [];
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      opportunities.push({
        opportunity: '可穿戴设备市场扩张',
        potential: 'high',
        timeframe: 'short'
      });
      opportunities.push({
        opportunity: '增强现实和虚拟现实技术',
        potential: 'high',
        timeframe: 'medium'
      });
      opportunities.push({
        opportunity: '服务业务收入增长',
        potential: 'high',
        timeframe: 'short'
      });
      break;
      
    case 'MSFT':
      opportunities.push({
        opportunity: 'AI集成云服务扩张',
        potential: 'high',
        timeframe: 'short'
      });
      opportunities.push({
        opportunity: '企业数字化转型解决方案',
        potential: 'high',
        timeframe: 'medium'
      });
      opportunities.push({
        opportunity: '游戏业务增长',
        potential: 'medium',
        timeframe: 'short'
      });
      break;
      
    case 'GOOGL':
      opportunities.push({
        opportunity: 'AI和机器学习应用',
        potential: 'high',
        timeframe: 'short'
      });
      opportunities.push({
        opportunity: '云服务市场份额增长',
        potential: 'high',
        timeframe: 'medium'
      });
      opportunities.push({
        opportunity: '其他产品营收多元化',
        potential: 'medium',
        timeframe: 'long'
      });
      break;
      
    case 'AMZN':
      opportunities.push({
        opportunity: '国际市场扩张',
        potential: 'high',
        timeframe: 'medium'
      });
      opportunities.push({
        opportunity: 'AWS云服务增长',
        potential: 'high',
        timeframe: 'short'
      });
      opportunities.push({
        opportunity: '物流和配送网络优化',
        potential: 'medium',
        timeframe: 'short'
      });
      break;
      
    default:
      // 基于行业随机生成增长机会
      const opportunitiesByIndustry: Record<string, string[]> = {
        '消费电子': ['新产品类别开发', '新兴市场扩张', '服务业务增长', '可穿戴设备市场'],
        '软件和云服务': ['AI集成服务', '数据分析解决方案', 'SaaS产品扩展', '行业垂直解决方案'],
        '互联网搜索和广告': ['视频广告增长', '电子商务整合', '本地服务整合', '新广告形式'],
        '电子商务': ['国际市场扩张', '新品类扩展', '自有品牌发展', '物流网络优化'],
        '社交媒体': ['短视频内容增长', '电商功能整合', '元宇宙发展', '新兴市场用户增长'],
        '电动汽车': ['自动驾驶技术', '电池技术改进', '充电基础设施', '新车型开发'],
        '半导体': ['AI芯片需求', '汽车电子需求', '物联网应用', '数据中心扩张'],
        '科技': ['云计算服务', '人工智能应用', '5G相关产品', '企业数字化转型']
      };
      
      const industryOpps = opportunitiesByIndustry[industry] || opportunitiesByIndustry['科技'];
      
      // 随机选择2-3个机会
      const shuffledOpps = [...industryOpps].sort(() => 0.5 - Math.random());
      const oppsCount = 2 + Math.floor(Math.random() * 2);
      
      const potentials: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
      const timeframes: Array<'short' | 'medium' | 'long'> = ['short', 'medium', 'long'];
      
      for (let i = 0; i < Math.min(oppsCount, shuffledOpps.length); i++) {
        opportunities.push({
          opportunity: shuffledOpps[i],
          potential: potentials[Math.floor(Math.random() * potentials.length)],
          timeframe: timeframes[Math.floor(Math.random() * timeframes.length)]
        });
      }
  }
  
  return opportunities;
}

/**
 * 评估市场定位
 */
function evaluateMarketPosition(
  marketShareData: {
    marketShare: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    growthRate: number;
  },
  competitiveAdvantages: Array<{
    type: 'brand' | 'technology' | 'scale' | 'network' | 'cost' | 'switching_cost' | 'intellectual_property';
    strength: 'strong' | 'moderate' | 'weak';
  }>,
  growthOpportunities: Array<{
    opportunity: string;
    potential: 'high' | 'medium' | 'low';
    timeframe: 'short' | 'medium' | 'long';
  }>
): {
  score: number;
  analysis: string;
} {
  // 基于市场份额评分 (0-3分)
  let marketShareScore = 0;
  if (marketShareData.marketShare > 0.3) marketShareScore = 3;
  else if (marketShareData.marketShare > 0.15) marketShareScore = 2;
  else if (marketShareData.marketShare > 0.05) marketShareScore = 1;
  
  // 基于市场份额趋势评分 (0-2分)
  let trendScore = 0;
  if (marketShareData.trend === 'increasing') trendScore = 2;
  else if (marketShareData.trend === 'stable') trendScore = 1;
  
  // 基于竞争优势评分 (0-3分)
  let advantageScore = 0;
  const strongAdvantages = competitiveAdvantages.filter(adv => adv.strength === 'strong').length;
  const moderateAdvantages = competitiveAdvantages.filter(adv => adv.strength === 'moderate').length;
  
  if (strongAdvantages >= 2) advantageScore = 3;
  else if (strongAdvantages >= 1) advantageScore = 2;
  else if (moderateAdvantages >= 2) advantageScore = 1;
  
  // 基于增长机会评分 (0-2分)
  let opportunityScore = 0;
  const highPotentialOpps = growthOpportunities.filter(opp => opp.potential === 'high').length;
  const shortTermOpps = growthOpportunities.filter(opp => opp.timeframe === 'short').length;
  
  if (highPotentialOpps >= 2) opportunityScore += 1;
  if (shortTermOpps >= 1) opportunityScore += 1;
  
  // 总得分 (0-10分)
  const totalScore = marketShareScore + trendScore + advantageScore + opportunityScore;
  
  // 分析评价
  let analysis = '';
  
  if (totalScore >= 8) {
    analysis = `市场领导者，拥有强大的竞争优势和增长前景。市场份额${(marketShareData.marketShare * 100).toFixed(1)}%，${
      marketShareData.trend === 'increasing' ? '呈上升趋势' : marketShareData.trend === 'decreasing' ? '呈下降趋势' : '保持稳定'
    }。拥有${strongAdvantages}个强竞争优势和${highPotentialOpps}个高潜力增长机会。`;
  } else if (totalScore >= 6) {
    analysis = `市场强者，拥有良好的竞争地位。市场份额${(marketShareData.marketShare * 100).toFixed(1)}%，${
      marketShareData.trend === 'increasing' ? '呈上升趋势' : marketShareData.trend === 'decreasing' ? '呈下降趋势' : '保持稳定'
    }。具备一定竞争优势和增长机会。`;
  } else if (totalScore >= 4) {
    analysis = `市场参与者，具备一定竞争力。市场份额${(marketShareData.marketShare * 100).toFixed(1)}%，面临一定的市场挑战，但有潜在增长机会。`;
  } else {
    analysis = `市场弱者，竞争地位较弱。市场份额仅${(marketShareData.marketShare * 100).toFixed(1)}%，缺乏明显竞争优势，面临严峻的市场挑战。`;
  }
  
  return {
    score: totalScore,
    analysis
  };
} 