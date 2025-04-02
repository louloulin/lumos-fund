# LumosFund - AI驱动的量化交易平台

LumosFund是一个基于Next.js构建的AI驱动量化交易平台，集成了Mastra AI框架用于智能分析和交易决策。

## 功能特点

- 实时市场数据集成与可视化
- AI驱动的股票分析（价值投资、技术分析、情绪分析）
- 交易执行与历史记录
- 投资组合管理
- 回测系统

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Mastra AI 框架
- Chart.js (图表可视化)
- Tauri (桌面应用)

## 本地开发

### 安装依赖

```bash
# 安装项目依赖
npm install
# 或使用pnpm
pnpm install

# 复制环境变量示例
cp .env.example .env.local
# 编辑.env.local填入必要的API密钥
```

### 开发服务器

```bash
# 启动开发服务器
npm run dev
# 或使用pnpm
pnpm dev

# 清理缓存并启动（建议在遇到问题时使用）
pnpm dev:clean
```

应用默认会在 [http://localhost:8286](http://localhost:8286) 运行。

### 构建应用

```bash
# 构建应用
npm run build
# 或使用pnpm
pnpm build

# 运行构建后的应用
npm start
# 或使用pnpm
pnpm start
```

## 常见问题与解决方案

### 解决`EADDRINUSE`端口占用问题

如果遇到`EADDRINUSE`错误，表示端口已被占用：

1. 查找占用端口的进程：
   ```bash 
   # macOS/Linux
   lsof -i :端口号
   # Windows
   netstat -ano | findstr :端口号
   ```

2. 终止占用进程：
   ```bash
   # macOS/Linux
   kill -9 进程ID
   # Windows
   taskkill /F /PID 进程ID
   ```

3. 或者更改项目端口：
   在`package.json`中修改dev脚本，指定不同端口：
   ```json
   "dev": "next dev -p 3001"
   ```

### 解决Node.js模块问题

如果遇到与`fs`、`crypto`、`worker_threads`或`node:*`协议等Node.js模块相关的错误：

1. **使用Server Actions方式**（推荐）:
   - 不要在客户端组件中直接导入Mastra库
   - 改用`app/actions.ts`中定义的服务器端函数
   ```js
   // 🚫 不要这样做
   import { mastra } from '@/mastra';
   
   // ✅ 而应该这样做
   import { getValueInvestingAnalysis } from '@/app/actions';
   ```

2. 使用我们的环境变量和日志工具：
   ```js
   import { getEnv } from '@/lib/env';
   import logger from '@/lib/logger';
   
   // 安全地获取环境变量和日志
   const apiUrl = getEnv('NEXT_PUBLIC_API_URL');
   logger.info('这在客户端和服务器端都安全');
   ```

3. 服务器组件中使用服务器专用logger：
   ```js
   import { createLogger } from '@/lib/logger.server';
   
   const logger = createLogger('组件名称');
   logger.info('这只会在服务器端执行');
   ```

4. **清理缓存**：如果您在更新后仍遇到问题，请尝试清理缓存：
   ```bash
   # 清理Next.js缓存
   pnpm clean
   
   # 或者更彻底地清理
   rm -rf .next node_modules/.cache
   ```

5. 我们已在`next.config.js`中配置webpack处理这些模块，解决了以下问题：
   - 处理`node:events`等Node.js协议导入
   - 通过IgnorePlugin忽略`node:*`协议模块
   - 在客户端构建中回退Node.js模块

## 项目结构

```
lumos-fund/
├── public/            # 静态资源
├── src/
│   ├── app/           # Next.js App Router页面
│   │   ├── actions.ts # Server Actions
│   │   └── api/       # API路由
│   ├── components/    # React组件
│   │   ├── analysis/  # 分析相关组件
│   │   ├── backtest/  # 回测相关组件
│   │   ├── dashboard/ # 仪表盘组件
│   │   ├── layout/    # 布局组件
│   │   └── ui/        # UI组件库
│   ├── lib/           # 工具函数
│   │   ├── env.ts     # 环境变量工具
│   │   ├── logger.ts  # 通用日志工具
│   │   └── logger.server.ts # 服务器专用日志工具
│   ├── mastra/        # Mastra AI集成
│   │   ├── agents/    # AI代理定义
│   │   ├── tools/     # 工具定义
│   │   └── workflows/ # 工作流定义
│   ├── services/      # 服务层
│   └── types/         # TypeScript类型定义
└── next.config.js     # Next.js配置
```

## 许可证

[MIT](LICENSE)
