'use client';

import { useState } from 'react';
import { QuantitativeAnalysisForm } from '@/components/QuantitativeAnalysisForm';
import { QuantitativeAnalysisResult } from '@/components/QuantitativeAnalysisResult';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export function QuantitativeAnalysisClient() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('analyze');
  const { toast } = useToast();

  // 处理分析完成
  const handleAnalysisComplete = (results: any) => {
    setAnalysisData(results);
    setActiveTab('results');
  };

  // 处理分析保存
  const handleSaveAnalysis = async () => {
    try {
      // 在实际应用中，这里会调用API保存分析结果
      const response = await fetch('/api/trading/quantitative/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysis: analysisData }),
      });

      if (!response.ok) {
        throw new Error('保存分析失败');
      }

      const result = await response.json();

      // 更新历史记录
      setAnalysisHistory(prev => [
        {
          id: result.id || `temp-${Date.now()}`,
          ticker: analysisData.ticker,
          type: analysisData.type,
          timestamp: analysisData.timestamp,
          summary: analysisData.summary
        },
        ...prev
      ]);

      toast({
        title: '保存成功',
        description: '分析结果已保存到您的账户',
      });
    } catch (error) {
      console.error('保存分析失败:', error);
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 处理重新分析
  const handleReset = () => {
    setAnalysisData(null);
    setActiveTab('analyze');
  };

  // 加载分析历史
  const loadAnalysisHistory = async () => {
    try {
      // 模拟获取历史数据
      // 在实际应用中，这里会调用API获取分析历史
      const mockHistoryData = [
        {
          id: '1',
          ticker: 'AAPL',
          type: 'full',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          summary: {
            signal: 'bullish',
            confidence: 0.82,
            recommendation: '适量买入，逐步建仓'
          }
        },
        {
          id: '2',
          ticker: 'MSFT',
          type: 'technical',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          summary: {
            signal: 'neutral',
            confidence: 0.60,
            recommendation: '建议持仓观望，等待更明确信号'
          }
        },
        {
          id: '3',
          ticker: 'NVDA',
          type: 'factor',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          summary: {
            signal: 'bullish',
            confidence: 0.75,
            recommendation: '可考虑买入'
          }
        }
      ];

      setAnalysisHistory(mockHistoryData);
    } catch (error) {
      console.error('获取分析历史失败:', error);
      toast({
        title: '获取历史失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 查看历史分析详情
  const viewHistoryItem = async (id: string) => {
    try {
      // 在实际应用中，这里会调用API获取分析详情
      // 这里使用模拟数据
      const historyItem = analysisHistory.find(item => item.id === id);
      
      if (!historyItem) {
        throw new Error('未找到分析记录');
      }
      
      // 模拟加载完整分析数据
      const mockAnalysisData = {
        type: historyItem.type,
        ticker: historyItem.ticker,
        timestamp: historyItem.timestamp,
        riskTolerance: 'medium',
        investmentHorizon: 'medium',
        marketCondition: 'neutral',
        summary: historyItem.summary,
        // 模拟其他分析数据
        analysis: {
          signal: historyItem.summary.signal,
          confidence: historyItem.summary.confidence,
          factors: {
            value: { metrics: [] },
            quality: { metrics: [] },
            momentum: { metrics: [] }
          },
          indicators: []
        }
      };
      
      setAnalysisData(mockAnalysisData);
      setActiveTab('results');
      
    } catch (error) {
      console.error('获取分析详情失败:', error);
      toast({
        title: '获取详情失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Tabs defaultValue="analyze" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="analyze">创建分析</TabsTrigger>
        <TabsTrigger value="history" onClick={loadAnalysisHistory}>历史分析</TabsTrigger>
      </TabsList>
      
      <TabsContent value="analyze">
        <QuantitativeAnalysisForm onAnalysisComplete={handleAnalysisComplete} />
      </TabsContent>
      
      <TabsContent value="results">
        <QuantitativeAnalysisResult 
          data={analysisData} 
          onSave={handleSaveAnalysis} 
          onReset={handleReset} 
        />
      </TabsContent>
      
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>分析历史</CardTitle>
            <CardDescription>
              查看之前的分析记录和结果
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisHistory.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">
                暂无分析历史记录
              </p>
            ) : (
              <div className="space-y-4">
                {analysisHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => viewHistoryItem(item.id)}
                  >
                    <div>
                      <h3 className="font-medium">{item.ticker}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()} · {getAnalysisTypeText(item.type)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs rounded ${getSignalClass(item.summary?.signal)}`}>
                        {getSignalText(item.summary?.signal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// 辅助函数
function getAnalysisTypeText(type: string): string {
  switch (type) {
    case 'full':
      return '全面分析';
    case 'factor':
      return '因子分析';
    case 'technical':
      return '技术分析';
    case 'arbitrage':
      return '统计套利';
    default:
      return type;
  }
}

function getSignalText(signal?: string): string {
  switch (signal) {
    case 'bullish':
      return '看涨';
    case 'bearish':
      return '看跌';
    case 'neutral':
      return '中性';
    default:
      return '未知';
  }
}

function getSignalClass(signal?: string): string {
  switch (signal) {
    case 'bullish':
      return 'bg-green-100 text-green-800';
    case 'bearish':
      return 'bg-red-100 text-red-800';
    case 'neutral':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 