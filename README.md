# LumosFund - AI驱动的量化交易平台

LumosFund是一个基于AI代理的量化交易平台，集成了多种投资风格和策略，通过Mastra框架实现智能投资决策流程。

## 项目概述

LumosFund旨在结合大型语言模型(LLM)的强大能力与专业的金融分析工具，创造一个全新的智能投资决策平台。系统使用Qwen AI技术，通过多种专业化的AI代理，从不同投资风格和专业领域的视角分析股票和市场。

主要特点：
- **多代理协作**：模拟不同投资风格和专业领域的AI代理协同工作
- **专业化工具**：集成多种专业金融分析工具
- **全面分析**：从基本面、技术面、情绪面等多维度分析股票
- **可定制策略**：根据用户风险偏好和投资目标提供个性化建议
- **透明决策**：提供清晰的分析理由和投资建议逻辑

## 系统架构

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
- 技术分析代理
- 宏观分析代理
- 投资委员会代理
- 策略推荐代理

### 3. 工作流层 (Workflow Layer)
将多个代理组合成端到端的决策流程：
- 股票分析工作流
- 投资组合优化工作流
- 交易决策工作流
- 风险评估工作流

### 4. API层 (API Layer)
提供RESTful API接口，支持前端应用集成。

## 技术栈

- **前端**：TypeScript, Next.js, Tailwind CSS, ShadcnUI
- **后端**：Node.js, Next.js API Routes
- **AI框架**：Mastra, Qwen
- **开发工具**：PNPM, Jest, ESLint, Prettier

## 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-organization/lumos-fund.git
cd lumos-fund

# 安装依赖
pnpm install
```

### 配置

创建`.env.local`文件并配置以下环境变量：
```
QWEN_API_KEY=your_qwen_api_key
ALPHAVANTAGE_API_KEY=your_api_key
FINNHUB_API_KEY=your_api_key
NEWS_API_KEY=your_api_key
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 或使用脚本启动
./run-dev.sh
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test -- path/to/test
```

### 生产构建

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

## 项目文档

详细的项目文档可在`doc/`目录中找到：

- [系统架构](doc/01-architecture.md) - 详细的系统架构说明
- [技术设计](doc/02-technical-design.md) - 深入的技术设计和实现细节
- [使用指南](doc/03-usage-guide.md) - 平台使用说明和功能介绍
- [开发指南](doc/04-development-guide.md) - 面向开发者的扩展和二次开发指南
- [未来规划](doc/05-future-roadmap.md) - 项目未来发展路线图

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
  },
  "riskTolerance": "moderate",
  "investmentHorizon": "medium"
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

更多API详情请参阅[使用指南](doc/03-usage-guide.md)中的API部分。

## 项目结构

```
lumos-fund/
├── doc/               # 项目文档
├── src/
│   ├── app/           # Next.js应用目录
│   │   ├── api/       # API路由
│   │   └── ...        # 页面组件
│   ├── components/    # UI组件
│   ├── lib/           # 通用工具和辅助函数
│   ├── mastra/        # AI代理系统
│   │   ├── agents/    # AI代理
│   │   ├── tools/     # 代理工具
│   │   └── workflows/ # 决策工作流
│   ├── services/      # 服务层
│   ├── providers/     # 上下文提供者
│   └── types/         # 类型定义
├── public/            # 静态资源
├── tests/             # 测试文件
└── ...                # 配置文件
```

## AI 代理系统

LumosFund 使用 Mastra 框架实现了多种投资风格的 AI 代理，具有以下特点：

- **专业化**：每个代理专注于特定的投资风格或专业领域
- **可解释性**：代理的决策过程和理由是透明可解释的
- **数据驱动**：基于实时和历史数据进行分析和决策
- **持续学习**：能够从新数据和反馈中改进

代理之间通过多种协作机制共同工作，包括投资委员会模式、串行决策链、并行分析和交叉验证。

## 贡献指南

我们欢迎社区贡献！如果您想参与项目开发，请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

请确保您的代码符合我们的代码风格指南，并包含适当的测试。

## 未来规划

LumosFund正在积极开发中，未来规划包括：

- 增强AI代理的专业知识和分析能力
- 扩展数据源和金融市场覆盖范围
- 实现全功能回测和模拟系统
- 开发多平台支持（桌面和移动应用）
- 构建自动交易执行系统

详细的未来规划请参阅[未来规划](doc/05-future-roadmap.md)文档。

## 许可

本项目采用MIT许可证 - 详情请参阅[LICENSE](LICENSE)文件。

## 联系方式

如有问题或建议，请通过以下方式联系我们：

- 项目负责人：[您的姓名](mailto:your-email@example.com)
- 项目仓库：[GitHub Issues](https://github.com/your-organization/lumos-fund/issues)
