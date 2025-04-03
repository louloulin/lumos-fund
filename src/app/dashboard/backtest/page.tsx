'use client';

import { useState } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form, FormControl, FormDescription, FormField, FormItem, 
  FormLabel, FormMessage 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BacktestChart } from '@/components/BacktestChart';
import { runValueBacktest, runMomentumBacktest, runMeanReversionBacktest, runComparisonBacktest } from '@/actions/backtest';
import { toast } from '@/components/ui/use-toast';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

// 回测参数表单验证schema
const backtestFormSchema = z.object({
  ticker: z.string().min(2, { message: '请输入有效的股票代码' }),
  initialCapital: z.number().positive({ message: '初始资金必须大于零' }),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  strategy: z.string(),
  // 价值投资参数
  peRatio: z.number().min(0),
  pbRatio: z.number().min(0),
  dividendYield: z.number().min(0),
  // 动量投资参数
  maShortPeriod: z.number().int().positive(),
  maLongPeriod: z.number().int().positive(),
  rsiPeriod: z.number().int().positive(),
  rsiOverbought: z.number().min(50).max(100),
  rsiOversold: z.number().min(0).max(50),
  // 均值回归参数
  bollingerPeriod: z.number().int().positive(),
  bollingerDeviation: z.number().positive(),
  // 多策略对比
  isComparison: z.boolean().default(false),
  strategies: z.array(z.string()).optional(),
});

type BacktestFormValues = z.infer<typeof backtestFormSchema>;

const defaultValues: Partial<BacktestFormValues> = {
  ticker: '600519', // 贵州茅台
  initialCapital: 100000,
  dateRange: {
    from: new Date(2020, 0, 1),
    to: new Date(),
  },
  strategy: 'value',
  peRatio: 15,
  pbRatio: 1.5,
  dividendYield: 2.0,
  maShortPeriod: 20,
  maLongPeriod: 50,
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  bollingerPeriod: 20,
  bollingerDeviation: 2,
  isComparison: false,
  strategies: ['value'],
};

export default function BacktestPage() {
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<BacktestFormValues>({
    resolver: zodResolver(backtestFormSchema),
    defaultValues,
  });
  
  const watchStrategy = form.watch('strategy');
  const watchIsComparison = form.watch('isComparison');
  const watchStrategies = form.watch('strategies');
  
  // 运行回测
  const onSubmit = async (data: BacktestFormValues) => {
    setIsLoading(true);
    
    try {
      const startDate = format(data.dateRange.from, 'yyyy-MM-dd');
      const endDate = format(data.dateRange.to, 'yyyy-MM-dd');
      
      let result;
      
      if (data.isComparison && data.strategies && data.strategies.length > 0) {
        // 运行多策略对比
        result = await runComparisonBacktest(
          data.ticker,
          data.initialCapital,
          startDate,
          endDate,
          data.strategies,
          {
            value: {
              peRatio: data.peRatio,
              pbRatio: data.pbRatio,
              dividendYield: data.dividendYield,
            },
            momentum: {
              maShortPeriod: data.maShortPeriod,
              maLongPeriod: data.maLongPeriod,
              rsiPeriod: data.rsiPeriod,
              rsiOverbought: data.rsiOverbought,
              rsiOversold: data.rsiOversold,
            },
            meanReversion: {
              bollingerPeriod: data.bollingerPeriod,
              bollingerDeviation: data.bollingerDeviation,
            }
          }
        );
      } else {
        // 运行单一策略
        switch (data.strategy) {
          case 'value':
            result = await runValueBacktest(
              data.ticker,
              data.initialCapital,
              startDate,
              endDate,
              {
                peRatio: data.peRatio,
                pbRatio: data.pbRatio,
                dividendYield: data.dividendYield,
              }
            );
            break;
          case 'momentum':
            result = await runMomentumBacktest(
              data.ticker,
              data.initialCapital,
              startDate,
              endDate,
              {
                maShortPeriod: data.maShortPeriod,
                maLongPeriod: data.maLongPeriod,
                rsiPeriod: data.rsiPeriod,
                rsiOverbought: data.rsiOverbought,
                rsiOversold: data.rsiOversold,
              }
            );
            break;
          case 'meanReversion':
            result = await runMeanReversionBacktest(
              data.ticker,
              data.initialCapital,
              startDate,
              endDate,
              {
                bollingerPeriod: data.bollingerPeriod,
                bollingerDeviation: data.bollingerDeviation,
              }
            );
            break;
        }
      }
      
      setBacktestResult(result);
      toast({
        title: '回测完成',
        description: `成功运行 ${data.ticker} 的历史回测分析`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: '回测失败',
        description: '运行回测时发生错误，请检查参数后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStrategyChange = (value: string) => {
    form.setValue('strategy', value);
  };
  
  const handleComparisonToggle = (checked: boolean) => {
    form.setValue('isComparison', checked);
    if (checked && (!watchStrategies || watchStrategies.length === 0)) {
      form.setValue('strategies', ['value']);
    }
  };
  
  const handleStrategySelect = (strategy: string, checked: boolean) => {
    const currentStrategies = watchStrategies || [];
    
    if (checked) {
      form.setValue('strategies', [...currentStrategies, strategy]);
    } else {
      form.setValue('strategies', currentStrategies.filter(s => s !== strategy));
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">量化回测平台</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧参数面板 */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>回测参数</CardTitle>
            <CardDescription>配置策略参数并运行历史数据回测</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* 基本参数 */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ticker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>股票代码</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：600519" {...field} />
                        </FormControl>
                        <FormDescription>
                          输入A股股票代码（6位数字）
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="initialCapital"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>初始资金</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1000" 
                            placeholder="初始资金金额" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          回测使用的初始资金金额（元）
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>回测时间范围</FormLabel>
                        <FormControl>
                          <CalendarDateRangePicker 
                            date={field.value as DateRange}
                            onSelect={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          选择回测的开始和结束日期
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isComparison"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            多策略对比
                          </FormLabel>
                          <FormDescription>
                            开启后可同时回测多个策略并进行对比
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={handleComparisonToggle}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {watchIsComparison ? (
                    <FormField
                      control={form.control}
                      name="strategies"
                      render={() => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel className="text-base">
                              选择策略
                            </FormLabel>
                            <FormDescription>
                              选择要对比的策略（至少选择一个）
                            </FormDescription>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="value" 
                                checked={watchStrategies?.includes('value')}
                                onCheckedChange={(checked) => 
                                  handleStrategySelect('value', checked as boolean)
                                }
                              />
                              <label
                                htmlFor="value"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                价值投资
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="momentum" 
                                checked={watchStrategies?.includes('momentum')}
                                onCheckedChange={(checked) => 
                                  handleStrategySelect('momentum', checked as boolean)
                                }
                              />
                              <label
                                htmlFor="momentum"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                动量策略
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="meanReversion" 
                                checked={watchStrategies?.includes('meanReversion')}
                                onCheckedChange={(checked) => 
                                  handleStrategySelect('meanReversion', checked as boolean)
                                }
                              />
                              <label
                                htmlFor="meanReversion"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                均值回归
                              </label>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="strategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>回测策略</FormLabel>
                          <Select 
                            onValueChange={handleStrategyChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择回测策略" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="value">价值投资</SelectItem>
                              <SelectItem value="momentum">动量策略</SelectItem>
                              <SelectItem value="meanReversion">均值回归</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            选择要回测的交易策略
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <Separator />
                
                {/* 策略参数 */}
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-6">
                    {/* 价值投资参数 */}
                    {(watchStrategy === 'value' || watchIsComparison) && (
                      <div className="space-y-4">
                        <h3 className="font-medium">价值投资参数</h3>
                        
                        <FormField
                          control={form.control}
                          name="peRatio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PE阈值 ({field.value})</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={5}
                                  max={30}
                                  step={0.5}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                买入信号的市盈率阈值
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="pbRatio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PB阈值 ({field.value})</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={0.5}
                                  max={5}
                                  step={0.1}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                买入信号的市净率阈值
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dividendYield"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>股息率阈值 ({field.value}%)</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={0}
                                  max={10}
                                  step={0.1}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                买入信号的股息率阈值
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    
                    {/* 动量策略参数 */}
                    {(watchStrategy === 'momentum' || watchIsComparison) && (
                      <div className="space-y-4">
                        <h3 className="font-medium">动量策略参数</h3>
                        
                        <FormField
                          control={form.control}
                          name="maShortPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>短期均线周期 ({field.value}日)</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={5}
                                  max={50}
                                  step={1}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                短期移动平均线的周期
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="maLongPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>长期均线周期 ({field.value}日)</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={20}
                                  max={200}
                                  step={5}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                长期移动平均线的周期
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="rsiPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>RSI周期 ({field.value}日)</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={5}
                                  max={30}
                                  step={1}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                相对强弱指标的计算周期
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="rsiOverbought"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>超买阈值 ({field.value})</FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[field.value]}
                                    min={60}
                                    max={90}
                                    step={1}
                                    onValueChange={(value) => field.onChange(value[0])}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="rsiOversold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>超卖阈值 ({field.value})</FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[field.value]}
                                    min={10}
                                    max={40}
                                    step={1}
                                    onValueChange={(value) => field.onChange(value[0])}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* 均值回归参数 */}
                    {(watchStrategy === 'meanReversion' || watchIsComparison) && (
                      <div className="space-y-4">
                        <h3 className="font-medium">均值回归参数</h3>
                        
                        <FormField
                          control={form.control}
                          name="bollingerPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>布林带周期 ({field.value}日)</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={10}
                                  max={50}
                                  step={1}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                布林带计算的移动平均周期
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bollingerDeviation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>布林带标准差倍数 ({field.value})</FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={1}
                                  max={3}
                                  step={0.1}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                布林带上下轨的标准差倍数
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      运行回测中...
                    </>
                  ) : '运行回测'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* 右侧回测结果 */}
        <div className="xl:col-span-2">
          {backtestResult ? (
            <BacktestChart 
              result={backtestResult} 
              title={`${form.getValues('ticker')} 回测结果`}
              description={`${format(form.getValues('dateRange').from, 'yyyy-MM-dd')} 至 ${format(form.getValues('dateRange').to, 'yyyy-MM-dd')}`}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="pt-10 text-center">
                <p className="text-muted-foreground">
                  配置参数并运行回测以查看结果
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 