import { vi } from 'vitest';
import { NextRequest } from 'next/server';

// 创建模拟的Next.js请求
export function createMockRequest(method: string, body: any, queryString?: string): Request {
  const url = `http://localhost:3000/api/test${queryString || ''}`;
  
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// 模拟工作流执行
export function mockWorkflowExecution(workflowResult: any) {
  return {
    execute: vi.fn().mockResolvedValue(workflowResult),
  };
} 