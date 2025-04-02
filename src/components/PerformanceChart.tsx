'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// 定义性能数据类型
interface PerformanceData {
  timestamp: string;
  portfolioValue: number;
  benchmarkValue: number;
}

// 定义图表选项
const timeRanges = [
  { id: '1d', label: '1天', days: 1 },
  { id: '1w', label: '1周', days: 7 },
  { id: '1m', label: '1个月', days: 30 },
  { id: '3m', label: '3个月', days: 90 },
  { id: '6m', label: '6个月', days: 180 },
  { id: '1y', label: '1年', days: 365 },
  { id: 'all', label: '全部', days: 0 },
];

// 定义基准指数选项
const benchmarks = [
  { id: 'SPX', name: 'S&P 500' },
  { id: 'IXIC', name: '纳斯达克综合指数' },
  { id: 'DJI', name: '道琼斯工业平均指数' },
  { id: 'BTC', name: '比特币' },
];

// 自定义Tooltip组件
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md p-3 shadow-md">
        <p className="text-sm font-medium">{new Date(label).toLocaleDateString('zh-CN')}</p>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-primary">
            <span className="inline-block w-3 h-3 rounded-full bg-primary mr-2" />
            投资组合: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-orange-500">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2" />
            基准指数: {formatCurrency(payload[1].value)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

interface PerformanceChartProps {
  data: PerformanceData[];
  className?: string;
}

export function PerformanceChart({ data, className = '' }: PerformanceChartProps) {
  const [timeRange, setTimeRange] = useState('1m');
  const [benchmark, setBenchmark] = useState('SPX');
  const [chartType, setChartType] = useState('value'); // 'value' | 'percent'
  
  // 根据时间范围筛选数据
  const filteredData = useMemo(() => {
    const selectedRange = timeRanges.find(range => range.id === timeRange);
    if (!selectedRange || selectedRange.days === 0) {
      return data;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - selectedRange.days);
    return data.filter(item => new Date(item.timestamp) >= cutoffDate);
  }, [data, timeRange]);
  
  // 计算表现指标
  const performance = useMemo(() => {
    if (filteredData.length < 2) {
      return { portfolioChange: 0, portfolioPercent: 0, benchmarkChange: 0, benchmarkPercent: 0 };
    }
    
    const first = filteredData[0];
    const last = filteredData[filteredData.length - 1];
    
    const portfolioChange = last.portfolioValue - first.portfolioValue;
    const portfolioPercent = portfolioChange / first.portfolioValue;
    
    const benchmarkChange = last.benchmarkValue - first.benchmarkValue;
    const benchmarkPercent = benchmarkChange / first.benchmarkValue;
    
    return { portfolioChange, portfolioPercent, benchmarkChange, benchmarkPercent };
  }, [filteredData]);
  
  // 计算图表数据
  const chartData = useMemo(() => {
    if (chartType === 'value') {
      return filteredData;
    } else {
      // 百分比变化图表数据
      const firstPortfolioValue = filteredData[0]?.portfolioValue || 0;
      const firstBenchmarkValue = filteredData[0]?.benchmarkValue || 0;
      
      return filteredData.map(item => ({
        ...item,
        portfolioValue: firstPortfolioValue === 0 ? 0 : (item.portfolioValue - firstPortfolioValue) / firstPortfolioValue,
        benchmarkValue: firstBenchmarkValue === 0 ? 0 : (item.benchmarkValue - firstBenchmarkValue) / firstBenchmarkValue,
      }));
    }
  }, [filteredData, chartType]);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>投资组合表现</CardTitle>
          
          <div className="flex items-center gap-2">
            <TabsList>
              <TabsTrigger 
                value="value" 
                className={chartType === 'value' ? 'bg-primary text-primary-foreground' : ''}
                onClick={() => setChartType('value')}
              >
                金额
              </TabsTrigger>
              <TabsTrigger 
                value="percent" 
                className={chartType === 'percent' ? 'bg-primary text-primary-foreground' : ''}
                onClick={() => setChartType('percent')}
              >
                百分比
              </TabsTrigger>
            </TabsList>
            
            <Select value={benchmark} onValueChange={setBenchmark}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {benchmarks.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2">
          {timeRanges.map(range => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-3 py-1 rounded-md text-sm ${
                timeRange === range.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-secondary'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div>
            <div className="text-sm text-muted-foreground mb-1">投资组合</div>
            <div className="text-2xl font-medium">
              {chartType === 'value' 
                ? formatCurrency(filteredData[filteredData.length - 1]?.portfolioValue || 0)
                : formatPercent(performance.portfolioPercent)
              }
            </div>
            <div className={`text-sm ${performance.portfolioPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {performance.portfolioPercent >= 0 ? '↑ ' : '↓ '}
              {formatPercent(Math.abs(performance.portfolioPercent))}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              基准指数 ({benchmarks.find(b => b.id === benchmark)?.name})
            </div>
            <div className="text-2xl font-medium">
              {chartType === 'value' 
                ? formatCurrency(filteredData[filteredData.length - 1]?.benchmarkValue || 0)
                : formatPercent(performance.benchmarkPercent)
              }
            </div>
            <div className={`text-sm ${performance.benchmarkPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {performance.benchmarkPercent >= 0 ? '↑ ' : '↓ '}
              {formatPercent(Math.abs(performance.benchmarkPercent))}
            </div>
          </div>
        </div>
        
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={val => new Date(val).toLocaleDateString('zh-CN')}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={val => chartType === 'value' ? formatCurrency(val, 'CNY', 'zh-CN').split('.')[0] : formatPercent(val).split('.')[0]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="portfolioValue" 
                stroke="#0091FF"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="benchmarkValue" 
                stroke="#FF6B00" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 