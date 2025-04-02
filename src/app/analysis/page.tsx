"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { StockAnalysisCard } from '@/components/analysis/StockAnalysisCard';

export default function AnalysisPage() {
  const [ticker, setTicker] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!ticker) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          portfolio: {
            cash: 100000,
            positions: [
              { ticker: 'MSFT', shares: 20, avgPrice: 345.72 },
              { ticker: 'GOOGL', shares: 15, avgPrice: 132.45 },
            ]
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('分析请求失败');
      }
      
      const result = await response.json();
      
      // 格式化分析结果
      setAnalysis({
        ticker,
        price: 185.92, // 实际应用中应从API获取
        signals: {
          overall: result.portfolioDecision.signal || 'neutral',
          confidence: result.portfolioDecision.confidence || 75,
        },
        reasoning: {
          summary: result.portfolioDecision.reasoning || '分析结果摘要',
          fundamental: {
            roe: 24.5,
            score: 0.85,
            analysis: result.fundamentalAnalysis?.reasoning || '基本面分析',
          },
          technical: {
            trend: '上升',
            score: 0.72,
            analysis: result.technicalAnalysis?.reasoning || '技术面分析',
          },
        },
      });
    } catch (error) {
      console.error('分析错误:', error);
      // 显示错误提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">股票分析</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>输入股票代码</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="例如：AAPL"
                className="px-3 py-2 border rounded-md flex-1"
                disabled={loading}
              />
              <Button onClick={handleAnalyze} disabled={loading}>
                {loading ? '分析中...' : '分析'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {analysis && (
          <div className="mt-4">
            <StockAnalysisCard {...analysis} />
          </div>
        )}
      </div>
    </AppLayout>
  );
} 