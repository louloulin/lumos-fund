import { Agent } from '@mastra/core/agent';
import { Tool } from '@mastra/core/tools';
import { beforeEach, afterEach, vi } from 'vitest';

// 创建一个存根LLM函数，用于测试
export const createMockLLM = (mockResponse: any) => {
  return vi.fn().mockResolvedValue(mockResponse);
};

// 为工具创建模拟执行函数
export const createMockTool = (name: string, mockResponse: any): Tool => {
  return {
    name,
    description: `Mock ${name} tool`,
    schema: {},
    execute: vi.fn().mockResolvedValue(mockResponse),
  } as unknown as Tool;
};

// 设置模拟代理，用于测试工作流
export const setupMockAgent = (name: string, mockResponse: any = { text: 'Mock response' }) => {
  const mockAgent = {
    name,
    generate: vi.fn().mockResolvedValue(mockResponse),
  };
  
  return {
    agent: mockAgent,
    reset: () => {
      mockAgent.generate.mockClear();
    }
  };
};

// 创建工具响应测试辅助函数
export const expectToolToBeCalled = (tool: any, expectedArgs: any) => {
  expect(tool.execute).toHaveBeenCalled();
  const callArgs = tool.execute.mock.calls[0][0];
  
  // 验证参数
  for (const key in expectedArgs) {
    expect(callArgs[key]).toEqual(expectedArgs[key]);
  }
}; 