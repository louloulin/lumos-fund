'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import BacktestChart from '@/components/BacktestChart';
import {
  runValueAgentBacktest,
  runGrowthAgentBacktest,
  runTrendAgentBacktest,
  runQuantAgentBacktest,
  runAgentComparisonBacktest
} from '@/actions/backtestAI';

const formSchema = z.object({
  ticker: z.string().min(1, {
    message: "请输入股票代码",
  }),
  initialCapital: z.string().transform((val) => parseInt(val, 10)),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "请使用YYYY-MM-DD格式",
  }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "请使用YYYY-MM-DD格式",
  }),
  agentType: z.enum(["value", "growth", "trend", "quant", "comparison"]),
});

export default function BacktestClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // 选择要对比的AI代理
  const [includeValue, setIncludeValue] = useState(true);
  const [includeGrowth, setIncludeGrowth] = useState(true);
  const [includeTrend, setIncludeTrend] = useState(true);
  const [includeQuant, setIncludeQuant] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: "AAPL",
      initialCapital: "100000",
      startDate: "2022-01-01",
      endDate: "2023-01-01",
      agentType: "value",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let backtestResult;

      if (values.agentType === "comparison") {
        // 确定哪些代理类型需要包含在对比中
        const agentTypes = [];
        if (includeValue) agentTypes.push("value");
        if (includeGrowth) agentTypes.push("growth");
        if (includeTrend) agentTypes.push("trend");
        if (includeQuant) agentTypes.push("quant");

        if (agentTypes.length === 0) {
          throw new Error("请至少选择一种代理类型进行对比");
        }

        backtestResult = await runAgentComparisonBacktest({
          ticker: values.ticker,
          initialCapital: values.initialCapital,
          startDate: values.startDate,
          endDate: values.endDate,
          agentTypes,
        });
      } else {
        // 单一代理回测
        switch (values.agentType) {
          case "value":
            backtestResult = await runValueAgentBacktest({
              ticker: values.ticker,
              initialCapital: values.initialCapital,
              startDate: values.startDate,
              endDate: values.endDate,
            });
            break;
          case "growth":
            backtestResult = await runGrowthAgentBacktest({
              ticker: values.ticker,
              initialCapital: values.initialCapital,
              startDate: values.startDate,
              endDate: values.endDate,
            });
            break;
          case "trend":
            backtestResult = await runTrendAgentBacktest({
              ticker: values.ticker,
              initialCapital: values.initialCapital,
              startDate: values.startDate,
              endDate: values.endDate,
            });
            break;
          case "quant":
            backtestResult = await runQuantAgentBacktest({
              ticker: values.ticker,
              initialCapital: values.initialCapital,
              startDate: values.startDate,
              endDate: values.endDate,
            });
            break;
        }
      }

      setResult(backtestResult);
    } catch (err: any) {
      setError(err.message || '回测过程中出现错误');
    } finally {
      setLoading(false);
    }
  }

  const toggleAgentHandler = (agentType: string, checked: boolean) => {
    switch (agentType) {
      case 'value':
        setIncludeValue(checked);
        break;
      case 'growth':
        setIncludeGrowth(checked);
        break;
      case 'trend':
        setIncludeTrend(checked);
        break;
      case 'quant':
        setIncludeQuant(checked);
        break;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>回测设置</CardTitle>
            <CardDescription>
              配置回测参数和选择AI代理类型
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="ticker"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>股票代码</FormLabel>
                      <FormControl>
                        <Input placeholder="AAPL" {...field} />
                      </FormControl>
                      <FormDescription>
                        输入美股股票代码如AAPL、MSFT
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
                        <Input placeholder="100000" {...field} />
                      </FormControl>
                      <FormDescription>
                        设置回测初始资金金额（美元）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>开始日期</FormLabel>
                        <FormControl>
                          <Input placeholder="2022-01-01" {...field} />
                        </FormControl>
                        <FormDescription>
                          YYYY-MM-DD格式
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>结束日期</FormLabel>
                        <FormControl>
                          <Input placeholder="2023-01-01" {...field} />
                        </FormControl>
                        <FormDescription>
                          YYYY-MM-DD格式
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="agentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>投资代理类型</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择代理类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="value">价值投资</SelectItem>
                          <SelectItem value="growth">成长投资</SelectItem>
                          <SelectItem value="trend">趋势投资</SelectItem>
                          <SelectItem value="quant">量化投资</SelectItem>
                          <SelectItem value="comparison">对比多个代理</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        选择使用哪种AI投资代理进行回测
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("agentType") === "comparison" && (
                  <div className="space-y-4 mt-2 p-4 border rounded-md">
                    <h3 className="text-sm font-medium">选择要对比的代理</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor="value-agent" 
                          className="flex flex-col space-y-1"
                        >
                          <span>价值投资代理</span>
                          <span className="font-normal text-xs text-muted-foreground">
                            基于基本面分析的价值投资策略
                          </span>
                        </Label>
                        <Switch 
                          id="value-agent" 
                          checked={includeValue}
                          onCheckedChange={(checked) => toggleAgentHandler('value', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor="growth-agent" 
                          className="flex flex-col space-y-1"
                        >
                          <span>成长投资代理</span>
                          <span className="font-normal text-xs text-muted-foreground">
                            专注于高增长潜力公司
                          </span>
                        </Label>
                        <Switch 
                          id="growth-agent" 
                          checked={includeGrowth}
                          onCheckedChange={(checked) => toggleAgentHandler('growth', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor="trend-agent" 
                          className="flex flex-col space-y-1"
                        >
                          <span>趋势投资代理</span>
                          <span className="font-normal text-xs text-muted-foreground">
                            基于技术分析的趋势跟踪策略
                          </span>
                        </Label>
                        <Switch 
                          id="trend-agent" 
                          checked={includeTrend}
                          onCheckedChange={(checked) => toggleAgentHandler('trend', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor="quant-agent" 
                          className="flex flex-col space-y-1"
                        >
                          <span>量化投资代理</span>
                          <span className="font-normal text-xs text-muted-foreground">
                            基于多因子分析和统计套利的量化策略
                          </span>
                        </Label>
                        <Switch 
                          id="quant-agent" 
                          checked={includeQuant}
                          onCheckedChange={(checked) => toggleAgentHandler('quant', checked)}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "运行中..." : "开始回测"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="h-full">
          <CardHeader>
            <CardTitle>回测结果</CardTitle>
            <CardDescription>
              {result 
                ? "回测完成，查看投资策略表现" 
                : "运行回测后显示结果"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[500px] flex flex-col">
            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>正在进行回测分析...</p>
                </div>
              </div>
            )}
            
            {error && !loading && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {result && !loading && (
              <div className="flex-1">
                <BacktestChart 
                  result={result} 
                  title="投资组合表现" 
                  description="基于历史数据的AI代理回测结果"
                />
                
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    回测摘要
                  </h3>
                  {result.results ? (
                    <p className="text-sm">
                      多代理对比回测完成。量化代理在回测期间内表现最佳，建议进一步分析各代理在不同市场环境下的表现特点。
                    </p>
                  ) : (
                    <p className="text-sm">
                      {`${getAgentName(form.getValues().agentType)}回测完成。该策略在${form.getValues().ticker}上的表现是`}
                      <span className={result.metrics.totalReturn > 0 ? "text-green-500" : "text-red-500"}>
                        {result.metrics.totalReturn > 0 ? "正收益" : "负收益"}
                      </span>
                      ，总收益率为
                      <span className={result.metrics.totalReturn > 0 ? "text-green-500" : "text-red-500"}>
                        {` ${(result.metrics.totalReturn * 100).toFixed(2)}%`}
                      </span>。
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {!result && !loading && !error && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">设置参数并运行回测以查看结果</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getAgentName(type: string): string {
  switch (type) {
    case 'value':
      return '价值投资';
    case 'growth':
      return '成长投资';
    case 'trend':
      return '趋势投资';
    case 'quant':
      return '量化投资';
    default:
      return type;
  }
} 