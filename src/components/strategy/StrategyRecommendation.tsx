"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Check, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 定义表单 Schema
const formSchema = z.object({
  ticker: z.string().min(1, {
    message: "请输入股票代码",
  }).max(10),
  riskTolerance: z.enum(["low", "moderate", "high"], {
    required_error: "请选择风险承受能力",
  }),
  investmentHorizon: z.enum(["short", "medium", "long"], {
    required_error: "请选择投资期限",
  }),
  marketCondition: z.enum(["bull", "bear", "neutral", "volatile"]).optional(),
});

// 风险承受能力选项
const riskOptions = [
  { value: "low", label: "保守型" },
  { value: "moderate", label: "平衡型" },
  { value: "high", label: "积极型" },
];

// 投资期限选项
const horizonOptions = [
  { value: "short", label: "短期(3-6个月)" },
  { value: "medium", label: "中期(6-18个月)" },
  { value: "long", label: "长期(18个月以上)" },
];

// 市场状况选项
const marketOptions = [
  { value: "bull", label: "牛市" },
  { value: "bear", label: "熊市" },
  { value: "neutral", label: "中性市场" },
  { value: "volatile", label: "波动市场" },
];

export default function StrategyRecommendation() {
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("form");

  // 表单设置
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: "",
      riskTolerance: "moderate",
      investmentHorizon: "medium",
      marketCondition: "neutral",
    },
  });

  // 提交表单
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/strategy-recommendation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "获取策略推荐失败");
      }

      setRecommendation(result.data);
      setActiveTab("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setIsLoading(false);
    }
  };

  // 保存策略偏好
  const savePreference = async () => {
    // 实际项目中应从用户会话获取用户ID
    const userId = "user123";
    const values = form.getValues();

    try {
      await fetch("/api/strategy-recommendation", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          riskTolerance: values.riskTolerance,
          investmentHorizon: values.investmentHorizon,
          marketView: values.marketCondition,
          preferredStrategies: recommendation?.recommendation 
            ? [recommendation.recommendation.primaryStrategy, recommendation.recommendation.secondaryStrategy] 
            : undefined
        }),
      });

      // 显示成功消息（实际项目中可使用toast）
      alert("偏好保存成功");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存偏好失败");
    }
  };

  // 渲染策略推荐结果
  const renderRecommendation = () => {
    if (!recommendation) return null;

    const { agentResponse, strategyData } = recommendation;
    const { recommendation: strat, riskProfile, strategyScores, confidence } = strategyData || {};

    return (
      <div className="space-y-6">
        {/* AI分析概述 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              AI策略推荐
              <Badge className="ml-2" variant="outline">
                {confidence}% 置信度
              </Badge>
            </CardTitle>
            <CardDescription>
              基于{riskProfile?.tolerance === "low" ? "保守型" : riskProfile?.tolerance === "moderate" ? "平衡型" : "积极型"}风险承受能力和
              {riskProfile?.horizon === "short" ? "短期" : riskProfile?.horizon === "medium" ? "中期" : "长期"}投资期限
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              {agentResponse}
            </div>
          </CardContent>
        </Card>

        {/* 策略组合 */}
        {strat && (
          <Card>
            <CardHeader>
              <CardTitle>推荐策略组合</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* 主要策略 */}
                <div className="space-y-2">
                  <h3 className="font-medium">主要策略：{translateStrategy(strat.primaryStrategy)}</h3>
                  <Progress value={strat.allocation[strat.primaryStrategy]} />
                  <p className="text-sm text-muted-foreground">
                    配置比例: {strat.allocation[strat.primaryStrategy]}%
                  </p>
                </div>

                {/* 次要策略 */}
                <div className="space-y-2">
                  <h3 className="font-medium">次要策略：{translateStrategy(strat.secondaryStrategy)}</h3>
                  <Progress value={strat.allocation[strat.secondaryStrategy]} />
                  <p className="text-sm text-muted-foreground">
                    配置比例: {strat.allocation[strat.secondaryStrategy]}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 策略参数 */}
        {strat?.parameters && (
          <Card>
            <CardHeader>
              <CardTitle>策略参数</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="primary">
                <TabsList>
                  <TabsTrigger value="primary">主要策略参数</TabsTrigger>
                  <TabsTrigger value="secondary">次要策略参数</TabsTrigger>
                  <TabsTrigger value="risk">风险管理</TabsTrigger>
                </TabsList>
                <TabsContent value="primary" className="space-y-4">
                  <div className="grid gap-2">
                    {Object.entries(strat.parameters.primaryParams).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 items-center border-b py-2">
                        <div className="font-medium">{translateParam(key)}</div>
                        <div>{value}</div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="secondary" className="space-y-4">
                  <div className="grid gap-2">
                    {Object.entries(strat.parameters.secondaryParams).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 items-center border-b py-2">
                        <div className="font-medium">{translateParam(key)}</div>
                        <div>{value}</div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="risk" className="space-y-4">
                  <div className="grid gap-2">
                    {Object.entries(strat.parameters.riskManagement).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 items-center border-b py-2">
                        <div className="font-medium">{translateParam(key)}</div>
                        <div>{typeof value === 'boolean' ? (value ? '是' : '否') : value}</div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* 交易规则 */}
        {strat?.tradingRules && (
          <Card>
            <CardHeader>
              <CardTitle>交易规则</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* 入场信号 */}
                <div>
                  <h3 className="font-medium mb-2">入场信号</h3>
                  <ul className="space-y-2">
                    {strat.tradingRules.entrySignals.map((signal: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 出场信号 */}
                <div>
                  <h3 className="font-medium mb-2">出场信号</h3>
                  <ul className="space-y-2">
                    {strat.tradingRules.exitSignals.map((signal: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 text-red-500 shrink-0" />
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 额外信息 */}
              <div className="mt-4 pt-4 border-t">
                <div className="grid gap-2 md:grid-cols-2">
                  {strat.tradingRules.timeframe && (
                    <div className="flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      <span>时间周期: {strat.tradingRules.timeframe}</span>
                    </div>
                  )}
                  {strat.tradingRules.reviewFrequency && (
                    <div className="flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      <span>复审频率: {strat.tradingRules.reviewFrequency}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 策略评分 */}
        {strategyScores && (
          <Card>
            <CardHeader>
              <CardTitle>策略适应性评分</CardTitle>
              <CardDescription>不同策略对当前市场环境和您的风险偏好的适应性</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(strategyScores)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([strategy, score]) => (
                    <div key={strategy} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span>{translateStrategy(strategy)}</span>
                        <span className="text-sm font-medium">{score}/100</span>
                      </div>
                      <Progress value={score as number} />
                    </div>
                  ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={savePreference} variant="outline">保存我的策略偏好</Button>
            </CardFooter>
          </Card>
        )}

        {/* 免责声明 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>免责声明</AlertTitle>
          <AlertDescription>
            {strategyData?.disclaimer || "此推荐基于当前市场状况和历史数据，投资有风险，实际结果可能因市场变化而不同。"}
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">AI策略推荐</h1>
      <p className="text-muted-foreground mb-6">
        基于市场状况、风险承受能力和投资期限，为您推荐个性化的投资策略组合。
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="form">参数设置</TabsTrigger>
          <TabsTrigger value="result" disabled={!recommendation}>
            策略推荐
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>输入策略参数</CardTitle>
              <CardDescription>设置您的风险偏好和投资期限，获取个性化策略推荐</CardDescription>
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
                          <Input placeholder="例如: AAPL, MSFT" {...field} />
                        </FormControl>
                        <FormDescription>
                          输入您感兴趣的股票代码
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="riskTolerance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>风险承受能力</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择风险承受能力" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {riskOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            根据您的风险偏好选择合适的风险承受能力
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="investmentHorizon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>投资期限</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择投资期限" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {horizonOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            选择您计划持有投资的时间长度
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="marketCondition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>市场状况（可选）</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择当前市场状况" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {marketOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          选择您对当前市场的判断，如不确定可选择中性市场
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>错误</AlertTitle>
                      <AlertDescription>
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成策略中...
                      </>
                    ) : (
                      "获取策略推荐"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result">
          {renderRecommendation()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 辅助函数：策略名称翻译
function translateStrategy(strategy: string): string {
  const translations: Record<string, string> = {
    value: "价值投资",
    growth: "成长投资",
    momentum: "动量策略",
    meanReversion: "均值回归",
    trend: "趋势跟踪",
    technical: "技术分析",
    quantitative: "量化模型",
    dividend: "股息策略", 
    factorBased: "因子投资"
  };
  
  return translations[strategy] || strategy;
}

// 辅助函数：参数名称翻译
function translateParam(param: string): string {
  const translations: Record<string, string> = {
    peRatio: "市盈率",
    pbRatio: "市净率",
    dividendYield: "股息率(%)",
    roe: "ROE(%)",
    lookbackPeriod: "回溯期(月)",
    maShortPeriod: "短期均线(日)",
    maLongPeriod: "长期均线(日)",
    minimumMomentum: "最小动量",
    rsiPeriod: "RSI周期",
    rsiOversold: "RSI超卖阈值",
    rsiOverbought: "RSI超买阈值",
    bollingerPeriod: "布林带周期",
    bollingerDeviation: "布林带标准差",
    adxThreshold: "ADX阈值",
    trendStrength: "趋势强度",
    stopLoss: "止损比例",
    takeProfit: "止盈比例",
    trailingStop: "追踪止损",
    maxPositionSize: "最大仓位比例",
    minYield: "最小股息率(%)",
    payoutRatioMax: "最大派息率",
    dividendGrowth: "股息增长率(%)",
    riskLevel: "风险等级"
  };
  
  return translations[param] || param;
} 