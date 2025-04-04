# LumosFund：AI驱动的量化交易平台详细计划

## 1. 项目概述

LumosFund将是一个基于AI Agent的量化交易平台，融合了AI智能对冲基金的核心理念和现代技术栈。该平台将利用多个专业AI代理协作分析市场，制定交易策略，并执行模拟或实盘交易。平台设计面向个人投资者和小型投资机构，提供用户友好的界面和强大的分析能力。

### 1.1 核心理念

- **AI代理协作**：多个专业AI代理协同工作，模拟不同投资风格 ✅
- **多策略融合**：结合基本面、技术面、情绪和宏观分析 ✅
- **透明决策**：提供详细的AI推理过程和决策依据 ✅
- **风险管理**：内置专业风险控制机制 ✅
- **性能评估**：完整的回测和绩效分析系统 ✅

## 2. 技术架构

![LumosFund技术架构](https://github.com/user-attachments/assets/e8ca04bf-9989-4a7d-a8b4-34e04666663b)

### 2.1 前端技术栈

- **框架**: Next.js（React框架） ✅
- **UI库**: Shadcn UI（基于Tailwind CSS的组件库） ✅
- **图表库**: TradingView轻量图表库/Recharts/D3.js ✅
- **状态管理**: Zustand/Jotai ✅
- **类型系统**: TypeScript ✅

### 2.2 桌面应用

- **框架**: Tauri（Rust + Web技术的桌面应用框架） ✅
- **核心功能**: 本地数据处理、实时数据连接、系统集成 ✅

### 2.3 后端技术栈

- **API服务**: Rust（高性能计算）+ Axum/Actix（API框架） ✅
- **AI代理框架**: Mastra（TypeScript AI代理框架） ✅
- **数据处理**: Rust + Arrow/DataFusion ✅
- **数据库**: TimescaleDB（时间序列数据）+ PostgreSQL（关系数据） ✅

### 2.4 AI模型集成

- **LLM提供商**: OpenAI、Anthropic、Groq等 ✅
- **向量数据库**: Qdrant/Pinecone（策略和分析存储） ✅
- **时序预测**: Prophet/StatsModels（技术指标预测） ✅

## 3. AI代理系统设计

### 3.1 代理类型

参考AI Hedge Fund项目的代理设计，我们将实现以下代理类型，但使用Mastra框架：

1. **投资专家代理** ✅
   - 价值投资代理（巴菲特、格雷厄姆风格） ✅
   - 成长投资代理（林奇、伍德风格） ✅
   - 趋势投资代理（德拉肯米勒风格） ✅
   - 量化投资代理（基于统计套利和因子模型） ✅

2. **分析代理** ✅
   - 基本面分析代理 ✅
   - 技术分析代理 ✅
   - 情绪分析代理 ✅
   - 宏观经济分析代理 ✅

3. **管理代理** ✅
   - 风险管理代理 ✅
   - 投资组合优化代理 ✅
   - 执行代理（负责生成交易信号） ✅
   - 策略推荐代理（根据风险偏好和市场状况推荐策略） ✅

### 3.2 Mastra实现示例

以下是使用Mastra框架实现巴菲特风格代理的示例： ✅

```typescript
// src/agents/valueInvestingAgent.ts
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { financialMetricsTool } from '../tools/financialMetrics';
import { stockPriceTool } from '../tools/stockPrice';
import { newsSentimentTool } from '../tools/newsSentiment';

export const valueInvestingAgent = new Agent({
  name: 'Warren Buffett Agent',
  description: '价值投资代理，模拟沃伦·巴菲特的投资风格',
  model: openai('gpt-4o'),
  instructions: `
    你是沃伦·巴菲特的AI模拟，著名的价值投资者。
    
    分析公司时，你会关注:
    1. 持久的竞争优势（护城河）
    2. 良好的管理质量和资本分配
    3. 可理解的业务模型
    4. 内在价值与市场价格的差距（安全边际）
    5. 长期增长潜力
    
    使用提供的工具分析公司，并给出投资建议。输出必须包含信号（看涨/看跌/中性）、
    置信度（0-100）和详细推理过程。
  `,
  tools: {
    financialMetricsTool,
    stockPriceTool,
    newsSentimentTool
  }
});
``` ✅

### 3.3 代理工具设计

```typescript
// src/tools/financialMetrics.ts
import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

export const financialMetricsTool = createTool({
  name: 'financialMetricsTool',
  description: '获取公司的财务指标和比率',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    period: z.enum(['quarterly', 'annual', 'ttm']).describe('报告周期'),
    metrics: z.array(z.string()).describe('需要的指标列表'),
  }),
  execute: async ({ ticker, period, metrics }) => {
    // 实现从API获取财务数据的逻辑
    // 可以是直接调用金融数据API，或者通过Rust后端处理
    const result = await fetch(`/api/financial-metrics?ticker=${ticker}&period=${period}`);
    return result.json();
  }
}); ✅

// src/tools/strategyRecommendationTool.ts
import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

export const strategyRecommendationTool = createTool({
  name: 'strategyRecommendationTool',
  description: '根据市场状况、风险承受能力和投资期限推荐最优交易策略',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    riskTolerance: z.enum(['low', 'moderate', 'high']).describe('风险承受能力'),
    investmentHorizon: z.enum(['short', 'medium', 'long']).describe('投资期限'),
    marketCondition: z.enum(['bull', 'bear', 'neutral', 'volatile']).optional().describe('市场状况'),
    fundamentalData: z.any().optional().describe('基本面数据'),
    technicalData: z.any().optional().describe('技术指标数据')
  }),
  execute: async ({ ticker, riskTolerance, investmentHorizon, marketCondition, fundamentalData, technicalData }) => {
    // 评估不同策略的适合性分数
    const strategyScores = evaluateStrategyScores(riskTolerance, investmentHorizon, marketCondition, fundamentalData, technicalData);
    
    // 确定推荐的策略组合
    const { primaryStrategy, secondaryStrategy, allocation, parameters } = determineRecommendedStrategies(strategyScores, riskTolerance);
    
    // 生成解释和交易规则
    return {
      ticker,
      recommendationDate: new Date().toISOString(),
      riskProfile: { tolerance: riskTolerance, horizon: investmentHorizon, marketCondition },
      recommendation: { primaryStrategy, secondaryStrategy, allocation, parameters },
      strategyScores,
      confidence: calculateConfidenceScore(strategyScores, fundamentalData, technicalData)
    };
  }
}); ✅

// src/tools/technicalIndicatorsTool.ts
import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

export const technicalIndicatorsTool = createTool({
  name: 'technicalIndicatorsTool',
  description: '计算和分析技术指标，包括移动平均线、RSI、MACD等',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    period: z.string().describe('数据周期：daily, weekly, monthly'),
    indicators: z.array(z.string()).describe('需要的技术指标列表'),
  }),
  execute: async ({ ticker, period, indicators }) => {
    // 获取历史价格数据并计算技术指标
    const priceData = await fetchHistoricalPrices(ticker, period);
    const indicatorsData = calculateIndicators(priceData, indicators);
    
    // 分析各指标信号并生成综合信号
    const signal = analyzeIndicators(indicatorsData);
    
    return {
      ticker,
      timestamp: new Date().toISOString(),
      indicators: indicatorsData,
      signal: signal.direction,
      confidence: signal.confidence,
      supportingIndicators: signal.supporting,
      opposingIndicators: signal.opposing
    };
  }
}); ✅

// src/tools/factorModelTool.ts
import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

export const factorModelTool = createTool({
  name: 'factorModelTool',
  description: '使用多因子模型分析股票',
  schema: z.object({
    ticker: z.string().describe('股票代码'),
    factors: z.array(z.string()).describe('需要分析的因子列表'),
    benchmark: z.string().optional().describe('基准指数'),
    period: z.string().describe('分析周期'),
  }),
  execute: async ({ ticker, factors, benchmark, period }) => {
    // 获取股票数据和因子数据
    const stockData = await fetchStockData(ticker, period);
    
    // 分析各因子
    const factorAnalysis = {};
    for (const factor of factors) {
      factorAnalysis[factor] = calculateFactorMetrics(stockData, factor, benchmark);
    }
    
    // 汇总分析结果
    const { signal, confidence, strongFactors, weakFactors } = analyzeFactors(factorAnalysis);
    
    return {
      ticker,
      timestamp: new Date().toISOString(),
      factors: factorAnalysis,
      signal,
      confidence,
      strongFactors,
      weakFactors
    };
  }
}); ✅

// src/tools/statisticalArbitrageTool.ts
import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

export const statisticalArbitrageTool = createTool({
  name: 'statisticalArbitrageTool',
  description: '分析股票对的统计关系，发现潜在的套利机会',
  schema: z.object({
    ticker1: z.string().describe('第一支股票代码'),
    ticker2: z.string().describe('第二支股票代码'),
    period: z.string().default('6m').describe('分析周期'),
    lookbackDays: z.number().int().min(20).max(500).default(180).describe('回溯天数'),
    thresholdZScore: z.number().min(1).max(3).default(2).describe('Z-score阈值')
  }),
  execute: async ({ ticker1, ticker2, period, lookbackDays, thresholdZScore }) => {
    // 获取历史价格数据
    const priceData1 = await fetchHistoricalPrices(ticker1, period);
    const priceData2 = await fetchHistoricalPrices(ticker2, period);
    
    // 计算相关性和协整性
    const correlation = calculateCorrelation(priceData1, priceData2);
    const cointegration = calculateCointegration(priceData1, priceData2);
    
    // 计算价差和Z-score
    const { spreadData, zScore, spreadMean, spreadStd } = calculateSpread(priceData1, priceData2);
    
    // 生成交易信号
    const signal = generateTradingSignal(zScore, thresholdZScore);
    
    // 分析套利机会
    const analysis = analyzeArbitrageOpportunity({
      ticker1, ticker2, correlation, cointegration, zScore, signal
    });
    
    return {
      ticker1,
      ticker2,
      timestamp: new Date().toISOString(),
      statistics: { correlation, cointegration, spreadMean, spreadStd, currentZScore: zScore },
      signal,
      analysis
    };
  }
}); ✅
```

### 3.4 代理工作流

使用Mastra的工作流功能创建完整的分析和决策流程： ✅

```typescript
// src/workflows/tradingDecisionWorkflow.ts
import { Workflow } from '@mastra/core/workflow';
import { valueInvestingAgent } from '../agents/valueInvestingAgent';
import { technicalAnalysisAgent } from '../agents/technicalAnalysisAgent';
import { sentimentAnalysisAgent } from '../agents/sentimentAnalysisAgent';
import { riskManagementAgent } from '../agents/riskManagementAgent';
import { portfolioOptimizationAgent } from '../agents/portfolioOptimizationAgent';

export const tradingDecisionWorkflow = new Workflow({
  name: 'Trading Decision Workflow',
  description: '完整的交易决策工作流',
  agents: {
    valueInvestingAgent,
    technicalAnalysisAgent,
    sentimentAnalysisAgent,
    riskManagementAgent,
    portfolioOptimizationAgent
  },
  steps: [
    {
      id: 'fundamentalAnalysis',
      agent: 'valueInvestingAgent',
      input: ({ context }) => ({
        ticker: context.ticker,
        data: context.data
      })
    },
    {
      id: 'technicalAnalysis',
      agent: 'technicalAnalysisAgent',
      input: ({ context }) => ({
        ticker: context.ticker,
        data: context.data
      })
    },
    {
      id: 'sentimentAnalysis',
      agent: 'sentimentAnalysisAgent',
      input: ({ context }) => ({
        ticker: context.ticker,
        data: context.data
      })
    },
    {
      id: 'riskAssessment',
      agent: 'riskManagementAgent',
      input: ({ context, results }) => ({
        ticker: context.ticker,
        fundamentalAnalysis: results.fundamentalAnalysis,
        technicalAnalysis: results.technicalAnalysis,
        sentimentAnalysis: results.sentimentAnalysis,
        portfolio: context.portfolio
      })
    },
    {
      id: 'portfolioDecision',
      agent: 'portfolioOptimizationAgent',
      input: ({ context, results }) => ({
        ticker: context.ticker,
        analyses: {
          fundamental: results.fundamentalAnalysis,
          technical: results.technicalAnalysis,
          sentiment: results.sentimentAnalysis
        },
        riskAssessment: results.riskAssessment,
        portfolio: context.portfolio,
        cash: context.cash
      })
    }
  ]
});
``` ✅

## 4. 前端UI设计

### 4.1 主要界面

![UI示意图](https://github.com/user-attachments/assets/cbae3dcf-b571-490d-b0ad-3f0f035ac0d4)

1. **仪表盘** ✅
   - 投资组合概览 ✅
   - 性能指标 ✅
   - 最近交易 ✅
   - 市场摘要 ✅

2. **交易中心** ✅
   - 股票搜索和基本信息 ✅
   - AI分析见解 ✅
   - 交易执行界面 ✅
   - 历史订单 ✅

3. **策略推荐** ✅
   - 风险偏好设置 ✅
   - 市场状况分析 ✅
   - 个性化策略推荐 ✅
   - 参数配置 ✅

4. **回测系统** ✅
   - 策略配置 ✅
   - 回测结果可视化 ✅
   - 绩效统计 ✅
   - 优化建议 ✅

### 4.2 UI组件示例

使用Shadcn UI实现的股票分析组件示例： ✅

```tsx
// src/components/StockAnalysisCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function StockAnalysisCard({ 
  ticker, 
  price, 
  signals, 
  reasoning 
}: StockAnalysisProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{ticker}</CardTitle>
          <div className="text-2xl font-bold">${price.toFixed(2)}</div>
        </div>
        <div className="flex gap-2">
          {signals.overall === 'bullish' && (
            <Badge variant="success">看涨</Badge>
          )}
          {signals.overall === 'bearish' && (
            <Badge variant="destructive">看跌</Badge>
          )}
          {signals.overall === 'neutral' && (
            <Badge variant="secondary">中性</Badge>
          )}
          <div className="text-sm text-muted-foreground">
            置信度: {signals.confidence}%
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">摘要</TabsTrigger>
            <TabsTrigger value="fundamental">基本面</TabsTrigger>
            <TabsTrigger value="technical">技术面</TabsTrigger>
            <TabsTrigger value="sentiment">情绪分析</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <p className="text-sm text-muted-foreground">{reasoning.summary}</p>
          </TabsContent>
          <TabsContent value="fundamental">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>ROE</span>
                <span>{reasoning.fundamental.roe}%</span>
              </div>
              <Progress value={reasoning.fundamental.score * 100} />
              <p className="text-xs">{reasoning.fundamental.analysis}</p>
            </div>
          </TabsContent>
          {/* 其他标签页内容 */}
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

## 5. 后端服务设计

### 5.1 Rust服务架构

```
backend/
├── src/
│   ├── main.rs                 # 应用入口
│   │   ├── mod.rs
│   │   ├── api/                    # API路由
│   │   │   ├── mod.rs
│   │   │   ├── financial_data.rs   # 金融数据API
│   │   │   ├── trading.rs          # 交易API
│   │   │   ├── backtesting.rs      # 回测API
│   │   │   └── strategy.rs         # 策略推荐API ✅
│   │   ├── services/               # 业务逻辑
│   │   │   ├── mod.rs
│   │   │   ├── data_provider.rs    # 数据提供服务
│   │   │   ├── risk_manager.rs     # 风险管理
│   │   │   ├── strategy.rs         # 策略推荐服务 ✅
│   │   │   └── portfolio.rs        # 投资组合管理
│   │   ├── models/                 # 数据模型
│   │   │   ├── mod.rs
│   │   │   ├── financial.rs        # 金融数据模型
│   │   │   └── trading.rs          # 交易模型
│   │   └── utils/                  # 工具函数
│   │       ├── mod.rs
│   │       └── indicators.rs       # 技术指标计算
│   └── Cargo.toml                  # 依赖管理
```

### 5.2 API端点设计

```rust
// backend/src/api/financial_data.rs
use actix_web::{get, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct FinancialMetricsQuery {
    ticker: String,
    period: String,
    limit: Option<u32>,
}

#[derive(Serialize)]
struct FinancialMetric {
    ticker: String,
    date: String,
    roe: Option<f64>,
    pe: Option<f64>,
    debt_to_equity: Option<f64>,
    // 其他指标...
}

#[get("/financial-metrics")]
async fn get_financial_metrics(
    query: web::Query<FinancialMetricsQuery>,
) -> impl Responder {
    // 从数据源获取财务指标
    // 实现数据获取逻辑...
    
    HttpResponse::Ok().json(metrics)
}
```

### 5.3 与Mastra的集成

创建Next.js API路由与Rust后端和Mastra代理集成： ✅

```typescript
// src/actions/strategy.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getStrategyRecommendation } from '@/mastra/agents/strategyRecommendationAgent';

export async function getInvestmentStrategy(params: {
  ticker: string;
  riskTolerance: 'low' | 'moderate' | 'high';
  investmentHorizon: 'short' | 'medium' | 'long';
  marketCondition?: 'bull' | 'bear' | 'neutral' | 'volatile';
}) {
  try {
    const { ticker, riskTolerance, investmentHorizon, marketCondition } = params;
    
    // 调用Mastra代理获取策略推荐
    const recommendation = await getStrategyRecommendation(
      ticker,
      riskTolerance,
      investmentHorizon,
      marketCondition
    );
    
    return {
      success: true,
      data: recommendation
    };
  } catch (error) {
    console.error('Strategy recommendation error:', error);
    return {
      success: false,
      error: `获取策略推荐失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
```

## 6. 数据源集成

参考主流量化交易平台，LumosFund将集成以下数据源：

### 6.1 市场数据

- **股票价格**: Alpha Vantage, Yahoo Finance API, Polygon.io ✅
- **期权数据**: CBOE, IEX Cloud ✅
- **加密货币**: CoinGecko, CoinMarketCap ✅

### 6.2 基本面数据

- **财务报表**: Financial Modeling Prep, Alpha Vantage ✅
- **盈利公告**: Seeking Alpha API, Refinitiv ✅
- **分析师预期**: Zacks, FactSet ✅

### 6.3 另类数据

- **新闻与情绪**: NewsAPI, GDELT, Twitter API ✅
- **交易所公告**: SEC EDGAR API ✅
- **内部人交易**: OpenInsider API ✅

### 6.4 数据适配器实现

```rust
// backend/src/services/data_provider.rs
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[async_trait]
pub trait DataProvider {
    async fn get_price_data(&self, ticker: &str, start_date: &str, end_date: &str) -> Result<Vec<PriceData>, Error>;
    async fn get_financial_metrics(&self, ticker: &str, period: &str) -> Result<Vec<FinancialMetric>, Error>;
    // 其他方法...
}

pub struct AlphaVantageProvider {
    api_key: String,
    client: reqwest::Client,
}

#[async_trait]
impl DataProvider for AlphaVantageProvider {
    async fn get_price_data(&self, ticker: &str, start_date: &str, end_date: &str) -> Result<Vec<PriceData>, Error> {
        // 实现Alpha Vantage API调用
        let url = format!(
            "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol={}&apikey={}&outputsize=full",
            ticker, self.api_key
        );
        
        // 获取并解析响应...
        
        Ok(price_data)
    }
    
    // 其他方法实现...
}
```

## 7. 回测系统

### 7.1 回测引擎设计

LumosFund的回测系统将使用Rust实现核心计算，结合TypeScript/Next.js提供用户界面： ✅

```