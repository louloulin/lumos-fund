'use server'

// Server-side imports - 只在服务器运行
import { mastra } from '@/mastra';
import { revalidatePath } from 'next/cache';
import { createLogger } from '@/lib/logger.server';
import { stockPriceTool } from '@/mastra';

const logger = createLogger('actions');

/**
 * 分析股票
 * @param ticker 股票代码
 * @param portfolio 投资组合信息
 */
export async function analyzeStock(ticker: string, portfolio: any) {
  logger.info(`执行完整交易决策分析: ${ticker}`);
  
  try {
    // 获取交易决策工作流
    const workflow = mastra.getWorkflow('tradingDecisionWorkflow');
    
    // 执行工作流
    const result = await workflow.execute({
      context: {
        ticker,
        portfolio,
      }
    });
    
    // 重新验证路径
    revalidatePath('/dashboard');
    
    return { success: true, data: result };
  } catch (error) {
    logger.error('分析股票失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '分析失败'
    };
  }
}

/**
 * 获取价值投资分析
 * @param ticker 股票代码
 * @param data 股票数据
 */
export async function getValueInvestingAnalysis(ticker: string, data: any) {
  logger.info(`执行价值投资分析: ${ticker}`);
  
  try {
    const agent = mastra.getAgent('valueInvestingAgent');
    
    const prompt = `分析 ${ticker} 股票的价值投资潜力。
      
      价格: ${data?.currentPrice || 'N/A'}
      市值: ${data?.marketCap || 'N/A'}
      市盈率: ${data?.pe || 'N/A'}
      股息率: ${data?.dividendYield || 'N/A'}%
      52周最高价: ${data?.high52 || 'N/A'}
      52周最低价: ${data?.low52 || 'N/A'}
    `;
    
    const result = await agent.generate(prompt);
    
    // 重新验证相关路径确保数据刷新
    revalidatePath('/analysis');
    
    return { success: true, data: result.text || result };
  } catch (error) {
    logger.error('价值投资分析失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '分析失败'
    };
  }
}

/**
 * 获取技术分析
 */
export async function getTechnicalAnalysis(ticker: string, data: any) {
  logger.info(`执行技术分析: ${ticker}`);
  
  try {
    const agent = mastra.getAgent('technicalAnalysisAgent');
    
    const prompt = `分析 ${ticker} 股票的技术面。
      
      当前价格: ${data?.currentPrice || 'N/A'}
      成交量: ${data?.volume || 'N/A'}
      日涨跌: ${data?.change || 'N/A'} (${data?.changePercent || 'N/A'}%)
    `;
    
    const result = await agent.generate(prompt);
    
    // 重新验证相关路径确保数据刷新
    revalidatePath('/analysis');
    
    return { success: true, data: result.text || result };
  } catch (error) {
    logger.error('技术分析失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '分析失败'
    };
  }
}

/**
 * 获取情绪分析
 */
export async function getSentimentAnalysis(ticker: string) {
  logger.info(`执行情绪分析: ${ticker}`);
  
  try {
    const agent = mastra.getAgent('sentimentAnalysisAgent');
    
    const prompt = `分析 ${ticker} 股票的市场情绪。`;
    
    const result = await agent.generate(prompt);
    
    // 重新验证相关路径确保数据刷新
    revalidatePath('/analysis');
    
    return { success: true, data: result.text || result };
  } catch (error) {
    logger.error('情绪分析失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '分析失败'
    };
  }
}

/**
 * 获取风险评估
 */
export async function getRiskAssessment(ticker: string, data: any, analyses: any) {
  logger.info(`执行风险评估: ${ticker}`);
  
  try {
    const agent = mastra.getAgent('riskManagementAgent');
    
    const prompt = `评估 ${ticker} 股票的投资风险。
      
      当前价格: ${data?.currentPrice || 'N/A'}
      市值: ${data?.marketCap || 'N/A'}
      市盈率: ${data?.pe || 'N/A'}
      波动率: ${data?.change || 'N/A'}%
      
      价值分析: ${analyses?.valueAnalysis || '无'}
      技术分析: ${analyses?.technicalAnalysis || '无'}
      情绪分析: ${analyses?.sentimentAnalysis || '无'}
    `;
    
    const result = await agent.generate(prompt);
    
    // 重新验证相关路径确保数据刷新
    revalidatePath('/analysis');
    
    return { success: true, data: result.text || result };
  } catch (error) {
    logger.error('风险评估失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '评估失败'
    };
  }
}

/**
 * 获取股票价格数据
 */
export async function getStockPriceData(ticker: string) {
  logger.info(`获取股票数据: ${ticker}`);
  
  try {    
    // 直接使用导入的stockPriceTool
    if (!stockPriceTool || !stockPriceTool.execute) {
      throw new Error('stockPriceTool未找到或不可用');
    }
    
    const result = await stockPriceTool.execute({ 
      context: { ticker } 
    });
    
    // 重新验证相关路径确保数据刷新
    revalidatePath('/analysis');
    
    return { success: true, data: result };
  } catch (error) {
    logger.error('获取股票数据失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '获取数据失败'
    };
  }
} 