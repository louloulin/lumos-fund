'use server'

import { mastra } from '@/mastra';
import { revalidatePath } from 'next/cache';

/**
 * 分析股票
 * @param ticker 股票代码
 * @param portfolio 投资组合信息
 */
export async function analyzeStock(ticker: string, portfolio: any) {
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
    console.error('分析股票失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '分析失败'
    };
  }
}

/**
 * 获取价值投资代理分析
 */
export async function getValueInvestingAnalysis(ticker: string, data: any) {
  try {
    const agent = mastra.getAgent('valueInvestingAgent');
    
    const prompt = `分析 ${ticker} 股票的价值投资机会`;
    const result = await agent.generate(prompt, {
      inputs: {
        ticker,
        data
      }
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('价值投资分析失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '分析失败'
    };
  }
}

/**
 * 获取技术分析代理分析
 */
export async function getTechnicalAnalysis(ticker: string, data: any) {
  try {
    const agent = mastra.getAgent('technicalAnalysisAgent');
    
    const prompt = `分析 ${ticker} 股票的技术指标`;
    const result = await agent.generate(prompt, {
      inputs: {
        ticker,
        data
      }
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('技术分析失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '分析失败'
    };
  }
} 