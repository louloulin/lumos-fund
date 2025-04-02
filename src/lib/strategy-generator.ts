import { Strategy } from './backtester';
import { mastra } from '@/mastra';
import { createLogger } from './logger.server';

const logger = createLogger('strategyGenerator');

export interface AgentStrategyOptions {
  name: string;
  type: 'value' | 'technical' | 'sentiment' | 'mixed';
  agentName: string;
  params?: Record<string, any>;
}

/**
 * 创建基于价值投资代理的策略
 */
export async function createValueStrategy(
  options: AgentStrategyOptions
): Promise<Strategy> {
  logger.info(`创建价值投资策略: ${options.name}`);
  
  const agent = mastra.getAgent('valueInvestingAgent');
  
  return {
    name: options.name,
    type: options.type,
    params: options.params || {},
    generateSignal: async (data, date) => {
      const ticker = data.ticker;
      
      // 利用价值投资代理分析股票
      const prompt = `
        分析 ${ticker} 股票在 ${date} 的价值投资潜力。
        
        价格数据:
        - 收盘价: ${data.close}
        - 开盘价: ${data.open}
        - 最高价: ${data.high}
        - 最低价: ${data.low}
        - 成交量: ${data.volume}
        
        请给出明确的交易信号（买入/卖出/持有）以及置信度(0-100)。
      `;
      
      try {
        const result = await agent.generate(prompt);
        
        // 简单解析代理输出以获取交易信号
        const text = result.text;
        let action = 'hold';
        let confidence = 50;
        
        // 解析交易信号
        if (text.toLowerCase().includes('买入') || text.toLowerCase().includes('看涨')) {
          action = 'buy';
          // 提取置信度
          const confidenceMatch = text.match(/置信度[：:]\s*(\d+)/);
          if (confidenceMatch && confidenceMatch[1]) {
            confidence = parseInt(confidenceMatch[1], 10);
          } else {
            // 随机生成中高置信度
            confidence = 50 + Math.floor(Math.random() * 30);
          }
        } else if (text.toLowerCase().includes('卖出') || text.toLowerCase().includes('看跌')) {
          action = 'sell';
          // 提取置信度
          const confidenceMatch = text.match(/置信度[：:]\s*(\d+)/);
          if (confidenceMatch && confidenceMatch[1]) {
            confidence = parseInt(confidenceMatch[1], 10);
          } else {
            // 随机生成中高置信度
            confidence = 50 + Math.floor(Math.random() * 30);
          }
        }
        
        logger.info(`${date} - ${ticker} 生成信号: ${action}, 置信度: ${confidence}`);
        return { action, confidence };
      } catch (error) {
        logger.error(`策略信号生成失败: ${error}`);
        return { action: 'hold', confidence: 0 };
      }
    }
  };
}

/**
 * 创建基于技术分析代理的策略
 */
export async function createTechnicalStrategy(
  options: AgentStrategyOptions
): Promise<Strategy> {
  logger.info(`创建技术分析策略: ${options.name}`);
  
  const agent = mastra.getAgent('technicalAnalysisAgent');
  
  return {
    name: options.name,
    type: options.type,
    params: options.params || {},
    generateSignal: async (data, date) => {
      const ticker = data.ticker;
      
      // 利用技术分析代理分析股票
      const prompt = `
        分析 ${ticker} 股票在 ${date} 的技术指标。
        
        价格数据:
        - 收盘价: ${data.close}
        - 开盘价: ${data.open}
        - 最高价: ${data.high}
        - 最低价: ${data.low}
        - 成交量: ${data.volume}
        - 日涨跌: ${data.change}%
        
        请给出明确的交易信号（买入/卖出/持有）以及置信度(0-100)。
      `;
      
      try {
        const result = await agent.generate(prompt);
        
        // 简单解析代理输出以获取交易信号
        const text = result.text;
        let action = 'hold';
        let confidence = 50;
        
        // 解析交易信号
        if (text.toLowerCase().includes('买入') || text.toLowerCase().includes('看涨') || text.toLowerCase().includes('上升趋势')) {
          action = 'buy';
          confidence = 50 + Math.floor(Math.random() * 40); // 技术分析通常有更高的置信度
        } else if (text.toLowerCase().includes('卖出') || text.toLowerCase().includes('看跌') || text.toLowerCase().includes('下降趋势')) {
          action = 'sell';
          confidence = 50 + Math.floor(Math.random() * 40);
        }
        
        logger.info(`${date} - ${ticker} 生成信号: ${action}, 置信度: ${confidence}`);
        return { action, confidence };
      } catch (error) {
        logger.error(`策略信号生成失败: ${error}`);
        return { action: 'hold', confidence: 0 };
      }
    }
  };
}

/**
 * 创建基于情绪分析代理的策略
 */
export async function createSentimentStrategy(
  options: AgentStrategyOptions
): Promise<Strategy> {
  logger.info(`创建情绪分析策略: ${options.name}`);
  
  const agent = mastra.getAgent('sentimentAnalysisAgent');
  
  return {
    name: options.name,
    type: options.type,
    params: options.params || {},
    generateSignal: async (data, date) => {
      const ticker = data.ticker;
      
      // 利用情绪分析代理分析股票
      const prompt = `
        分析 ${ticker} 股票在 ${date} 的市场情绪。
        
        价格数据:
        - 收盘价: ${data.close}
        - 日涨跌: ${data.change}%
        - 成交量: ${data.volume}
        
        请给出明确的交易信号（买入/卖出/持有）以及置信度(0-100)。
      `;
      
      try {
        const result = await agent.generate(prompt);
        
        // 简单解析代理输出以获取交易信号
        const text = result.text;
        let action = 'hold';
        let confidence = 50;
        
        // 解析交易信号
        if (text.toLowerCase().includes('积极') || text.toLowerCase().includes('看涨') || text.toLowerCase().includes('乐观')) {
          action = 'buy';
          confidence = 40 + Math.floor(Math.random() * 30); // 情绪分析通常有较低的置信度
        } else if (text.toLowerCase().includes('谨慎') || text.toLowerCase().includes('看跌') || text.toLowerCase().includes('悲观')) {
          action = 'sell';
          confidence = 40 + Math.floor(Math.random() * 30);
        }
        
        logger.info(`${date} - ${ticker} 生成信号: ${action}, 置信度: ${confidence}`);
        return { action, confidence };
      } catch (error) {
        logger.error(`策略信号生成失败: ${error}`);
        return { action: 'hold', confidence: 0 };
      }
    }
  };
}

/**
 * 创建基于风险管理代理的策略
 */
export async function createRiskManagedStrategy(
  options: AgentStrategyOptions
): Promise<Strategy> {
  logger.info(`创建风险管理策略: ${options.name}`);
  
  const agent = mastra.getAgent('riskManagementAgent');
  
  return {
    name: options.name,
    type: options.type,
    params: options.params || {},
    generateSignal: async (data, date) => {
      const ticker = data.ticker;
      
      // 利用风险管理代理分析股票
      const prompt = `
        评估 ${ticker} 股票在 ${date} 的投资风险。
        
        价格数据:
        - 收盘价: ${data.close}
        - 开盘价: ${data.open}
        - 最高价: ${data.high}
        - 最低价: ${data.low}
        - 成交量: ${data.volume}
        - 日涨跌: ${data.change}%
        
        请评估风险水平并给出风险管理建议。
      `;
      
      try {
        const result = await agent.generate(prompt);
        
        // 解析风险评估结果
        const text = result.text;
        let action = 'hold';
        let confidence = 50;
        
        // 基于风险级别设置信号
        if (text.includes('低风险')) {
          action = 'buy';
          confidence = 60 + Math.floor(Math.random() * 20);
        } else if (text.includes('高风险')) {
          action = 'sell';
          confidence = 60 + Math.floor(Math.random() * 20);
        } else if (text.includes('中等风险')) {
          // 中等风险时，根据其他因素随机决定
          if (Math.random() > 0.5) {
            action = Math.random() > 0.7 ? 'buy' : 'sell';
            confidence = 40 + Math.floor(Math.random() * 20);
          }
        }
        
        logger.info(`${date} - ${ticker} 风险管理信号: ${action}, 置信度: ${confidence}`);
        return { action, confidence };
      } catch (error) {
        logger.error(`风险管理信号生成失败: ${error}`);
        return { action: 'hold', confidence: 0 };
      }
    }
  };
}

/**
 * 创建混合策略
 */
export async function createMixedStrategy(options: {
  name: string;
  valueWeight?: number;
  technicalWeight?: number;
  sentimentWeight?: number;
  riskWeight?: number;
  params?: Record<string, any>;
}): Promise<Strategy> {
  logger.info(`创建混合策略: ${options.name}`);
  
  // 设置默认权重
  const valueWeight = options.valueWeight || 0.3;
  const technicalWeight = options.technicalWeight || 0.3;
  const sentimentWeight = options.sentimentWeight || 0.2;
  const riskWeight = options.riskWeight || 0.2;
  
  // 创建各个策略
  const valueStrategy = await createValueStrategy({
    name: `${options.name}_value`,
    type: 'value',
    agentName: 'valueInvestingAgent'
  });
  
  const technicalStrategy = await createTechnicalStrategy({
    name: `${options.name}_technical`,
    type: 'technical',
    agentName: 'technicalAnalysisAgent'
  });
  
  const sentimentStrategy = await createSentimentStrategy({
    name: `${options.name}_sentiment`,
    type: 'sentiment',
    agentName: 'sentimentAnalysisAgent'
  });
  
  const riskStrategy = await createRiskManagedStrategy({
    name: `${options.name}_risk`,
    type: 'mixed',
    agentName: 'riskManagementAgent'
  });
  
  return {
    name: options.name,
    type: 'mixed',
    params: {
      valueWeight,
      technicalWeight,
      sentimentWeight,
      riskWeight,
      ...options.params
    },
    generateSignal: async (data, date) => {
      // 获取各策略信号
      const valueSignal = await valueStrategy.generateSignal(data, date);
      const technicalSignal = await technicalStrategy.generateSignal(data, date);
      const sentimentSignal = await sentimentStrategy.generateSignal(data, date);
      const riskSignal = await riskStrategy.generateSignal(data, date);
      
      // 计算买入/卖出/持有信号的加权得分
      let buyScore = 0;
      let sellScore = 0;
      
      // 价值投资信号
      if (valueSignal.action === 'buy') {
        buyScore += valueWeight * (valueSignal.confidence / 100);
      } else if (valueSignal.action === 'sell') {
        sellScore += valueWeight * (valueSignal.confidence / 100);
      }
      
      // 技术分析信号
      if (technicalSignal.action === 'buy') {
        buyScore += technicalWeight * (technicalSignal.confidence / 100);
      } else if (technicalSignal.action === 'sell') {
        sellScore += technicalWeight * (technicalSignal.confidence / 100);
      }
      
      // 情绪分析信号
      if (sentimentSignal.action === 'buy') {
        buyScore += sentimentWeight * (sentimentSignal.confidence / 100);
      } else if (sentimentSignal.action === 'sell') {
        sellScore += sentimentWeight * (sentimentSignal.confidence / 100);
      }
      
      // 风险管理信号
      if (riskSignal.action === 'buy') {
        buyScore += riskWeight * (riskSignal.confidence / 100);
      } else if (riskSignal.action === 'sell') {
        sellScore += riskWeight * (riskSignal.confidence / 100);
      }
      
      // 决定最终信号
      let action = 'hold';
      let confidence = 0;
      
      if (buyScore > sellScore && buyScore > 0.3) {
        action = 'buy';
        confidence = Math.round(buyScore * 100);
      } else if (sellScore > buyScore && sellScore > 0.3) {
        action = 'sell';
        confidence = Math.round(sellScore * 100);
      }
      
      logger.info(`${date} - ${data.ticker} 混合策略信号: ${action}, 置信度: ${confidence}`);
      
      return { action, confidence };
    }
  };
}