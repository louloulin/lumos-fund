import { vi } from 'vitest';
import { NextRequest } from 'next/server';

// 创建模拟的Next.js请求
export function createMockRequest(method: string, body: any): Request {
  return new Request('http://localhost:3000/api/test', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// 模拟工作流执行
export function mockWorkflowExecution(workflowResult: any) {
  return {
    execute: vi.fn().mockResolvedValue(workflowResult),
  };
} 