'use client';

// 注意: 这是一个客户端组件，确保所有Mastra相关库只在客户端环境中导入和使用
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, BarChart3, TrendingUp, Newspaper, User, AlertCircle } from 'lucide-react';
// 不再直接从@/mastra导入，而是使用server actions
import { getValueInvestingAnalysis, getTechnicalAnalysis, getSentimentAnalysis, getStockPriceData } from '@/app/actions';
import { AgentStreamingResponse } from './AgentStreamingResponse';
import { formatCurrency } from '@/lib/utils';

export function StockAnalysis() {
  const [ticker, setTicker] = useState('');
  const [inputTicker, setInputTicker] = useState('');
  const [activeTab, setActiveTab] = useState('value');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stockData, setStockData] = useState<any>(null);
  const [valueAnalysis, setValueAnalysis] = useState<string>('');
  const [technicalAnalysis, setTechnicalAnalysis] = useState<string>('');
  const [sentimentAnalysis, setSentimentAnalysis] = useState<string>('');
  const [streamingAgent, setStreamingAgent] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const { toast } = useToast();

  // 处理分析请求
  const handleAnalyze = async () => {
    if (!inputTicker.trim()) {
      toast({
        title: "请输入股票代码",
        description: "请输入需要分析的股票代码",
        variant: "destructive",
      });
      return;
    }

    const symbol = inputTicker.toUpperCase();
    setTicker(symbol);
    setIsAnalyzing(true);
    setStockData(null);
    setValueAnalysis('');
    setTechnicalAnalysis('');
    setSentimentAnalysis('');
    
    try {
      // 使用Server Action获取股票数据
      const stockResponse = await getStockPriceData(symbol);
      
      if (!stockResponse.success) {
        throw new Error(stockResponse.error || '获取股票数据失败');
      }
      
      const stockData = stockResponse.data;
      setStockData(stockData);
      
      // 并行执行所有分析
      await Promise.all([
        runValueAnalysis(symbol, stockData),
        runTechnicalAnalysis(symbol, stockData),
        runSentimentAnalysis(symbol)
      ]);
    } catch (error) {
      console.error('分析过程出错:', error);
      toast({
        title: "分析失败",
        description: `无法获取 ${symbol} 的数据或分析结果`,
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  // 执行价值投资分析
  const runValueAnalysis = async (symbol: string, data: any) => {
    try {
      setStreamingAgent('value');
      setStreamingResponse('正在进行价值投资分析...');
      
      // 使用Server Action
      const response = await getValueInvestingAnalysis(symbol, data);
      
      if (!response.success) {
        throw new Error(response.error || '价值分析失败');
      }
      
      setValueAnalysis(response.data);
      setStreamingResponse(response.data);
    } catch (error) {
      console.error('价值分析失败:', error);
      setValueAnalysis('无法进行价值分析，请稍后再试。');
    } finally {
      setStreamingAgent(null);
    }
  };

  // 执行技术分析
  const runTechnicalAnalysis = async (symbol: string, data: any) => {
    try {
      // 只有当不在流式输出时才设置技术分析为流式输出
      if (!streamingAgent) {
        setStreamingAgent('technical');
        setStreamingResponse('正在进行技术分析...');
      }
      
      // 使用Server Action
      const response = await getTechnicalAnalysis(symbol, data);
      
      if (!response.success) {
        throw new Error(response.error || '技术分析失败');
      }
      
      setTechnicalAnalysis(response.data);
      
      if (streamingAgent === 'technical') {
        setStreamingResponse(response.data);
      }
      
      // 如果当前是技术分析流，完成后清空
      if (streamingAgent === 'technical') {
        setStreamingAgent(null);
      }
    } catch (error) {
      console.error('技术分析失败:', error);
      setTechnicalAnalysis('无法进行技术分析，请稍后再试。');
      if (streamingAgent === 'technical') {
        setStreamingAgent(null);
      }
    }
  };

  // 执行情绪分析
  const runSentimentAnalysis = async (symbol: string) => {
    try {
      // 只有当不在流式输出时才设置情绪分析为流式输出
      if (!streamingAgent) {
        setStreamingAgent('sentiment');
        setStreamingResponse('正在进行市场情绪分析...');
      }
      
      // 使用Server Action
      const response = await getSentimentAnalysis(symbol);
      
      if (!response.success) {
        throw new Error(response.error || '情绪分析失败');
      }
      
      setSentimentAnalysis(response.data);
      
      if (streamingAgent === 'sentiment') {
        setStreamingResponse(response.data);
      }
      
      // 如果当前是情绪分析流，完成后清空
      if (streamingAgent === 'sentiment') {
        setStreamingAgent(null);
      }
    } catch (error) {
      console.error('情绪分析失败:', error);
      setSentimentAnalysis('无法进行情绪分析，请稍后再试。');
      if (streamingAgent === 'sentiment') {
        setStreamingAgent(null);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 渲染股票基本信息
  const renderStockInfo = () => {
    if (!stockData) return null;
    
    const isPositive = stockData.change >= 0;
    
    return (
      <div className="mb-4 p-4 border rounded-lg bg-muted/30">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{ticker}</h2>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold">{formatCurrency(stockData.currentPrice)}</span>
              <span className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">市盈率</div>
              <div className="font-medium">{stockData.pe.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">市值</div>
              <div className="font-medium">
                {stockData.marketCap >= 1000000000
                  ? `${(stockData.marketCap / 1000000000).toFixed(2)}B`
                  : `${(stockData.marketCap / 1000000).toFixed(2)}M`
                }
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">股息率</div>
              <div className="font-medium">{stockData.dividendYield.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">成交量</div>
              <div className="font-medium">
                {stockData.volume >= 1000000
                  ? `${(stockData.volume / 1000000).toFixed(2)}M`
                  : `${(stockData.volume / 1000).toFixed(2)}K`
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 根据分析提取signal和confidence
  const extractAnalysisSignal = (analysisText: string) => {
    const signalMap: Record<string, string> = {
      '看涨': 'positive',
      '看跌': 'negative',
      '中性': 'neutral',
      '买入': 'positive',
      '卖出': 'negative',
      '持有': 'neutral',
    };
    
    let signal = 'neutral';
    let confidence = 0;
    
    // 寻找信号
    for (const [key, value] of Object.entries(signalMap)) {
      if (analysisText.includes(key)) {
        signal = value;
        break;
      }
    }
    
    // 寻找置信度
    const confidenceMatch = analysisText.match(/置信度[：:]?\s*(\d+)/);
    if (confidenceMatch && confidenceMatch[1]) {
      confidence = Math.min(100, Math.max(0, parseInt(confidenceMatch[1])));
    }
    
    return { signal, confidence };
  };

  // 渲染分析状态标签
  const renderSignalBadge = (signal: string) => {
    switch (signal) {
      case 'positive':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">看涨</Badge>;
      case 'negative':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">看跌</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">中性</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI股票分析</CardTitle>
        <CardDescription>
          基于多种投资策略的综合股票分析
        </CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Input
            value={inputTicker}
            onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
            placeholder="输入股票代码 (例如: AAPL)"
            className="max-w-xs"
          />
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !inputTicker.trim()}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                分析中...
              </>
            ) : '分析'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {ticker && renderStockInfo()}
        
        {streamingAgent && (
          <div className="mb-6 p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">
                正在进行{streamingAgent === 'value' ? '价值' : streamingAgent === 'technical' ? '技术' : '情绪'}分析...
              </span>
            </div>
            <AgentStreamingResponse content={streamingResponse} />
          </div>
        )}
        
        {(valueAnalysis || technicalAnalysis || sentimentAnalysis) && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="value" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">价值分析</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">技术分析</span>
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="flex items-center gap-1">
                <Newspaper className="h-4 w-4" />
                <span className="hidden sm:inline">情绪分析</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="value">
              {valueAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">价值投资分析</h3>
                    </div>
                    {renderSignalBadge(extractAnalysisSignal(valueAnalysis).signal)}
                  </div>
                  
                  {extractAnalysisSignal(valueAnalysis).confidence > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>置信度</span>
                        <span>{extractAnalysisSignal(valueAnalysis).confidence}%</span>
                      </div>
                      <Progress value={extractAnalysisSignal(valueAnalysis).confidence} className="h-2" />
                    </div>
                  )}
                  
                  <div className="p-4 rounded-md bg-muted/50 whitespace-pre-line">
                    {valueAnalysis}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center py-8 text-muted-foreground">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span>价值分析尚未完成</span>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="technical">
              {technicalAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">技术分析</h3>
                    </div>
                    {renderSignalBadge(extractAnalysisSignal(technicalAnalysis).signal)}
                  </div>
                  
                  {extractAnalysisSignal(technicalAnalysis).confidence > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>置信度</span>
                        <span>{extractAnalysisSignal(technicalAnalysis).confidence}%</span>
                      </div>
                      <Progress value={extractAnalysisSignal(technicalAnalysis).confidence} className="h-2" />
                    </div>
                  )}
                  
                  <div className="p-4 rounded-md bg-muted/50 whitespace-pre-line">
                    {technicalAnalysis}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center py-8 text-muted-foreground">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span>技术分析尚未完成</span>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sentiment">
              {sentimentAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Newspaper className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">情绪分析</h3>
                    </div>
                    {renderSignalBadge(extractAnalysisSignal(sentimentAnalysis).signal)}
                  </div>
                  
                  {extractAnalysisSignal(sentimentAnalysis).confidence > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>置信度</span>
                        <span>{extractAnalysisSignal(sentimentAnalysis).confidence}%</span>
                      </div>
                      <Progress value={extractAnalysisSignal(sentimentAnalysis).confidence} className="h-2" />
                    </div>
                  )}
                  
                  <div className="p-4 rounded-md bg-muted/50 whitespace-pre-line">
                    {sentimentAnalysis}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center py-8 text-muted-foreground">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span>情绪分析尚未完成</span>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {!ticker && !isAnalyzing && (
          <div className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <TrendingUp className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">输入股票代码开始分析</h3>
            <p className="text-muted-foreground">
              结合价值投资、技术分析和市场情绪的多维度分析
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 