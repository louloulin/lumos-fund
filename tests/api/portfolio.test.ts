import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/portfolio/route';
import { createMockRequest } from './test-utils';

describe('用户组合API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应返回指定用户的投资组合', async () => {
    // 创建模拟请求
    const mockRequest = createMockRequest('GET', null, '?userId=user1');
    
    // 调用API
    const response = await GET(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(200);
    
    // 解析JSON响应
    const data = await response.json();
    
    // 验证数据结构
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('cash');
    expect(data).toHaveProperty('totalValue');
    expect(data).toHaveProperty('positions');
    expect(data).toHaveProperty('transactions');
    
    // 验证ID匹配
    expect(data.id).toBe('user1');
    
    // 验证持仓和交易记录是数组
    expect(Array.isArray(data.positions)).toBe(true);
    expect(Array.isArray(data.transactions)).toBe(true);
  });

  it('应处理不存在的用户ID', async () => {
    // 创建模拟请求
    const mockRequest = createMockRequest('GET', null, '?userId=nonexistent');
    
    // 调用API
    const response = await GET(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(404);
    
    // 解析JSON响应
    const data = await response.json();
    
    // 验证错误信息
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('未找到投资组合');
  });

  it('应成功添加现金到投资组合', async () => {
    // 创建模拟请求数据
    const requestBody = {
      userId: 'user1',
      action: 'addCash',
      data: { amount: 5000 }
    };
    
    // 创建模拟请求
    const mockRequest = createMockRequest('POST', requestBody);
    
    // 获取原始现金余额
    const initialRequest = createMockRequest('GET', null, '?userId=user1');
    const initialResponse = await GET(initialRequest);
    const initialData = await initialResponse.json();
    const initialCash = initialData.cash;
    
    // 调用API
    const response = await POST(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(200);
    
    // 解析JSON响应
    const data = await response.json();
    
    // 验证成功信息
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    
    // 验证投资组合数据
    expect(data).toHaveProperty('portfolio');
    
    // 验证现金已增加
    expect(data.portfolio.cash).toBe(initialCash + 5000);
    
    // 验证交易记录已添加
    const lastTransaction = data.portfolio.transactions[0];
    expect(lastTransaction.type).toBe('deposit');
    expect(lastTransaction.amount).toBe(5000);
  });

  it('应成功执行买入操作', async () => {
    // 创建模拟请求数据
    const requestBody = {
      userId: 'user1',
      action: 'buy',
      data: { 
        ticker: 'TSLA', 
        name: 'Tesla Inc.',
        shares: 10, 
        price: 175.48 
      }
    };
    
    // 创建模拟请求
    const mockRequest = createMockRequest('POST', requestBody);
    
    // 调用API
    const response = await POST(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(200);
    
    // 解析JSON响应
    const data = await response.json();
    
    // 验证成功信息
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    
    // 验证投资组合数据
    expect(data).toHaveProperty('portfolio');
    
    // 验证交易记录已添加
    const lastTransaction = data.portfolio.transactions[0];
    expect(lastTransaction.type).toBe('buy');
    expect(lastTransaction.ticker).toBe('TSLA');
    expect(lastTransaction.shares).toBe(10);
    expect(lastTransaction.price).toBe(175.48);
    
    // 验证持仓包含买入的股票
    const position = data.portfolio.positions.find((p: any) => p.ticker === 'TSLA');
    expect(position).toBeDefined();
    expect(position.shares).toBeGreaterThanOrEqual(10);
  });

  it('应处理无效的操作', async () => {
    // 创建模拟请求数据
    const requestBody = {
      userId: 'user1',
      action: 'invalidAction',
      data: {}
    };
    
    // 创建模拟请求
    const mockRequest = createMockRequest('POST', requestBody);
    
    // 调用API
    const response = await POST(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(400);
    
    // 解析JSON响应
    const data = await response.json();
    
    // 验证错误信息
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('未知操作');
  });
}); 