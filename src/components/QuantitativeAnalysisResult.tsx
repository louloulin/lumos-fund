'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface QuantitativeAnalysisResultProps {
  data: any;
  onSave?: () => void;
  onReset?: () => void;
}

export function QuantitativeAnalysisResult({ data, onSave, onReset }: QuantitativeAnalysisResultProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  if (!data) {
    return null;
  }

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave();
      } finally {
        setIsSaving(false);
      }
    }
  };

  // 判断分析类型并渲染相应组件
  const renderAnalysisResult = () => {
    switch (data.type) {
      case 'factor':
        return <FactorAnalysisResult data={data} />;
      case 'technical':
        return <TechnicalAnalysisResult data={data} />;
      case 'arbitrage':
        return <ArbitrageAnalysisResult data={data} />;
      case 'full':
        return <FullAnalysisResult data={data} />;
      default:
        return <div>未知的分析类型</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>量化分析结果</CardTitle>
              <CardDescription>
                {data.ticker && `股票：${data.ticker}`} | 
                {data.timestamp && ` 分析时间：${new Date(data.timestamp).toLocaleString()}`}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {onSave && (
                <Button onClick={handleSave} size="sm" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? '保存中...' : '保存分析'}
                </Button>
              )}
              {onReset && (
                <Button onClick={onReset} variant="outline" size="sm">
                  重新分析
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderAnalysisResult()}
        </CardContent>
      </Card>
    </div>
  );
}

// 因子分析结果组件
function FactorAnalysisResult({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <SignalSummary 
        signal={data.summary?.signal} 
        confidence={data.summary?.confidence} 
        recommendation={data.summary?.recommendation} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">优势因子</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <ul className="space-y-2">
                {data.summary?.strongFactors?.map((factor: any, index: number) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>{factor.name || 'Unknown'}: </span>
                    <span className="ml-1 text-gray-600">{factor.score?.toFixed(2) || 'N/A'}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">劣势因子</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <ul className="space-y-2">
                {data.summary?.weakFactors?.map((factor: any, index: number) => (
                  <li key={index} className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span>{factor.name || 'Unknown'}: </span>
                    <span className="ml-1 text-gray-600">{factor.score?.toFixed(2) || 'N/A'}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {data.analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">因子详细分析</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-60">
              <div className="space-y-4">
                {Object.entries(data.analysis.factors || {}).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <h4 className="font-medium">{getFactorGroupName(key)}</h4>
                    <ul className="mt-2 space-y-1">
                      {value.metrics?.map((metric: any, i: number) => (
                        <li key={i} className="text-sm flex justify-between">
                          <span>{metric.name}</span>
                          <span className={metric.value > 0 ? 'text-green-600' : metric.value < 0 ? 'text-red-600' : ''}>
                            {metric.value?.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Separator className="my-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 技术分析结果组件
function TechnicalAnalysisResult({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <SignalSummary 
        signal={data.summary?.signal} 
        confidence={data.summary?.confidence} 
        recommendation={data.summary?.recommendation}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">支持信号的指标</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <ul className="space-y-2">
                {data.summary?.supportingIndicators?.map((indicator: any, index: number) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>{indicator.name || 'Unknown'}</span>
                    <Badge className="ml-2" variant="outline">{indicator.signal || 'N/A'}</Badge>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">反对信号的指标</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <ul className="space-y-2">
                {data.summary?.opposingIndicators?.map((indicator: any, index: number) => (
                  <li key={index} className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span>{indicator.name || 'Unknown'}</span>
                    <Badge className="ml-2" variant="outline">{indicator.signal || 'N/A'}</Badge>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {data.analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">技术指标详细分析</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-60">
              <div className="space-y-4">
                {data.analysis.indicators?.map((indicator: any, index: number) => (
                  <div key={index}>
                    <h4 className="font-medium">{indicator.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{indicator.interpretation}</p>
                    {indicator.value !== undefined && (
                      <div className="flex items-center mt-2">
                        <span className="text-sm mr-2">值: {indicator.value?.toFixed(2)}</span>
                        <Badge variant={getSignalVariant(indicator.signal)}>{indicator.signal}</Badge>
                      </div>
                    )}
                    <Separator className="my-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 统计套利分析结果组件
function ArbitrageAnalysisResult({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-lg mb-2">套利机会分析</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">配对股票</p>
            <p className="font-medium">{data.ticker1} / {data.ticker2}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">机会强度</p>
            <Badge variant={getOpportunityVariant(data.summary?.opportunity)}>
              {getOpportunityLabel(data.summary?.opportunity)}
            </Badge>
            <span className="ml-2">
              置信度: {data.summary?.confidence || 0}%
            </span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">建议</p>
          <p>{data.summary?.recommendation || '无建议'}</p>
        </div>
      </div>
      
      {data.analysis && (
        <Tabs defaultValue="signal">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signal">交易信号</TabsTrigger>
            <TabsTrigger value="statistics">统计指标</TabsTrigger>
            <TabsTrigger value="backtest">回测结果</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signal">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">当前信号</h4>
                    <div className="flex items-center mt-2">
                      <Badge variant={getSignalVariant(data.analysis.signal?.signalType)}>
                        {getArbitrageSignalLabel(data.analysis.signal?.signalType)}
                      </Badge>
                      <span className="ml-2">
                        Z-Score: {data.analysis.statistics?.currentZScore?.toFixed(2) || 'N/A'}
                      </span>
                      <span className="ml-2">
                        置信度: {data.analysis.signal?.confidence || 0}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {data.analysis.signal?.interpretation}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">建议操作</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">{data.ticker1}</p>
                        <p className="font-medium uppercase">{data.analysis.signal?.actions?.ticker1 || 'HOLD'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">{data.ticker2}</p>
                        <p className="font-medium uppercase">{data.analysis.signal?.actions?.ticker2 || 'HOLD'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="statistics">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">相关性分析</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      相关系数: {data.analysis.statistics?.correlation?.coefficient?.toFixed(2) || 'N/A'} 
                      ({data.analysis.statistics?.correlation?.strength || 'unknown'})
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {data.analysis.statistics?.correlation?.interpretation}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">协整性分析</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      是否协整: {data.analysis.statistics?.cointegration?.isCointegrated ? '是' : '否'} 
                      (置信度: {data.analysis.statistics?.cointegration?.confidence || 0}%)
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {data.analysis.statistics?.cointegration?.interpretation}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">价差统计</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-600">均值</p>
                        <p>{data.analysis.statistics?.spreadMean?.toFixed(4) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">标准差</p>
                        <p>{data.analysis.statistics?.spreadStd?.toFixed(4) || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="backtest">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">回测结果摘要</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {data.analysis.backtest?.interpretation}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">交易次数</p>
                      <p className="font-medium">{data.analysis.backtest?.tradeCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">胜率</p>
                      <p className="font-medium">{(data.analysis.backtest?.winRate * 100 || 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">平均收益</p>
                      <p className="font-medium">{(data.analysis.backtest?.averageReturn * 100 || 0).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">夏普比率</p>
                      <p className="font-medium">{data.analysis.backtest?.sharpeRatio?.toFixed(2) || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// 完整分析结果组件
function FullAnalysisResult({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <SignalSummary 
        signal={data.summary?.signal} 
        confidence={data.summary?.confidence} 
        recommendation={data.summary?.recommendation}
        reasoning={data.summary?.reasoning}
        riskAssessment={data.summary?.riskAssessment}
      />
      
      <Tabs defaultValue="integrated">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrated">综合分析</TabsTrigger>
          <TabsTrigger value="factors">因子分析</TabsTrigger>
          <TabsTrigger value="technical">技术分析</TabsTrigger>
          {data.arbitrageAnalysis && <TabsTrigger value="arbitrage">统计套利</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="integrated">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">核心分析</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    {data.integratedAnalysis?.analysis || '无综合分析数据'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">优势因素</h4>
                    <ul className="mt-2 space-y-1">
                      {data.integratedAnalysis?.strengths?.map((item: string, i: number) => (
                        <li key={i} className="text-sm flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">风险因素</h4>
                    <ul className="mt-2 space-y-1">
                      {data.integratedAnalysis?.risks?.map((item: string, i: number) => (
                        <li key={i} className="text-sm flex items-center">
                          <AlertCircle className="h-3 w-3 text-amber-500 mr-2" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium">交易规则</h4>
                  <div className="mt-2 bg-gray-50 p-3 rounded">
                    <p className="text-sm whitespace-pre-line">
                      {data.integratedAnalysis?.tradingRules || '无交易规则数据'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="factors">
          {data.factorAnalysis && <FactorAnalysisResult data={data.factorAnalysis} />}
        </TabsContent>
        
        <TabsContent value="technical">
          {data.technicalAnalysis && <TechnicalAnalysisResult data={data.technicalAnalysis} />}
        </TabsContent>
        
        {data.arbitrageAnalysis && (
          <TabsContent value="arbitrage">
            <ArbitrageAnalysisResult data={data.arbitrageAnalysis} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// 信号摘要组件
function SignalSummary({ 
  signal, 
  confidence, 
  recommendation,
  reasoning,
  riskAssessment
}: { 
  signal?: string;
  confidence?: number;
  recommendation?: string;
  reasoning?: string;
  riskAssessment?: string;
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center">
        <SignalIcon signal={signal} />
        <div className="ml-3">
          <h3 className="font-medium text-lg">{getSignalText(signal)}</h3>
          <div className="flex items-center mt-1">
            <span className="text-sm text-gray-600 mr-2">置信度:</span>
            <Progress value={confidence ? confidence * 100 : 50} className="w-24 h-2" />
            <span className="ml-2 text-sm font-medium">{confidence ? (confidence * 100).toFixed(0) : 50}%</span>
          </div>
        </div>
      </div>
      
      {recommendation && (
        <div className="mt-3">
          <h4 className="font-medium">建议</h4>
          <p className="text-sm">{recommendation}</p>
        </div>
      )}
      
      {reasoning && (
        <div className="mt-3">
          <h4 className="font-medium">分析理由</h4>
          <p className="text-sm">{reasoning}</p>
        </div>
      )}
      
      {riskAssessment && (
        <div className="mt-3">
          <h4 className="font-medium">风险评估</h4>
          <p className="text-sm">{riskAssessment}</p>
        </div>
      )}
    </div>
  );
}

// 辅助函数
function SignalIcon({ signal }: { signal?: string }) {
  if (signal === 'bullish') {
    return <TrendingUp className="h-10 w-10 text-green-500" />;
  } else if (signal === 'bearish') {
    return <TrendingDown className="h-10 w-10 text-red-500" />;
  } else {
    return <AlertCircle className="h-10 w-10 text-amber-500" />;
  }
}

function getSignalText(signal?: string): string {
  switch (signal) {
    case 'bullish':
      return '看涨信号';
    case 'bearish':
      return '看跌信号';
    case 'neutral':
      return '中性信号';
    default:
      return '未知信号';
  }
}

function getSignalVariant(signal?: string): 'default' | 'outline' | 'secondary' | 'destructive' {
  switch (signal) {
    case 'bullish':
    case 'buy':
      return 'default';
    case 'bearish':
    case 'sell':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getFactorGroupName(key: string): string {
  switch (key) {
    case 'value':
      return '价值因子';
    case 'quality':
      return '质量因子';
    case 'momentum':
      return '动量因子';
    case 'size':
      return '规模因子';
    case 'volatility':
      return '波动性因子';
    default:
      return key;
  }
}

function getOpportunityVariant(opportunity?: string): 'default' | 'outline' | 'secondary' | 'destructive' {
  switch (opportunity) {
    case 'strong':
      return 'default';
    case 'moderate':
      return 'secondary';
    case 'weak':
    case 'none':
      return 'outline';
    default:
      return 'outline';
  }
}

function getOpportunityLabel(opportunity?: string): string {
  switch (opportunity) {
    case 'strong':
      return '强套利机会';
    case 'moderate':
      return '中等套利机会';
    case 'weak':
      return '弱套利机会';
    case 'none':
      return '无套利机会';
    default:
      return '未知';
  }
}

function getArbitrageSignalLabel(signal?: string): string {
  switch (signal) {
    case 'divergence':
      return '价差偏离';
    case 'convergence':
      return '价差收敛';
    case 'neutral':
      return '中性';
    default:
      return '未知';
  }
} 