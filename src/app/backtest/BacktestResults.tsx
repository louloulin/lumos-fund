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
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BacktestResult } from '@/actions/backtest';

interface BacktestResultsProps {
  result: BacktestResult | null;
  isComparison: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];

const formatNumber = (num: number, decimals = 2): string => {
  return num.toLocaleString('zh-CN', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

const formatPercent = (num: number): string => {
  return `${formatNumber(num * 100)}%`;
};

const formatCurrency = (num: number): string => {
  return num.toLocaleString('zh-CN', { 
    style: 'currency', 
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function BacktestResults({ result, isComparison }: BacktestResultsProps) {
  if (!result) return null;
  
  // 获取图表数据
  const chartData = (() => {
    if (isComparison && result.results) {
      // 比较模式 - 多条曲线
      const allDates = new Set<string>();
      const strategies = Object.keys(result.results);
      
      // 获取所有日期
      strategies.forEach(strategy => {
        result.results![strategy].equityCurve.forEach(point => {
          allDates.add(point.date);
        });
      });
      
      // 按日期排序
      const sortedDates = Array.from(allDates).sort();
      
      // 创建图表数据
      return sortedDates.map(date => {
        const dataPoint: any = { date };
        
        strategies.forEach(strategy => {
          const point = result.results![strategy].equityCurve.find(p => p.date === date);
          if (point) {
            dataPoint[strategy] = point.value;
          }
        });
        
        return dataPoint;
      });
    } else {
      // 单一策略
      return result.equityCurve;
    }
  })();
  
  // 生成图表线条
  const renderChartLines = () => {
    if (isComparison && result.results) {
      return Object.keys(result.results).map((strategy, index) => (
        <Line
          key={strategy}
          type="monotone"
          dataKey={strategy}
          stroke={COLORS[index % COLORS.length]}
          dot={false}
          activeDot={{ r: 6 }}
        />
      ));
    } else {
      return (
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0088FE"
          dot={false}
          activeDot={{ r: 6 }}
        />
      );
    }
  };
  
  // 生成绩效指标表格
  const renderMetricsTable = () => {
    if (isComparison && result.results) {
      // 比较模式 - 多策略指标
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>策略</TableHead>
              <TableHead>总收益</TableHead>
              <TableHead>年化收益</TableHead>
              <TableHead>最大回撤</TableHead>
              <TableHead>夏普比率</TableHead>
              <TableHead>胜率</TableHead>
              <TableHead>盈亏比</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(result.results).map(([strategy, data]) => (
              <TableRow key={strategy}>
                <TableCell className="font-medium">{strategy}</TableCell>
                <TableCell className={data.metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPercent(data.metrics.totalReturn)}
                </TableCell>
                <TableCell className={data.metrics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPercent(data.metrics.annualizedReturn)}
                </TableCell>
                <TableCell className="text-red-600">
                  {formatPercent(data.metrics.maxDrawdown)}
                </TableCell>
                <TableCell>
                  {formatNumber(data.metrics.sharpeRatio)}
                </TableCell>
                <TableCell>
                  {formatPercent(data.metrics.winRate)}
                </TableCell>
                <TableCell>
                  {formatNumber(data.metrics.profitFactor)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    } else {
      // 单一策略指标
      return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">总收益</CardTitle>
            </CardHeader>
            <CardContent className={`text-2xl font-bold ${result.metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(result.metrics.totalReturn)}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">年化收益</CardTitle>
            </CardHeader>
            <CardContent className={`text-2xl font-bold ${result.metrics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(result.metrics.annualizedReturn)}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">最大回撤</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-red-600">
              {formatPercent(result.metrics.maxDrawdown)}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">夏普比率</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {formatNumber(result.metrics.sharpeRatio)}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">胜率</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {formatPercent(result.metrics.winRate)}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm font-medium">盈亏比</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {formatNumber(result.metrics.profitFactor)}
            </CardContent>
          </Card>
        </div>
      );
    }
  };
  
  // 如果有交易记录，显示交易记录表格
  const renderTradesTable = () => {
    if (!result.trades || result.trades.length === 0) {
      return <p className="text-center py-4">无交易记录</p>;
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日期</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>数量</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>盈亏</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.trades.map((trade, index) => (
            <TableRow key={index}>
              <TableCell>{trade.date}</TableCell>
              <TableCell>
                <Badge variant={trade.type === 'buy' ? 'default' : 'secondary'}>
                  {trade.type === 'buy' ? '买入' : '卖出'}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(trade.price)}</TableCell>
              <TableCell>{trade.shares}</TableCell>
              <TableCell>{formatCurrency(trade.price * trade.shares)}</TableCell>
              <TableCell className={
                trade.profit !== undefined
                  ? (trade.profit >= 0 ? 'text-green-600' : 'text-red-600')
                  : ''
              }>
                {trade.profit !== undefined ? formatCurrency(trade.profit) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>回测结果</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '资产']}
                labelFormatter={(label) => `日期: ${label}`}
              />
              <Legend />
              {renderChartLines()}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>绩效指标</CardTitle>
        </CardHeader>
        <CardContent>
          {renderMetricsTable()}
        </CardContent>
      </Card>
      
      {!isComparison && (
        <Tabs defaultValue="trades">
          <TabsList>
            <TabsTrigger value="trades">交易记录</TabsTrigger>
          </TabsList>
          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>交易记录</CardTitle>
              </CardHeader>
              <CardContent>
                {renderTradesTable()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 