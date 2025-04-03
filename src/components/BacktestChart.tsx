'use client';

import React, { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Bar
} from 'recharts';
import type { BacktestResult } from '@/actions/backtest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BacktestChartProps {
  result: BacktestResult;
  title?: string;
  description?: string;
}

// 格式化金额
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// 格式化百分比
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

export default function BacktestChart({ 
  result, 
  title = '回测结果',
  description = '基于历史数据的策略回测表现'
}: BacktestChartProps) {
  // 判断是否是对比模式
  const isComparison = !!result.results && Object.keys(result.results).length > 0;
  
  // 准备回撤数据
  const calculateDrawdowns = () => {
    if (!result.equityCurve || result.equityCurve.length === 0) return [];
    
    let maxEquity = result.equityCurve[0].value;
    return result.equityCurve.map((point) => {
      if (point.value > maxEquity) {
        maxEquity = point.value;
        return { date: point.date, drawdown: 0 };
      }
      const drawdown = (maxEquity - point.value) / maxEquity;
      return { date: point.date, drawdown };
    });
  };

  // 准备对比数据
  const prepareComparisonData = () => {
    if (!isComparison) return [];
    
    const strategies = Object.keys(result.results!);
    const dates = new Set<string>();
    
    // 收集所有日期
    strategies.forEach(strategy => {
      result.results![strategy].equityCurve.forEach((point) => {
        dates.add(point.date);
      });
    });
    
    // 按日期排序
    const sortedDates = Array.from(dates).sort();
    
    // 创建比较数据
    return sortedDates.map(date => {
      const dataPoint: Record<string, any> = { date };
      
      strategies.forEach(strategy => {
        const point = result.results![strategy].equityCurve.find((p) => p.date === date);
        if (point) {
          dataPoint[strategy] = point.value;
        }
      });
      
      return dataPoint;
    });
  };

  // 渲染权益曲线图表
  const renderEquityChart = () => {
    if (isComparison) {
      const comparisonData = prepareComparisonData();
      const strategies = Object.keys(result.results!);
      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];
      
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            {strategies.map((strategy, index) => (
              <Line 
                key={strategy}
                type="monotone"
                dataKey={strategy}
                name={strategy}
                stroke={colors[index % colors.length]}
                dot={false}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={result.equityCurve} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              name="权益" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.3} 
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  };

  // 渲染回撤图表
  const renderDrawdownChart = () => {
    const drawdownData = calculateDrawdowns();
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={drawdownData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={formatPercent} />
          <Tooltip formatter={(value) => formatPercent(value as number)} />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="drawdown" 
            name="回撤" 
            stroke="#ff0000" 
            fill="#ff0000" 
            fillOpacity={0.3} 
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // 渲染交易记录图表
  const renderTradesChart = () => {
    if (!result.trades || result.trades.length === 0) return null;
    
    const tradeData = result.trades.map(trade => {
      // 找到对应的权益点
      const equityPoint = result.equityCurve.find(p => p.date === trade.date);
      
      return {
        date: trade.date,
        equity: equityPoint?.value || 0,
        type: trade.type,
        profit: trade.profit || 0,
        shares: trade.shares,
        price: trade.price
      };
    });
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={tradeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" tickFormatter={formatCurrency} />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value, name) => {
            if (name === 'equity') return formatCurrency(value as number);
            if (name === 'profit') return formatCurrency(value as number);
            return value;
          }} />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="equity" 
            name="权益" 
            stroke="#8884d8" 
            dot={false}
          />
          <Bar 
            yAxisId="right"
            dataKey="profit" 
            name="交易收益" 
            fill="#82ca9d"
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  // 渲染指标表格
  const renderMetricsTable = () => {
    const metrics = [
      { name: '总收益率', value: formatPercent(result.metrics.totalReturn) },
      { name: '年化收益率', value: formatPercent(result.metrics.annualizedReturn) },
      { name: '最大回撤', value: formatPercent(result.metrics.maxDrawdown) },
      { name: '夏普比率', value: result.metrics.sharpeRatio.toFixed(2) },
      { name: '胜率', value: formatPercent(result.metrics.winRate) },
      { name: '盈亏比', value: result.metrics.profitFactor.toFixed(2) }
    ];
    
    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>指标</TableHead>
              <TableHead>值</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{metric.name}</TableCell>
                <TableCell className={cn(
                  metric.name.includes('回撤') ? 'text-rose-600' : 
                  (metric.name.includes('收益') || metric.name.includes('比率') || metric.name.includes('胜率')) && parseFloat(metric.value) > 0 
                    ? 'text-emerald-600' 
                    : ''
                )}>
                  {metric.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // 渲染交易记录表格
  const renderTradesTable = () => {
    if (!result.trades || result.trades.length === 0) return <p>没有交易记录</p>;
    
    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>数量</TableHead>
              <TableHead>收益</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.trades.slice(0, 20).map((trade, i) => (
              <TableRow key={i}>
                <TableCell>{trade.date}</TableCell>
                <TableCell className={cn(
                  trade.type === 'buy' ? 'text-emerald-600' : 'text-rose-600'
                )}>
                  {trade.type === 'buy' ? '买入' : '卖出'}
                </TableCell>
                <TableCell>{trade.price.toFixed(2)}</TableCell>
                <TableCell>{trade.shares}</TableCell>
                <TableCell className={cn(
                  trade.profit && trade.profit > 0 ? 'text-emerald-600' : 
                  trade.profit && trade.profit < 0 ? 'text-rose-600' : ''
                )}>
                  {trade.profit ? formatCurrency(trade.profit) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {result.trades.length > 20 && (
          <div className="text-center py-2 text-sm text-slate-500">
            显示前20条交易记录，共{result.trades.length}条
          </div>
        )}
      </div>
    );
  };

  // 策略对比数据
  const renderComparisonMetrics = () => {
    if (!isComparison) return null;
    
    const strategies = Object.keys(result.results!);
    
    return (
      <div className="rounded-md border overflow-hidden mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>策略</TableHead>
              <TableHead>总收益率</TableHead>
              <TableHead>年化收益</TableHead>
              <TableHead>最大回撤</TableHead>
              <TableHead>夏普比率</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {strategies.map((strategy, i) => {
              const metrics = result.results![strategy].metrics;
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium">{strategy}</TableCell>
                  <TableCell className={cn(
                    metrics.totalReturn > 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    {formatPercent(metrics.totalReturn)}
                  </TableCell>
                  <TableCell className={cn(
                    metrics.annualizedReturn > 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    {formatPercent(metrics.annualizedReturn)}
                  </TableCell>
                  <TableCell className="text-rose-600">
                    {formatPercent(metrics.maxDrawdown)}
                  </TableCell>
                  <TableCell className={cn(
                    metrics.sharpeRatio > 1 ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {metrics.sharpeRatio.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="equity" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="equity">权益曲线</TabsTrigger>
            <TabsTrigger value="drawdown">回撤分析</TabsTrigger>
            <TabsTrigger value="metrics">绩效指标</TabsTrigger>
            <TabsTrigger value="trades">交易记录</TabsTrigger>
          </TabsList>
          
          <TabsContent value="equity">
            {renderEquityChart()}
            {isComparison && renderComparisonMetrics()}
          </TabsContent>
          
          <TabsContent value="drawdown">
            {renderDrawdownChart()}
          </TabsContent>
          
          <TabsContent value="metrics">
            {renderMetricsTable()}
            {isComparison && renderComparisonMetrics()}
          </TabsContent>
          
          <TabsContent value="trades">
            {renderTradesChart()}
            <div className="mt-4">
              {renderTradesTable()}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 