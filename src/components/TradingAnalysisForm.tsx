'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { TradingAnalysisResult } from './TradingAnalysisResult';

// 表单验证Schema
const formSchema = z.object({
  ticker: z.string().min(1, "股票代码不能为空"),
  riskTolerance: z.enum(["low", "medium", "high"]),
  investmentHorizon: z.enum(["short", "medium", "long"]),
  marketCondition: z.enum(["bear", "neutral", "bull"]),
  analysisTypes: z.array(z.string()).min(1, "至少选择一种分析类型"),
});

// 分析类型选项
const analysisOptions = [
  { id: 'fundamental', label: '基本面分析' },
  { id: 'technical', label: '技术面分析' },
  { id: 'sentiment', label: '情绪分析' },
  { id: 'risk', label: '风险评估' },
  { id: 'strategy', label: '策略推荐' },
];

type FormData = z.infer<typeof formSchema>;

export default function TradingAnalysisForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: '',
      riskTolerance: 'medium',
      investmentHorizon: 'medium',
      marketCondition: 'neutral',
      analysisTypes: ['fundamental', 'technical', 'strategy'],
    }
  });

  const analysisTypes = watch('analysisTypes');

  const toggleAnalysisType = (id: string) => {
    const current = analysisTypes || [];
    if (current.includes(id)) {
      setValue('analysisTypes', current.filter(type => type !== id));
    } else {
      setValue('analysisTypes', [...current, id]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/trading/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: 'demo-user', // 在实际应用中应该使用真实用户ID
          portfolioData: {} // 在实际应用中应该提供实际投资组合数据
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || '请求交易分析失败');
      }

      setResult(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      console.error('交易分析请求错误:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>交易决策分析</CardTitle>
          <CardDescription>
            提供股票代码和偏好设置，获取AI驱动的交易决策分析
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ticker">股票代码</Label>
              <Input
                id="ticker"
                placeholder="例如：AAPL, GOOGL"
                {...register('ticker')}
              />
              {errors.ticker && (
                <p className="text-sm text-red-500">{errors.ticker.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="riskTolerance">风险承受能力</Label>
                <Select
                  defaultValue="medium"
                  onValueChange={(value) => setValue('riskTolerance', value as "low" | "medium" | "high")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择风险偏好" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低风险</SelectItem>
                    <SelectItem value="medium">中等风险</SelectItem>
                    <SelectItem value="high">高风险</SelectItem>
                  </SelectContent>
                </Select>
                {errors.riskTolerance && (
                  <p className="text-sm text-red-500">{errors.riskTolerance.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentHorizon">投资期限</Label>
                <Select
                  defaultValue="medium"
                  onValueChange={(value) => setValue('investmentHorizon', value as "short" | "medium" | "long")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择投资期限" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">短期 (小于3个月)</SelectItem>
                    <SelectItem value="medium">中期 (3-12个月)</SelectItem>
                    <SelectItem value="long">长期 (大于1年)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.investmentHorizon && (
                  <p className="text-sm text-red-500">{errors.investmentHorizon.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketCondition">市场状况</Label>
                <Select
                  defaultValue="neutral"
                  onValueChange={(value) => setValue('marketCondition', value as "bear" | "neutral" | "bull")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择市场状况" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bear">熊市</SelectItem>
                    <SelectItem value="neutral">中性市场</SelectItem>
                    <SelectItem value="bull">牛市</SelectItem>
                  </SelectContent>
                </Select>
                {errors.marketCondition && (
                  <p className="text-sm text-red-500">{errors.marketCondition.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>分析类型</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={analysisTypes?.includes(option.id)}
                      onCheckedChange={() => toggleAnalysisType(option.id)}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer">{option.label}</Label>
                  </div>
                ))}
              </div>
              {errors.analysisTypes && (
                <p className="text-sm text-red-500">{errors.analysisTypes.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : '获取交易分析'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p className="font-medium">分析请求失败</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && <TradingAnalysisResult result={result} />}
    </div>
  );
} 