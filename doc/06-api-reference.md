# LumosFund API参考文档

本文档提供了LumosFund平台所有API端点的详细说明和使用示例。

## API概述

LumosFund API采用REST架构设计，所有请求和响应均使用JSON格式。API基于Next.js API Routes实现，提供了以下特点：

- **认证**：API使用Bearer Token进行身份验证
- **速率限制**：每个API密钥每分钟限制60次请求
- **版本控制**：API路径中包含版本号，如`/api/v1/analyze`
- **响应格式**：统一的响应结构，包含`success`字段和`data`或`error`字段

## 认证

所有API请求需要在HTTP头部包含有效的认证令牌：

```
Authorization: Bearer YOUR_API_KEY
```

您可以在用户设置页面生成和管理API密钥。

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据...
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误消息",
  "code": "ERROR_CODE",  // 可选的错误代码
  "details": {}          // 可选的错误详情
}
```

## API端点

### 1. 股票分析 API

#### 1.1 获取股票分析

**端点**: `/api/v1/analyze`

**方法**: `POST`

**描述**: 提供股票的全面分析，包括基本面、技术面、情绪面分析和投资建议。

**请求参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| ticker | string | 是 | 股票代码，如"AAPL" |
| currentPosition | object | 否 | 当前持仓信息 |
| currentPosition.shares | number | 否 | 持有股数 |
| currentPosition.averagePrice | number | 否 | 平均买入价格 |
| currentPosition.entryDate | string | 否 | 买入日期(ISO格式) |
| riskTolerance | string | 否 | 风险承受能力，可选值: "low", "moderate", "high" |
| investmentHorizon | string | 否 | 投资期限，可选值: "short", "medium", "long" |
| timeRange | string | 否 | 分析时间范围，可选值: "1m", "3m", "6m", "1y", "5y" |
| agents | array | 否 | 要使用的代理列表，如 ["value", "growth", "technical"] |
| includePrediction | boolean | 否 | 是否包含价格预测 |
| includeFinancials | boolean | 否 | 是否包含详细财务数据 |

**请求示例**:

```json
{
  "ticker": "AAPL",
  "currentPosition": {
    "shares": 10,
    "averagePrice": 150.0,
    "entryDate": "2023-01-15"
  },
  "riskTolerance": "moderate",
  "investmentHorizon": "medium",
  "timeRange": "1y",
  "agents": ["value", "growth", "technical", "sentiment"],
  "includePrediction": true,
  "includeFinancials": false
}
```

**响应字段**:

| 字段名 | 类型 | 描述 |
|-------|------|------|
| ticker | string | 股票代码 |
| companyInfo | object | 公司基本信息 |
| recommendationBreakdown | object | 各代理的推荐详情 |
| aggregateRecommendation | string | 综合推荐："BUY", "HOLD", "SELL" |
| confidence | number | 置信度(0-1) |
| targetPrice | object | 目标价格区间 |
| analysis | string | 综合分析文本 |
| risks | array | 风险因素列表 |
| technicalIndicators | object | 技术指标数据(可选) |
| sentimentAnalysis | object | 情绪分析数据(可选) |
| prediction | object | 价格预测(可选) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "companyInfo": {
      "name": "Apple Inc.",
      "sector": "Technology",
      "industry": "Consumer Electronics",
      "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
    },
    "recommendationBreakdown": {
      "value": { "score": 8.5, "recommendation": "BUY", "reasoning": "强大的现金流和合理估值..." },
      "growth": { "score": 7.2, "recommendation": "HOLD", "reasoning": "增长放缓但仍有潜力..." },
      "technical": { "score": 6.8, "recommendation": "HOLD", "reasoning": "处于关键阻力位附近..." },
      "sentiment": { "score": 7.5, "recommendation": "HOLD", "reasoning": "市场情绪中性略偏正面..." }
    },
    "aggregateRecommendation": "BUY",
    "confidence": 0.85,
    "targetPrice": {
      "low": 170,
      "base": 195,
      "high": 210
    },
    "analysis": "Apple公司展现出稳健的财务表现和持续的创新能力...",
    "risks": [
      "供应链中断风险",
      "竞争加剧",
      "监管压力增加"
    ],
    "technicalIndicators": {
      "rsi": 62.5,
      "macd": 1.23,
      "movingAverages": {
        "sma50": 178.5,
        "sma200": 165.2,
        "ema20": 180.3
      }
    },
    "sentimentAnalysis": {
      "overallScore": 0.68,
      "newsScore": 0.72,
      "socialMediaScore": 0.65,
      "analystSentiment": 0.78
    },
    "prediction": {
      "1m": { "low": 175, "high": 190 },
      "3m": { "low": 180, "high": 205 },
      "6m": { "low": 185, "high": 220 }
    }
  }
}
```

#### 1.2 批量分析股票

**端点**: `/api/v1/analyze/batch`

**方法**: `POST`

**描述**: 同时分析多只股票，返回简化分析结果。

**请求参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| tickers | array | 是 | 股票代码列表，最多10只 |
| riskTolerance | string | 否 | 风险承受能力 |
| investmentHorizon | string | 否 | 投资期限 |

**请求示例**:

```json
{
  "tickers": ["AAPL", "MSFT", "GOOG", "AMZN", "META"],
  "riskTolerance": "moderate",
  "investmentHorizon": "medium"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "ticker": "AAPL",
        "recommendation": "BUY",
        "confidence": 0.85,
        "targetPrice": { "base": 195 }
      },
      {
        "ticker": "MSFT",
        "recommendation": "BUY",
        "confidence": 0.88,
        "targetPrice": { "base": 415 }
      },
      // 其他股票...
    ]
  }
}
```

### 2. 投资组合 API

#### 2.1 获取投资组合

**端点**: `/api/v1/portfolio`

**方法**: `GET`

**描述**: 获取用户的投资组合信息。

**查询参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| id | string | 否 | 特定投资组合ID，不提供则返回默认组合 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "portfolioId": "portfolio123",
    "name": "我的投资组合",
    "description": "长期增长投资组合",
    "cash": 15000.50,
    "positions": [
      {
        "ticker": "AAPL",
        "shares": 10,
        "averagePrice": 150.0,
        "currentPrice": 175.25,
        "marketValue": 1752.50,
        "profit": 252.50,
        "profitPercentage": 16.83
      },
      // 其他持仓...
    ],
    "totalValue": 16753.00,
    "metrics": {
      "returnRate": 11.69,
      "volatility": 12.45,
      "sharpeRatio": 0.82,
      "maxDrawdown": 8.32
    },
    "allocation": {
      "technology": 45.32,
      "finance": 20.18,
      "healthcare": 15.65,
      "consumer": 10.85,
      "other": 8.00
    }
  }
}
```

#### 2.2 创建投资组合

**端点**: `/api/v1/portfolio`

**方法**: `POST`

**描述**: 创建新的投资组合。

**请求参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| name | string | 是 | 投资组合名称 |
| description | string | 否 | 投资组合描述 |
| initialCash | number | 是 | 初始资金 |
| riskProfile | string | 否 | 风险偏好 |

**请求示例**:

```json
{
  "name": "科技成长组合",
  "description": "专注于高成长科技企业",
  "initialCash": 10000.00,
  "riskProfile": "aggressive"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "portfolioId": "portfolio456",
    "name": "科技成长组合",
    "description": "专注于高成长科技企业",
    "cash": 10000.00,
    "positions": [],
    "totalValue": 10000.00,
    "createdAt": "2023-05-15T14:30:45Z"
  }
}
```

#### 2.3 更新投资组合

**端点**: `/api/v1/portfolio/{id}`

**方法**: `PUT`

**描述**: 更新现有投资组合信息。

**路径参数**:

| 参数名 | 类型 | 描述 |
|-------|------|------|
| id | string | 投资组合ID |

**请求参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| name | string | 否 | 新名称 |
| description | string | 否 | 新描述 |
| riskProfile | string | 否 | 新风险偏好 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "portfolioId": "portfolio456",
    "name": "高科技成长组合",
    "description": "专注于高成长科技企业，偏重AI和云计算",
    "updatedAt": "2023-05-16T10:15:30Z"
  }
}
```

#### 2.4 删除投资组合

**端点**: `/api/v1/portfolio/{id}`

**方法**: `DELETE`

**描述**: 删除指定投资组合。

**路径参数**:

| 参数名 | 类型 | 描述 |
|-------|------|------|
| id | string | 投资组合ID |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "message": "投资组合已成功删除"
  }
}
```

#### 2.5 优化投资组合

**端点**: `/api/v1/portfolio/{id}/optimize`

**方法**: `POST`

**描述**: 根据选定的目标优化投资组合资产配置。

**路径参数**:

| 参数名 | 类型 | 描述 |
|-------|------|------|
| id | string | 投资组合ID |

**请求参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| optimizationTarget | string | 是 | 优化目标: "sharpe", "risk", "return", "balanced" |
| constraints | object | 否 | 优化约束条件 |
| constraints.maxPositionSize | number | 否 | 单一持仓最大比例(0-1) |
| constraints.sectorLimits | object | 否 | 行业配置限制 |

**请求示例**:

```json
{
  "optimizationTarget": "sharpe",
  "constraints": {
    "maxPositionSize": 0.15,
    "sectorLimits": {
      "technology": 0.5,
      "finance": 0.3
    }
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "currentAllocation": [
      { "ticker": "AAPL", "weight": 0.12 },
      { "ticker": "MSFT", "weight": 0.18 },
      // 其他持仓...
    ],
    "optimizedAllocation": [
      { "ticker": "AAPL", "weight": 0.15 },
      { "ticker": "MSFT", "weight": 0.15 },
      // 其他持仓...
    ],
    "suggestedActions": [
      {
        "ticker": "AAPL",
        "action": "buy",
        "shares": 5,
        "estimatedCost": 876.25
      },
      // 其他建议操作...
    ],
    "expectedMetrics": {
      "returnRate": 12.45,
      "volatility": 11.75,
      "sharpeRatio": 0.94
    }
  }
}
```

### 3. 交易 API

#### 3.1 执行交易

**端点**: `/api/v1/trade`

**方法**: `POST`

**描述**: 在投资组合中执行买入或卖出操作。

**请求参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| portfolioId | string | 是 | 投资组合ID |
| action | string | 是 | 交易类型: "buy" 或 "sell" |
| ticker | string | 是 | 股票代码 |
| shares | number | 是 | 交易股数 |
| priceLimit | number | 否 | 限价（不提供则使用市价） |

**请求示例**:

```json
{
  "portfolioId": "portfolio123",
  "action": "buy",
  "ticker": "AAPL",
  "shares": 5,
  "priceLimit": 180.0
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "transactionId": "tx12345",
    "portfolioId": "portfolio123",
    "action": "buy",
    "ticker": "AAPL",
    "shares": 5,
    "price": 175.25,
    "totalCost": 876.25,
    "timestamp": "2023-05-15T14:30:45Z",
    "status": "completed"
  }
}
```

#### 3.2 获取交易历史

**端点**: `/api/v1/trade/history`

**方法**: `GET`

**描述**: 获取指定投资组合的交易历史记录。

**查询参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| portfolioId | string | 是 | 投资组合ID |
| startDate | string | 否 | 开始日期(ISO格式) |
| endDate | string | 否 | 结束日期(ISO格式) |
| limit | number | 否 | 返回记录数量限制 |
| offset | number | 否 | 分页偏移量 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transactionId": "tx12345",
        "action": "buy",
        "ticker": "AAPL",
        "shares": 5,
        "price": 175.25,
        "totalCost": 876.25,
        "timestamp": "2023-05-15T14:30:45Z"
      },
      // 其他交易记录...
    ],
    "pagination": {
      "total": 42,
      "limit": 10,
      "offset": 0,
      "nextOffset": 10
    }
  }
}
```

### 4. 市场数据 API

#### 4.1 获取股票价格

**端点**: `/api/v1/market/price`

**方法**: `GET`

**描述**: 获取一只或多只股票的当前价格和基本信息。

**查询参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| tickers | string | 是 | 股票代码，多个用逗号分隔 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "prices": [
      {
        "ticker": "AAPL",
        "price": 175.25,
        "change": 2.15,
        "changePercent": 1.24,
        "volume": 58243621,
        "marketCap": 2750000000000,
        "timestamp": "2023-05-15T20:00:00Z"
      },
      // 其他股票价格...
    ]
  }
}
```

#### 4.2 获取历史价格数据

**端点**: `/api/v1/market/history`

**方法**: `GET`

**描述**: 获取股票的历史价格数据。

**查询参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| ticker | string | 是 | 股票代码 |
| interval | string | 否 | 时间间隔: "1d", "1h", "15m"等 |
| startDate | string | 否 | 开始日期(ISO格式) |
| endDate | string | 否 | 结束日期(ISO格式) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "interval": "1d",
    "currency": "USD",
    "prices": [
      {
        "timestamp": "2023-05-15T20:00:00Z",
        "open": 173.10,
        "high": 177.35,
        "low": 172.80,
        "close": 175.25,
        "volume": 58243621
      },
      // 其他历史价格...
    ]
  }
}
```

### 5. 回测 API

#### 5.1 创建回测

**端点**: `/api/v1/backtest`

**方法**: `POST`

**描述**: 创建新的回测任务。

**请求参数**:

| 参数名 | 类型 | 必选 | 描述 |
|-------|------|------|------|
| strategy | string | 是 | 策略名称: "value", "growth", "trend", "quant", "custom" |
| startDate | string | 是 | 回测开始日期 |
| endDate | string | 是 | 回测结束日期 |
| initialCapital | number | 是 | 初始资金 |
| universe | array | 是 | 投资范围，股票列表或指数 |
| parameters | object | 否 | 策略参数 |
| constraints | object | 否 | 交易约束 |

**请求示例**:

```json
{
  "strategy": "value",
  "startDate": "2021-01-01",
  "endDate": "2022-12-31",
  "initialCapital": 100000,
  "universe": ["AAPL", "MSFT", "AMZN", "GOOG", "META"],
  "parameters": {
    "rebalancePeriod": "monthly",
    "maxPositions": 3
  },
  "constraints": {
    "maxPositionSize": 0.33,
    "maxTurnover": 0.2
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "backtestId": "bt12345",
    "status": "queued",
    "estimatedCompletion": "2023-05-15T15:00:45Z"
  }
}
```

#### 5.2 获取回测结果

**端点**: `/api/v1/backtest/{id}`

**方法**: `GET`

**描述**: 获取指定回测的结果。

**路径参数**:

| 参数名 | 类型 | 描述 |
|-------|------|------|
| id | string | 回测ID |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "backtestId": "bt12345",
    "status": "completed",
    "strategy": "value",
    "period": {
      "start": "2021-01-01",
      "end": "2022-12-31"
    },
    "metrics": {
      "totalReturn": 15.32,
      "annualizedReturn": 7.36,
      "volatility": 12.75,
      "sharpeRatio": 0.58,
      "maxDrawdown": 18.24,
      "winRate": 62.5
    },
    "returns": {
      "strategy": [0.5, 1.2, -0.8, /* ... */],
      "benchmark": [0.3, 0.7, -1.1, /* ... */]
    },
    "trades": [
      {
        "date": "2021-01-15",
        "ticker": "AAPL",
        "action": "buy",
        "shares": 50,
        "price": 130.25
      },
      // 其他交易...
    ],
    "positions": [
      {
        "date": "2021-12-31",
        "holdings": [
          { "ticker": "AAPL", "shares": 50, "value": 8850.00 },
          { "ticker": "MSFT", "shares": 30, "value": 10080.00 }
        ],
        "cash": 5325.75,
        "totalValue": 24255.75
      },
      // 其他持仓快照...
    ]
  }
}
```

## 错误代码

| 错误代码 | 描述 |
|---------|------|
| `INVALID_PARAMETERS` | 请求参数无效 |
| `RESOURCE_NOT_FOUND` | 请求的资源不存在 |
| `UNAUTHORIZED` | 认证失败或权限不足 |
| `RATE_LIMIT_EXCEEDED` | 超出API调用限制 |
| `INTERNAL_ERROR` | 服务器内部错误 |
| `INSUFFICIENT_FUNDS` | 投资组合资金不足 |
| `INVALID_TRADE` | 交易请求无效 |
| `DATA_SOURCE_ERROR` | 数据源错误 |

## 最佳实践

1. **使用分页**：对于可能返回大量数据的API（如交易历史），请使用分页参数限制返回结果大小。

2. **处理错误**：始终检查响应中的`success`字段，并正确处理错误情况。

3. **缓存数据**：缓存不常变化的数据（如历史价格），减少API调用次数。

4. **批量操作**：尽可能使用批量API（如批量分析）而不是多次单独请求。

5. **速率限制**：了解并遵守API的速率限制，实现请求重试和退避策略。 