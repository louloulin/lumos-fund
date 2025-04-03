import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type QuantitativeAnalysisProps = {
  result: {
    ticker: string;
    analysis: string;
    data: {
      timeframe: 'short' | 'medium' | 'long';
      riskTolerance: 'low' | 'medium' | 'high';
      historicalPrices?: any[];
      technicalIndicators?: {
        rsi?: { value: number; signal: string };
        macd?: { value: number; signal: string };
        bollinger?: { upper: number; middle: number; lower: number; signal: string };
        [key: string]: any;
      };
      factorData?: {
        value?: number;
        momentum?: number;
        quality?: number;
        size?: number;
        volatility?: number;
        [key: string]: any;
      };
      arbitrageData?: {
        pairStock: string;
        correlation: number;
        zScore: number;
        signal: string;
        confidence: number;
      }[];
    };
    timestamp: string;
  };
};

export function QuantitativeAnalysis({ result }: QuantitativeAnalysisProps) {
  // 从分析文本中提取关键信息
  const extractFromAnalysis = (text: string, pattern: RegExp): string => {
    const match = text.match(pattern);
    return match ? match[1].trim() : 'N/A';
  };

  const signal = extractFromAnalysis(result.analysis, /投资信号:\s*(.+?)(?:\n|$)/);
  const confidence = extractFromAnalysis(result.analysis, /置信度:\s*(.+?)(?:\n|$)/);
  const sharpeRatio = extractFromAnalysis(result.analysis, /估计夏普比率:\s*(.+?)(?:\n|$)/);

  // 分析详情提取
  const analysisLines = result.analysis
    .split(/量化分析:/)
    .pop()
    ?.split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.trim()) || [];

  // 确定信号颜色
  const getSignalColor = (signal: string) => {
    if (signal.includes('看涨')) return 'bg-green-500';
    if (signal.includes('看跌')) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  // 确定时间框架显示
  const timeframeMap = {
    short: '短期',
    medium: '中期',
    long: '长期'
  };

  // 确定风险承受度显示
  const riskToleranceMap = {
    low: '低风险',
    medium: '中等风险',
    high: '高风险'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{result.ticker} 量化分析</CardTitle>
              <CardDescription>
                {timeframeMap[result.data.timeframe]} | {riskToleranceMap[result.data.riskTolerance]} | 
                {new Date(result.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <Badge className={`text-white ${getSignalColor(signal)}`}>
              {signal}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">置信度</p>
              <div className="flex items-center gap-2">
                <Progress value={parseInt(confidence)} className="h-2" />
                <span className="font-medium">{confidence}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">夏普比率</p>
              <p className="text-xl font-bold">{sharpeRatio}</p>
            </div>
          </div>

          <Tabs defaultValue="analysis">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="analysis">分析详情</TabsTrigger>
              <TabsTrigger value="factors">因子暴露</TabsTrigger>
              <TabsTrigger value="technicals">技术指标</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">量化分析要点</h3>
                <ul className="space-y-1">
                  {analysisLines.map((line, index) => (
                    <li key={index} className="text-sm">{line}</li>
                  ))}
                </ul>
              </div>
              
              {result.data.arbitrageData && result.data.arbitrageData.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">统计套利机会</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>配对股票</TableHead>
                        <TableHead>相关性</TableHead>
                        <TableHead>Z-Score</TableHead>
                        <TableHead>信号</TableHead>
                        <TableHead>置信度</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.data.arbitrageData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.pairStock}</TableCell>
                          <TableCell>{(item.correlation * 100).toFixed(1)}%</TableCell>
                          <TableCell>{item.zScore.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={item.signal.includes('buy') ? 'default' : 'destructive'}>
                              {item.signal.includes('buy_target') ? '买入目标' : '卖出目标'}
                            </Badge>
                          </TableCell>
                          <TableCell>{(item.confidence * 100).toFixed(0)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="factors">
              {result.data.factorData && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-2">因子暴露度</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(result.data.factorData).map(([factor, value]) => (
                      <div key={factor} className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-sm capitalize">{factor}</p>
                          <p className="text-sm font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</p>
                        </div>
                        {typeof value === 'number' && (
                          <Progress
                            value={(value + 2) * 25} // 转换 -2 到 +2 范围为0-100
                            className="h-2"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    因子暴露度表示相对于市场基准的标准差单位。正值表示高于市场平均水平。
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="technicals">
              {result.data.technicalIndicators && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-2">技术指标</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>指标</TableHead>
                        <TableHead>数值</TableHead>
                        <TableHead>信号</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(result.data.technicalIndicators)
                        .filter(([_, details]) => typeof details === 'object' && details !== null)
                        .map(([indicator, details]) => (
                          <TableRow key={indicator}>
                            <TableCell className="uppercase">{indicator}</TableCell>
                            <TableCell>
                              {details.value !== undefined ? 
                                typeof details.value === 'number' ? 
                                  details.value.toFixed(2) : 
                                  details.value
                                : 
                                Object.entries(details)
                                  .filter(([k]) => k !== 'signal')
                                  .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`)
                                  .join(', ')
                              }
                            </TableCell>
                            <TableCell>
                              {details.signal && (
                                <Badge
                                  variant={
                                    details.signal === 'bullish' ? 'default' :
                                    details.signal === 'bearish' ? 'destructive' :
                                    'outline'
                                  }
                                >
                                  {details.signal === 'bullish' ? '看涨' :
                                   details.signal === 'bearish' ? '看跌' :
                                   '中性'}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 