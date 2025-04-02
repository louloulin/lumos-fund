'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { analyzeStock, getStockPriceData, getValueInvestingAnalysis } from '@/app/actions';

export default function MastraDemo() {
  const [ticker, setTicker] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalysis() {
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 步骤1: 获取股票价格数据
      const priceResult = await getStockPriceData(ticker);
      
      if (!priceResult.success) {
        throw new Error(priceResult.error || '获取股票数据失败');
      }
      
      // 步骤2: 进行价值投资分析
      const analysisResult = await getValueInvestingAnalysis(ticker, priceResult.data);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || '分析失败');
      }
      
      // 设置结果
      setResult({
        stockData: priceResult.data,
        analysis: analysisResult.data
      });
    } catch (err) {
      console.error('分析过程中出错:', err);
      setError(err instanceof Error ? err.message : '分析过程中出错');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleFullAnalysis() {
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 执行完整的交易决策分析
      const portfolio = {
        cash: 10000,
        holdings: [
          { ticker: 'MSFT', shares: 10, costBasis: 350 },
          { ticker: 'GOOG', shares: 5, costBasis: 140 }
        ]
      };
      
      const result = await analyzeStock(ticker, portfolio);
      
      if (!result.success) {
        throw new Error(result.error || '分析失败');
      }
      
      setResult(result.data);
    } catch (err) {
      console.error('完整分析过程中出错:', err);
      setError(err instanceof Error ? err.message : '分析过程中出错');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Mastra AI 演示</h1>
      <p className="text-lg mb-8">
        此页面演示了如何在Next.js应用中通过Server Actions安全地使用Mastra AI功能。
      </p>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>股票分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 mb-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="ticker">股票代码</Label>
              <Input 
                id="ticker" 
                value={ticker} 
                onChange={(e) => setTicker(e.target.value.toUpperCase())} 
                placeholder="输入股票代码，如AAPL" 
              />
            </div>
            <Button 
              onClick={handleAnalysis} 
              disabled={loading || !ticker}
            >
              {loading ? '分析中...' : '分析股票'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleFullAnalysis} 
              disabled={loading || !ticker}
            >
              {loading ? '分析中...' : '完整分析'}
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {result && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">分析结果</h3>
              <Separator className="mb-4" />
              
              {result.stockData && (
                <div className="mb-4">
                  <h4 className="text-lg font-medium mb-2">股票数据</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm text-muted-foreground">股票代码</p>
                      <p className="font-medium">{result.stockData.ticker}</p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm text-muted-foreground">当前价格</p>
                      <p className="font-medium">${result.stockData.currentPrice?.toFixed(2)}</p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm text-muted-foreground">涨跌</p>
                      <p className={`font-medium ${result.stockData.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.stockData.change > 0 ? '+' : ''}{result.stockData.change?.toFixed(2)} ({result.stockData.changePercent?.toFixed(2)}%)
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm text-muted-foreground">交易量</p>
                      <p className="font-medium">{result.stockData.volume?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {result.analysis && (
                <div className="mb-4">
                  <h4 className="text-lg font-medium mb-2">价值投资分析</h4>
                  <div className="bg-muted p-4 rounded">
                    <p>{result.analysis}</p>
                  </div>
                </div>
              )}
              
              {result.valueAnalysis && (
                <div className="mb-4">
                  <h4 className="text-lg font-medium mb-2">价值分析</h4>
                  <div className="bg-muted p-4 rounded">
                    <p>{result.valueAnalysis}</p>
                  </div>
                </div>
              )}
              
              {result.technicalAnalysis && (
                <div className="mb-4">
                  <h4 className="text-lg font-medium mb-2">技术分析</h4>
                  <div className="bg-muted p-4 rounded">
                    <p>{result.technicalAnalysis}</p>
                  </div>
                </div>
              )}
              
              {result.sentimentAnalysis && (
                <div className="mb-4">
                  <h4 className="text-lg font-medium mb-2">市场情绪</h4>
                  <div className="bg-muted p-4 rounded">
                    <p>{result.sentimentAnalysis}</p>
                  </div>
                </div>
              )}
              
              {result.decision && (
                <div>
                  <h4 className="text-lg font-medium mb-2">决策建议</h4>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                    <p className="whitespace-pre-line">{result.decision}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 