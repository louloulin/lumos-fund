'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// 分析类型
type AnalysisType = 'value' | 'technical' | 'sentiment' | 'portfolio';

export function StreamingAnalysis() {
  const [ticker, setTicker] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('value');
  const [streaming, setStreaming] = useState(false);
  const [content, setContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // 清理函数
  useEffect(() => {
    return () => {
      // 组件卸载时取消所有进行中的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 开始流式分析
  const startStreaming = async () => {
    if (!ticker.trim()) {
      toast({
        title: "缺少股票代码",
        description: "请输入要分析的股票代码",
        variant: "destructive",
      });
      return;
    }

    setStreaming(true);
    setContent('');

    // 创建一个新的AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // 调用流式API
      const response = await fetch(
        `/api/analyze?ticker=${encodeURIComponent(ticker)}&type=${analysisType}`,
        { signal }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分析请求失败');
      }

      // 确保响应是一个可读流
      if (!response.body) {
        throw new Error('响应没有body流');
      }

      // 创建读取器
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // 读取流
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码和解析数据
        const chunk = decoder.decode(value, { stream: true });
        try {
          // 处理SSE格式的数据，每行应该是"data: {...}"格式
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const jsonStr = line.slice(5).trim();
              if (jsonStr === '[DONE]') continue;
              
              try {
                const data = JSON.parse(jsonStr);
                if (data.text || data.content) {
                  setContent(prev => prev + (data.text || data.content));
                }
              } catch (e) {
                // 如果不是JSON格式，直接添加文本
                setContent(prev => prev + jsonStr);
              }
            }
          }
        } catch (e) {
          // 如果解析失败，就直接添加文本
          setContent(prev => prev + chunk);
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('流式分析错误:', error);
        toast({
          title: "分析失败",
          description: error instanceof Error ? error.message : '未知错误',
          variant: "destructive",
        });
      }
    } finally {
      setStreaming(false);
    }
  };

  // 停止流式分析
  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>流式股票分析</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="输入股票代码 (例如: AAPL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            disabled={streaming}
          />
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
            className="px-3 py-2 border rounded-md"
            disabled={streaming}
          >
            <option value="value">价值分析</option>
            <option value="technical">技术分析</option>
            <option value="sentiment">情绪分析</option>
            <option value="portfolio">投资组合</option>
          </select>
          {streaming ? (
            <Button variant="destructive" onClick={stopStreaming}>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              停止
            </Button>
          ) : (
            <Button onClick={startStreaming}>
              开始分析
            </Button>
          )}
        </div>

        <div className="p-4 border rounded-md bg-muted/30 h-[300px] overflow-auto whitespace-pre-line">
          {content || (
            <div className="text-muted-foreground text-sm">
              {streaming ? '正在分析...' : '请输入股票代码并点击"开始分析"'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 