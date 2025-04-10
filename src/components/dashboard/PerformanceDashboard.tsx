'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  calculatePortfolioPerformance, 
  generatePerformanceInsights,
  calculateAttributionAnalysis,
  getHistoricalPerformance,
  PerformanceMetrics,
  PerformanceInsights
} from '@/actions/performance-dashboard';
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface PerformanceDashboardProps {
  portfolioId: string;
}

export function PerformanceDashboard({ portfolioId }: PerformanceDashboardProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [benchmark, setBenchmark] = useState<string>('SPY');
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [insights, setInsights] = useState<PerformanceInsights | null>(null);
  const [attribution, setAttribution] = useState<any | null>(null);
  const [attributionLevel, setAttributionLevel] = useState<'asset' | 'sector' | 'factor'>('sector');
  const [historicalData, setHistoricalData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('metrics');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FDAE61', '#F5222D', '#69C0FF', '#B7EB8F'];

  useEffect(() => {
    loadData();
  }, [portfolioId, timeframe, benchmark, attributionLevel]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load metrics
      const metricsResult = await calculatePortfolioPerformance(portfolioId, {
        timeframe,
        benchmark,
        includeForwardLooking: true,
        includeStressTests: true
      });
      
      if (metricsResult.success && metricsResult.metrics) {
        setMetrics(metricsResult.metrics);
        
        // Load insights based on metrics
        const insightsResult = await generatePerformanceInsights(portfolioId, metricsResult.metrics);
        if (insightsResult.success && insightsResult.insights) {
          setInsights(insightsResult.insights);
        }
      }
      
      // Load attribution analysis
      const attributionResult = await calculateAttributionAnalysis(portfolioId, {
        level: attributionLevel,
        timeframe
      });
      
      if (attributionResult.success && attributionResult.attribution) {
        setAttribution(attributionResult.attribution);
      }
      
      // Load historical data
      const historicalResult = await getHistoricalPerformance(
        portfolioId,
        timeframe,
        true,
        benchmark
      );
      
      if (historicalResult.success && historicalResult.data) {
        setHistoricalData(historicalResult.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    loadData();
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Generate data for pie chart
  const generatePieData = (allocation: Record<string, number>) => {
    return Object.entries(allocation)
      .filter(([_, value]) => value > 0) // Filter out zero values
      .map(([name, value], index) => ({
        name,
        value: parseFloat((value * 100).toFixed(2)),
      }));
  };

  const renderSectorAllocation = () => {
    if (!metrics) return null;
    const pieData = generatePieData(metrics.sectorAllocation);
    
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>行业配置</CardTitle>
          <CardDescription>投资组合按行业划分的配置比例</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTopHoldings = () => {
    if (!metrics) return null;
    
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>重要持仓</CardTitle>
          <CardDescription>按权重排序的前5大持仓</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.topHoldings}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatPercent} />
                <YAxis type="category" dataKey="ticker" width={80} />
                <Tooltip formatter={(value) => formatPercent(value as number)} />
                <Legend />
                <Bar dataKey="weight" name="权重" fill="#0088FE" />
                <Bar dataKey="return" name="收益率" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEquityCurve = () => {
    if (!metrics || !historicalData) return null;
    
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>权益曲线</CardTitle>
          <CardDescription>投资组合价值随时间变化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historicalData.portfolio}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="投资组合"
                  stroke="#0088FE"
                  activeDot={{ r: 8 }}
                />
                {historicalData.benchmark && (
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="基准"
                    stroke="#00C49F"
                    data={historicalData.benchmark}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAttributionAnalysis = () => {
    if (!attribution) return null;
    
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>归因分析</CardTitle>
          <CardDescription>
            <div className="flex items-center justify-between">
              <span>投资组合表现的归因分析</span>
              <Select
                value={attributionLevel}
                onValueChange={(value) => setAttributionLevel(value as any)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="分析维度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">资产级别</SelectItem>
                  <SelectItem value="sector">行业级别</SelectItem>
                  <SelectItem value="factor">因子级别</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attribution.components}
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatPercent} />
                <Tooltip formatter={(value) => formatPercent(value as number)} />
                <Legend />
                <Bar dataKey="contribution" name="贡献" fill="#0088FE" />
                <Bar dataKey="allocation" name="配置" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!metrics) return null;
    
    return (
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>总回报</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(metrics.totalReturn)}
            </div>
            <p className="text-sm text-muted-foreground">
              {timeframe}期间
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>夏普比率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              风险调整后回报
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>阿尔法</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(metrics.alpha)}
            </div>
            <p className="text-sm text-muted-foreground">
              相对于{benchmark}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>最大回撤</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(metrics.maxDrawdown)}
            </div>
            <p className="text-sm text-muted-foreground">
              期间最大亏损
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>波动率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(metrics.volatility)}
            </div>
            <p className="text-sm text-muted-foreground">
              年化标准差
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>贝塔</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.beta.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              市场敏感度
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>信息比率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.informationRatio.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              主动管理效率
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>跟踪误差</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(metrics.trackingError)}
            </div>
            <p className="text-sm text-muted-foreground">
              相对于基准
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPerformanceInsights = () => {
    if (!insights) return null;
    
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>投资组合分析</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">{insights.summary}</p>
            
            <h3 className="font-semibold text-lg mb-2">优势:</h3>
            <ul className="list-disc pl-5 mb-4">
              {insights.strengths.map((strength, index) => (
                <li key={`strength-${index}`}>{strength}</li>
              ))}
            </ul>
            
            <h3 className="font-semibold text-lg mb-2">弱点:</h3>
            <ul className="list-disc pl-5 mb-4">
              {insights.weaknesses.map((weakness, index) => (
                <li key={`weakness-${index}`}>{weakness}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>建议与关键指标</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg mb-2">建议:</h3>
            <ul className="list-disc pl-5 mb-4">
              {insights.recommendations.map((recommendation, index) => (
                <li key={`rec-${index}`}>{recommendation}</li>
              ))}
            </ul>
            
            <h3 className="font-semibold text-lg mb-2">关键指标:</h3>
            <div className="space-y-3">
              {insights.keyMetrics.map((metric, index) => (
                <div key={`metric-${index}`} className="border-b pb-2">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{metric.name}</span>
                    <span className="font-semibold">{metric.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{metric.interpretation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">投资组合绩效</h2>
        
        <div className="flex items-center space-x-2">
          <Select
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">周</SelectItem>
              <SelectItem value="month">月</SelectItem>
              <SelectItem value="quarter">季度</SelectItem>
              <SelectItem value="year">年</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={benchmark}
            onValueChange={(value) => setBenchmark(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="基准" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SPY">SPY (S&P 500)</SelectItem>
              <SelectItem value="QQQ">QQQ (纳斯达克100)</SelectItem>
              <SelectItem value="IWM">IWM (罗素2000)</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={refresh} disabled={isLoading}>
            {isLoading ? '加载中...' : '刷新'}
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">加载绩效数据中...</div>
        </div>
      ) : (
        <Tabs defaultValue="metrics" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">绩效指标</TabsTrigger>
            <TabsTrigger value="insights">AI分析洞察</TabsTrigger>
            <TabsTrigger value="attribution">归因分析</TabsTrigger>
            <TabsTrigger value="allocation">资产配置</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="space-y-4">
            {renderPerformanceMetrics()}
            {renderEquityCurve()}
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            {renderPerformanceInsights()}
          </TabsContent>
          
          <TabsContent value="attribution" className="space-y-4">
            {renderAttributionAnalysis()}
          </TabsContent>
          
          <TabsContent value="allocation" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {renderSectorAllocation()}
              {renderTopHoldings()}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 