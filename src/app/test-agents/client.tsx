'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { runValueAgent, runGrowthAgent, runTrendAgent, runQuantAgent, runAllAgents } from '@/actions/runAIAgentAnalysis';

export function TestAgentClient() {
  const [ticker, setTicker] = useState('AAPL');
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState('value');
  const [results, setResults] = useState<{[key: string]: any}>({});

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicker(e.target.value.toUpperCase());
  };

  const runValueTest = async () => {
    setIsLoading(prev => ({ ...prev, value: true }));
    try {
      const result = await runValueAgent(ticker);
      setResults(prev => ({ ...prev, value: result }));
    } catch (error) {
      console.error('Value agent analysis failed:', error);
      setResults(prev => ({ 
        ...prev, 
        value: { 
          error: error instanceof Error ? error.message : 'Analysis failed' 
        } 
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, value: false }));
    }
  };

  const runGrowthTest = async () => {
    setIsLoading(prev => ({ ...prev, growth: true }));
    try {
      const result = await runGrowthAgent(ticker);
      setResults(prev => ({ ...prev, growth: result }));
    } catch (error) {
      console.error('Growth agent analysis failed:', error);
      setResults(prev => ({ 
        ...prev, 
        growth: { 
          error: error instanceof Error ? error.message : 'Analysis failed' 
        } 
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, growth: false }));
    }
  };

  const runTrendTest = async () => {
    setIsLoading(prev => ({ ...prev, trend: true }));
    try {
      const result = await runTrendAgent(ticker);
      setResults(prev => ({ ...prev, trend: result }));
    } catch (error) {
      console.error('Trend agent analysis failed:', error);
      setResults(prev => ({ 
        ...prev, 
        trend: { 
          error: error instanceof Error ? error.message : 'Analysis failed' 
        } 
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, trend: false }));
    }
  };

  const runQuantTest = async () => {
    setIsLoading(prev => ({ ...prev, quant: true }));
    try {
      const result = await runQuantAgent(ticker);
      setResults(prev => ({ ...prev, quant: result }));
    } catch (error) {
      console.error('Quant agent analysis failed:', error);
      setResults(prev => ({ 
        ...prev, 
        quant: { 
          error: error instanceof Error ? error.message : 'Analysis failed' 
        } 
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, quant: false }));
    }
  };

  const runAllTests = async () => {
    setIsLoading(prev => ({ 
      ...prev, 
      value: true,
      growth: true,
      trend: true,
      quant: true,
      all: true
    }));
    
    try {
      const result = await runAllAgents(ticker);
      
      setResults(prev => ({
        ...prev,
        value: result.results[0],
        growth: result.results[1],
        trend: result.results[2],
        quant: result.results[3],
        all: result.consensus
      }));
    } catch (error) {
      console.error('All agents analysis failed:', error);
      setResults(prev => ({ 
        ...prev, 
        all: { 
          error: error instanceof Error ? error.message : 'Analysis failed' 
        } 
      }));
    } finally {
      setIsLoading(prev => ({ 
        ...prev, 
        value: false,
        growth: false,
        trend: false,
        quant: false,
        all: false
      }));
    }
  };

  const getSignalBadge = (signal: string) => {
    if (signal === 'buy') {
      return <Badge className="bg-green-500 hover:bg-green-600">买入</Badge>;
    } else if (signal === 'sell') {
      return <Badge className="bg-red-500 hover:bg-red-600">卖出</Badge>;
    } else {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">持有</Badge>;
    }
  };

  const getConfidence = (confidence: number) => {
    if (confidence >= 80) {
      return <Badge className="bg-green-500 hover:bg-green-600">高确信度 ({confidence}%)</Badge>;
    } else if (confidence >= 50) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">中等确信度 ({confidence}%)</Badge>;
    } else {
      return <Badge className="bg-red-500 hover:bg-red-600">低确信度 ({confidence}%)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>测试AI投资代理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <Input
                placeholder="输入股票代码 (例如: AAPL, MSFT, GOOGL)"
                value={ticker}
                onChange={handleTickerChange}
              />
            </div>
            <Button 
              onClick={runAllTests}
              disabled={isLoading.all}
              className="w-full"
            >
              {isLoading.all ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : '运行所有代理'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.all && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>共识分析结果 ({ticker})</span>
              {getSignalBadge(results.all.signal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">确信度:</span>
                {getConfidence(results.all.confidence)}
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-1">分析摘要:</h4>
                <p className="text-sm whitespace-pre-line">{results.all.explanation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="value">价值投资</TabsTrigger>
          <TabsTrigger value="growth">成长投资</TabsTrigger>
          <TabsTrigger value="trend">趋势投资</TabsTrigger>
          <TabsTrigger value="quant">量化投资</TabsTrigger>
        </TabsList>

        <TabsContent value="value">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>价值投资代理</span>
                <Button 
                  onClick={runValueTest}
                  disabled={isLoading.value}
                  size="sm"
                >
                  {isLoading.value ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      分析中...
                    </>
                  ) : '运行分析'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading.value ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : results.value ? (
                results.value.error ? (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <span>{results.value.error}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">信号:</span>
                      {getSignalBadge(results.value.signal)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">确信度:</span>
                      {getConfidence(results.value.confidence)}
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">分析理由:</h4>
                      <p className="text-sm whitespace-pre-line">{results.value.reasoning}</p>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  点击"运行分析"按钮开始价值投资分析
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>成长投资代理</span>
                <Button 
                  onClick={runGrowthTest}
                  disabled={isLoading.growth}
                  size="sm"
                >
                  {isLoading.growth ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      分析中...
                    </>
                  ) : '运行分析'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading.growth ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : results.growth ? (
                results.growth.error ? (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <span>{results.growth.error}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">信号:</span>
                      {getSignalBadge(results.growth.signal)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">确信度:</span>
                      {getConfidence(results.growth.confidence)}
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">分析理由:</h4>
                      <p className="text-sm whitespace-pre-line">{results.growth.reasoning}</p>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  点击"运行分析"按钮开始成长投资分析
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>趋势投资代理</span>
                <Button 
                  onClick={runTrendTest}
                  disabled={isLoading.trend}
                  size="sm"
                >
                  {isLoading.trend ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      分析中...
                    </>
                  ) : '运行分析'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading.trend ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : results.trend ? (
                results.trend.error ? (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <span>{results.trend.error}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">信号:</span>
                      {getSignalBadge(results.trend.signal)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">确信度:</span>
                      {getConfidence(results.trend.confidence)}
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">分析理由:</h4>
                      <p className="text-sm whitespace-pre-line">{results.trend.reasoning}</p>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  点击"运行分析"按钮开始趋势投资分析
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quant">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>量化投资代理</span>
                <Button 
                  onClick={runQuantTest}
                  disabled={isLoading.quant}
                  size="sm"
                >
                  {isLoading.quant ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      分析中...
                    </>
                  ) : '运行分析'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading.quant ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : results.quant ? (
                results.quant.error ? (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <span>{results.quant.error}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">信号:</span>
                      {getSignalBadge(results.quant.signal)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">确信度:</span>
                      {getConfidence(results.quant.confidence)}
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">分析理由:</h4>
                      <p className="text-sm whitespace-pre-line">{results.quant.reasoning}</p>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  点击"运行分析"按钮开始量化投资分析
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 