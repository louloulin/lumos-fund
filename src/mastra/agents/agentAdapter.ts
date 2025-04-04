import { createLogger } from '@/lib/logger.server';

const logger = createLogger('agentAdapter');

/**
 * 适配器类型定义，用于扩展Mastra代理功能
 */
export interface MastraAgent {
  generate: (prompt: string) => Promise<{
    text: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

/**
 * 代理运行输入参数
 */
export interface RunInput {
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
}

/**
 * 代理运行输出结果
 */
export interface RunOutput {
  content: string;
  [key: string]: any;
}

/**
 * 为Mastra代理添加run方法，以匹配更现代的接口
 * @param agent Mastra代理实例
 */
export function addRunMethod(agent: MastraAgent): MastraAgent {
  // 如果代理已经有run方法，直接返回
  if (typeof agent.run === 'function') {
    return agent;
  }

  // 为代理实例添加run方法
  agent.run = async (input: RunInput): Promise<RunOutput> => {
    try {
      // 提取用户消息
      const userMessage = input.messages.find(m => m.role === 'user')?.content;
      
      if (!userMessage) {
        throw new Error('没有找到用户消息');
      }
      
      // 使用原始的generate方法
      const response = await agent.generate(userMessage);
      
      // 将generate的输出转换为run输出格式
      return {
        content: response.text,
        ...response
      };
    } catch (error) {
      logger.error('代理运行失败', { error });
      throw error;
    }
  };
 