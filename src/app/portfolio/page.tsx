'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TradeHistoryTable } from '@/components/TradeHistoryTable';
import { PerformanceChart } from '@/components/PerformanceChart';
import { formatCurrency, formatPercent } from '@/lib/utils';

// 模拟获取投资组合数据
async function fetchPortfolioData() {
  // 在实际项目中，这里应该调用真实的API
  const res = await fetch('/api/portfolio?userId=user1');
  if (!res.ok) {
    throw new Error('Failed to fetch portfolio data');
  }
  return res.json();
}

// 模拟获取性能数据
async function fetchPerformanceData() {
  // 生成模拟数据
  const days = 90;
  const data = [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let portfolioValue = 170000;
  let benchmarkValue = 5100;
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // 模拟每日波动
    const portfolioChange = (Math.random() - 0.48) * 1000;
    const benchmarkChange = (Math.random() - 0.48) * 25;
    
    portfolioValue += portfolioChange;
    benchmarkValue += benchmarkChange;
    
    data.push({
      timestamp: date.toISOString(),
      portfolioValue,
      benchmarkValue,
    });
  }
  
  return data;
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [portfolioData, perfData] = await Promise.all([
          fetchPortfolioData(),
          fetchPerformanceData(),
        ]);
        
        setPortfolio(portfolioData);
        setPerformanceData(perfData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-lg text-muted-foreground">加载中...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{portfolio?.name || '投资组合'}</h1>
          <p className="text-muted-foreground mt-1">
            最后更新: {new Date(portfolio?.lastUpdated).toLocaleString('zh-CN')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">导出报告</Button>
          <Button>添加资金</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总资产
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolio?.totalValue)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              现金: {formatCurrency(portfolio?.cash)}
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className={`${portfolio?.performance?.total >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>
                {portfolio?.performance?.total >= 0 ? '↑ ' : '↓ '}
                {formatPercent(Math.abs(portfolio?.performance?.total) / 100)}
              </span>
              <span className="text-muted-foreground ml-1">总收益</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              持仓市值
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolio?.totalValue - portfolio?.cash)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              共 {portfolio?.positions?.length || 0} 个持仓
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className={`${portfolio?.performance?.day >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>
                {portfolio?.performance?.day >= 0 ? '↑ ' : '↓ '}
                {formatPercent(Math.abs(portfolio?.performance?.day) / 100)}
              </span>
              <span className="text-muted-foreground ml-1">今日</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              交易次数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio?.transactions?.length || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              最近30天内: {portfolio?.transactions?.filter((t: any) => 
                new Date(t.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length || 0}
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-muted-foreground">上次交易: </span>
              <span className="ml-1 font-medium">
                {portfolio?.transactions?.[0]?.timestamp ? 
                  new Date(portfolio.transactions[0].timestamp).toLocaleDateString('zh-CN') : 
                  '无'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="holdings" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="holdings">持仓</TabsTrigger>
          <TabsTrigger value="performance">表现</TabsTrigger>
          <TabsTrigger value="history">交易历史</TabsTrigger>
        </TabsList>
        
        <TabsContent value="holdings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>持仓明细</CardTitle>
            </CardHeader>
            <CardContent>
              {portfolio?.positions?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">股票</th>
                        <th className="text-right p-3">数量</th>
                        <th className="text-right p-3">平均成本</th>
                        <th className="text-right p-3">当前价格</th>
                        <th className="text-right p-3">市值</th>
                        <th className="text-right p-3">盈亏</th>
                        <th className="text-right p-3">盈亏比例</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.positions.map((position: any) => {
                        const marketValue = position.shares * position.currentPrice;
                        const costBasis = position.shares * position.avgPrice;
                        const profit = marketValue - costBasis;
                        const profitPercent = profit / costBasis;
                        
                        return (
                          <tr key={position.ticker} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div className="font-medium">{position.ticker}</div>
                              <div className="text-sm text-muted-foreground">{position.name}</div>
                            </td>
                            <td className="text-right p-3">{position.shares}</td>
                            <td className="text-right p-3">{formatCurrency(position.avgPrice)}</td>
                            <td className="text-right p-3">{formatCurrency(position.currentPrice)}</td>
                            <td className="text-right p-3">{formatCurrency(marketValue)}</td>
                            <td className={`text-right p-3 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(profit)}
                            </td>
                            <td className={`text-right p-3 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatPercent(profitPercent)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  没有持仓记录
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <PerformanceChart data={performanceData} />
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>交易历史</CardTitle>
            </CardHeader>
            <CardContent>
              <TradeHistoryTable transactions={portfolio?.transactions || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 