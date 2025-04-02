# Next.js与Mastra集成指南

## 概述

本文档介绍如何在LumosFund项目中集成Mastra框架与Next.js，实现AI代理功能。该集成方案支持以下功能：

- 服务器端代理执行（Server Actions）
- 流式响应API
- 客户端组件中使用代理结果

## 基本设置

### 1. Mastra实例配置

首先，创建一个Mastra实例，注册所有代理和工作流：

```typescript
// src/mastra/index.ts
import { Mastra } from '@mastra/core';
import { valueInvestingAgent } from './agents/valueInvestingAgent';
import { technicalAnalysisAgent } from './agents/technicalAnalysisAgent';
import { portfolioManagementAgent } from './agents/portfolioManagementAgent';
import { tradingDecisionWorkflow } from './workflows/tradingDecisionWorkflow';

// 创建并配置Mastra实例
export const mastra = new Mastra({
  agents: {
    valueInvestingAgent,
    technicalAnalysisAgent,
    portfolioManagementAgent,
  },
  workflows: {
    tradingDecisionWorkflow,
  },
});

// 默认导出为单例模式
export default mastra;
```

### 2. 更新next.config.js

确保Next.js配置支持Mastra：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@mastra/*"],
  // ... 其他Next.js配置
}
 
module.exports = nextConfig
```

## 服务器端集成

### 1. Server Actions

使用服务器操作(Server Actions)在服务器端执行代理：

```typescript
// src/app/actions.ts
'use server'

import { mastra } from '@/mastra';
import { revalidatePath } from 'next/cache';

export async function analyzeStock(ticker: string, portfolio: any) {
  try {
    const workflow = mastra.getWorkflow('tradingDecisionWorkflow');
    
    const result = await workflow.execute({
      context: {
        ticker,
        portfolio,
      }
    });
    
    revalidatePath('/dashboard');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('分析股票失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '分析失败'
    };
  }
}
```

### 2. 在组件中使用Server Actions

```typescript
'use client'
 
import { analyzeStock } from '../actions';
 
export function StockAnalysisForm() {
  async function handleSubmit(formData: FormData) {
    const ticker = formData.get('ticker') as string;
    const result = await analyzeStock(ticker, { cash: 100000, positions: [] });
    // 处理结果
    console.log(result);
  }
 
  return (
    <form action={handleSubmit}>
      <input name="ticker" placeholder="输入股票代码" />
      <button type="submit">分析</button>
    </form>
  );
}
```

## API路由集成

### 1. 标准API路由

创建标准API端点：

```typescript
// src/app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import { mastra } from '@/mastra';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticker, portfolio } = body;
    
    if (!ticker) {
      return NextResponse.json(
        { error: '缺少股票代码' },
        { status: 400 }
      );
    }
    
    const workflow = mastra.getWorkflow('tradingDecisionWorkflow');
    const result = await workflow.execute({
      context: {
        ticker,
        portfolio: portfolio || { cash: 0, positions: [] },
      }
    });
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('分析API错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理请求时出错' },
      { status: 500 }
    );
  }
}
```

### 2. 流式响应API

```typescript
// 支持流式响应的API端点
export async function OPTIONS(req: Request) {
  try {
    const body = await req.json();
    const { ticker, question } = body;
    
    if (!ticker) {
      return NextResponse.json(
        { error: '缺少股票代码' },
        { status: 400 }
      );
    }
    
    const agent = mastra.getAgent('valueInvestingAgent');
    const prompt = question || `分析 ${ticker} 股票，提供投资建议`;
    const stream = await agent.stream(prompt);
    
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error('流式API错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理流式请求时出错' },
      { status: 500 }
    );
  }
}
```

## 客户端流式UI组件

创建接收流式响应的客户端组件：

```typescript
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AgentStreamingResponse({ ticker }: { ticker: string }) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;
    
    setIsLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'OPTIONS',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, question }),
      });
      
      if (!res.body) throw new Error('没有返回数据流');
      
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
      console.error('流式响应错误:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div>{response || (isLoading ? '思考中...' : '')}</div>
      <Textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={`询问关于 ${ticker} 的问题...`}
        disabled={isLoading}
      />
      <Button onClick={handleSubmit} disabled={isLoading}>
        发送
      </Button>
    </div>
  );
}
```

## 环境变量设置

确保在部署环境中设置好LLM API密钥：

```bash
# .env.local
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

## 注意事项

1. 在生产环境中，确保实现适当的错误处理和重试机制
2. 对于长时间运行的代理操作，考虑使用后台任务处理
3. 监控代理操作的性能和成本
4. 在部署时确保环境变量正确设置

## 排障指南

- 如果遇到跨域问题，检查Next.js的CORS配置
- 如果流式响应中断，检查网络连接和超时设置
- 对于性能问题，考虑增加缓存或优化提示工程 