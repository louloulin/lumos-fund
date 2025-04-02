import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// 回测结果类型定义
interface BacktestResult {
  strategy: string;
  initialCapital: number;
  finalCapital: number;
  returns: number;
  annualizedReturns: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  trades: number;
  successfulTrades: number;
  dailyReturns: {
    date: string;
    value: number;
    benchmark: number;
  }[];
  positions: {
    date: string;
    symbol: string;
    action: string;
    price: number;
    shares: number;
    value: number;
    returnPct?: number;
  }[];
  statistics: {
    name: string;
    value: string | number;
  }[];
}

interface BacktestResultsProps {
  results: BacktestResult[];
  benchmarkName?: string;
}

export function BacktestResults({ results, benchmarkName = '沪深300' }: BacktestResultsProps) {
  const [activeStrategy, setActiveStrategy] = useState<string>(results[0]?.strategy || '');
  
  // 如果没有结果，显示空状态
  if (!results.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>回测结果</CardTitle>
          <CardDescription>暂无回测数据</CardDescription>
        </CardHeader>
        <CardContent className="min-h-40 flex items-center justify-center">
          <p className="text-muted-foreground">请先运行回测</p>
        </CardContent>
      </Card>
    );
  }
  
  // 找到当前选择的策略结果
  const activeResult = results.find(r => r.strategy === activeStrategy) || results[0];
  
  // 格式化收益率百分比
  const formatPct = (value: number) => `${(value * 100).toFixed(2)}%`;
  
  // 计算回测日期范围
  const startDate = activeResult.dailyReturns[0]?.date;
  const endDate = activeResult.dailyReturns[activeResult.dailyReturns.length - 1]?.date;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>回测结果</CardTitle>
        <CardDescription>
          {startDate && endDate ? (
            `回测期间: ${startDate} - ${endDate} (${activeResult.dailyReturns.length}个交易日)`
          ) : '策略回测分析'}
        </CardDescription>
        
        {results.length > 1 && (
          <div className="mt-2">
            <TabsList className="grid" style={{ 
              gridTemplateColumns: `repeat(${Math.min(results.length, 4)}, minmax(0, 1fr))` 
            }}>
              {results.map(result => (
                <TabsTrigger 
                  key={result.strategy} 
                  value={result.strategy}
                  onClick={() => setActiveStrategy(result.strategy)}
                  className={activeStrategy === result.strategy ? 'bg-primary text-primary-foreground' : ''}
                >
                  {result.strategy}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="returns">收益曲线</TabsTrigger>
            <TabsTrigger value="stats">统计指标</TabsTrigger>
            <TabsTrigger value="trades">交易记录</TabsTrigger>
          </TabsList>
          
          {/* 概览面板 */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <MetricCard 
                title="总收益率" 
                value={formatPct(activeResult.returns)} 
                trend={activeResult.returns > 0 ? "up" : "down"}
              />
              <MetricCard 
                title="年化收益" 
                value={formatPct(activeResult.annualizedReturns)} 
                trend={activeResult.annualizedReturns > 0 ? "up" : "down"}
              />
              <MetricCard 
                title="最大回撤" 
                value={formatPct(activeResult.maxDrawdown)} 
                trend="down"
                trendReversed
              />
              <MetricCard 
                title="夏普比率" 
                value={activeResult.sharpeRatio.toFixed(2)} 
                trend={activeResult.sharpeRatio > 1 ? "up" : "neutral"}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">收益对比</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeResult.dailyReturns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return format(date, 'MM-dd');
                        }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${(value * 100).toFixed(2)}%`]}
                        labelFormatter={(label) => `日期: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name={activeResult.strategy} 
                        stroke="#3b82f6" 
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="benchmark" 
                        name={benchmarkName} 
                        stroke="#6b7280" 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">交易表现</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: '交易次数', value: activeResult.trades },
                      { name: '成功交易', value: activeResult.successfulTrades },
                      { name: '失败交易', value: activeResult.trades - activeResult.successfulTrades }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* 收益曲线面板 */}
          <TabsContent value="returns">
            <div className="h-80 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeResult.dailyReturns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${(value * 100).toFixed(2)}%`]}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={activeResult.strategy} 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    name={benchmarkName} 
                    stroke="#6b7280" 
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">策略表现</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                  title="起始资金" 
                  value={`¥${activeResult.initialCapital.toLocaleString()}`} 
                  trend="neutral"
                />
                <MetricCard 
                  title="最终资金" 
                  value={`¥${activeResult.finalCapital.toLocaleString()}`} 
                  trend={activeResult.finalCapital > activeResult.initialCapital ? "up" : "down"}
                />
                <MetricCard 
                  title="收益率" 
                  value={formatPct(activeResult.returns)} 
                  trend={activeResult.returns > 0 ? "up" : "down"}
                />
                <MetricCard 
                  title="盈亏比" 
                  value={activeResult.profitFactor.toFixed(2)} 
                  trend={activeResult.profitFactor > 1 ? "up" : "down"}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* 统计指标面板 */}
          <TabsContent value="stats">
            <div className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {activeResult.statistics.map((stat, index) => (
                  <div key={index} className="bg-muted/30 p-4 rounded-md">
                    <h4 className="text-sm text-muted-foreground">{stat.name}</h4>
                    <p className="text-lg font-medium mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* 交易记录面板 */}
          <TabsContent value="trades">
            <div className="mt-4">
              <ScrollArea className="h-80">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card border-b">
                    <tr>
                      <th className="text-left py-2 px-3">日期</th>
                      <th className="text-left py-2 px-3">股票</th>
                      <th className="text-left py-2 px-3">操作</th>
                      <th className="text-right py-2 px-3">价格</th>
                      <th className="text-right py-2 px-3">数量</th>
                      <th className="text-right py-2 px-3">金额</th>
                      <th className="text-right py-2 px-3">收益率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeResult.positions.map((trade, index) => (
                      <tr key={index} className="border-b border-muted">
                        <td className="py-2 px-3">{trade.date}</td>
                        <td className="py-2 px-3">{trade.symbol}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            trade.action === '买入' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {trade.action}
                          </span>
                        </td>
                        <td className="text-right py-2 px-3">¥{trade.price.toFixed(2)}</td>
                        <td className="text-right py-2 px-3">{trade.shares}</td>
                        <td className="text-right py-2 px-3">¥{trade.value.toLocaleString()}</td>
                        <td className="text-right py-2 px-3">
                          {trade.returnPct !== undefined ? (
                            <span className={trade.returnPct >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatPct(trade.returnPct)}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// 指标卡片组件
interface MetricCardProps {
  title: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  trendReversed?: boolean;
}

function MetricCard({ title, value, trend, trendReversed = false }: MetricCardProps) {
  const getTrendColor = () => {
    if (trend === 'neutral') return 'text-gray-500';
    return trendReversed 
      ? (trend === 'up' ? 'text-red-500' : 'text-green-500')
      : (trend === 'up' ? 'text-green-500' : 'text-red-500');
  };
  
  return (
    <div className="bg-card p-4 rounded-md border">
      <h3 className="text-sm text-muted-foreground">{title}</h3>
      <p className={`text-2xl font-bold mt-1 ${getTrendColor()}`}>{value}</p>
    </div>
  );
} 