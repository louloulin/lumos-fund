# LumosFund - AI驱动的量化交易平台

LumosFund是一个基于AI代理的量化交易平台，集成了多种投资风格和策略，通过Mastra框架实现智能投资决策流程。

## 项目架构

LumosFund采用四层架构设计：

### 1. 工具层 (Tool Layer)
提供专业化的金融分析工具，包括：
- 市场数据工具
- 财务数据工具
- 技术分析工具
- 因子模型工具
- 估值工具
- 新闻情绪分析工具
- 统计套利工具

### 2. 代理层 (Agent Layer)
实现了多种投资风格的AI代理：
- 价值投资代理 (Warren Buffett风格)
- 成长投资代理 (Peter Lynch风格)
- 趋势投资代理 (基于技术分析)
- 量化投资代理 (基于统计套利和因子模型)
- 风险管理代理
- 市场情绪代理

### 3. 工作流层 (Workflow Layer)
将多个代理组合成端到端的决策流程：
- 股票分析工作流
- 投资组合优化工作流
- 市场扫描工作流
- 风险评估工作流

### 4. API层 (API Layer)
提供RESTful API接口，支持前端应用集成。

## 技术栈

- TypeScript
- Next.js
- Mastra AI框架
- Zod (类型验证)
- Jest (测试)

## 快速开始

### 安装

```bash
# 安装依赖
pnpm install
```

### 配置

创建`.env.local`文件并配置以下环境变量：
```
ALPHAVANTAGE_API_KEY=your_api_key
FINNHUB_API_KEY=your_api_key
NEWS_API_KEY=your_api_key
```

### 开发模式

```bash
pnpm dev
```

### 测试

```bash
pnpm test
```

### 生产构建

```bash
pnpm build
pnpm start
```

## API使用

### 股票分析API

**端点**: `/api/analyze`

**方法**: `POST`

**请求体**:
```json
{
  "ticker": "AAPL",
  "currentPosition": {
    "shares": 10,
    "averagePrice": 150.0,
    "entryDate": "2023-01-15"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "recommendationBreakdown": {
      "value": { "score": 8.5, "recommendation": "BUY" },
      "growth": { "score": 7.2, "recommendation": "HOLD" },
      "technical": { "score": 6.8, "recommendation": "HOLD" },
      "quant": { "score": 8.2, "recommendation": "BUY" },
      "sentiment": { "score": 7.5, "recommendation": "HOLD" }
    },
    "aggregateRecommendation": "BUY",
    "confidence": 0.85,
    "targetPrice": { "low": 170, "base": 195, "high": 210 },
    "analysis": "综合分析...",
    "risks": ["竞争加剧", "供应链中断"]
  }
}
```

## 项目结构

```
lumos-fund/
├── src/
│   ├── app/
│   │   ├── api/          # API路由
│   │   └── ...           # Next.js页面组件
│   ├── mastra/
│   │   ├── agents/       # AI代理
│   │   ├── tools/        # 分析工具
│   │   ├── workflows/    # 决策工作流
│   │   └── types/        # 类型定义
│   └── components/       # UI组件
├── tests/                # 测试文件
├── public/               # 静态资源
└── ...
```

## 贡献

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可

MIT

## AI 代理系统

LumosFund 使用 Mastra 框架实现了多种投资风格的 AI 代理，包括：

- **价值投资代理**: 采用价值投资理念，关注公司的内在价值与市场价格的差距
- **成长投资代理**: 专注寻找高增长潜力的公司
- **趋势投资代理**: 基于技术分析识别价格趋势和动量
- **量化投资代理**: 使用多因子模型和统计方法进行投资决策

这些 AI 代理可以在回测系统中测试其历史表现，也可以用于实时分析市场并提供投资建议。

### Mastra 框架集成

LumosFund 深度集成了 Mastra AI 代理框架，实现：

1. 使用 AI Agent 进行多种投资风格的策略实现
2. 通过特定工具如 `technicalIndicatorsTool` 和 `marketDataTools` 让 AI 代理能够获取和分析市场数据
3. 设计回测系统能够评估 AI 代理在历史市场中的表现
4. 提供交互界面让用户可以直接与 AI 代理交流，获取投资建议
