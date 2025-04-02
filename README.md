# LumosFund - AI驱动的量化交易平台

LumosFund是一个基于AI Agent的量化交易平台，融合了先进的AI技术和现代Web技术，为用户提供智能化的投资决策支持。

## 主要功能

- 多代理AI投资分析系统
- 基本面、技术面和情绪面综合分析
- 实时市场数据监控
- 投资组合管理
- 交易执行与回测
- 自定义AI投资策略

## 技术栈

- **前端**: Next.js + Tailwind CSS + Shadcn UI
- **后端**: Node.js + Rust(部分核心功能)
- **AI框架**: Mastra
- **数据处理**: TBD
- **桌面应用**: Tauri (规划中)

## 快速开始

### 前提条件

- Node.js 18.x 或更高版本
- Bun 1.0.0 或更高版本

### 安装

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/lumos-fund.git
cd lumos-fund
```

2. 安装依赖：

```bash
bun install
```

3. 环境变量配置：

创建一个 `.env.local` 文件在项目根目录，并添加以下配置：

```
NEXT_PUBLIC_MASTRA_API_URL=http://localhost:4111
```

### 启动Mastra AI代理后端

1. 进入Mastra目录：

```bash
cd mastra
```

2. 安装依赖：

```bash
bun install
```

3. 启动Mastra开发服务器：

```bash
bun run dev
```

这将在 http://localhost:4111 启动Mastra服务器，并提供AI代理API。

### 启动前端应用

在另一个终端中，从项目根目录运行：

```bash
bun run dev
```

应用将在 http://localhost:3000 启动。

## 项目结构

```
lumos-fund/
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── app/             # Next.js应用目录
│   │   ├── dashboard/   # 仪表盘页面
│   │   ├── layout.tsx   # 主布局组件
│   │   └── page.tsx     # 主页
│   ├── components/      # 可复用组件
│   ├── lib/             # 工具函数和服务
│   ├── styles/          # 全局样式
├── mastra/              # Mastra AI代理代码
│   ├── src/             # 源代码
│   │   ├── agents/      # AI代理定义
│   │   ├── tools/       # 代理工具
│   │   ├── workflows/   # 工作流定义
│   │   └── index.ts     # 入口文件
└── README.md            # 项目文档
```

## AI代理系统

LumosFund使用以下AI代理：

- **价值投资代理**: 模拟巴菲特风格的价值投资策略
- **技术分析代理**: 分析价格图表和技术指标
- **情绪分析代理**: 分析市场情绪和新闻对股票的影响
- **投资组合优化代理**: TBD
- **风险管理代理**: TBD

## 路线图

- [x] 基础UI框架
- [x] 交易中心页面
- [x] AI代理集成
- [x] 市场数据展示
- [ ] 投资组合管理
- [ ] 回测系统
- [ ] 策略编辑器
- [ ] 桌面应用版本

## 贡献

欢迎贡献！请查看贡献指南了解更多信息。

## 许可证

[MIT](LICENSE)
