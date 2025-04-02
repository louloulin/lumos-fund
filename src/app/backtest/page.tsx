'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BacktestResult, BacktestParams } from '@/lib/types/backtest';
import BacktestChart from '@/components/BacktestChart';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function BacktestPage() {
  // 初始化状态
  const [ticker, setTicker] = useState<string>('AAPL');
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResult | BacktestResult[] | null>(null);
  const [error, setError] = useState<string>('');
  
  const { toast } = useToast();
  
  // 处理回测
  const handleValueBacktest = async () => {
    await runBacktest('value', '价值投资策略回测');
  };
  
  const handleTechnicalBacktest = async () => {
    await runBacktest('trend', '趋势投资策略回测');
  };
  
  const handleSentimentBacktest = async () => {
    await runBacktest('sentiment', '情绪分析策略回测');
  };
  
  const handleRiskBacktest = async () => {
    await runBacktest('risk', '风险管理策略回测');
  };
  
  const handleMixedBacktest = async () => {
    await runBacktest('mixed', '混合策略回测');
  };
  
  const handleComparisonBacktest = async () => {
    await runBacktest('comparison', '策略对比回测');
  };
  
  // 运行回测
  const runBacktest = async (strategyType: string, title: string) => {
    // 参数验证
    if (!ticker) {
      setError('请输入股票代码');
      return;
    }
    
    if (!initialCapital || initialCapital <= 0) {
      setError('初始资金必须大于0');
      return;
    }
    
    if (!startDate || !endDate) {
      setError('请选择开始和结束日期');
      return;
    }
    
    if (startDate >= endDate) {
      setError('开始日期必须早于结束日期');
      return;
    }
    
    // 清除之前的错误
    setError('');
    setLoading(true);
    
    try {
      // 创建回测参数
      const params: BacktestParams = {
        ticker,
        initialCapital,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        strategyType: strategyType as any
      };
      
      // 调用回测API
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      // 处理响应
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '回测请求失败');
      }
      
      const data = await response.json();
      setResult(data.result);
      
      // 显示成功消息
      toast({
        title: '回测完成',
        description: `成功完成${title}`,
      });
      
    } catch (err) {
      console.error('回测失败', err);
      setError(err instanceof Error ? err.message : '未知错误');
      
      toast({
        variant: 'destructive',
        title: '回测失败',
        description: err instanceof Error ? err.message : '未知错误',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 准备结果展示的标题
  const getResultTitle = (): string => {
    if (!result) return '';
    
    if (Array.isArray(result)) {
      return `${ticker} 策略对比回测结果`;
    } else {
      return `${ticker} ${result.strategy}回测结果`;
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">策略回测</h1>
        <p className="text-muted-foreground">
          使用多种AI投资策略对股票进行历史回测，评估不同策略的表现和收益潜力。
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 参数设置 */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>回测参数</CardTitle>
            <CardDescription>设置需要回测的股票和参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 股票代码 */}
            <div className="space-y-2">
              <Label htmlFor="ticker">股票代码</Label>
              <Input
                id="ticker"
                placeholder="例如: AAPL, MSFT, GOOG"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
              />
            </div>
            
            {/* 初始资金 */}
            <div className="space-y-2">
              <Label htmlFor="capital">初始资金 ($)</Label>
              <Input
                id="capital"
                type="number"
                min="1000"
                step="1000"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
              />
            </div>
            
            {/* 日期选择 */}
            <div className="space-y-2">
              <Label>开始日期</Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
              />
            </div>
            
            <div className="space-y-2">
              <Label>结束日期</Label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
              />
            </div>
            
            {/* 错误提示 */}
            {error && (
              <div className="text-sm font-medium text-red-500 mt-2">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 策略选择 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>选择策略</CardTitle>
            <CardDescription>选择一种投资策略进行回测</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="value" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="value">基本面策略</TabsTrigger>
                <TabsTrigger value="technical">技术分析</TabsTrigger>
                <TabsTrigger value="advanced">高级策略</TabsTrigger>
              </TabsList>
              
              {/* 基本面策略 */}
              <TabsContent value="value" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">价值投资策略</CardTitle>
                      <CardDescription>
                        基于公司财务指标、估值和现金流的投资策略，寻找被低估的股票。
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleValueBacktest} 
                        className="w-full"
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        运行价值投资回测
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">成长投资策略</CardTitle>
                      <CardDescription>
                        专注于高增长潜力公司的投资策略，寻找营收增长和市场扩张的机会。
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => runBacktest('growth', '成长投资策略回测')} 
                        className="w-full"
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        运行成长投资回测
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* 技术分析策略 */}
              <TabsContent value="technical" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">趋势跟踪策略</CardTitle>
                      <CardDescription>
                        基于价格走势和动量的投资策略，捕捉市场趋势和突破点。
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleTechnicalBacktest} 
                        className="w-full"
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        运行趋势跟踪回测
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">量化投资策略</CardTitle>
                      <CardDescription>
                        使用多种技术指标和统计模型制定的系统化投资策略。
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => runBacktest('quant', '量化投资策略回测')} 
                        className="w-full"
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        运行量化投资回测
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* 高级策略 */}
              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">情绪分析策略</CardTitle>
                      <CardDescription>
                        基于市场情绪和新闻分析的投资策略，捕捉舆论变化和异常情绪。
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleSentimentBacktest} 
                        className="w-full"
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        运行情绪分析回测
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">风险管理策略</CardTitle>
                      <CardDescription>
                        专注于控制下行风险和波动性的投资策略，优化风险回报比。
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleRiskBacktest} 
                        className="w-full"
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        运行风险管理回测
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">混合策略</CardTitle>
                      <CardDescription>
                        结合多种投资策略的优势，平衡不同市场环境下的表现。
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleMixedBacktest} 
                        className="w-full"
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        运行混合策略回测
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">策略对比</CardTitle>
                      <CardDescription>
                        同时运行多种策略并对比分析它们的表现和收益。
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleComparisonBacktest} 
                        className="w-full"
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        运行策略对比
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* 回测结果 */}
      {result && (
        <div className="space-y-4">
          <Separator />
          <h2 className="text-2xl font-bold tracking-tight">{getResultTitle()}</h2>
          <BacktestChart result={result} />
        </div>
      )}
    </div>
  );
} 