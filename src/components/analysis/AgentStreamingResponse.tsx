'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconBrain, IconSend } from '@tabler/icons-react';

interface AgentStreamingResponseProps {
  ticker: string;
}

export function AgentStreamingResponse({ ticker }: AgentStreamingResponseProps) {
  const [question, setQuestion] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 处理表单提交
  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setResponse('');
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker, question }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '请求失败');
      }
      
      if (!res.body) {
        throw new Error('没有返回数据流');
      }
      
      // 处理流式响应
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      let responseText = '';
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          responseText += chunk;
          setResponse(responseText);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误');
      console.error('流式响应错误:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBrain size={20} />
          <span>AI分析助手</span>
        </CardTitle>
        <CardDescription>
          询问关于 {ticker} 的任何问题，AI将为您提供实时分析
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
          {response ? (
            <div className="prose dark:prose-invert max-w-none">
              {response}
            </div>
          ) : error ? (
            <div className="text-red-500">
              {error}
            </div>
          ) : (
            <div className="text-gray-400 dark:text-gray-500">
              {isLoading ? '思考中...' : '提问以获取分析...'}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`询问关于 ${ticker} 的问题，例如："分析其基本面指标" 或 "评估当前估值"...`}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !question.trim()}
            className="self-end"
          >
            <IconSend size={16} />
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="text-sm text-gray-500">
        分析结果基于AI模型生成，仅供参考，不构成投资建议。
      </CardFooter>
    </Card>
  );
} 