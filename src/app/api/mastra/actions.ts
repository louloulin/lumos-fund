'use server';

import { valueInvestingAgent, growthInvestingAgent, trendInvestingAgent, quantInvestingAgent, macroAnalysisAgent, sentimentAnalysisAgent } from '@/mastra';

/**
 * 测试Mastra AI代理
 * @param agentType 代理类型
 * @param prompt 提示词
 * @returns 代理响应内容
 */
export async function testAgent(agentType: string, prompt: string): Promise<string> {
  try {
    // 根据代理类型选择相应的代理
    let agent;
    switch (agentType) {
      case 'valueInvesting':
        agent = valueInvestingAgent;
        break;
      case 'growthInvesting':
        agent = growthInvestingAgent;
        break;
      case 'trendInvesting':
        agent = trendInvestingAgent;
        break;
      case 'quantInvesting':
        agent = quantInvestingAgent;
        break;
      case 'macroAnalysis':
        agent = macroAnalysisAgent;
        break;
      case 'sentimentAnalysis':
        agent = sentimentAnalysisAgent;
        break;
      default:
        throw new Error(`未知的代理类型: ${agentType}`);
    }

    // 生成响应
    const response = await agent.generate(prompt);
    return response.text;
  } catch (error) {
    console.error('代理调用错误:', error);
    
    // 检查是否为服务器环境（防止客户端直接调用）
    if (typeof window === 'undefined') {
      // 格式化错误消息
      const errorMessage = error instanceof Error 
        ? error.message 
        : '未知错误';
      
      throw new Error(`调用Mastra代理失败: ${errorMessage}`);
    } else {
      // 客户端环境下提供通用错误
      throw new Error('服务器处理请求失败');
    }
  }
} 