'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { testAgent } from '@/app/api/mastra/actions';

/**
 * Mastra测试与执行组件
 * 
 * 这个组件提供一个界面，用于直接测试Mastra AI代理和工作流，
 * 对于开发和调试非常有用。
 */
export function MastraPlayground() {
  const { toast } = useToast();
  const [tab, setTab] = useState('agents');
  const [agentType, setAgentType] = useState('valueInvesting');
  const [prompt, setPrompt] = useState('分析苹果公司(AAPL)的投资价值。');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRunAgent = async () => {
    if (!prompt.trim()) {
      toast({
        title: '请输入提示词',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await testAgent(agentType, prompt);
      setResponse(result || '无响应');
    } catch (error) {
      console.error('测试代理失败:', error);
      toast({
        title: '测试失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
      setResponse('测试失败，请查看控制台获取详细信息。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mastra AI测试平台</CardTitle>
        <CardDescription>测试和运行Mastra AI代理和工作流</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="agents" value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="agents">AI代理</TabsTrigger>
            <TabsTrigger value="workflows">工作流</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agents" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">选择代理</label>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger>
                  <SelectValue placeholder="选择AI代理" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valueInvesting">价值投资代理</SelectItem>
                  <SelectItem value="growthInvesting">成长投资代理</SelectItem>
                  <SelectItem value="trendInvesting">趋势投资代理</SelectItem>
                  <SelectItem value="quantInvesting">量化投资代理</SelectItem>
                  <SelectItem value="macroAnalysis">宏观分析代理</SelectItem>
                  <SelectItem value="sentimentAnalysis">舆情分析代理</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">提示词</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="输入提示词..."
                className="h-32"
              />
            </div>
            
            <Button 
              onClick={handleRunAgent} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                '运行代理'
              )}
            </Button>
            
            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium">AI响应</label>
              <div className="p-4 border rounded-md bg-slate-50 min-h-32 whitespace-pre-wrap">
                {response || '等待响应...'}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="workflows" className="space-y-4">
            <div className="p-4 border rounded-md">
              <p className="text-center text-gray-500">工作流测试功能即将推出...</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 