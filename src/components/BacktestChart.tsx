'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BacktestResult } from '@/lib/types/backtest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface BacktestChartProps {
  result: BacktestResult | BacktestResult[];
  title?: string;
  description?: string;
}

const BacktestChart: React.FC<BacktestChartProps> = ({ 
  result, 
  title = '回测结果',
  description = '基于历史数据的策略回测表现'
}) => {
  // 处理单一结果或多结果
  const results = Array.isArray(result) ? result : [result];
  const isComparison = Array.isArray(result);
  
  // 准备收益图表数据
  const returnsData = prepareReturnsChartData(results);
  
  // 准备统计数据表格
  const statsData = results.map(r => ({
    name: r.strategy,
    returns: r.returns * 100,
    annualizedReturns: r.annualizedReturns * 100,
    maxDrawdown: r.maxDrawdown * 100,
    sharpeRatio: r.sharpeRatio,
    winRate: r.winRate * 100,
    trades: r.trades
  }));
  
  // 计算整个周期内的最佳策略
  const bestStrategy = isComparison ? findBestStrategy(results) : null;
  
  // 准备交易记录
  const trades = results[0].positions || [];
  
  // 交易信号图表数据
  const signalsData = prepareSignalsData(results[0]);
  
  // 颜色配置
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="returns" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="returns">收益曲线</TabsTrigger>
            <TabsTrigger value="stats">统计指标</TabsTrigger>
            <TabsTrigger value="trades">交易记录</TabsTrigger>
            <TabsTrigger value="signals">交易信号</TabsTrigger>
          </TabsList>
          
          {/* 收益曲线图表 */}
          <TabsContent value="returns" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={returnsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      // 简化日期显示
                      const date = new Date(value);
                      return `${date.getMonth()+1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  
                  {/* 绘制每个策略的曲线 */}
                  {results.map((r, i) => (
                    <Line
                      key={r.strategy}
                      type="monotone"
                      dataKey={r.strategy}
                      stroke={colors[i % colors.length]}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  ))}
                  
                  {/* 绘制基准曲线 */}
                  <Line
                    type="monotone"
                    dataKey="基准"
                    stroke="#94a3b8"
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* 最佳策略显示 */}
            {bestStrategy && (
              <div className="bg-slate-50 p-4 rounded-md border">
                <h3 className="text-lg font-semibold mb-2">策略综合评价</h3>
                <p>
                  在整个回测周期内，
                  <span className="font-medium" style={{ color: colors[bestStrategy.index % colors.length] }}>
                    {bestStrategy.name}
                  </span> 
                  综合表现最佳，年化收益率 
                  <span className="font-medium text-emerald-600">
                    {bestStrategy.annualizedReturns.toFixed(2)}%
                  </span>，
                  最大回撤 
                  <span className="font-medium text-rose-600">
                    {bestStrategy.maxDrawdown.toFixed(2)}%
                  </span>，
                  夏普比率 
                  <span className="font-medium text-blue-600">
                    {bestStrategy.sharpeRatio.toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* 统计指标表格 */}
          <TabsContent value="stats">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>策略</TableHead>
                    <TableHead>总收益率</TableHead>
                    <TableHead>年化收益</TableHead>
                    <TableHead>最大回撤</TableHead>
                    <TableHead>夏普比率</TableHead>
                    <TableHead>胜率</TableHead>
                    <TableHead>交易次数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData.map((stat, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{stat.name}</TableCell>
                      <TableCell className={cn(
                        stat.returns > 0 ? 'text-emerald-600' : 'text-rose-600'
                      )}>
                        {stat.returns.toFixed(2)}%
                      </TableCell>
                      <TableCell className={cn(
                        stat.annualizedReturns > 0 ? 'text-emerald-600' : 'text-rose-600'
                      )}>
                        {stat.annualizedReturns.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-rose-600">
                        {stat.maxDrawdown.toFixed(2)}%
                      </TableCell>
                      <TableCell className={cn(
                        stat.sharpeRatio > 1 ? 'text-emerald-600' : 'text-amber-600'
                      )}>
                        {stat.sharpeRatio.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {stat.winRate.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {stat.trades}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* 详细统计指标 */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((r, i) => (
                <Card key={i} className="bg-slate-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{r.strategy}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {r.statistics.map((stat, j) => (
                        <div key={j} className="flex justify-between items-center border-b pb-1">
                          <span className="text-sm text-slate-600">{stat.name}</span>
                          <span className="font-medium">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* 交易记录 */}
          <TabsContent value="trades">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>交易</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>交易额</TableHead>
                    <TableHead>收益率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.slice(0, 20).map((trade, i) => (
                    <TableRow key={i}>
                      <TableCell>{trade.date}</TableCell>
                      <TableCell className={cn(
                        trade.action === '买入' ? 'text-emerald-600' : 'text-rose-600'
                      )}>
                        {trade.action} {trade.symbol}
                      </TableCell>
                      <TableCell>{trade.price.toFixed(2)}</TableCell>
                      <TableCell>{trade.shares}</TableCell>
                      <TableCell>{trade.value.toFixed(2)}</TableCell>
                      <TableCell className={cn(
                        trade.returnPct && trade.returnPct > 0 ? 'text-emerald-600' : 
                        trade.returnPct && trade.returnPct < 0 ? 'text-rose-600' : ''
                      )}>
                        {trade.returnPct ? (trade.returnPct * 100).toFixed(2) + '%' : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {trades.length > 20 && (
                <div className="text-center py-2 text-sm text-slate-500">
                  显示前20条交易记录，共{trades.length}条
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* 交易信号 */}
          <TabsContent value="signals">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={signalsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth()+1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}`, '价格']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  <Bar dataKey="价格" fill="#3b82f6" />
                  <Bar dataKey="交易信号" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

/**
 * 准备收益图表数据
 */
function prepareReturnsChartData(results: BacktestResult[]): any[] {
  // 使用第一个结果的日期作为基准
  const firstResult = results[0];
  if (!firstResult || !firstResult.dailyReturns.length) return [];
  
  // 准备数据结构
  return firstResult.dailyReturns.map((day, i) => {
    const dataPoint: any = {
      date: day.date,
      基准: day.benchmark * 100 // 转换为百分比
    };
    
    // 添加每个策略的收益率
    results.forEach(result => {
      if (result.dailyReturns[i]) {
        dataPoint[result.strategy] = result.dailyReturns[i].value * 100; // 转换为百分比
      }
    });
    
    return dataPoint;
  });
}

/**
 * 准备交易信号图表数据
 */
function prepareSignalsData(result: BacktestResult): any[] {
  if (!result || !result.positions.length) return [];
  
  // 创建交易信号数据结构
  const signalsByDate: Record<string, number> = {};
  
  // 标记买入和卖出日期
  result.positions.forEach(pos => {
    signalsByDate[pos.date] = pos.action === '买入' ? 1 : -1;
  });
  
  // 准备返回数据
  return result.dailyReturns.map(day => {
    // 获取当天的收盘价（这里假设dailyReturns中有相应的数据）
    // 实际应用中可能需要从其他来源获取价格数据
    const priceEstimate = (1 + day.value) * result.initialCapital / 100;
    
    return {
      date: day.date,
      价格: priceEstimate,
      交易信号: signalsByDate[day.date] ? priceEstimate * (signalsByDate[day.date] > 0 ? 1.05 : 0.95) : null
    };
  });
}

/**
 * 找出表现最佳的策略
 */
function findBestStrategy(results: BacktestResult[]): { 
  name: string; 
  index: number; 
  annualizedReturns: number;
  maxDrawdown: number;
  sharpeRatio: number;
} | null {
  if (!results.length) return null;
  
  // 计算每个策略的综合评分
  // 这里我们用一个简单的公式：年化收益 * 0.5 + 夏普比率 * 0.3 - 最大回撤 * 0.2
  const scores = results.map((result, index) => {
    const score = (
      result.annualizedReturns * 100 * 0.5 + 
      result.sharpeRatio * 0.3 - 
      result.maxDrawdown * 100 * 0.2
    );
    
    return {
      name: result.strategy,
      index,
      score,
      annualizedReturns: result.annualizedReturns * 100,
      maxDrawdown: result.maxDrawdown * 100,
      sharpeRatio: result.sharpeRatio
    };
  });
  
  // 返回评分最高的策略
  return scores.sort((a, b) => b.score - a.score)[0] || null;
}

export default BacktestChart; 