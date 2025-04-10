'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon, 
  DollarSignIcon, ActivityIcon, PieChartIcon 
} from "lucide-react";

// 回测结果类型定义
export interface BacktestResult {
  strategy?: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number;
  returns: number;
  annualizedReturns: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: {
    date: string;
    ticker: string;
    action: 'buy' | 'sell' | 'short' | 'cover';
    price: number;
    quantity: number;
    value: number;
    profit?: number;
    confidence?: number;
  }[];
  equityCurve: Array<{ date: string; value: number }>;
  metrics: Record<string, number>;
  analysis?: string;
  optimizationSuggestions?: string;
}

interface BacktestResultsProps {
  results: Record<string, BacktestResult> | BacktestResult;
  benchmarkName?: string;
}

export function BacktestResults({ results, benchmarkName = '标普500' }: BacktestResultsProps) {
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);
  
  // 检查是否是多策略比较
  const isMultiStrategy = !('startDate' in results);
  
  // 获取活跃策略数据
  let activeData: BacktestResult | null = null;
  let strategies: string[] = [];
  
  if (isMultiStrategy) {
    strategies = Object.keys(results);
    if (!activeStrategy && strategies.length > 0) {
      setActiveStrategy(strategies[0]);
    }
    if (activeStrategy) {
      activeData = (results as Record<string, BacktestResult>)[activeStrategy];
    }
  } else {
    activeData = results as BacktestResult;
    if (activeData.strategy) {
      strategies = [activeData.strategy];
      if (!activeStrategy) {
        setActiveStrategy(activeData.strategy);
      }
    }
  }
  
  // 如果没有数据，显示空状态
  if (!activeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>回测结果</CardTitle>
          <CardDescription>暂无回测数据</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  // 计算月度回报
  const calculateMonthlyReturns = (equityCurve: Array<{ date: string; value: number }>) => {
    if (!equityCurve || equityCurve.length < 2) return [];
    
    const monthlyData: Record<string, { date: string; value: number }> = {};
    
    equityCurve.forEach(point => {
      const date = new Date(point.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey] || new Date(monthlyData[monthKey].date) < date) {
        monthlyData[monthKey] = point;
      }
    });
    
    const monthlyPoints = Object.values(monthlyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const monthlyReturns = [];
    
    for (let i = 1; i < monthlyPoints.length; i++) {
      const prevValue = monthlyPoints[i-1].value;
      const currentValue = monthlyPoints[i].value;
      const returnPct = ((currentValue / prevValue) - 1) * 100;
      
      monthlyReturns.push({
        month: formatDate(monthlyPoints[i].date).substring(0, 7),
        return: returnPct
      });
    }
    
    return monthlyReturns;
  };
  
  // 统计获利和亏损交易
  const calculateTradeStats = (trades: BacktestResult['trades']) => {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        profitableTrades: 0,
        unprofitableTrades: 0,
        winRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        largestProfit: 0,
        largestLoss: 0,
        averageProfit: 0,
        averageLoss: 0,
        profitFactor: 0
      };
    }
    
    // 过滤出卖出交易（包含利润信息）
    const sellTrades = trades.filter(t => t.action === 'sell' && t.profit !== undefined);
    
    if (sellTrades.length === 0) {
      return {
        totalTrades: trades.length,
        profitableTrades: 0,
        unprofitableTrades: 0,
        winRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        largestProfit: 0,
        largestLoss: 0,
        averageProfit: 0,
        averageLoss: 0,
        profitFactor: 0
      };
    }
    
    const profitableTrades = sellTrades.filter(t => (t.profit || 0) > 0);
    const unprofitableTrades = sellTrades.filter(t => (t.profit || 0) <= 0);
    
    const totalProfit = profitableTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalLoss = Math.abs(unprofitableTrades.reduce((sum, t) => sum + (t.profit || 0), 0));
    
    const largestProfit = profitableTrades.length > 0
      ? Math.max(...profitableTrades.map(t => t.profit || 0))
      : 0;
      
    const largestLoss = unprofitableTrades.length > 0
      ? Math.abs(Math.min(...unprofitableTrades.map(t => t.profit || 0)))
      : 0;
      
    const averageProfit = profitableTrades.length > 0
      ? totalProfit / profitableTrades.length
      : 0;
      
    const averageLoss = unprofitableTrades.length > 0
      ? totalLoss / unprofitableTrades.length
      : 0;
      
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    return {
      totalTrades: sellTrades.length,
      profitableTrades: profitableTrades.length,
      unprofitableTrades: unprofitableTrades.length,
      winRate: profitableTrades.length / sellTrades.length,
      totalProfit,
      totalLoss,
      largestProfit,
      largestLoss,
      averageProfit,
      averageLoss,
      profitFactor
    };
  };
  
  const tradeStats = calculateTradeStats(activeData.trades);
  const monthlyReturns = calculateMonthlyReturns(activeData.equityCurve);
  
  // 格式化收益率显示
  const formatReturnPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // 格式化货币显示
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // 为图表准备权益曲线数据
  const equityCurveData = activeData.equityCurve.map(point => ({
    date: formatDate(point.date),
    value: point.value
  }));
  
  // 拆分交易类型为买入和卖出
  const buySellTradeData = activeData.trades.map(trade => ({
    date: formatDate(trade.date),
    [trade.action === 'buy' ? 'buy' : 'sell']: trade.price
  }));
  
  return (
    <div className="space-y-6">
      {/* 策略选择器（仅多策略比较时显示） */}
      {isMultiStrategy && strategies.length > 1 && (
        <Tabs
          value={activeStrategy || strategies[0]}
          onValueChange={setActiveStrategy}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
            {strategies.map(strategy => (
              <TabsTrigger key={strategy} value={strategy}>
                {strategy === 'value' && '价值策略'}
                {strategy === 'trend' && '趋势策略'}
                {strategy === 'meanreversion' && '均值回归'}
                {strategy === 'risk' && '风险管理'}
                {strategy === 'hybrid' && '混合策略'}
                {!['value', 'trend', 'meanreversion', 'risk', 'hybrid'].includes(strategy) && strategy}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      
      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总回报</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              {formatReturnPercent(activeData.returns)}
              <span className="ml-2">
                {activeData.returns > 0 ? (
                  <TrendingUpIcon className="text-green-500 h-5 w-5" />
                ) : (
                  <TrendingDownIcon className="text-red-500 h-5 w-5" />
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              年化收益率: {formatReturnPercent(activeData.annualizedReturns)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>最大回撤</CardDescription>
            <CardTitle className="text-2xl text-amber-500">
              {formatReturnPercent(activeData.maxDrawdown)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              风险收益比: {(activeData.annualizedReturns / activeData.maxDrawdown).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>夏普比率</CardDescription>
            <CardTitle 
              className={`text-2xl ${
                activeData.sharpeRatio > 1 ? 'text-green-500' : 
                activeData.sharpeRatio > 0 ? 'text-amber-500' : 'text-red-500'
              }`}
            >
              {activeData.sharpeRatio.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              波动率: {(activeData.metrics.volatility * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>盈利因子</CardDescription>
            <CardTitle className="text-2xl">
              {tradeStats.profitFactor.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              胜率: {(tradeStats.winRate * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* 回测结果内容区 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="equity">权益曲线</TabsTrigger>
          <TabsTrigger value="trades">交易记录</TabsTrigger>
          <TabsTrigger value="monthly">月度回报</TabsTrigger>
          {activeData.analysis && <TabsTrigger value="analysis">AI分析</TabsTrigger>}
        </TabsList>
        
        {/* 概览选项卡 */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>权益曲线</CardTitle>
                <CardDescription>
                  {formatDate(activeData.startDate)} 到 {formatDate(activeData.endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurveData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 12}}
                        tickFormatter={(value) => value.substring(5)}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Area 
                        type="monotone" 
                        dataKey="value"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        name="投资组合价值"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>绩效指标</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">初始资金</TableCell>
                      <TableCell>{formatCurrency(activeData.initialCapital)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">最终价值</TableCell>
                      <TableCell>{formatCurrency(activeData.finalValue)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">净盈亏</TableCell>
                      <TableCell 
                        className={activeData.finalValue - activeData.initialCapital > 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        {formatCurrency(activeData.finalValue - activeData.initialCapital)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">回测期间</TableCell>
                      <TableCell>{formatDate(activeData.startDate)} 至 {formatDate(activeData.endDate)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">总交易次数</TableCell>
                      <TableCell>{activeData.trades.length}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">胜率</TableCell>
                      <TableCell>{(tradeStats.winRate * 100).toFixed(2)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">平均盈利</TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(tradeStats.averageProfit)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">平均亏损</TableCell>
                      <TableCell className="text-red-600">
                        {formatCurrency(tradeStats.averageLoss)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* 权益曲线选项卡 */}
        <TabsContent value="equity">
          <Card>
            <CardHeader>
              <CardTitle>权益曲线和交易点位</CardTitle>
              <CardDescription>查看投资组合价值变化与交易执行时机</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={equityCurveData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fontSize: 12}}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(value) => formatCurrency(value).split('.')[0]}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'value' ? '投资组合价值' : name
                      ]}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      dot={false}
                      name="投资组合价值"
                    />
                    
                    {/* 在图表上标注交易点 */}
                    {activeData.trades.map((trade, index) => {
                      const tradeDate = formatDate(trade.date);
                      const matchingPoint = equityCurveData.find(p => p.date === tradeDate);
                      
                      if (!matchingPoint) return null;
                      
                      return (
                        <Line
                          key={`trade-${index}`}
                          yAxisId="left"
                          dataKey="value"
                          data={[matchingPoint]}
                          stroke="transparent"
                          dot={{
                            r: 6,
                            fill: trade.action === 'buy' ? '#4caf50' : '#f44336',
                            stroke: trade.action === 'buy' ? '#4caf50' : '#f44336'
                          }}
                          activeDot={{
                            r: 8,
                            fill: trade.action === 'buy' ? '#4caf50' : '#f44336',
                            stroke: '#fff'
                          }}
                          name={trade.action === 'buy' ? '买入' : '卖出'}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 交易记录选项卡 */}
        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <CardTitle>交易记录</CardTitle>
              <CardDescription>查看所有执行的交易</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>价格</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>交易额</TableHead>
                      <TableHead>盈亏</TableHead>
                      <TableHead>置信度</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeData.trades.map((trade, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(trade.date)}</TableCell>
                        <TableCell>
                          <Badge variant={trade.action === 'buy' ? 'default' : 'destructive'}>
                            {trade.action === 'buy' ? '买入' : '卖出'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(trade.price)}</TableCell>
                        <TableCell>{trade.quantity}</TableCell>
                        <TableCell>{formatCurrency(trade.value)}</TableCell>
                        <TableCell className={
                          trade.profit === undefined ? '' : 
                          trade.profit > 0 ? 'text-green-600' : 'text-red-600'
                        }>
                          {trade.profit !== undefined 
                            ? formatCurrency(trade.profit) 
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {trade.confidence !== undefined 
                            ? `${(trade.confidence * 100).toFixed(0)}%` 
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 月度回报选项卡 */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>月度回报</CardTitle>
              <CardDescription>查看按月度统计的回报率</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyReturns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(2)}%`, '收益率']}
                      cursor={{fill: 'rgba(0, 0, 0, 0.1)'}}
                    />
                    <Bar 
                      dataKey="return" 
                      name="月收益率" 
                      fill={(data) => Number(data.return) >= 0 ? '#4caf50' : '#f44336'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI分析选项卡 */}
        {activeData.analysis && (
          <TabsContent value="analysis">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI策略分析</CardTitle>
                  <CardDescription>人工智能对回测结果的评估</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {activeData.analysis.split('\n\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {activeData.optimizationSuggestions && (
                <Card>
                  <CardHeader>
                    <CardTitle>策略优化建议</CardTitle>
                    <CardDescription>AI提供的改进方向</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {activeData.optimizationSuggestions.split('\n\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 