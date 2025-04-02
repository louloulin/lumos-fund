import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/market/route';
import { createMockRequest } from './test-utils';

describe('市场数据API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应返回指数数据作为默认端点', async () => {
    // 创建模拟请求
    const mockRequest = createMockRequest('GET', null, '?endpoint=indices');
    
    // 调用API
    const response = await GET(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(200);
    
    // 解析JSON响应
    const data = await response.json();
    
    // 验证数据结构
    expect(data).toHaveProperty('indices');
    expect(Array.isArray(data.indices)).toBe(true);
    expect(data.indices.length).toBeGreaterThan(0);
    
    // 验证数据项格式
    const firstItem = data.indices[0];
    expect(firstItem).toHaveProperty('symbol');
    expect(firstItem).toHaveProperty('name');
    expect(firstItem).toHaveProperty('value');
    expect(firstItem).toHaveProperty('change');
    expect(firstItem).toHaveProperty('changePercent');
  });

  it('应返回行业板块数据', async () => {
    // 创建模拟请求
    const mockRequest = createMockRequest('GET', null, '?endpoint=sectors');
    
    // 调用API
    const response = await GET(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(200);
    
    // 解析JSON响应
    const data = await response.json();
    
    // 验证数据结构
    expect(data).toHaveProperty('sectors');
    expect(Array.isArray(data.sectors)).toBe(true);
    expect(data.sectors.length).toBeGreaterThan(0);
    
    // 验证数据项格式
    const firstItem = data.sectors[0];
    expect(firstItem).toHaveProperty('name');
    expect(firstItem).toHaveProperty('performance');
    expect(firstItem).toHaveProperty('volume');
  });

  it('应返回市场涨跌幅数据', async () => {
    // 创建模拟请求
    const mockRequest = createMockRequest('GET', null, '?endpoint=movers');
    
    // 调用API
    const response = await GET(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(200);
    
    // 解析JSON响应
    const data = await response.json();
    
    // 验证数据结构
    expect(data).toHaveProperty('topGainers');
    expect(data).toHaveProperty('topLosers');
    expect(data).toHaveProperty('mostActive');
    
    // 验证数据项格式
    expect(Array.isArray(data.topGainers)).toBe(true);
    expect(Array.isArray(data.topLosers)).toBe(true);
    expect(Array.isArray(data.mostActive)).toBe(true);
    
    // 验证前N名上涨股票数据格式
    if (data.topGainers.length > 0) {
      const firstGainer = data.topGainers[0];
      expect(firstGainer).toHaveProperty('symbol');
      expect(firstGainer).toHaveProperty('name');
      expect(firstGainer).toHaveProperty('price');
      expect(firstGainer).toHaveProperty('change');
      expect(firstGainer).toHaveProperty('changePercent');
    }
  });

  it('应返回市场新闻数据', async () => {
    // 创建模拟请求
    const mockRequest = createMockRequest('GET', null, '?endpoint=news');
    
    // 调用API
    const response = await GET(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(200);
    
    // 解析JSON响应
    const data = await response.json();
    
    // 验证数据结构
    expect(data).toHaveProperty('marketNews');
    expect(Array.isArray(data.marketNews)).toBe(true);
    expect(data.marketNews.length).toBeGreaterThan(0);
    
    // 验证新闻项格式
    const firstNews = data.marketNews[0];
    expect(firstNews).toHaveProperty('id');
    expect(firstNews).toHaveProperty('title');
    expect(firstNews).toHaveProperty('source');
    expect(firstNews).toHaveProperty('timestamp');
    expect(firstNews).toHaveProperty('url');
    expect(firstNews).toHaveProperty('sentiment');
  });

  it('应处理无效的端点', async () => {
    // 创建模拟请求
    const mockRequest = createMockRequest('GET', null, '?endpoint=invalid');
    
    // 调用API
    const response = await GET(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(200);
    
    // 解析JSON响应
    const data = await response.json();
    
    // 验证错误信息
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('未知的市场数据端点');
  });
}); 