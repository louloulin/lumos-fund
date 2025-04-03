import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * 因子模型工具 - 分析股票的多因子暴露度
 */
export const factorModelTool = createTool({
  id: 'factorModelTool',
  description: '使用多因子模型分析股票的因子暴露度，包括价值、动量、质量、规模和波动性因子',
  inputSchema: z.object({
    ticker: z.string().describe('股票代码'),
    factors: z.array(z.string()).describe('要分析的因子列表'),
    benchmark: z.string().optional().describe('基准指数（默认为SPY）'),
    period: z.string().optional().describe('分析周期（默认为1y）')
  }),
  execute: async ({ ticker, factors, benchmark = 'SPY', period = '1y' }: { 
    ticker: string; 
    factors: string[]; 
    benchmark?: string; 
    period?: string; 
  }) => {
    console.log(`分析股票 ${ticker} 的因子暴露度`, { factors, benchmark, period });

    try {
      // 在实际项目中应该调用因子数据API
      // 这里使用模拟数据实现
      const response = await fetch(
        `https://lumosfund-api.vercel.app/api/factor-data?ticker=${ticker}&benchmark=${benchmark}&period=${period}`
      );

      if (!response.ok) {
        return {
          ticker,
          success: false,
          error: `获取因子数据失败: ${response.status}`
        };
      }

      // 模拟数据
      const mockFactorData = generateMockFactorData(ticker, factors);
      
      // 计算整体评分
      const overallScore = calculateOverallScore(mockFactorData);

      return {
        ticker,
        benchmark,
        period,
        factorExposures: mockFactorData,
        overallScore,
        success: true
      };
    } catch (error) {
      console.error(`分析股票 ${ticker} 的因子暴露度时出错:`, error);
      return {
        ticker,
        success: false,
        error: `因子分析失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
});

/**
 * 生成模拟因子数据
 */
function generateMockFactorData(ticker: string, factors: string[]): Record<string, any> {
  const result: Record<string, any> = {};

  // 生成随机但有偏差的因子暴露度 - 使一些股票有倾向性
  const tickerSeed = sumChars(ticker) % 100; // 使用股票代码生成稳定的"随机"种子
  
  factors.forEach(factor => {
    switch (factor.toLowerCase()) {
      case 'value':
        result.value = generateFactorData(
          'value', 
          tickerSeed, 
          0.3, // 价值股偏向
          ['市盈率(PE)', '市净率(PB)', '股息率', '自由现金流收益率'],
          ['低估值', '合理估值', '价值被低估', '价值型']
        );
        break;
      case 'momentum':
        result.momentum = generateFactorData(
          'momentum', 
          tickerSeed, 
          0.1, // 轻微动量偏向
          ['6个月动量', '12个月动量', '相对强弱指数', '价格趋势'],
          ['强劲上升动量', '正向动量', '动量减弱', '动量转向']
        );
        break;
      case 'quality':
        result.quality = generateFactorData(
          'quality', 
          tickerSeed, 
          0.2, // 质量偏向
          ['ROE', '利润率', '资产负债率', '盈利稳定性'],
          ['优秀质量', '良好质量', '一般质量', '质量下降']
        );
        break;
      case 'size':
        // 根据股票代码决定规模特性
        const isBigCompany = tickerSeed > 50;
        const marketCap = isBigCompany 
          ? 200000000000 + (tickerSeed * 10000000000) 
          : 5000000000 + (tickerSeed * 100000000);
        const sizeCategory = marketCap > 100000000000 ? '超大型股' : 
                           marketCap > 10000000000 ? '大型股' :
                           marketCap > 2000000000 ? '中型股' : '小型股';
                           
        result.size = {
          marketCap,
          category: sizeCategory,
          score: isBigCompany ? 0.1 + (Math.random() * 0.3) : 0.6 + (Math.random() * 0.3),
          interpretation: isBigCompany ? '大型股特征' : '中小型股特征',
          subFactors: {
            '市值': marketCap,
            '流通股本': marketCap * 0.8 * (0.8 + Math.random() * 0.4),
            '成交量': isBigCompany ? '高' : '中'
          }
        };
        break;
      case 'volatility':
        result.volatility = generateFactorData(
          'volatility', 
          tickerSeed, 
          -0.1, // 偏向低波动
          ['贝塔系数', '波动率', '下行风险', '最大回撤'],
          ['低波动性', '适中波动性', '良好风险回报', '波动较大']
        );
        break;
      default:
        result[factor] = {
          score: (Math.random() * 2 - 1), // -1 到 1 之间
          interpretation: '未知因子'
        };
    }
  });

  return result;
}

/**
 * 生成特定因子的详细数据
 */
function generateFactorData(
  factorName: string, 
  seed: number, 
  bias: number, 
  subFactors: string[],
  interpretations: string[]
): any {
  // 使用种子生成-1到1之间的得分，并加入偏差
  const baseRandom = Math.sin(seed * factorName.length) * 0.5 + 0.5; // 0到1
  let score = (baseRandom * 2 - 1) + bias; // 加入偏差
  score = Math.max(-1, Math.min(1, score)); // 确保在-1到1之间
  
  // 归一化到0-1区间用于解释
  const normalizedScore = (score + 1) / 2; // 0到1
  
  // 选择解释文本
  const interpretationIndex = Math.floor(normalizedScore * interpretations.length);
  const interpretation = interpretations[Math.min(interpretationIndex, interpretations.length - 1)];
  
  // 生成子因子数据
  const subFactorData: Record<string, number> = {};
  subFactors.forEach(subFactor => {
    const subFactorSeed = (seed + subFactor.length) % 100;
    const subFactorRandom = Math.sin(subFactorSeed) * 0.5 + 0.5;
    subFactorData[subFactor] = score * 0.7 + (subFactorRandom * 2 - 1) * 0.3; // 主因子得分 + 随机波动
  });
  
  return {
    score: parseFloat(score.toFixed(2)),
    interpretation,
    subFactors: subFactorData
  };
}

/**
 * 计算基于所有因子的综合评分
 */
function calculateOverallScore(factorData: Record<string, any>): any {
  // 因子权重
  const weights: Record<string, number> = {
    value: 0.25,
    quality: 0.25,
    momentum: 0.2,
    size: 0.1,
    volatility: 0.2
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  // 计算加权得分
  Object.entries(factorData).forEach(([factor, data]) => {
    if (factor in weights && 'score' in data) {
      weightedSum += data.score * weights[factor];
      totalWeight += weights[factor];
    }
  });
  
  // 如果没有有效因子，返回中性评分
  if (totalWeight === 0) {
    return {
      score: 0,
      interpretation: '数据不足',
      investment_view: '需要更多数据'
    };
  }
  
  // 计算最终得分并归一化到0-1
  const finalScore = weightedSum / totalWeight;
  const normalizedScore = (finalScore + 1) / 2; // 转换为0-1范围
  
  // 根据得分确定解释和投资观点
  let interpretation, investment_view;
  
  if (normalizedScore > 0.8) {
    interpretation = '极具吸引力';
    investment_view = '强烈买入';
  } else if (normalizedScore > 0.6) {
    interpretation = '具有吸引力';
    investment_view = '买入';
  } else if (normalizedScore > 0.45) {
    interpretation = '略具吸引力';
    investment_view = '持有偏买入';
  } else if (normalizedScore > 0.35) {
    interpretation = '中性';
    investment_view = '持有';
  } else if (normalizedScore > 0.2) {
    interpretation = '略缺乏吸引力';
    investment_view = '持有偏卖出';
  } else {
    interpretation = '缺乏吸引力';
    investment_view = '卖出';
  }
  
  return {
    score: parseFloat(normalizedScore.toFixed(2)),
    interpretation,
    investment_view
  };
}

/**
 * 辅助函数：将字符串转换为数值
 */
function sumChars(str: string): number {
  return str.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
} 