# LumosFund 开发指南

## 1. 开发环境设置

### 1.1 基础要求

开发LumosFund需要以下基础环境：

- **Node.js**: v18.0.0 或更高版本
- **PNPM**: v8.0.0 或更高版本
- **Git**: 用于版本控制
- **IDE**: 推荐使用Visual Studio Code，搭配以下扩展：
  - TypeScript支持
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

### 1.2 开发环境配置步骤

1. **克隆代码库**:
```bash
git clone https://github.com/your-organization/lumos-fund.git
cd lumos-fund
```

2. **安装依赖**:
```bash
pnpm install
```

3. **配置开发环境变量**:
复制 `.env.example` 文件为 `.env.local`，并填入必要的API密钥：
```bash
cp .env.example .env.local
```

4. **启动开发服务器**:
```bash
pnpm dev
```

5. **运行测试**:
```bash
pnpm test
```

### 1.3 项目结构概览

```
lumos-fund/
├── src/                   # 源代码目录
│   ├── app/               # Next.js应用目录
│   │   ├── api/           # API路由
│   │   ├── (routes)/      # 页面路由
│   │   └── layout.tsx     # 主布局
│   ├── components/        # UI组件
│   ├── lib/               # 通用工具和辅助函数
│   ├── mastra/            # Mastra AI集成
│   │   ├── agents/        # AI代理定义
│   │   ├── tools/         # 代理工具
│   │   └── workflows/     # 决策工作流
│   ├── providers/         # 上下文提供者
│   ├── services/          # 服务类
│   └── types/             # 类型定义
├── public/                # 静态资源
├── tests/                 # 测试文件
├── doc/                   # 文档
└── ... 配置文件
```

## 2. 核心概念

### 2.1 Mastra AI框架集成

LumosFund使用Mastra框架实现AI代理系统。Mastra提供了以下核心概念：

- **Agent**：AI代理，代表具有特定能力和专业知识的虚拟助手
- **Tool**：代理可以使用的工具，提供特定功能
- **Workflow**：组织多个代理和工具的工作流程
- **Memory**：代理记忆系统，用于保存对话和上下文

在LumosFund中，这些概念被应用于量化交易领域：

```typescript
// 代理示例 (Agent Example)
import { Agent } from '@mastra/core';
import { qwen } from 'qwen-ai-provider';

const valueInvestingAgent = new Agent({
  id: 'valueInvestingAgent',
  description: '价值投资代理',
  model: qwen('qwen-plus-2024-12-20'),
  systemPrompt: `你是一位价值投资专家...`,
  tools: { ... }
});

// 工具示例 (Tool Example)
const financialMetricsTool = {
  id: 'financialMetricsTool',
  description: '获取财务指标',
  execute: async (options) => {
    // 实现财务指标获取逻辑
  }
};

// 工作流示例 (Workflow Example)
const stockAnalysisWorkflow = {
  execute: async (options) => {
    // 实现股票分析工作流逻辑
  }
};
```

### 2.2 项目架构

LumosFund采用了模块化、分层架构，主要由以下几个层次组成：

- **表现层**：Next.js页面和组件，负责UI展示
- **业务逻辑层**：服务类和Mastra workflows，实现核心业务逻辑
- **AI代理层**：基于Mastra的AI代理和工具
- **数据访问层**：API客户端和数据处理服务

这种分层架构使得系统更加模块化、可测试和可扩展。

## 3. 扩展开发指南

### 3.1 添加新的AI代理

要添加新的投资风格或专业领域的AI代理，请按照以下步骤进行：

1. **创建代理文件**：
在 `src/mastra/agents/` 目录下创建新的代理文件，例如 `newInvestingAgent.ts`

2. **实现代理类**：

```typescript
// src/mastra/agents/newInvestingAgent.ts
import { Agent } from '@mastra/core';
import { createQwen } from 'qwen-ai-provider';

// 初始化Qwen
const qwen = createQwen({
  apiKey: process.env.QWEN_API_KEY || "your_fallback_key",
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

/**
 * 新投资风格代理
 * @description 实现新的投资风格或专业领域的AI代理
 */
export const newInvestingAgent = new Agent({
  id: 'newInvestingAgent',
  description: '新投资风格代理，专注于...',
  apiKey: process.env.QWEN_API_KEY,
  provider: 'qwen',
  model: qwen('qwen-plus-2024-12-20'),
  systemPrompt: `
    你是一位专注于[新投资风格]的投资专家。
    你的任务是分析股票，并基于[新投资风格]的原则提供投资建议。
    
    在分析过程中，你应当特别关注：
    1. [关注点1]
    2. [关注点2]
    3. [关注点3]
    
    提供分析时，应当[具体要求和风格指导]。
  `,
  tools: {
    // 集成必要的工具
    stockPriceTool,
    financialMetricsTool,
    // 其他相关工具...
  }
});
```

3. **导出新代理**：
在 `src/mastra/agents/index.ts` 中导出新代理

```typescript
// src/mastra/agents/index.ts
export * from './valueInvestingAgent';
export * from './growthInvestingAgent';
// 其他现有代理...
export * from './newInvestingAgent'; // 新增
```

4. **注册到Mastra实例**：
在 `src/mastra/index.ts` 中注册新代理

```typescript
// src/mastra/index.ts
import { newInvestingAgent } from './agents/newInvestingAgent';

// 初始化mastra
export const mastra = new Mastra({
  agents: {
    // 现有代理...
    newInvestingAgent, // 新增
  },
  // 其他配置...
});

// 更新getAgent方法
mastra.getAgent = (name: string) => {
  switch (name) {
    // 现有代理case...
    case 'newInvestingAgent':
      return newInvestingAgent;
    default:
      throw new Error(`Agent ${name} not found`);
  }
};

// 导出新代理
export {
  // 现有代理...
  newInvestingAgent, // 新增
};
```

5. **测试新代理**：
创建单元测试和集成测试确保新代理正常工作

```typescript
// __tests__/agents/newInvestingAgent.test.ts
import { newInvestingAgent } from '@/mastra/agents/newInvestingAgent';

describe('New Investing Agent', () => {
  test('should analyze stocks based on new investment style', async () => {
    const result = await newInvestingAgent.generate('分析AAPL股票');
    expect(result).toBeDefined();
    expect(result.text).toContain('分析');
    // 其他断言...
  });
  
  // 其他测试...
});
```

### 3.2 添加新的工具

要添加新的分析工具或功能模块，请按照以下步骤进行：

1. **创建工具文件**：
在 `src/mastra/tools/` 目录下创建新的工具文件，例如 `newAnalysisTool.ts`

2. **实现工具接口**：

```typescript
// src/mastra/tools/newAnalysisTool.ts
import type { Tool } from '@mastra/core/tools';

/**
 * 新分析工具
 * @description 实现新的分析功能
 */
export const newAnalysisTool: Tool = {
  id: 'newAnalysisTool',
  description: '执行新类型的分析功能',
  execute: async (options: any) => {
    try {
      const { param1, param2 } = options;
      
      // 实现分析逻辑
      const analysisResult = await performAnalysis(param1, param2);
      
      // 返回结果
      return {
        success: true,
        data: analysisResult
      };
    } catch (error) {
      console.error('新分析工具执行失败:', error);
      return {
        success: false,
        error: `执行分析失败: ${error.message}`
      };
    }
  }
};

// 辅助函数
async function performAnalysis(param1: string, param2: any) {
  // 实现具体的分析算法或API调用
  // ...
  
  return {
    result: 'analysis result',
    metrics: {
      // 指标数据
    },
    summary: '分析总结'
  };
}
```

3. **导出新工具**：
在 `src/mastra/tools/index.ts` 中导出新工具

```typescript
// src/mastra/tools/index.ts
export * from './financialMetrics';
export * from './technicalIndicatorTools';
// 其他现有工具...
export * from './newAnalysisTool'; // 新增
```

4. **注册到Mastra实例**：
在 `src/mastra/index.ts` 中注册新工具

```typescript
// src/mastra/index.ts
import { newAnalysisTool } from './tools/newAnalysisTool';

// 初始化mastra
export const mastra = new Mastra({
  // 其他配置...
  tools: {
    // 现有工具...
    newAnalysisTool, // 新增
  }
});

// 导出新工具
export {
  // 现有工具...
  newAnalysisTool, // 新增
};
```

5. **测试新工具**：
创建单元测试确保新工具正常工作

```typescript
// __tests__/tools/newAnalysisTool.test.ts
import { newAnalysisTool } from '@/mastra/tools/newAnalysisTool';

describe('New Analysis Tool', () => {
  test('should perform analysis with valid parameters', async () => {
    const result = await newAnalysisTool.execute({
      param1: 'test',
      param2: { value: 123 }
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    // 其他断言...
  });
  
  test('should handle errors gracefully', async () => {
    const result = await newAnalysisTool.execute({
      param1: 'invalid'
      // 缺少必要参数
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### 3.3 创建新的工作流

要创建新的决策或分析工作流，请按照以下步骤进行：

1. **创建工作流文件**：
在 `src/mastra/workflows/` 目录下创建新的工作流文件，例如 `newAnalysisWorkflow.ts`

2. **实现工作流接口**：

```typescript
// src/mastra/workflows/newAnalysisWorkflow.ts
import type { Workflow } from '@mastra/core/workflow';
import { stockPriceTool } from '../tools/stockPrice';
import { newAnalysisTool } from '../tools/newAnalysisTool';
import { valueInvestingAgent } from '../agents/valueInvestingAgent';
import { newInvestingAgent } from '../agents/newInvestingAgent';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('newAnalysisWorkflow');

/**
 * 新分析工作流
 * @description 实现新的分析决策流程
 */
export const newAnalysisWorkflow: Workflow = {
  execute: async (options: any) => {
    const { context } = options;
    const { ticker, parameter1, parameter2 } = context;
    
    logger.info(`执行新分析工作流: ${ticker}`);
    
    try {
      // 获取基础数据
      const stockData = await stockPriceTool.execute({ 
        context: { ticker } 
      });
      
      // 执行专门分析
      const specialAnalysis = await newAnalysisTool.execute({
        param1: parameter1,
        param2: parameter2,
        stockData: stockData.data
      });
      
      // 执行价值投资分析
      const valueAnalysis = await valueInvestingAgent.generate(
        `分析 ${ticker} 的价值投资潜力，基于以下数据和特殊分析：
        价格数据: ${JSON.stringify(stockData.data)}
        特殊分析: ${JSON.stringify(specialAnalysis.data)}`
      );
      
      // 执行新投资风格分析
      const newStyleAnalysis = await newInvestingAgent.generate(
        `基于新投资风格分析 ${ticker}，考虑以下数据和之前分析：
        价格数据: ${JSON.stringify(stockData.data)}
        特殊分析: ${JSON.stringify(specialAnalysis.data)}
        价值分析: ${valueAnalysis.text}`
      );
      
      // 返回综合结果
      return {
        stockData: stockData.data,
        specialAnalysis: specialAnalysis.data,
        valueAnalysis: valueAnalysis.text,
        newStyleAnalysis: newStyleAnalysis.text
      };
    } catch (error) {
      logger.error('新分析工作流失败', error);
      throw new Error(`执行新分析工作流失败: ${error.message}`);
    }
  }
};
```

3. **注册到Mastra实例**：
在 `src/mastra/index.ts` 中注册新工作流

```typescript
// src/mastra/index.ts
import { newAnalysisWorkflow } from './workflows/newAnalysisWorkflow';

// 初始化mastra
export const mastra = new Mastra({
  // 其他配置...
  workflows: {
    // 现有工作流...
    newAnalysisWorkflow, // 新增
  }
});

// 更新getWorkflow方法
mastra.getWorkflow = (name: string) => {
  switch (name) {
    // 现有工作流case...
    case 'newAnalysisWorkflow':
      return newAnalysisWorkflow;
    default:
      throw new Error(`Workflow ${name} not found`);
  }
};

// 导出新工作流
export {
  // 现有工作流...
  newAnalysisWorkflow, // 新增
};
```

4. **创建API端点**：
在 `src/app/api/` 目录下创建新的API端点来暴露工作流

```typescript
// src/app/api/new-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/mastra';

export async function POST(req: NextRequest) {
  try {
    const { ticker, parameter1, parameter2 } = await req.json();
    
    // 参数验证
    if (!ticker) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: ticker' },
        { status: 400 }
      );
    }
    
    // 执行新分析工作流
    const result = await mastra.getWorkflow('newAnalysisWorkflow').execute({
      context: {
        ticker,
        parameter1,
        parameter2
      }
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('新分析API出错:', error);
    return NextResponse.json(
      { success: false, error: `分析失败: ${error.message}` },
      { status: 500 }
    );
  }
}
```

5. **创建前端组件**：
在 `src/components/` 目录下创建新的前端组件来使用新工作流

```typescript
// src/components/NewAnalysis.tsx
'use client';

import { useState } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Spinner } from '@/components/ui/spinner';

export function NewAnalysisComponent() {
  const [ticker, setTicker] = useState('');
  const [parameter1, setParameter1] = useState('');
  const [parameter2, setParameter2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/new-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          parameter1,
          parameter2: parameter2 ? JSON.parse(parameter2) : {}
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '分析请求失败');
      }
      
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ticker" className="block text-sm font-medium">
            股票代码
          </label>
          <Input
            id="ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="AAPL"
            required
          />
        </div>
        
        <div>
          <label htmlFor="parameter1" className="block text-sm font-medium">
            参数1
          </label>
          <Input
            id="parameter1"
            value={parameter1}
            onChange={(e) => setParameter1(e.target.value)}
            placeholder="参数1值"
          />
        </div>
        
        <div>
          <label htmlFor="parameter2" className="block text-sm font-medium">
            参数2 (JSON)
          </label>
          <Input
            id="parameter2"
            value={parameter2}
            onChange={(e) => setParameter2(e.target.value)}
            placeholder="{}"
          />
        </div>
        
        <Button type="submit" disabled={loading || !ticker}>
          {loading ? <><Spinner size="sm" className="mr-2" /> 分析中...</> : '执行分析'}
        </Button>
      </form>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>分析结果: {ticker}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">价值分析</h3>
                <p className="whitespace-pre-wrap">{result.valueAnalysis}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">新风格分析</h3>
                <p className="whitespace-pre-wrap">{result.newStyleAnalysis}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">特殊分析结果</h3>
                <pre className="bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.specialAnalysis, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## 4. 测试指南

### 4.1 测试框架

LumosFund使用Jest和React Testing Library进行测试。测试文件组织如下：

- 单元测试：测试独立组件和功能
- 集成测试：测试多个组件或模块的交互
- 端到端测试：测试完整用户流程

### 4.2 测试命令

```bash
# 运行所有测试
pnpm test

# 运行特定文件的测试
pnpm test -- path/to/test

# 运行带有覆盖率报告的测试
pnpm test:coverage

# 持续监听模式
pnpm test:watch
```

### 4.3 编写测试示例

**单元测试示例 (Jest)**:

```typescript
// __tests__/tools/financialMetricsTool.test.ts
import { financialMetricsTool } from '@/mastra/tools/financialMetrics';

describe('Financial Metrics Tool', () => {
  it('should return financial metrics for valid ticker', async () => {
    const result = await financialMetricsTool.execute({
      ticker: 'AAPL'
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.metrics).toHaveProperty('peRatio');
    // 其他断言...
  });
  
  it('should handle invalid ticker gracefully', async () => {
    const result = await financialMetricsTool.execute({
      ticker: 'INVALID_TICKER'
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

**组件测试示例 (React Testing Library)**:

```typescript
// __tests__/components/StockAnalysis.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StockAnalysisComponent } from '@/components/StockAnalysis';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// 模拟API服务器
const server = setupServer(
  rest.post('/api/analyze', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          ticker: 'AAPL',
          technicalAnalysis: '技术分析结果...',
          sentimentAnalysis: '情绪分析结果...',
          strategyRecommendation: '策略建议结果...'
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('StockAnalysis Component', () => {
  it('should render analysis results after form submission', async () => {
    render(<StockAnalysisComponent />);
    
    // 输入股票代码
    fireEvent.change(screen.getByLabelText(/股票代码/i), {
      target: { value: 'AAPL' }
    });
    
    // 提交表单
    fireEvent.click(screen.getByRole('button', { name: /分析/i }));
    
    // 等待结果显示
    await waitFor(() => {
      expect(screen.getByText(/技术分析结果/i)).toBeInTheDocument();
      expect(screen.getByText(/情绪分析结果/i)).toBeInTheDocument();
      expect(screen.getByText(/策略建议结果/i)).toBeInTheDocument();
    });
  });
  
  it('should display error message on API failure', async () => {
    // 覆盖默认处理程序以模拟错误
    server.use(
      rest.post('/api/analyze', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ success: false, error: '服务器错误' })
        );
      })
    );
    
    render(<StockAnalysisComponent />);
    
    // 输入股票代码
    fireEvent.change(screen.getByLabelText(/股票代码/i), {
      target: { value: 'AAPL' }
    });
    
    // 提交表单
    fireEvent.click(screen.getByRole('button', { name: /分析/i }));
    
    // 等待错误信息显示
    await waitFor(() => {
      expect(screen.getByText(/服务器错误/i)).toBeInTheDocument();
    });
  });
});
```

## 5. 部署指南

### 5.1 构建生产版本

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm start
```

### 5.2 部署选项

LumosFund支持多种部署选项：

#### Vercel部署

1. 将代码推送到GitHub仓库
2. 在Vercel控制台中导入项目
3. 设置环境变量（QWEN_API_KEY等）
4. 点击部署

#### Docker部署

1. 构建Docker镜像:
```bash
docker build -t lumos-fund .
```

2. 运行容器:
```bash
docker run -p 3000:3000 \
  -e QWEN_API_KEY=your_api_key \
  -e ALPHAVANTAGE_API_KEY=your_api_key \
  -e FINNHUB_API_KEY=your_api_key \
  -e NEWS_API_KEY=your_api_key \
  lumos-fund
```

#### 传统服务器部署

1. 在服务器上设置Node.js环境
2. 克隆代码仓库
3. 安装依赖: `pnpm install --production`
4. 构建项目: `pnpm build`
5. 使用PM2或类似工具启动服务: `pm2 start npm -- start`

### 5.3 CI/CD集成

推荐使用GitHub Actions设置CI/CD流程：

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test
        
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - name: Install dependencies
        run: pnpm install
      - name: Build
        run: pnpm build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 6. 性能优化指南

### 6.1 前端优化

- 使用Next.js的ISR（增量静态再生成）优化页面加载
- 实现组件懒加载和代码分割
- 优化图像使用Next.js的Image组件
- 实现有效的状态管理避免不必要的渲染

### 6.2 AI代理优化

- 实现请求缓存减少对LLM API的调用
- 优化提示词工程提高代理效率
- 使用批处理合并多个代理请求
- 实现结果缓存避免重复分析

### 6.3 API优化

- 实施适当的缓存策略
- 优化数据获取和处理
- 实现请求限流保护外部API
- 使用边缘函数加速全球响应时间

## 7. 故障排除

### 7.1 常见错误及解决方案

| 错误类型 | 可能原因 | 解决方法 |
|---------|----------|---------|
| API密钥错误 | 环境变量未正确设置 | 检查`.env.local`文件中的API密钥 |
| 代理返回空结果 | 提示词设计问题 | 检查和优化代理的systemPrompt |
| 响应超时 | 代理或工具执行时间过长 | 优化代理和工具实现，添加超时处理 |
| 内存溢出 | 数据结构过大 | 优化数据结构，实现分页处理 |
| 类型错误 | TypeScript类型定义不匹配 | 更新类型定义，确保类型一致性 |

### 7.2 调试技巧

1. **使用日志**:
   - 在关键位置添加日志记录
   - 使用不同的日志级别（info, warn, error）
   - 分析日志寻找问题模式

2. **调试工具**:
   - 使用VS Code调试器进行服务器端调试
   - 使用Chrome DevTools进行客户端调试
   - 使用React Developer Tools检查组件状态

3. **测试隔离**:
   - 编写隔离测试验证特定功能
   - 使用模拟数据和服务进行测试
   - 逐层排除问题 