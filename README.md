# LumosFund - AI驱动的量化交易平台

LumosFund是一个基于AI代理的量化交易平台，使用Mastra框架实现多个专业AI代理协同分析市场，制定交易策略。平台结合了现代Web技术（Next.js、Shadcn UI）和桌面应用框架（Tauri），为用户提供强大且友好的交易分析体验。

## 功能特点

- 🤖 **多AI代理协作**：价值投资、技术分析、投资组合管理等多个专业AI代理协同工作
- 📊 **多维度分析**：基本面、技术面综合分析
- 📈 **直观可视化**：现代化UI界面，展示分析结果和投资组合表现
- 🔍 **透明决策过程**：AI推理过程完全透明，帮助用户理解交易决策依据
- 💻 **跨平台支持**：支持Windows、macOS和Linux

## 技术栈

- **前端**：Next.js、Shadcn UI、TypeScript、Zustand
- **AI框架**：Mastra（基于TypeScript的AI代理框架）
- **桌面框架**：Tauri（Rust）
- **LLM集成**：OpenAI、Anthropic等

## 开始使用

### 前提条件

- Node.js 18+
- Rust（用于Tauri开发）
- API密钥（OpenAI、金融数据API等）

### 安装

1. 克隆此仓库

```bash
git clone https://github.com/yourusername/lumos-fund.git
cd lumos-fund
```

2. 安装依赖

```bash
npm install
```

3. 创建`.env`文件并设置必要的API密钥（见`.env.example`）

4. 启动开发服务器

```bash
./start-dev.sh
```

或者手动启动：

```bash
npm run dev
```

## 项目结构

```
lumos-fund/
├── src/                         # Next.js源代码
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API路由
│   │   ├── dashboard/           # 仪表盘页面
│   │   ├── analysis/            # 分析页面
│   │   └── ...
│   ├── components/              # UI组件
│   │   ├── ui/                  # 基础UI组件（Shadcn UI）
│   │   ├── analysis/            # 分析相关组件
│   │   ├── layout/              # 布局组件
│   │   └── ...
│   ├── mastra/                  # Mastra AI代理
│   │   ├── agents/              # AI代理实现
│   │   ├── tools/               # 代理工具
│   │   └── workflows/           # 代理工作流
│   └── lib/                     # 工具函数和库
├── src-tauri/                   # Tauri/Rust源代码
│   ├── src/                     # Rust源代码
│   └── Cargo.toml               # Rust依赖配置
└── ...
```

## 贡献

欢迎贡献代码、报告问题或提出建议！请先阅读[贡献指南](CONTRIBUTING.md)。

## 许可证

本项目采用[MIT许可证](LICENSE)。
