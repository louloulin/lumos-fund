import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('innovationTools');

/**
 * 创新能力评估工具
 * 
 * 分析公司的研发投入、专利数量、新产品发布频率等指标，
 * 用于评估公司的创新能力和未来增长潜力。
 */
export const innovationAssessmentTool = createTool({
  name: 'innovationAssessmentTool',
  description: '分析公司的创新能力和研发投入',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    period: z.enum(['quarterly', 'annual', 'ttm']).default('ttm').describe('分析周期')
  }),
  execute: async ({ ticker, period }: { ticker: string; period: string }) => {
    logger.info('执行创新能力评估', { ticker, period });
    
    try {
      // 模拟API调用或数据计算
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成研发数据
      const rdData = generateRDData(ticker);
      
      // 分析专利情况
      const patentData = analyzePatents(ticker);
      
      // 分析产品创新
      const productInnovation = analyzeProductInnovation(ticker);
      
      // 评分和分析
      const { score, analysis } = evaluateInnovation(rdData, patentData, productInnovation);
      
      return {
        ticker,
        timestamp: new Date().toISOString(),
        rdData,
        patentData,
        productInnovation,
        score, // 0-10分
        analysis
      };
    } catch (error: any) {
      logger.error('创新能力评估失败', { ticker, error });
      throw new Error(`创新能力评估失败: ${error.message}`);
    }
  }
});

/**
 * 生成研发数据
 */
function generateRDData(ticker: string): {
  rdExpense: number;
  rdAsPercentOfRevenue: number;
  rdGrowthRate: number;
  rdEfficiency: number;
  fiveYearTrend: 'increasing' | 'decreasing' | 'stable';
} {
  // 为不同公司设置不同的研发数据
  let baseRDExpense: number; // 百万美元
  let baseRDPercent: number;
  let baseRDGrowth: number;
  let baseRDEfficiency: number;
  let baseTrend: 'increasing' | 'decreasing' | 'stable';
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      baseRDExpense = 18000; // 180亿美元
      baseRDPercent = 0.07; // 7%
      baseRDGrowth = 0.12; // 12%
      baseRDEfficiency = 0.85; // 85%
      baseTrend = 'increasing';
      break;
    case 'MSFT':
      baseRDExpense = 22000; // 220亿美元
      baseRDPercent = 0.13; // 13%
      baseRDGrowth = 0.15; // 15%
      baseRDEfficiency = 0.80; // 80%
      baseTrend = 'increasing';
      break;
    case 'GOOGL':
      baseRDExpense = 30000; // 300亿美元
      baseRDPercent = 0.16; // 16%
      baseRDGrowth = 0.18; // 18%
      baseRDEfficiency = 0.75; // 75%
      baseTrend = 'increasing';
      break;
    case 'META':
      baseRDExpense = 25000; // 250亿美元
      baseRDPercent = 0.21; // 21%
      baseRDGrowth = 0.25; // 25%
      baseRDEfficiency = 0.65; // 65%
      baseTrend = 'increasing';
      break;
    case 'TSLA':
      baseRDExpense = 3500; // 35亿美元
      baseRDPercent = 0.05; // 5%
      baseRDGrowth = 0.30; // 30%
      baseRDEfficiency = 0.85; // 85%
      baseTrend = 'increasing';
      break;
    case 'AMZN':
      baseRDExpense = 42000; // 420亿美元
      baseRDPercent = 0.12; // 12%
      baseRDGrowth = 0.20; // 20%
      baseRDEfficiency = 0.75; // 75%
      baseTrend = 'increasing';
      break;
    case 'NVDA':
      baseRDExpense = 6500; // 65亿美元
      baseRDPercent = 0.25; // 25%
      baseRDGrowth = 0.35; // 35%
      baseRDEfficiency = 0.90; // 90%
      baseTrend = 'increasing';
      break;
    default:
      // 随机生成数据
      baseRDExpense = 1000 + Math.random() * 10000; // 10亿-100亿美元
      baseRDPercent = 0.05 + Math.random() * 0.15; // 5%-20%
      baseRDGrowth = 0.05 + Math.random() * 0.20; // 5%-25%
      baseRDEfficiency = 0.40 + Math.random() * 0.50; // 40%-90%
      
      // 随机趋势
      const trends: Array<'increasing' | 'decreasing' | 'stable'> = ['increasing', 'decreasing', 'stable'];
      baseTrend = trends[Math.floor(Math.random() * trends.length)];
  }
  
  // 添加一些随机波动
  const rdExpense = baseRDExpense * (1 + (Math.random() * 0.1 - 0.05)); // ±5%
  const rdAsPercentOfRevenue = baseRDPercent * (1 + (Math.random() * 0.1 - 0.05)); // ±5%
  const rdGrowthRate = baseRDGrowth * (1 + (Math.random() * 0.2 - 0.1)); // ±10%
  const rdEfficiency = Math.min(1, baseRDEfficiency * (1 + (Math.random() * 0.1 - 0.05))); // ±5%
  
  return {
    rdExpense,
    rdAsPercentOfRevenue,
    rdGrowthRate,
    rdEfficiency,
    fiveYearTrend: baseTrend
  };
}

/**
 * 分析专利情况
 */
function analyzePatents(ticker: string): {
  totalPatents: number;
  patentsLastYear: number;
  growthRate: number;
  keyAreas: string[];
  patentQuality: 'high' | 'medium' | 'low';
} {
  // 为不同公司设置不同的专利数据
  let baseTotalPatents: number;
  let basePatentsLastYear: number;
  let baseGrowthRate: number;
  let baseKeyAreas: string[];
  let baseQuality: 'high' | 'medium' | 'low';
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      baseTotalPatents = 25000;
      basePatentsLastYear = 2500;
      baseGrowthRate = 0.08;
      baseKeyAreas = ['移动设备', '用户界面', '可穿戴技术', '芯片设计', '人工智能'];
      baseQuality = 'high';
      break;
    case 'MSFT':
      baseTotalPatents = 30000;
      basePatentsLastYear = 3000;
      baseGrowthRate = 0.10;
      baseKeyAreas = ['云计算', '人工智能', '操作系统', '搜索技术', '增强现实'];
      baseQuality = 'high';
      break;
    case 'GOOGL':
      baseTotalPatents = 35000;
      basePatentsLastYear = 4000;
      baseGrowthRate = 0.15;
      baseKeyAreas = ['搜索算法', '人工智能', '自动驾驶', '云计算', '数据分析'];
      baseQuality = 'high';
      break;
    case 'META':
      baseTotalPatents = 20000;
      basePatentsLastYear = 3000;
      baseGrowthRate = 0.20;
      baseKeyAreas = ['社交网络', '虚拟现实', '增强现实', '数据分析', '加密通信'];
      baseQuality = 'medium';
      break;
    case 'TSLA':
      baseTotalPatents = 3000;
      basePatentsLastYear = 500;
      baseGrowthRate = 0.25;
      baseKeyAreas = ['电池技术', '自动驾驶', '电动机', '充电技术', '制造工艺'];
      baseQuality = 'high';
      break;
    case 'AMZN':
      baseTotalPatents = 15000;
      basePatentsLastYear = 2000;
      baseGrowthRate = 0.18;
      baseKeyAreas = ['物流系统', '云计算', '人工智能', '语音识别', '无人机配送'];
      baseQuality = 'medium';
      break;
    case 'NVDA':
      baseTotalPatents = 10000;
      basePatentsLastYear = 1500;
      baseGrowthRate = 0.30;
      baseKeyAreas = ['GPU架构', '深度学习', '计算机视觉', '并行计算', '自动驾驶'];
      baseQuality = 'high';
      break;
    default:
      // 随机生成数据
      baseTotalPatents = 1000 + Math.random() * 20000;
      basePatentsLastYear = baseTotalPatents * (0.05 + Math.random() * 0.10);
      baseGrowthRate = 0.05 + Math.random() * 0.20;
      
      // 随机选择关键领域
      const allAreas = [
        '人工智能', '机器学习', '云计算', '数据分析', '区块链',
        '物联网', '5G技术', '生物技术', '量子计算', '可再生能源',
        '虚拟现实', '增强现实', '网络安全', '自动化技术', '3D打印'
      ];
      
      baseKeyAreas = [...allAreas].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));
      
      // 随机质量
      const qualities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
      baseQuality = qualities[Math.floor(Math.random() * qualities.length)];
  }
  
  // 添加一些随机波动
  const totalPatents = Math.round(baseTotalPatents * (1 + (Math.random() * 0.1 - 0.05))); // ±5%
  const patentsLastYear = Math.round(basePatentsLastYear * (1 + (Math.random() * 0.1 - 0.05))); // ±5%
  const growthRate = baseGrowthRate * (1 + (Math.random() * 0.2 - 0.1)); // ±10%
  
  return {
    totalPatents,
    patentsLastYear,
    growthRate,
    keyAreas: baseKeyAreas,
    patentQuality: baseQuality
  };
}

/**
 * 分析产品创新
 */
function analyzeProductInnovation(ticker: string): {
  newProductsLastYear: number;
  averageProductCycle: number; // 月
  innovationSuccessRate: number; // 0-1
  disruptionPotential: 'high' | 'medium' | 'low';
  keyInnovations: string[];
} {
  // 为不同公司设置不同的产品创新数据
  let baseNewProducts: number;
  let baseProductCycle: number;
  let baseSuccessRate: number;
  let baseDisruptionPotential: 'high' | 'medium' | 'low';
  let baseKeyInnovations: string[];
  
  switch (ticker.toUpperCase()) {
    case 'AAPL':
      baseNewProducts = 5;
      baseProductCycle = 12;
      baseSuccessRate = 0.80;
      baseDisruptionPotential = 'high';
      baseKeyInnovations = ['Vision Pro', 'Apple Silicon', 'iPhone创新', '健康监测技术', 'Apple Intelligence'];
      break;
    case 'MSFT':
      baseNewProducts = 8;
      baseProductCycle = 18;
      baseSuccessRate = 0.75;
      baseDisruptionPotential = 'medium';
      baseKeyInnovations = ['Microsoft Copilot', 'Azure AI服务', 'Surface创新', '量子计算研究', 'Windows创新'];
      break;
    case 'GOOGL':
      baseNewProducts = 12;
      baseProductCycle = 6;
      baseSuccessRate = 0.60;
      baseDisruptionPotential = 'high';
      baseKeyInnovations = ['生成式AI产品', 'Waymo自动驾驶', 'Android创新', 'Quantum AI', '搜索算法革新'];
      break;
    case 'META':
      baseNewProducts = 6;
      baseProductCycle = 8;
      baseSuccessRate = 0.65;
      baseDisruptionPotential = 'high';
      baseKeyInnovations = ['Meta Quest', 'Llama AI模型', '社交媒体创新', '元宇宙技术', 'AR眼镜'];
      break;
    case 'TSLA':
      baseNewProducts = 3;
      baseProductCycle = 24;
      baseSuccessRate = 0.70;
      baseDisruptionPotential = 'high';
      baseKeyInnovations = ['全自动驾驶', '新电池技术', '机器人', '太阳能屋顶', '新车型创新'];
      break;
    case 'AMZN':
      baseNewProducts = 15;
      baseProductCycle = 10;
      baseSuccessRate = 0.50;
      baseDisruptionPotential = 'medium';
      baseKeyInnovations = ['无人商店技术', 'AWS创新服务', 'Alexa创新', '无人机配送', '物流自动化'];
      break;
    case 'NVDA':
      baseNewProducts = 4;
      baseProductCycle = 18;
      baseSuccessRate = 0.85;
      baseDisruptionPotential = 'high';
      baseKeyInnovations = ['AI芯片架构', 'CUDA生态系统', '光线追踪技术', '深度学习加速器', '数字孪生技术'];
      break;
    default:
      // 随机生成数据
      baseNewProducts = 2 + Math.random() * 10;
      baseProductCycle = 6 + Math.random() * 24;
      baseSuccessRate = 0.30 + Math.random() * 0.50;
      
      // 随机创新潜力
      const potentials: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
      baseDisruptionPotential = potentials[Math.floor(Math.random() * potentials.length)];
      
      // 随机关键创新
      const allInnovations = [
        'AI集成产品', '物联网设备', '可持续技术', '5G解决方案', '云原生应用',
        '边缘计算技术', '区块链应用', '智能自动化', '数据分析平台', '安全解决方案',
        '远程协作工具', '生物识别技术', '机器人流程自动化', '增强现实应用', '健康监测技术'
      ];
      
      baseKeyInnovations = [...allInnovations].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));
  }
  
  // 添加一些随机波动
  const newProductsLastYear = Math.round(baseNewProducts * (1 + (Math.random() * 0.2 - 0.1))); // ±10%
  const averageProductCycle = baseProductCycle * (1 + (Math.random() * 0.1 - 0.05)); // ±5%
  const innovationSuccessRate = Math.min(1, baseSuccessRate * (1 + (Math.random() * 0.1 - 0.05))); // ±5%
  
  return {
    newProductsLastYear,
    averageProductCycle,
    innovationSuccessRate,
    disruptionPotential: baseDisruptionPotential,
    keyInnovations: baseKeyInnovations
  };
}

/**
 * 评估创新能力
 */
function evaluateInnovation(
  rdData: {
    rdExpense: number;
    rdAsPercentOfRevenue: number;
    rdGrowthRate: number;
    rdEfficiency: number;
    fiveYearTrend: 'increasing' | 'decreasing' | 'stable';
  },
  patentData: {
    totalPatents: number;
    patentsLastYear: number;
    growthRate: number;
    patentQuality: 'high' | 'medium' | 'low';
  },
  productInnovation: {
    newProductsLastYear: number;
    innovationSuccessRate: number;
    disruptionPotential: 'high' | 'medium' | 'low';
  }
): {
  score: number;
  analysis: string;
} {
  // 基于研发投入评分 (0-3分)
  let rdScore = 0;
  if (rdData.rdAsPercentOfRevenue > 0.15) rdScore = 3;
  else if (rdData.rdAsPercentOfRevenue > 0.10) rdScore = 2;
  else if (rdData.rdAsPercentOfRevenue > 0.05) rdScore = 1;
  
  // 如果研发增长强劲，加分
  if (rdData.rdGrowthRate > 0.20 && rdData.fiveYearTrend === 'increasing') rdScore = Math.min(3, rdScore + 1);
  
  // 基于专利评分 (0-3分)
  let patentScore = 0;
  if (patentData.patentsLastYear > 2000) patentScore = 3;
  else if (patentData.patentsLastYear > 1000) patentScore = 2;
  else if (patentData.patentsLastYear > 500) patentScore = 1;
  
  // 考虑专利质量
  if (patentData.patentQuality === 'high') patentScore = Math.min(3, patentScore + 1);
  else if (patentData.patentQuality === 'low') patentScore = Math.max(0, patentScore - 1);
  
  // 基于产品创新评分 (0-4分)
  let productScore = 0;
  
  // 新产品数量
  if (productInnovation.newProductsLastYear > 10) productScore += 1.5;
  else if (productInnovation.newProductsLastYear > 5) productScore += 1;
  else if (productInnovation.newProductsLastYear > 2) productScore += 0.5;
  
  // 创新成功率
  if (productInnovation.innovationSuccessRate > 0.75) productScore += 1.5;
  else if (productInnovation.innovationSuccessRate > 0.5) productScore += 1;
  else if (productInnovation.innovationSuccessRate > 0.3) productScore += 0.5;
  
  // 颠覆潜力
  if (productInnovation.disruptionPotential === 'high') productScore += 1;
  else if (productInnovation.disruptionPotential === 'medium') productScore += 0.5;
  
  // 总得分 (0-10分)
  const totalScore = Math.min(10, rdScore + patentScore + productScore);
  
  // 分析评价
  let analysis = '';
  
  if (totalScore >= 8) {
    analysis = `卓越的创新能力。研发投入为收入的${(rdData.rdAsPercentOfRevenue * 100).toFixed(1)}%，专利质量${
      patentData.patentQuality === 'high' ? '高' : patentData.patentQuality === 'medium' ? '中等' : '低'
    }，去年申请了${patentData.patentsLastYear}项专利，拥有${productInnovation.newProductsLastYear}项新产品，创新成功率${(productInnovation.innovationSuccessRate * 100).toFixed(1)}%。具有${
      productInnovation.disruptionPotential === 'high' ? '高度' : productInnovation.disruptionPotential === 'medium' ? '中等' : '有限的'
    }产业颠覆潜力。`;
  } else if (totalScore >= 6) {
    analysis = `强劲的创新能力。研发投入为收入的${(rdData.rdAsPercentOfRevenue * 100).toFixed(1)}%，去年申请了${patentData.patentsLastYear}项专利，拥有${productInnovation.newProductsLastYear}项新产品。具备良好的产品创新记录和市场竞争力。`;
  } else if (totalScore >= 4) {
    analysis = `一般的创新能力。研发投入为收入的${(rdData.rdAsPercentOfRevenue * 100).toFixed(1)}%，专利活动和产品创新处于行业平均水平。有一定的创新潜力，但可能缺乏颠覆性突破。`;
  } else {
    analysis = `较弱的创新能力。研发投入较低，仅为收入的${(rdData.rdAsPercentOfRevenue * 100).toFixed(1)}%，专利活动有限，产品创新不足。在快速变化的市场中可能面临挑战。`;
  }
  
  return {
    score: totalScore,
    analysis
  };
} 