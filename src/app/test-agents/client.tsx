'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { testValueAgent, testGrowthAgent, testTrendAgent, testQuantAgent, testAllAgents } from '@/actions/testAIAgent';

export default function TestAgentClient() {
  const [ticker, setTicker] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('value');
  const [testAllLoading, setTestAllLoading] = useState(false);

  const [results, setResults] = useState<{
    value?: any;
    growth?: any;
    trend?: any;
    quant?: any;
    all?: any;
  }>({});

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicker(e.target.value.toUpperCase());
  };

  const runTest = async (agentType: 'value' | 'growth' | 'trend' | 'quant') => {
    setLoading(true);
    
    try {
      let result;
      switch (agentType) {
        case 'value':
          result = await testValueAgent(ticker);
          break;
        case 'growth':
          result = await testGrowthAgent(ticker);
          break;
        case 'trend':
          result = await testTrendAgent(ticker);
          break;
        case 'quant':
          result = await testQuantAgent(ticker);
          break;
      }
      
      setResults(prev => ({ ...prev, [agentType]: result }));
    } catch (error) {
      console.error(`测试${agentType}代理失败:`, error);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestAllLoading(true);
    
    try {
      const result = await testAllAgents(ticker);
      setResults(prev => ({ 
        ...prev, 
        all: result,
        value: result.results?.value,
        growth: result.results?.growth,
        trend: result.results?.trend,
        quant: result.results?.quant
      }));
    } catch (error) {
      console.error("测试所有代理失败:", error);
    } finally {
      setTestAllLoading(false);
    }
  };

  const getSignalBadge = (text: string) => {
    if (text.includes('看涨') || text.toLowerCase().includes('bullish') || text.includes('buy')) {
      return <Badge className="bg-green-500">看涨</Badge>;
    } else if (text.includes('看跌') || text.toLowerCase().includes('bearish') || text.includes('sell')) {
      return <Badge className="bg-red-500">看跌</Badge>;
    } else {
      return <Badge>中性</Badge>;
    }
  };

  const getConfidence = (text: string) => {
    const match = text.match(/(\d+)%/);
    return match ? match[1] : '未知';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI代理测试控制台</CardTitle>
          <CardDescription>
            输入股票代码并选择要测试的AI投资代理类型
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="股票代码 (例如: AAPL, TSLA)"
                value={ticker}
                onChange={handleTickerChange}
              />
            </div>
            <Button
              onClick={() => runTest(activeTab as any)}
              disabled={loading || !ticker}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  测试中...
                </>
              ) : (
                <>测试当前代理</>
              )}
            </Button>
            <Button
              onClick={runAllTests}
              disabled={testAllLoading || !ticker}
              variant="secondary"
            >
              {testAllLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  测试所有...
                </>
              ) : (
                <>测试所有代理</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="value" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="value">价值投资</TabsTrigger>
          <TabsTrigger value="growth">成长投资</TabsTrigger>
          <TabsTrigger value="trend">趋势投资</TabsTrigger>
          <TabsTrigger value="quant">量化投资</TabsTrigger>
        </TabsList>
        
        <TabsContent value="value">
          <ResultCard
            title="价值投资代理"
            description="模拟巴菲特风格，关注公司的内在价值和经济护城河"
            result={results.value}
            onRunTest={() => runTest('value')}
            loading={loading && activeTab === 'value'}
          />
        </TabsContent>
        
        <TabsContent value="growth">
          <ResultCard
            title="成长投资代理"
            description="模拟彼得·林奇风格，寻找成长潜力大的公司"
            result={results.growth}
            onRunTest={() => runTest('growth')}
            loading={loading && activeTab === 'growth'}
          />
        </TabsContent>
        
        <TabsContent value="trend">
          <ResultCard
            title="趋势投资代理"
            description="模拟德拉肯米勒风格，关注价格趋势和动量"
            result={results.trend}
            onRunTest={() => runTest('trend')}
            loading={loading && activeTab === 'trend'}
          />
        </TabsContent>
        
        <TabsContent value="quant">
          <ResultCard
            title="量化投资代理"
            description="基于多因子模型的投资风格，综合分析价值、成长和质量等因子"
            result={results.quant}
            onRunTest={() => runTest('quant')}
            loading={loading && activeTab === 'quant'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type ResultCardProps = {
  title: string;
  description: string;
  result: any;
  onRunTest: () => void;
  loading: boolean;
};

function ResultCard({ title, description, result, onRunTest, loading }: ResultCardProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-gray-400">
          {loading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p>正在分析中，请稍候...</p>
            </div>
          ) : (
            <p>运行测试以查看AI代理分析结果</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={onRunTest} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>运行测试</>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!result.success) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-64 overflow-auto">
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            <h3 className="text-sm font-semibold">测试失败</h3>
            <p className="mt-2 text-sm">{result.error || '未知错误'}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onRunTest} disabled={loading} className="w-full">
            重新测试
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {result.analysis && getSignalBadge(result.analysis)}
            {result.analysis && (
              <Badge variant="outline">
                置信度: {getConfidence(result.analysis)}%
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-64 overflow-auto">
        <div className="rounded-md bg-gray-50 p-4 text-sm whitespace-pre-wrap">
          {result.analysis || '无分析结果'}
        </div>
        {result.parsedSignal && (
          <div className="mt-4 rounded-md bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-700">解析结果</h3>
            <div className="mt-2 space-y-2">
              <div><span className="font-medium">操作:</span> {result.parsedSignal.action}</div>
              <div><span className="font-medium">置信度:</span> {Math.round(result.parsedSignal.confidence * 100)}%</div>
              {result.parsedSignal.position !== undefined && (
                <div><span className="font-medium">建议仓位:</span> {Math.round(result.parsedSignal.position * 100)}%</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          {new Date(result.timestamp).toLocaleString()}
        </p>
        <Button onClick={onRunTest} disabled={loading} variant="outline">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              重新分析中...
            </>
          ) : (
            <>重新测试</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 