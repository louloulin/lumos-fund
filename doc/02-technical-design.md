# LumosFund 技术设计

## 1. AI代理系统设计

LumosFund的核心是基于Mastra框架的AI代理系统，这些AI代理代表了不同的投资风格和专业领域。

### 1.1 代理设计原则

LumosFund的AI代理遵循以下设计原则：

- **专业化**：每个代理专注于特定的投资风格或专业领域
- **可组合性**：代理能够相互协作，形成投资决策链
- **可解释性**：代理的决策过程和理由是透明可解释的
- **知识驱动**：代理内置专业的金融知识和领域专长
- **数据支持**：代理的决策基于实时和历史数据分析

### 1.2 代理技术实现

每个AI代理由以下组件构成：

```typescript
// 典型的代理实现结构
const valueInvestingAgent = new Agent({
  id: 'valueInvestingAgent',
  description: '价值投资代理，寻找被低估的优质企业',
  apiKey: process.env.QWEN_API_KEY,
  provider: 'qwen',
  model: qwen('qwen-plus-2024-12-20'),
  systemPrompt: `
    你是一位遵循Warren Buffett投资哲学的价值投资专家。
    你的任务是分析公司的内在价值与市场价格的差距，寻找被低估的优质企业。
    
    在分析过程中，你应当关注：
    1. 公司的经济护城河和竞争优势
    2. 管理层的品质和资本分配能力
    3. 公司的长期盈利能力和稳定性
    4. 公司的财务健康状况和负债水平
    5. 估值的安全边际
    
    提供分析时，应当客观、理性，避免投机心态，专注于公司的长期价值。
  `,
  tools: { /* 工具集成 */ }
});
```

### 1.3 核心代理详解

#### 价值投资代理 (Value Investing Agent)

- **设计理念**：遵循Warren Buffett的价值投资理念
- **专业领域**：定性分析、竞争优势识别、管理层评估、价值估算
- **技术特点**：
  - 实现多阶段DCF估值模型
  - 集成护城河分析框架
  - 管理层质量评估系统
  - 安全边际计算方法

#### 成长投资代理 (Growth Investing Agent)

- **设计理念**：遵循Peter Lynch的成长投资方法
- **专业领域**：成长动力分析、创新能力评估、市场规模评估
- **技术特点**：
  - 增长率分析模型
  - PEG比率评估系统
  - 市场空间和渗透率分析
  - 创新周期评估方法

#### 趋势投资代理 (Trend Investing Agent)

- **设计理念**：基于技术分析和价格趋势识别
- **专业领域**：趋势识别、动量分析、突破确认
- **技术特点**：
  - 移动平均线系统
  - 相对强弱指标分析
  - 成交量变化分析
  - 趋势线和图形认识

#### 量化投资代理 (Quant Investing Agent)

- **设计理念**：基于因子模型和统计套利
- **专业领域**：多因子分析、均值回归、统计套利
- **技术特点**：
  - 多因子模型实现
  - 信号生成和组合构建
  - 回测系统集成
  - 风险调整和优化

### 1.4 代理协作机制

LumosFund的代理之间通过以下机制进行协作：

- **投资委员会模式**：多个专业代理提供分析，由投资委员会代理综合决策
- **串行决策链**：代理按预定顺序依次分析，形成完整的决策链
- **并行分析模式**：多个代理同时分析同一股票，从不同视角提供见解
- **交叉验证机制**：不同代理的结果互相验证，提高决策可靠性

## 2. 工具系统设计

工具是代理执行分析和决策的基础组件，每个工具负责特定的专业功能。

### 2.1 工具设计原则

- **原子性**：每个工具专注于单一功能，便于组合和重用
- **可测试性**：工具功能独立，便于单元测试和集成测试
- **可扩展性**：新工具可以方便地集成到系统中
- **错误处理**：工具实现健壮的错误处理机制
- **性能优化**：针对数据处理和分析的性能优化

### 2.2 工具技术实现

```typescript
// 典型的工具实现结构
const technicalIndicatorsTool: Tool = {
  id: 'technicalIndicatorsTool',
  description: '计算和分析技术指标',
  execute: async (options: any) => {
    try {
      const { ticker, startDate, endDate, indicators } = options;
      
      // 获取历史价格数据
      const priceData = await fetchHistoricalPrices(ticker, startDate, endDate);
      
      // 计算请求的技术指标
      const results = {};
      
      if (indicators.includes('RSI')) {
        results.RSI = calculateRSI(priceData, 14);
      }
      
      if (indicators.includes('MACD')) {
        results.MACD = calculateMACD(priceData, 12, 26, 9);
      }
      
      if (indicators.includes('BOLL')) {
        results.BOLL = calculateBollingerBands(priceData, 20, 2);
      }
      
      // 分析指标信号
      const analysis = analyzeIndicators(results, priceData);
      
      return {
        success: true,
        data: {
          indicators: results,
          analysis
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `计算技术指标失败: ${error.message}`
      };
    }
  }
};
```

### 2.3 核心工具详解

#### 市场数据工具 (Market Data Tool)

- **功能**：获取股票价格、交易量、市值等市场数据
- **数据源**：集成第三方API或模拟数据生成
- **技术特点**：
  - 数据缓存机制
  - 并发请求控制
  - 数据格式标准化
  - 错误重试机制

#### 财务数据工具 (Financial Metrics Tool)

- **功能**：分析公司财务指标和财务健康状况
- **核心指标**：PE、PB、ROE、毛利率、净利率、负债率等
- **技术特点**：
  - 财务比率计算
  - 历史趋势分析
  - 同行业比较
  - 异常检测

#### 技术分析工具 (Technical Indicators Tool)

- **功能**：计算和分析技术指标
- **核心指标**：RSI、MACD、布林带、KDJ、移动平均线等
- **技术特点**：
  - 指标计算算法优化
  - 信号系统实现
  - 图形模式识别
  - 相关性分析

#### 情绪分析工具 (Sentiment Analysis Tool)

- **功能**：分析新闻和社交媒体情绪
- **分析维度**：情绪得分、情绪趋势、热点话题、情绪分布
- **技术特点**：
  - 文本情绪分析算法
  - 情绪时序变化检测
  - 事件影响评估
  - 情绪与价格相关性分析

## 3. 工作流系统设计

工作流将多个代理和工具组织成完整的决策流程，实现从数据收集到最终决策的全流程自动化。

### 3.1 工作流设计原则

- **模块化**：工作流由可替换的模块构成
- **可编排性**：流程步骤可以根据需求灵活调整
- **状态管理**：清晰的状态传递和管理机制
- **异常处理**：完善的错误处理和恢复策略
- **可观测性**：流程执行状态的监控和记录

### 3.2 工作流技术实现

```typescript
// 典型的工作流实现结构
const tradingDecisionWorkflow: Workflow = {
  execute: async (options: any) => {
    const { context } = options;
    const { ticker, portfolio } = context;
    
    try {
      // 获取股票数据
      const stockData = await stockPriceTool.execute({ 
        context: { ticker } 
      });
      
      // 执行价值投资分析
      const valueAnalysis = await valueInvestingAgent.generate(
        `分析 ${ticker} 的价值投资潜力，基于以下数据：${JSON.stringify(stockData)}`
      );
      
      // 执行成长投资分析
      const growthAnalysis = await growthInvestingAgent.generate(
        `分析 ${ticker} 的成长投资潜力，基于以下数据：${JSON.stringify(stockData)}`
      );
      
      // 执行量化因子分析
      const quantAnalysis = await quantInvestingAgent.generate(
        `分析 ${ticker} 的量化因子表现，基于以下数据：${JSON.stringify(stockData)}`
      );
      
      // 执行风险评估
      const riskAssessment = await riskManagementAgent.generate(
        `评估 ${ticker} 的投资风险，基于以下数据和分析：
        价格数据: ${JSON.stringify(stockData)}
        价值分析: ${valueAnalysis.text}
        成长分析: ${growthAnalysis.text}
        量化分析: ${quantAnalysis.text}
        投资组合: ${JSON.stringify(portfolio)}`
      );
      
      // 综合分析并给出决策
      const decisionPrompt = `基于以下分析，为投资组合${JSON.stringify(portfolio)}给出关于${ticker}的投资决策建议:
        价值分析: ${valueAnalysis.text}
        成长分析: ${growthAnalysis.text}
        量化分析: ${quantAnalysis.text}
        风险评估: ${riskAssessment.text}
        
        考虑风险收益比，当前市场环境和投资组合现状，请给出明确的建议：买入、卖出或持有，以及建议的仓位比例和理由。
      `;
      
      const finalDecision = await investmentCommitteeAgent.generate(decisionPrompt);
      
      return {
        stockData,
        valueAnalysis: valueAnalysis.text,
        growthAnalysis: growthAnalysis.text,
        quantAnalysis: quantAnalysis.text,
        riskAssessment: riskAssessment.text,
        decision: finalDecision.text,
      };
    } catch (error) {
      throw new Error(`交易决策工作流失败: ${error.message}`);
    }
  }
};
```

### 3.3 核心工作流详解

#### 交易决策工作流 (Trading Decision Workflow)

- **功能**：生成针对特定股票的交易决策
- **流程步骤**：
  1. 获取股票基础数据
  2. 执行多风格投资分析
  3. 评估投资风险
  4. 考虑投资组合影响
  5. 生成最终交易决策
- **技术特点**：
  - 并行代理执行
  - 决策合成机制
  - 置信度评估
  - 风险调整逻辑

#### 股票分析工作流 (Stock Analysis Workflow)

- **功能**：生成全面的股票分析报告
- **流程步骤**：
  1. 获取市场和价格数据
  2. 执行技术分析
  3. 分析市场情绪
  4. 生成策略建议
- **技术特点**：
  - 报告结构优化
  - 可视化数据生成
  - 多角度分析整合
  - 关键结论提取

#### 投资组合优化工作流 (Portfolio Optimization Workflow)

- **功能**：优化投资组合配置
- **流程步骤**：
  1. 分析当前投资组合
  2. 评估各资产相关性
  3. 计算最优权重分配
  4. 生成调整建议
- **技术特点**：
  - 现代投资组合理论实现
  - 风险偏好调整
  - 夏普比率优化
  - 交易成本考量

## 4. API系统设计

API系统提供了统一的接口，使前端应用能够与后端系统交互。

### 4.1 API设计原则

- **RESTful**：遵循REST架构风格
- **版本控制**：API版本明确管理
- **认证授权**：统一的认证和授权机制
- **文档完善**：详细的API文档和示例
- **错误处理**：标准化的错误响应格式

### 4.2 API技术实现

LumosFund的API基于Next.js API Routes实现，具有以下特点：

- 基于文件系统的路由
- 内置中间件支持
- 无服务器函数部署
- 类型安全的请求和响应处理

```typescript
// 典型的API实现结构
// /api/analyze.ts
import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/mastra';

export async function POST(req: NextRequest) {
  try {
    const { ticker, currentPosition } = await req.json();
    
    // 参数验证
    if (!ticker) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: ticker' },
        { status: 400 }
      );
    }
    
    // 执行分析工作流
    const result = await mastra.getWorkflow('stockAnalysisWorkflow').execute({
      context: {
        ticker,
        currentPosition,
        riskTolerance: 'moderate',
        investmentHorizon: 'medium'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('股票分析API出错:', error);
    return NextResponse.json(
      { success: false, error: `分析失败: ${error.message}` },
      { status: 500 }
    );
  }
}
```

### 4.3 核心API详解

#### 股票分析API (/api/analyze)

- **功能**：提供股票全面分析
- **请求方法**：POST
- **请求参数**：
  - ticker: 股票代码
  - currentPosition: 当前持仓信息（可选）
  - riskTolerance: 风险承受能力（可选）
  - investmentHorizon: 投资期限（可选）
- **响应内容**：
  - 技术分析结果
  - 情绪分析结果
  - 策略建议
  - 价格预测

#### 投资组合API (/api/portfolio)

- **功能**：管理用户投资组合
- **请求方法**：GET/POST/PUT
- **核心功能**：
  - 获取投资组合状态
  - 添加/移除持仓
  - 优化投资组合
  - 计算投资组合表现

#### 交易API (/api/trade)

- **功能**：执行交易决策
- **请求方法**：POST
- **核心功能**：
  - 生成交易建议
  - 模拟交易执行
  - 记录交易历史
  - 评估交易效果 