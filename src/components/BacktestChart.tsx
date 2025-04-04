'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// 回测图表组件属性
interface BacktestChartProps {
  result: any;
  title?: string;
  description?: string;
}

// 处理多个曲线的数据格式化
function formatChartData(result: any) {
  // 如果是多个代理的比较回测
  if (result.results) {
    // 找到所有的时间点
    const allDates = new Set<string>();
    const resultsByAgent: Record<string, any> = {};
    
    // 收集所有代理的数据点
    for (const [agentType, data] of Object.entries(result.results)) {
      const equityCurve = (data as any).equityCurve || [];
      resultsByAgent[agentType] = {};
      
      for (const point of equityCurve) {
        allDates.add(point.date);
        resultsByAgent[agentType][point.date] = point.value;
      }
    }
    
    // 将所有时间点排序
    const sortedDates = Array.from(allDates).sort();
    
    // 创建最终的数据格式
    return sortedDates.map(date => {
      const dataPoint: Record<string, any> = { date };
      
      for (const agentType of Object.keys(result.results)) {
        dataPoint[agentType] = resultsByAgent[agentType][date] || null;
      }
      
      return dataPoint;
    });
  }
  
  // 单个代理的回测结果
  return result.equityCurve || [];
}

export function BacktestChart({ result, title, description }: BacktestChartProps) {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    if (result) {
      setData(formatChartData(result));
    }
  }, [result]);
  
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">没有回测数据可以显示</p>
      </div>
    );
  }
  
  // 多代理比较回测
  if (result.results) {
    const agentTypes = Object.keys(result.results);
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
    
    return (
      <div className="h-full">
        <div className="text-sm mb-2">{description}</div>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                // 只显示月份和年份
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getFullYear().toString().substring(2)}`;
              }}
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`$${parseFloat(value as string).toFixed(2)}`, '']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Legend />
            {agentTypes.map((agentType, index) => (
              <Line
                key={agentType}
                type="monotone"
                dataKey={agentType}
                name={getAgentName(agentType)}
                stroke={colors[index % colors.length]}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  // 单个代理回测
  return (
    <div className="h-full">
      <div className="text-sm mb-2">{description}</div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => {
              // 只显示月份和年份
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getFullYear().toString().substring(2)}`;
            }}
          />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`$${parseFloat(value as string).toFixed(2)}`, '投资组合价值']}
            labelFormatter={(label) => `日期: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name="投资组合价值"
            stroke="#4f46e5"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 辅助函数
function getAgentName(type: string): string {
  switch (type) {
    case 'value':
      return '价值投资';
    case 'growth':
      return '成长投资';
    case 'trend':
      return '趋势投资';
    case 'quant':
      return '量化投资';
    default:
      return type;
  }
}

export default BacktestChart; 