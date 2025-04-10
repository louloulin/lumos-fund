'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  DotIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  InfoIcon,
  RefreshCwIcon,
  TrendingUp
} from 'lucide-react';
import { getPrediction, batchPrediction } from '@/actions/volatility-analysis';
import { VolatilityForecast } from '@/services/volatilityPredictionService';
import Link from 'next/link';

// 默认股票列表
const DEFAULT_SYMBOLS = [
  'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'FB', 
  'TSLA', 'NVDA', 'JPM', 'V', 'PG'
];

// 预测时间范围选项
const FORECAST_HORIZONS = [
  { value: '1', label: '1天' },
  { value: '3', label: '3天' },
  { value: '5', label: '5天' },
  { value: '10', label: '10天' },
  { value: '20', label: '20天' },
  { value: '30', label: '30天' }
];

export default function VolatilityAnalysisPage() {
  // 状态管理
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [customSymbol, setCustomSymbol] = useState<string>('');
  const [forecastHorizon, setForecastHorizon] = useState<number>(5);
  const [predictions, setPredictions] = useState<Record<string, VolatilityForecast | null>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 获取预测数据
  useEffect(() => {
    fetchPredictions();
  }, []);
  
  // 加载预测数据
  const fetchPredictions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 批量获取预测
      const results = await batchPrediction(symbols, forecastHorizon);
      
      setPredictions(results);
      
      // 设置默认选中的股票
      if (!selectedSymbol && symbols.length > 0) {
        // 找到第一个有有效预测的股票
        const firstValidSymbol = symbols.find(symbol => results[symbol] !== null);
        setSelectedSymbol(firstValidSymbol || symbols[0]);
      }
    } catch (error) {
      console.error('获取波动率预测失败', error);
      setError('获取波动率预测数据失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 添加自定义股票
  const handleAddSymbol = () => {
    if (!customSymbol) return;
    
    const symbol = customSymbol.toUpperCase().trim();
    
    if (symbols.includes(symbol)) {
      return; // 已存在，不重复添加
    }
    
    setSymbols([...symbols, symbol]);
    setCustomSymbol('');
    
    // 获取新添加股票的预测
    fetchPredictionForSymbol(symbol);
  };
  
  // 获取单个股票的预测
  const fetchPredictionForSymbol = async (symbol: string) => {
    try {
      setIsLoading(true);
      
      // 获取单个预测
      const result = await getPrediction(symbol, forecastHorizon);
      
      setPredictions(prev => ({
        ...prev,
        [symbol]: result
      }));
      
      // 如果尚未选择股票，选择这个
      if (!selectedSymbol) {
        setSelectedSymbol(symbol);
      }
    } catch (error) {
      console.error(`获取${symbol}的波动率预测失败`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 更新预测时间范围
  const handleHorizonChange = (value: string) => {
    const horizon = parseInt(value, 10);
    setForecastHorizon(horizon);
    
    // 触发重新预测
    fetchPredictions();
  };
  
  // 创建波动率趋势柱状图数据
  const createVolatilityComparisonData = () => {
    return Object.entries(predictions)
      .filter(([_, prediction]) => prediction !== null)
      .map(([symbol, prediction]) => {
        const data = prediction as VolatilityForecast;
        return {
          symbol,
          current: Math.round(data.currentVolatility * 100) / 100,
          predicted: Math.round(data.predictedVolatility * 100) / 100,
          trend: data.volatilityTrend
        };
      })
      .sort((a, b) => b.predicted - a.predicted);
  };
  
  // 创建单个股票的波动率历史和预测对比数据
  const createVolatilityTrendData = (symbol: string) => {
    const prediction = predictions[symbol];
    if (!prediction) return [];
    
    const { historicalVolatility, predictedVolatility } = prediction;
    
    return [
      { name: '月度', value: historicalVolatility.monthly, type: '历史波动率' },
      { name: '周度', value: historicalVolatility.weekly, type: '历史波动率' },
      { name: '日度', value: historicalVolatility.daily, type: '历史波动率' },
      { name: '预测', value: predictedVolatility, type: '预测波动率' }
    ];
  };
  
  // 创建置信区间图表数据
  const createConfidenceIntervalData = (symbol: string) => {
    const prediction = predictions[symbol];
    if (!prediction) return [];
    
    const { predictedVolatility, confidenceInterval } = prediction;
    
    return [
      { name: '下限', value: confidenceInterval[0] },
      { name: '预测', value: predictedVolatility },
      { name: '上限', value: confidenceInterval[1] }
    ];
  };
  
  // 渲染波动率趋势标签
  const renderTrendBadge = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <TrendingUpIcon className="h-3 w-3" />
            <span>上升</span>
          </Badge>
        );
      case 'decreasing':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-500 text-white">
            <TrendingDownIcon className="h-3 w-3" />
            <span>下降</span>
          </Badge>
        );
      case 'stable':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <DotIcon className="h-3 w-3" />
            <span>稳定</span>
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // 渲染波动率表格
  const renderVolatilityTable = () => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableCaption>资产波动率预测（年化）</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">资产</TableHead>
              <TableHead>当前波动率</TableHead>
              <TableHead>预测波动率</TableHead>
              <TableHead>变化</TableHead>
              <TableHead>趋势</TableHead>
              <TableHead className="text-right">置信区间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {symbols.map(symbol => {
              const prediction = predictions[symbol];
              
              if (!prediction) {
                return (
                  <TableRow key={symbol} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{symbol}</TableCell>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                );
              }
              
              const {
                currentVolatility,
                predictedVolatility,
                confidenceInterval,
                volatilityTrend
              } = prediction;
              
              const changePercent = ((predictedVolatility / currentVolatility) - 1) * 100;
              const isIncreasing = changePercent > 0;
              
              return (
                <TableRow 
                  key={symbol} 
                  className={`cursor-pointer ${selectedSymbol === symbol ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedSymbol(symbol)}
                >
                  <TableCell className="font-medium">{symbol}</TableCell>
                  <TableCell>{(currentVolatility * 100).toFixed(2)}%</TableCell>
                  <TableCell>{(predictedVolatility * 100).toFixed(2)}%</TableCell>
                  <TableCell>
                    <span className={isIncreasing ? 'text-red-500' : 'text-green-500'}>
                      {isIncreasing ? '+' : ''}{changePercent.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>{renderTrendBadge(volatilityTrend)}</TableCell>
                  <TableCell className="text-right">
                    {(confidenceInterval[0] * 100).toFixed(2)}% - {(confidenceInterval[1] * 100).toFixed(2)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // 渲染波动率柱状图
  const renderVolatilityBarChart = () => {
    const data = createVolatilityComparisonData();
    
    return (
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              domain={[0, 'dataMax']} 
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              dataKey="symbol" 
              type="category" 
              width={60} 
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, '波动率']}
              labelFormatter={(label) => `股票: ${label}`}
            />
            <Legend />
            <Bar dataKey="current" name="当前波动率" fill="#8884d8" />
            <Bar dataKey="predicted" name="预测波动率" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // 渲染单个股票的详细分析
  const renderSymbolDetail = () => {
    if (!selectedSymbol || !predictions[selectedSymbol]) {
      return (
        <div className="flex justify-center items-center h-[300px]">
          <div className="text-center text-muted-foreground">
            <InfoIcon className="mx-auto h-12 w-12 mb-2 text-muted-foreground/70" />
            <p>请选择一个股票查看详细分析</p>
          </div>
        </div>
      );
    }
    
    const prediction = predictions[selectedSymbol];
    
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold">{selectedSymbol} 波动率分析</h3>
          <p className="text-muted-foreground">
            生成时间: {new Date(prediction.timestamp).toLocaleString()}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">当前波动率</CardTitle>
              <CardDescription>基于历史数据计算</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(prediction.currentVolatility * 100).toFixed(2)}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">预测波动率</CardTitle>
              <CardDescription>未来{prediction.forecastHorizon}天</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(prediction.predictedVolatility * 100).toFixed(2)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                区间: {(prediction.confidenceInterval[0] * 100).toFixed(2)}% - {(prediction.confidenceInterval[1] * 100).toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">波动率趋势</CardTitle>
              <CardDescription>相对变化</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">
                  {renderTrendBadge(prediction.volatilityTrend)}
                </div>
                <span className="text-xl">
                  {(((prediction.predictedVolatility / prediction.currentVolatility) - 1) * 100).toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>波动率趋势</CardTitle>
              <CardDescription>不同时间范围波动率对比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={createVolatilityTrendData(selectedSymbol)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, '波动率']}
                    />
                    <Bar dataKey="value" fill="#8884d8" name="波动率" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>置信区间</CardTitle>
              <CardDescription>波动率95%置信区间</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={createConfidenceIntervalData(selectedSymbol)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, '波动率']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      fill="#8884d8" 
                      stroke="#8884d8" 
                      name="波动率"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>波动率风险解读</CardTitle>
            <CardDescription>基于GARCH(1,1)模型分析</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p>
                <strong>模型:</strong> {prediction.modelType}
              </p>
              <p>
                <strong>模型参数:</strong> ω = {prediction.modelParams.omega.toExponential(4)}, 
                α = {prediction.modelParams.alpha.toFixed(4)}, 
                β = {prediction.modelParams.beta.toFixed(4)}
              </p>
              <p>
                <strong>持久性:</strong> {(prediction.modelParams.alpha + prediction.modelParams.beta).toFixed(4)}
                {prediction.modelParams.alpha + prediction.modelParams.beta > 0.99 && 
                  <span className="text-amber-500 ml-2">(高持久性)</span>
                }
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">风险评估</h4>
              {prediction.volatilityTrend === 'increasing' && (
                <Alert variant="destructive" className="bg-red-50">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertTitle>波动率上升趋势</AlertTitle>
                  <AlertDescription>
                    预计{selectedSymbol}在未来{prediction.forecastHorizon}天内波动率将上升。
                    这可能意味着更高的风险和更大的价格波动。
                  </AlertDescription>
                </Alert>
              )}
              
              {prediction.volatilityTrend === 'decreasing' && (
                <Alert className="bg-green-50 border-green-200">
                  <InfoIcon className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-700">波动率下降趋势</AlertTitle>
                  <AlertDescription className="text-green-700">
                    预计{selectedSymbol}在未来{prediction.forecastHorizon}天内波动率将下降。
                    这表明价格可能会更加稳定，风险有所降低。
                  </AlertDescription>
                </Alert>
              )}
              
              {prediction.volatilityTrend === 'stable' && (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>波动率稳定</AlertTitle>
                  <AlertDescription>
                    预计{selectedSymbol}在未来{prediction.forecastHorizon}天内波动率将保持相对稳定。
                    价格波动模式可能与当前水平相似。
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  return (
    <div className="container py-8 mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">波动率预测</h1>
        <p className="text-muted-foreground">
          基于GARCH模型的资产波动率预测和风险分析
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="w-full sm:w-1/2 space-y-2">
          <Label htmlFor="add-symbol">添加资产</Label>
          <div className="flex gap-2">
            <Input
              id="add-symbol"
              placeholder="输入股票代码，如 AAPL"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
            />
            <Button onClick={handleAddSymbol}>添加</Button>
          </div>
        </div>
        
        <div className="w-full sm:w-1/2 space-y-2">
          <Label htmlFor="forecast-horizon">预测时间范围</Label>
          <div className="flex gap-2">
            <Select
              value={forecastHorizon.toString()}
              onValueChange={handleHorizonChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择预测时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>预测时间范围</SelectLabel>
                  {FORECAST_HORIZONS.map((horizon) => (
                    <SelectItem key={horizon.value} value={horizon.value}>
                      {horizon.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={fetchPredictions}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">表格视图</TabsTrigger>
          <TabsTrigger value="chart">图表视图</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[40px] w-full" />
              <Skeleton className="h-[250px] w-full" />
            </div>
          ) : (
            renderVolatilityTable()
          )}
        </TabsContent>
        
        <TabsContent value="chart" className="mt-6">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            renderVolatilityBarChart()
          )}
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6">详细分析</h2>
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[120px] w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[350px] w-full" />
              <Skeleton className="h-[350px] w-full" />
            </div>
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          renderSymbolDetail()
        )}
      </div>
      
      <div className="mb-6">
        <Link href="/risk/volatility/prediction">
          <Button className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>波动率预测分析</span>
          </Button>
        </Link>
      </div>
    </div>
  );
} 