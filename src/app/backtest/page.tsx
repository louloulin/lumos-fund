'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import BacktestResults from './BacktestResults';
import { 
  runValueBacktest, 
  runTechnicalBacktest,
  runSentimentBacktest, 
  runRiskBacktest, 
  runMixedBacktest, 
  runComparisonBacktest,
  type BacktestResult
} from '@/actions/backtest';

const formSchema = z.object({
  ticker: z.string().min(1, '请输入股票代码'),
  initialCapital: z.coerce.number().min(1000, '初始资金至少为1000元'),
  startDate: z.date(),
  endDate: z.date().refine(date => date > new Date('2000-01-01'), {
    message: '结束日期必须在2000年后'
  })
}).refine(data => data.endDate > data.startDate, {
  message: '结束日期必须晚于开始日期',
  path: ['endDate']
});

export default function BacktestPage() {
  const [activeTab, setActiveTab] = useState('value');
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: 'AAPL',
      initialCapital: 100000,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31')
    }
  });
  
  // 处理价值策略回测
  const handleValueBacktest = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);
      
      // 格式化日期
      const startDate = values.startDate.toISOString().split('T')[0];
      const endDate = values.endDate.toISOString().split('T')[0];
      
      const result = await runValueBacktest(
        values.ticker,
        values.initialCapital,
        startDate,
        endDate
      );
      
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '回测失败，请检查输入参数');
      console.error('价值策略回测失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理技术分析策略回测
  const handleTechnicalBacktest = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);
      
      // 格式化日期
      const startDate = values.startDate.toISOString().split('T')[0];
      const endDate = values.endDate.toISOString().split('T')[0];
      
      const result = await runTechnicalBacktest(
        values.ticker,
        values.initialCapital,
        startDate,
        endDate
      );
      
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '回测失败，请检查输入参数');
      console.error('技术分析策略回测失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理情绪分析策略回测
  const handleSentimentBacktest = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);
      
      // 格式化日期
      const startDate = values.startDate.toISOString().split('T')[0];
      const endDate = values.endDate.toISOString().split('T')[0];
      
      const result = await runSentimentBacktest(
        values.ticker,
        values.initialCapital,
        startDate,
        endDate
      );
      
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '回测失败，请检查输入参数');
      console.error('情绪分析策略回测失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理风险管理策略回测
  const handleRiskBacktest = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);
      
      // 格式化日期
      const startDate = values.startDate.toISOString().split('T')[0];
      const endDate = values.endDate.toISOString().split('T')[0];
      
      const result = await runRiskBacktest(
        values.ticker,
        values.initialCapital,
        startDate,
        endDate
      );
      
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '回测失败，请检查输入参数');
      console.error('风险管理策略回测失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理混合策略回测
  const handleMixedBacktest = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);
      
      // 格式化日期
      const startDate = values.startDate.toISOString().split('T')[0];
      const endDate = values.endDate.toISOString().split('T')[0];
      
      const result = await runMixedBacktest(
        values.ticker,
        values.initialCapital,
        startDate,
        endDate
      );
      
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '回测失败，请检查输入参数');
      console.error('混合策略回测失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理策略比较回测
  const handleComparisonBacktest = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);
      
      // 格式化日期
      const startDate = values.startDate.toISOString().split('T')[0];
      const endDate = values.endDate.toISOString().split('T')[0];
      
      const result = await runComparisonBacktest(
        values.ticker,
        values.initialCapital,
        startDate,
        endDate
      );
      
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '回测失败，请检查输入参数');
      console.error('策略比较回测失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 根据当前选中的标签执行相应的回测
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // 先清空之前的结果
    setResult(null);
    
    // 根据当前标签执行相应的回测
    switch (activeTab) {
      case 'value':
        handleValueBacktest(values);
        break;
      case 'technical':
        handleTechnicalBacktest(values);
        break;
      case 'sentiment':
        handleSentimentBacktest(values);
        break;
      case 'risk':
        handleRiskBacktest(values);
        break;
      case 'mixed':
        handleMixedBacktest(values);
        break;
      case 'comparison':
        handleComparisonBacktest(values);
        break;
      default:
        handleValueBacktest(values);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">AI交易策略回测</h1>
        <p className="text-muted-foreground">
          测试不同的交易策略在历史数据上的表现，包括价值投资、技术分析、情绪分析等策略。
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="ticker"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>股票代码</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：AAPL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="initialCapital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>初始资金 (CNY)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>开始日期</FormLabel>
                      <FormControl>
                        <DatePicker 
                          date={field.value} 
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>结束日期</FormLabel>
                      <FormControl>
                        <DatePicker 
                          date={field.value} 
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Tabs 
                defaultValue="value" 
                className="w-full" 
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="grid grid-cols-3 md:grid-cols-6">
                  <TabsTrigger value="value">价值策略</TabsTrigger>
                  <TabsTrigger value="technical">技术策略</TabsTrigger>
                  <TabsTrigger value="sentiment">情绪策略</TabsTrigger>
                  <TabsTrigger value="risk">风险策略</TabsTrigger>
                  <TabsTrigger value="mixed">混合策略</TabsTrigger>
                  <TabsTrigger value="comparison">策略比较</TabsTrigger>
                </TabsList>
                
                <TabsContent value="value" className="mt-4">
                  <p>价值投资策略基于公司基本面的价值分析，使用PE、PB等估值指标判断股票是否被低估或高估。</p>
                </TabsContent>
                
                <TabsContent value="technical" className="mt-4">
                  <p>技术分析策略使用价格和交易量等历史数据，应用移动平均线、相对强弱指数等技术指标进行交易决策。</p>
                </TabsContent>
                
                <TabsContent value="sentiment" className="mt-4">
                  <p>情绪分析策略基于新闻、社交媒体和分析报告等数据，分析市场情绪对股票价格的影响。</p>
                </TabsContent>
                
                <TabsContent value="risk" className="mt-4">
                  <p>风险管理策略专注于控制回撤和波动率，使用止损、仓位管理和动态资金分配等方法。</p>
                </TabsContent>
                
                <TabsContent value="mixed" className="mt-4">
                  <p>混合策略综合考虑价值、技术、情绪和风险因素，使用加权得分系统进行更全面的决策。</p>
                </TabsContent>
                
                <TabsContent value="comparison" className="mt-4">
                  <p>对比所有策略的绩效指标和权益曲线，帮助您选择最适合的交易策略。</p>
                </TabsContent>
              </Tabs>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>错误</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '回测中...' : '运行回测'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <BacktestResults 
        result={result} 
        isComparison={activeTab === 'comparison'} 
      />
    </div>
  );
} 