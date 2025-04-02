import { marketDataTool } from '../marketData';

describe('Market Data Tool', () => {
  it('should fetch price data successfully', async () => {
    const result = await marketDataTool.run({
      symbol: 'AAPL',
      dataType: 'price',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });

    expect(result).toBeDefined();
    expect(result.symbol).toBe('AAPL');
    expect(result.dataType).toBe('price');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);

    // 验证数据结构
    const firstDataPoint = result.data[0];
    expect(firstDataPoint).toHaveProperty('date');
    expect(firstDataPoint).toHaveProperty('price');
    expect(firstDataPoint.price).toHaveProperty('open');
    expect(firstDataPoint.price).toHaveProperty('high');
    expect(firstDataPoint.price).toHaveProperty('low');
    expect(firstDataPoint.price).toHaveProperty('close');
  });

  it('should fetch financial data successfully', async () => {
    const result = await marketDataTool.run({
      symbol: 'AAPL',
      dataType: 'financials',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });

    expect(result).toBeDefined();
    expect(result.data[0]).toHaveProperty('financials');
    expect(result.data[0].financials).toHaveProperty('pe');
    expect(result.data[0].financials).toHaveProperty('pb');
    expect(result.data[0].financials).toHaveProperty('roe');
  });

  it('should handle invalid dates gracefully', async () => {
    await expect(marketDataTool.run({
      symbol: 'AAPL',
      dataType: 'price',
      startDate: 'invalid-date',
      endDate: '2024-01-31'
    })).rejects.toThrow();
  });

  it('should fetch all data types when requested', async () => {
    const result = await marketDataTool.run({
      symbol: 'AAPL',
      dataType: 'all',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });

    expect(result.data[0]).toHaveProperty('price');
    expect(result.data[0]).toHaveProperty('volume');
    expect(result.data[0]).toHaveProperty('financials');
  });

  it('should exclude weekends from data', async () => {
    const result = await marketDataTool.run({
      symbol: 'AAPL',
      dataType: 'price',
      startDate: '2024-01-01',
      endDate: '2024-01-07' // 一周数据
    });

    // 一周中应该只有5个交易日
    expect(result.data.length).toBe(5);
  });
}); 