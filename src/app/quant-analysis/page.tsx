'use client';

import React, { useState } from 'react';
import { QuantitativeAnalysis } from '@/components/QuantitativeAnalysis';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// 定义类型
type TimeFrame = 'short' | 'medium' | 'long';
type RiskTolerance = 'low' | 'medium' | 'high';

// 模拟分析结果
const mockResult = {
  ticker: 'AAPL',
  analysis: `
  投资信号: 看涨
  置信度: 78%
  估计夏普比率: 1.2
  关键因子暴露: 价值(0.8), 动量(1.2)
  
  交易建议:
  - 建立多头头寸，目标价格: 165
  - 止损设置在145以下
  
  量化分析:
  1. 技术指标显示中强度的看涨信号，RSI在上升趋势但未达超买区域
  2. 动量因子暴露度高，近期表现强劲
  3. 价值因子评分高于市场平均
  4. 与PEER1存在统计套利机会，Z-score为1.2，显示潜在回归机会
  `,
  data: {
    timeframe: 'medium' as TimeFrame,
    riskTolerance: 'medium' as RiskTolerance,
    historicalPrices: [
      { date: '2023-01-01', close: 150, volume: 1000000 },
      { date: '2023-01-02', close: 152, volume: 1200000 },
      { date: '2023-01-03', close: 151, volume: 900000 },
    ],
    technicalIndicators: {
      rsi: { value: 65, signal: 'neutral' },
      macd: { value: 2.1, signal: 'bullish' },
      bollinger: { upper: 160, middle: 151, lower: 142, signal: 'neutral' },
      atr: { value: 3.2 },
      obv: { value: 12500000, signal: 'bullish' }
    },
    factorData: {
      value: 0.8,
      momentum: 1.2,
      quality: 0.9,
      size: -0.2,
      volatility: -0.3
    },
    arbitrageData: [
      {
        pairStock: 'MSFT',
        correlation: 0.85,
        zScore: 1.2,
        signal: 'buy_target_sell_pair',
        confidence: 0.75
      }
    ]
  },
  timestamp: new Date().toISOString()
};

export default function QuantAnalysisPage() {
  const [ticker, setTicker] = useState('');
  const [timeframe, setTimeframe] = useState<TimeFrame>('medium');
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<typeof mockResult | null>(null);

  const handleAnalyze = async () => {
    if (!ticker) {
      setError('请输入股票代码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 实际项目中，这里应该调用API获取分析结果
      // const response = await fetch('/api/analyze', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ticker,
      //     timeframe,
      //     riskTolerance
      //   })
      // });
      
      // if (!response.ok) {
      //   throw new Error('分析请求失败');
      // }
      
      // const data = await response.json();
      // setResult(data);

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 使用模拟数据
      setResult({
        ...mockResult,
        ticker: ticker.toUpperCase(),
        data: {
          ...mockResult.data,
          timeframe,
          riskTolerance
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">量化投资分析</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>分析参数</CardTitle>
          <CardDescription>
            输入股票代码和分析参数来获取量化分析结果
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">股票代码</label>
              <Input
                placeholder="例如: AAPL"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">时间框架</label>
              <Select value={timeframe} onValueChange={(value: TimeFrame) => setTimeframe(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择时间框架" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">短期</SelectItem>
                  <SelectItem value="medium">中期</SelectItem>
                  <SelectItem value="long">长期</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">风险承受度</label>
              <Select value={riskTolerance} onValueChange={(value: RiskTolerance) => setRiskTolerance(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择风险承受度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低风险</SelectItem>
                  <SelectItem value="medium">中等风险</SelectItem>
                  <SelectItem value="high">高风险</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  '分析'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {result && (
        <QuantitativeAnalysis result={result} />
      )}
    </div>
  );
} 