import { performance } from 'perf_hooks';
import { BacktestParams } from '@/lib/types/backtest';
import { runSingleStrategyBacktest, runComparisonBacktest } from '@/app/api/backtest/route';

describe('Backtest Performance Tests', () => {
  const testParams: BacktestParams = {
    ticker: 'AAPL',
    initialCapital: 100000,
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    strategyType: 'value'
  };

  it('should complete single strategy backtest within time limit', async () => {
    const startTime = performance.now();
    
    const result = await runSingleStrategyBacktest(testParams);
    
    const duration = performance.now() - startTime;
    console.log(`单策略回测耗时: ${duration.toFixed(2)}ms`);
    
    expect(duration).toBeLessThan(5000); // 应在5秒内完成
    expect(result).toBeDefined();
    expect(result.dailyReturns.length).toBeGreaterThan(0);
  });

  it('should complete comparison backtest within time limit', async () => {
    const startTime = performance.now();
    
    const results = await runComparisonBacktest({
      ...testParams,
      strategyType: 'comparison'
    });
    
    const duration = performance.now() - startTime;
    console.log(`策略对比回测耗时: ${duration.toFixed(2)}ms`);
    
    expect(duration).toBeLessThan(15000); // 应在15秒内完成
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(1);
  });

  it('should handle concurrent backtests efficiently', async () => {
    const startTime = performance.now();
    
    // 创建多个并发回测任务
    const concurrentTests = Array(5).fill(null).map(() => 
      runSingleStrategyBacktest({
        ...testParams,
        ticker: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'][
          Math.floor(Math.random() * 5)
        ]
      })
    );
    
    const results = await Promise.all(concurrentTests);
    
    const duration = performance.now() - startTime;
    console.log(`5个并发回测耗时: ${duration.toFixed(2)}ms`);
    
    expect(duration).toBeLessThan(10000); // 应在10秒内完成
    expect(results.length).toBe(5);
    results.forEach(result => {
      expect(result).toBeDefined();
      expect(result.dailyReturns.length).toBeGreaterThan(0);
    });
  });

  it('should maintain performance with large datasets', async () => {
    const startTime = performance.now();
    
    // 使用更长的时间范围
    const result = await runSingleStrategyBacktest({
      ...testParams,
      startDate: '2020-01-01',
      endDate: '2023-12-31'
    });
    
    const duration = performance.now() - startTime;
    console.log(`大数据量回测耗时: ${duration.toFixed(2)}ms`);
    
    expect(duration).toBeLessThan(10000); // 应在10秒内完成
    expect(result.dailyReturns.length).toBeGreaterThan(500);
  });

  it('should handle memory efficiently during backtests', async () => {
    const initialMemory = process.memoryUsage();
    
    // 运行多个连续的回测
    for (let i = 0; i < 10; i++) {
      await runSingleStrategyBacktest({
        ...testParams,
        ticker: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'][i % 5]
      });
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    
    console.log(`内存使用增长: ${memoryIncrease.toFixed(2)}MB`);
    expect(memoryIncrease).toBeLessThan(100); // 内存增长应小于100MB
  });

  it('should optimize data processing performance', async () => {
    const results: number[] = [];
    
    // 测试不同数据量下的处理性能
    for (const days of [30, 90, 180, 365]) {
      const startTime = performance.now();
      
      await runSingleStrategyBacktest({
        ...testParams,
        startDate: `2023-${String(12 - Math.floor(days/30)).padStart(2, '0')}-01`,
        endDate: '2023-12-31'
      });
      
      const duration = performance.now() - startTime;
      results.push(duration);
      
      console.log(`${days}天数据处理耗时: ${duration.toFixed(2)}ms`);
    }
    
    // 验证处理时间增长是否接近线性
    const growthRates = results.slice(1).map((time, i) => time / results[i]);
    const maxGrowthRate = Math.max(...growthRates);
    
    console.log('处理时间增长率:', growthRates);
    expect(maxGrowthRate).toBeLessThan(4); // 增长率应该小于4
  });
}); 