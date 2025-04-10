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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { VolatilityForecast } from '@/services/volatilityPredictionService';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  BarChart3,
  LineChart,
  History
} from 'lucide-react';

// 波动率预测组件接口
interface VolatilityPredictionProps {
  onGenerate?: (symbol: string, days: number) => Promise<VolatilityForecast>;
  initialForecast?: VolatilityForecast;
  symbols?: string[];
}

// 波动率图表数据结构
interface VolatilityChartData {
  date: string;
  current: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

// 历史波动率图表数据结构
interface HistoricalVolatilityData {
  period: string;
  volatility: number;
}

// 波动率趋势标签
const TrendLabel = ({ trend }: { trend: 'increasing' | 'decreasing' | 'stable' }) => {
  if (trend === 'increasing') {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <TrendingUp size={14} /> 上升
      </Badge>
    );
  } else if (trend === 'decreasing') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
        <TrendingDown size={14} /> 下降
      </Badge>
    );
  } else {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Minus size={14} /> 稳定
      </Badge>
    );
  }
};

// 风险评级标签
const RiskLabel = ({ volatility }: { volatility: number }) => {
  let label: string;
  let icon: JSX.Element;
  let className: string;
  
  if (volatility >= 0.35) {
    label = '极高风险';
    icon = <AlertTriangle size={14} />;
    className = "bg-red-100 text-red-800 hover:bg-red-200";
  } else if (volatility >= 0.25) {
    label = '高风险';
    icon = <AlertTriangle size={14} />;
    className = "bg-amber-100 text-amber-800 hover:bg-amber-200";
  } else if (volatility >= 0.15) {
    label = '中等风险';
    icon = <Info size={14} />;
    className = "bg-blue-100 text-blue-800 hover:bg-blue-200";
  } else {
    label = '低风险';
    icon = <CheckCircle2 size={14} />;
    className = "bg-green-100 text-green-800 hover:bg-green-200";
  }
  
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
      {icon} {label}
    </Badge>
  );
};

// 格式化百分比
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

// 简单图表组件 - 替代@tremor/react的AreaChart
const SimpleAreaChart = ({ data, height = 160 }: { data: VolatilityChartData[], height?: number }) => {
  if (!data || data.length < 2) return <div className="text-center py-4">无足够数据生成图表</div>;
  
  const maxValue = Math.max(
    data[1].upperBound,
    data[1].predicted,
    data[0].current
  ) * 1.1;
  
  const minValue = Math.max(0, data[1].lowerBound * 0.9);
  const range = maxValue - minValue;
  
  // 计算比例尺
  const getY = (value: number) => {
    return height - ((value - minValue) / range) * height;
  };
  
  // SVG点集合
  const predictedLine = `
    M 50,${getY(data[0].current)} 
    L 250,${getY(data[1].predicted)}
  `;
  
  const upperLine = `
    M 50,${getY(data[0].current)} 
    L 250,${getY(data[1].upperBound)}
  `;
  
  const lowerLine = `
    M 50,${getY(data[0].current)} 
    L 250,${getY(data[1].lowerBound)}
  `;
  
  const confidenceArea = `
    M 50,${getY(data[0].current)} 
    L 250,${getY(data[1].upperBound)}
    L 250,${getY(data[1].lowerBound)}
    L 50,${getY(data[0].current)}
    Z
  `;
  
  return (
    <div className="w-full p-2">
      <svg width="100%" height={height} viewBox={`0 0 300 ${height}`}>
        {/* 信心区间 */}
        <path d={confidenceArea} fill="rgba(79, 70, 229, 0.1)" />
        
        {/* 下限线 */}
        <path d={lowerLine} stroke="rgba(79, 70, 229, 0.5)" strokeWidth="1" strokeDasharray="4" fill="none" />
        
        {/* 上限线 */}
        <path d={upperLine} stroke="rgba(79, 70, 229, 0.5)" strokeWidth="1" strokeDasharray="4" fill="none" />
        
        {/* 预测线 */}
        <path d={predictedLine} stroke="rgb(59, 130, 246)" strokeWidth="2" fill="none" />
        
        {/* 点 */}
        <circle cx="50" cy={getY(data[0].current)} r="3" fill="rgb(59, 130, 246)" />
        <circle cx="250" cy={getY(data[1].predicted)} r="3" fill="rgb(59, 130, 246)" />
        
        {/* 标签 */}
        <text x="50" y={height - 5} textAnchor="middle" fontSize="12" fill="currentColor">当前</text>
        <text x="250" y={height - 5} textAnchor="middle" fontSize="12" fill="currentColor">{data[1].date}</text>
        
        {/* 数值标签 */}
        <text x="50" y={getY(data[0].current) - 8} textAnchor="middle" fontSize="10" fill="currentColor">
          {formatPercent(data[0].current)}
        </text>
        <text x="250" y={getY(data[1].predicted) - 8} textAnchor="middle" fontSize="10" fill="currentColor">
          {formatPercent(data[1].predicted)}
        </text>
      </svg>
    </div>
  );
};

// 简单条形图组件 - 替代@tremor/react的BarChart
const SimpleBarChart = ({ data, height = 160 }: { data: HistoricalVolatilityData[], height?: number }) => {
  if (!data || !data.length) return <div className="text-center py-4">无数据</div>;
  
  const maxValue = Math.max(...data.map(d => d.volatility)) * 1.1;
  const barWidth = 280 / data.length;
  const gap = 10;
  const actualBarWidth = barWidth - gap;
  
  return (
    <div className="w-full p-2">
      <svg width="100%" height={height} viewBox={`0 0 300 ${height}`}>
        {data.map((item, index) => {
          const barHeight = (item.volatility / maxValue) * (height - 40);
          const x = 10 + index * barWidth;
          const y = height - 30 - barHeight;
          
          return (
            <g key={item.period}>
              {/* 条形 */}
              <rect 
                x={x} 
                y={y} 
                width={actualBarWidth} 
                height={barHeight} 
                fill="rgb(59, 130, 246)" 
                rx="2" 
              />
              
              {/* 标签 */}
              <text 
                x={x + actualBarWidth / 2} 
                y={height - 10} 
                textAnchor="middle" 
                fontSize="10" 
                fill="currentColor"
              >
                {item.period}
              </text>
              
              {/* 数值 */}
              <text 
                x={x + actualBarWidth / 2} 
                y={y - 5} 
                textAnchor="middle" 
                fontSize="10" 
                fill="currentColor"
              >
                {formatPercent(item.volatility)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// 波动率预测组件
export default function VolatilityPrediction({ 
  onGenerate, 
  initialForecast,
  symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'] 
}: VolatilityPredictionProps) {
  // 状态管理
  const [symbol, setSymbol] = useState<string>(symbols[0]);
  const [days, setDays] = useState<number>(30);
  const [forecast, setForecast] = useState<VolatilityForecast | undefined>(initialForecast);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 图表数据准备
  const prepareChartData = (): VolatilityChartData[] => {
    if (!forecast) return [];
    
    const current = forecast.currentVolatility;
    const predicted = forecast.predictedVolatility;
    const [lowerBound, upperBound] = forecast.confidenceInterval;
    
    // 生成简单的时间序列模拟
    const data: VolatilityChartData[] = [];
    
    // 当前时间点
    data.push({
      date: '当前',
      current,
      predicted: current,
      lowerBound: current,
      upperBound: current
    });
    
    // 预测时间点
    data.push({
      date: `${forecast.forecastHorizon}天后`,
      current,
      predicted,
      lowerBound,
      upperBound
    });
    
    return data;
  };
  
  // 准备历史波动率数据
  const prepareHistoricalData = (): HistoricalVolatilityData[] => {
    if (!forecast) return [];
    
    return [
      { period: '日波动率', volatility: forecast.historicalVolatility.daily },
      { period: '周波动率', volatility: forecast.historicalVolatility.weekly },
      { period: '月波动率', volatility: forecast.historicalVolatility.monthly }
    ];
  };
  
  // 生成预测
  const generateForecast = async () => {
    if (!onGenerate) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await onGenerate(symbol, days);
      setForecast(result);
    } catch (err) {
      setError(`获取波动率预测失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    if (!initialForecast && onGenerate && !forecast) {
      generateForecast();
    }
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>波动率预测控制面板</CardTitle>
            <CardDescription>选择资产和预测时间范围</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">股票代码</label>
                <Select 
                  value={symbol} 
                  onValueChange={setSymbol}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择股票" />
                  </SelectTrigger>
                  <SelectContent>
                    {symbols.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">预测天数: {days}</label>
                <Slider
                  value={[days]}
                  min={5}
                  max={90}
                  step={5}
                  onValueChange={(values) => setDays(values[0])}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button 
              onClick={generateForecast} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '生成中...' : '生成波动率预测'}
            </Button>
            
            {error && (
              <div className="text-destructive text-sm mt-2">{error}</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {forecast && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 波动率预测卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{symbol} 波动率预测</span>
                <TrendLabel trend={forecast.volatilityTrend} />
              </CardTitle>
              <CardDescription>
                预测时间范围: {forecast.forecastHorizon} 天
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">当前波动率</p>
                  <p className="text-2xl font-bold">{formatPercent(forecast.currentVolatility)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">预测波动率</p>
                  <p className="text-2xl font-bold">{formatPercent(forecast.predictedVolatility)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">下限 (90% 置信区间)</p>
                  <p className="text-xl">{formatPercent(forecast.confidenceInterval[0])}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">上限 (90% 置信区间)</p>
                  <p className="text-xl">{formatPercent(forecast.confidenceInterval[1])}</p>
                </div>
              </div>
              
              <div className="pt-4">
                <p className="text-sm font-medium mb-2">波动率变化预测</p>
                <SimpleAreaChart data={prepareChartData()} />
              </div>
              
              <div className="flex justify-center pt-2">
                <RiskLabel volatility={forecast.predictedVolatility} />
              </div>
            </CardContent>
          </Card>
          
          {/* 历史波动率与模型参数 */}
          <Card>
            <CardHeader>
              <CardTitle>分析详情</CardTitle>
              <CardDescription>历史波动率和模型参数</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="historical">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="historical" className="flex items-center gap-1">
                    <History size={16} /> 历史波动率
                  </TabsTrigger>
                  <TabsTrigger value="model" className="flex items-center gap-1">
                    <BarChart3 size={16} /> 模型参数
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="historical" className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">不同时间窗口的历史波动率</p>
                  <SimpleBarChart data={prepareHistoricalData()} />
                </TabsContent>
                
                <TabsContent value="model">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">模型类型</h4>
                      <p className="text-lg">{forecast.modelType}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">ω (Omega)</p>
                        <p className="text-lg">{forecast.modelParams.omega.toExponential(4)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">α (Alpha)</p>
                        <p className="text-lg">{forecast.modelParams.alpha.toFixed(4)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">β (Beta)</p>
                        <p className="text-lg">{forecast.modelParams.beta.toFixed(4)}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium">模型解释</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        GARCH(1,1)模型中，ω表示长期方差水平，α表示过去收益率冲击对当前波动率的影响，
                        β表示波动率的持续性。α+β越接近1，表示波动率冲击的持续性越强。
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 