import { run, message, AgentState, Events, MemoryVectorStoreOptions, MemoryVectorStore } from '@mastra/core';
import { analyzeStock } from './analyzeAgent';
import { stockPriceTool, financialMetricsTool } from '../tools/stockTool';
import { technicalAnalysisTool } from '../tools/technicalTool';
import { newsSentimentTool } from '../tools/sentimentTool';
import { portfolioOptimizationTool, portfolioRiskTool } from '../tools/portfolioTool';

interface TradingAgentState extends AgentState {
  portfolio: {
    cash: number;
    positions: Array<{
      ticker: string;
      shares: number;
      averagePrice: number;
    }>;
    transactions: Array<{
      date: string;
      type: 'buy' | 'sell';
      ticker: string;
      shares: number;
      price: number;
      total: number;
    }>;
  };
  watchlist: string[];
  analysisResults: Record<string, any>;
  marketCondition: {
    trend: string;
    volatility: string;
    sentiment: string;
    lastUpdated: string;
  };
  strategy: {
    type: string;
    parameters: Record<string, any>;
    riskProfile: string;
    timeHorizon: string;
  };
}

// 初始化内存向量存储
const memoryOptions: MemoryVectorStoreOptions = {
  vectorSize: 1536,
};

const memory = new MemoryVectorStore(memoryOptions);

/**
 * 创建AI交易助手代理
 * @param initialCash 初始资金
 * @param riskProfile 风险偏好 ('conservative', 'moderate', 'aggressive')
 * @param timeHorizon 投资时间范围 ('short', 'medium', 'long')
 */
export const createTradingAgent = (initialCash = 100000, riskProfile = 'moderate', timeHorizon = 'medium') => {
  const agent = run<TradingAgentState>({
    name: "LumosFundAI",
    model: "gpt-4-turbo",
    memory,
    systemMessage: `你是LumosFund AI，一个专业的量化交易AI助手。你的任务是帮助用户分析股票市场，提供投资建议，并执行交易策略。

你能够：
1. 分析股票基本面和技术面数据
2. 提供股票投资建议和风险分析
3. 跟踪投资组合表现
4. 优化投资组合配置
5. 实施不同的交易策略

请始终考虑用户的风险偏好、投资时间范围和市场状况，提供专业、客观的分析和建议。你的目标是帮助用户做出明智的投资决策，获取合理的风险调整回报。`,
    initialState: {
      portfolio: {
        cash: initialCash,
        positions: [],
        transactions: []
      },
      watchlist: [],
      analysisResults: {},
      marketCondition: {
        trend: 'neutral',
        volatility: 'moderate',
        sentiment: 'neutral',
        lastUpdated: new Date().toISOString().split('T')[0]
      },
      strategy: {
        type: 'balanced',
        parameters: {},
        riskProfile,
        timeHorizon
      }
    },
    tools: [
      stockPriceTool,
      financialMetricsTool,
      technicalAnalysisTool,
      newsSentimentTool,
      portfolioOptimizationTool,
      portfolioRiskTool
    ],
    events: {
      [Events.start]: async (state) => {
        return message(`欢迎使用LumosFund AI交易助手！
        
我已经为您创建了一个投资组合，初始资金为$${state.portfolio.cash.toLocaleString()}。
您的风险偏好设置为"${state.strategy.riskProfile}"，投资时间范围为"${state.strategy.timeHorizon}"。

请告诉我您想要做什么？例如：
- 分析股票（例如："分析苹果公司股票"）
- 添加股票到监视列表（例如："将AAPL添加到监视列表"）
- 进行交易（例如："买入100股AAPL"）
- 查看投资组合（例如："显示我的投资组合"）
- 优化投资组合（例如："优化我的投资组合"）
        `);
      },
      
      // 分析股票
      analyzeStock: async (state, options) => {
        const { ticker, timeframe } = options;
        const startDate = timeframe?.startDate || getDateDaysAgo(180);
        const endDate = timeframe?.endDate || getTodayDate();
        
        try {
          // 调用分析代理进行深度分析
          const analysisResult = await analyzeStock(ticker, startDate, endDate);
          
          // 存储分析结果
          state.analysisResults[ticker] = {
            data: analysisResult,
            date: getTodayDate()
          };
          
          return message(analysisResult);
        } catch (error) {
          console.error(`分析股票时出错:`, error);
          return message(`很抱歉，分析${ticker}时出现了问题。请稍后再试。`);
        }
      },
      
      // 执行买入操作
      buyStock: async (state, options) => {
        const { ticker, shares, price: specifiedPrice } = options;
        let price = specifiedPrice;
        
        try {
          // 如果没有指定价格，获取当前价格
          if (!price) {
            const today = getTodayDate();
            const startDate = getDateDaysAgo(5);
            
            const priceResult = await stockPriceTool.execute({
              ticker,
              startDate,
              endDate: today
            });
            
            if (!priceResult.success) {
              return message(`无法获取${ticker}的当前价格。请稍后再试或手动指定交易价格。`);
            }
            
            // 使用最新的收盘价
            price = priceResult.data.data[priceResult.data.data.length - 1].close;
          }
          
          // 计算交易总额
          const totalCost = price * shares;
          
          // 检查资金是否足够
          if (totalCost > state.portfolio.cash) {
            return message(`您的资金不足以完成此交易。您当前的现金余额为$${state.portfolio.cash.toLocaleString()}，而购买${shares}股${ticker}需要$${totalCost.toLocaleString()}。`);
          }
          
          // 执行交易
          // 查找是否已持有该股票
          const existingPosition = state.portfolio.positions.find(p => p.ticker === ticker);
          
          // 记录交易
          const transaction = {
            date: getTodayDate(),
            type: 'buy' as const,
            ticker,
            shares,
            price,
            total: totalCost
          };
          
          state.portfolio.transactions.push(transaction);
          
          // 更新现金余额
          state.portfolio.cash -= totalCost;
          
          // 更新持仓
          if (existingPosition) {
            // 计算新的平均成本
            const totalShares = existingPosition.shares + shares;
            const totalCostBasis = (existingPosition.shares * existingPosition.averagePrice) + totalCost;
            existingPosition.averagePrice = totalCostBasis / totalShares;
            existingPosition.shares = totalShares;
          } else {
            // 添加新持仓
            state.portfolio.positions.push({
              ticker,
              shares,
              averagePrice: price
            });
          }
          
          return message(`交易完成：买入${shares}股${ticker}，价格$${price.toFixed(2)}，总金额$${totalCost.toFixed(2)}。
          
您当前的现金余额为$${state.portfolio.cash.toLocaleString()}。`);
        } catch (error) {
          console.error(`执行买入操作时出错:`, error);
          return message(`很抱歉，买入${ticker}时出现了问题。请稍后再试。`);
        }
      },
      
      // 执行卖出操作
      sellStock: async (state, options) => {
        const { ticker, shares, price: specifiedPrice } = options;
        let price = specifiedPrice;
        
        try {
          // 检查是否持有该股票
          const existingPosition = state.portfolio.positions.find(p => p.ticker === ticker);
          
          if (!existingPosition) {
            return message(`您的投资组合中没有持有${ticker}的股票。`);
          }
          
          // 检查持仓数量是否足够
          if (existingPosition.shares < shares) {
            return message(`您持有的${ticker}股票不足。您当前持有${existingPosition.shares}股，但想要卖出${shares}股。`);
          }
          
          // 如果没有指定价格，获取当前价格
          if (!price) {
            const today = getTodayDate();
            const startDate = getDateDaysAgo(5);
            
            const priceResult = await stockPriceTool.execute({
              ticker,
              startDate,
              endDate: today
            });
            
            if (!priceResult.success) {
              return message(`无法获取${ticker}的当前价格。请稍后再试或手动指定交易价格。`);
            }
            
            // 使用最新的收盘价
            price = priceResult.data.data[priceResult.data.data.length - 1].close;
          }
          
          // 计算交易总额
          const totalProceeds = price * shares;
          
          // 记录交易
          const transaction = {
            date: getTodayDate(),
            type: 'sell' as const,
            ticker,
            shares,
            price,
            total: totalProceeds
          };
          
          state.portfolio.transactions.push(transaction);
          
          // 更新现金余额
          state.portfolio.cash += totalProceeds;
          
          // 更新持仓
          existingPosition.shares -= shares;
          
          // 如果股票已全部卖出，从持仓列表中移除
          if (existingPosition.shares === 0) {
            state.portfolio.positions = state.portfolio.positions.filter(p => p.ticker !== ticker);
          }
          
          // 计算收益
          const costBasis = shares * existingPosition.averagePrice;
          const profit = totalProceeds - costBasis;
          const profitPercentage = (profit / costBasis) * 100;
          
          return message(`交易完成：卖出${shares}股${ticker}，价格$${price.toFixed(2)}，总金额$${totalProceeds.toFixed(2)}。
          
盈亏：${profit >= 0 ? '盈利' : '亏损'}$${Math.abs(profit).toFixed(2)} (${profitPercentage >= 0 ? '+' : ''}${profitPercentage.toFixed(2)}%)

您当前的现金余额为$${state.portfolio.cash.toLocaleString()}。`);
        } catch (error) {
          console.error(`执行卖出操作时出错:`, error);
          return message(`很抱歉，卖出${ticker}时出现了问题。请稍后再试。`);
        }
      },
      
      // 查看投资组合
      viewPortfolio: async (state) => {
        try {
          // 获取最新的股票价格和投资组合表现
          const positions = state.portfolio.positions;
          let totalValue = state.portfolio.cash;
          let totalCost = 0;
          
          // 更新每个持仓的最新价格和价值
          const updatedPositions = await Promise.all(positions.map(async position => {
            const today = getTodayDate();
            const startDate = getDateDaysAgo(5);
            
            const priceResult = await stockPriceTool.execute({
              ticker: position.ticker,
              startDate,
              endDate: today
            });
            
            let currentPrice = position.averagePrice; // 默认使用平均价格
            
            if (priceResult.success) {
              // 使用最新的收盘价
              currentPrice = priceResult.data.data[priceResult.data.data.length - 1].close;
            }
            
            const marketValue = currentPrice * position.shares;
            const costBasis = position.averagePrice * position.shares;
            const profit = marketValue - costBasis;
            const profitPercentage = (profit / costBasis) * 100;
            
            totalValue += marketValue;
            totalCost += costBasis;
            
            return {
              ...position,
              currentPrice,
              marketValue,
              profit,
              profitPercentage
            };
          }));
          
          // 计算整体投资组合表现
          const totalProfit = totalValue - totalCost - state.portfolio.cash;
          const totalProfitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
          
          // 构建投资组合摘要
          let portfolioSummary = `# 投资组合摘要

## 总览
- 总资产价值: $${totalValue.toLocaleString()}
- 现金余额: $${state.portfolio.cash.toLocaleString()} (${((state.portfolio.cash / totalValue) * 100).toFixed(1)}%)
- 股票价值: $${(totalValue - state.portfolio.cash).toLocaleString()} (${(((totalValue - state.portfolio.cash) / totalValue) * 100).toFixed(1)}%)
- 总盈亏: ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toLocaleString()} (${totalProfitPercentage >= 0 ? '+' : ''}${totalProfitPercentage.toFixed(2)}%)

## 持仓明细`;

          if (updatedPositions.length === 0) {
            portfolioSummary += `\n\n您当前没有任何股票持仓。`;
          } else {
            // 添加持仓表格
            portfolioSummary += `\n\n| 股票 | 持仓数量 | 平均成本 | 当前价格 | 市值 | 盈亏 | 盈亏% |
|------|--------|--------|--------|-----|-----|-----|`;
            
            updatedPositions.forEach(position => {
              portfolioSummary += `\n| ${position.ticker} | ${position.shares} | $${position.averagePrice.toFixed(2)} | $${position.currentPrice.toFixed(2)} | $${position.marketValue.toLocaleString()} | ${position.profit >= 0 ? '+' : ''}$${position.profit.toFixed(2)} | ${position.profitPercentage >= 0 ? '+' : ''}${position.profitPercentage.toFixed(2)}% |`;
            });
          }
          
          // 添加分配分析
          if (updatedPositions.length > 0) {
            portfolioSummary += `\n\n## 资产分配`;
            
            // 按市值对持仓进行排序
            const sortedPositions = [...updatedPositions].sort((a, b) => b.marketValue - a.marketValue);
            
            sortedPositions.forEach(position => {
              const allocationPercentage = (position.marketValue / totalValue) * 100;
              portfolioSummary += `\n- ${position.ticker}: $${position.marketValue.toLocaleString()} (${allocationPercentage.toFixed(1)}%)`;
            });
          }
          
          // 添加最近交易记录
          const recentTransactions = state.portfolio.transactions.slice(-5).reverse();
          
          if (recentTransactions.length > 0) {
            portfolioSummary += `\n\n## 最近交易`;
            
            recentTransactions.forEach(transaction => {
              portfolioSummary += `\n- ${transaction.date}: ${transaction.type === 'buy' ? '买入' : '卖出'} ${transaction.shares}股 ${transaction.ticker} @ $${transaction.price.toFixed(2)}, 总金额: $${transaction.total.toFixed(2)}`;
            });
          }
          
          return message(portfolioSummary);
        } catch (error) {
          console.error(`查看投资组合时出错:`, error);
          return message(`很抱歉，获取投资组合信息时出现了问题。请稍后再试。`);
        }
      },
      
      // 优化投资组合
      optimizePortfolio: async (state, options) => {
        const { target = 'balanced' } = options;
        
        try {
          // 获取当前持仓的股票代码
          const tickers = state.portfolio.positions.map(p => p.ticker);
          
          // 如果没有持仓，无法优化
          if (tickers.length === 0) {
            return message(`您的投资组合中没有任何股票持仓，无法进行优化。请先添加一些股票到您的投资组合。`);
          }
          
          // 设置时间范围
          const endDate = getTodayDate();
          const startDate = getDateDaysAgo(365); // 使用过去一年的数据
          
          // 将优化目标映射到API接受的格式
          let optimizationTarget = 'balanced';
          switch (target.toLowerCase()) {
            case 'sharpe':
            case 'max sharpe':
            case 'maximum sharpe':
              optimizationTarget = 'sharpe';
              break;
            case 'risk':
            case 'min risk':
            case 'minimum risk':
              optimizationTarget = 'minRisk';
              break;
            case 'return':
            case 'max return':
            case 'maximum return':
              optimizationTarget = 'maxReturn';
              break;
            default:
              optimizationTarget = 'balanced';
          }
          
          // 调用投资组合优化工具
          const optimizationResult = await portfolioOptimizationTool.execute({
            tickers,
            startDate,
            endDate,
            optimizationTarget
          });
          
          if (!optimizationResult.success) {
            return message(`优化投资组合时出现了问题：${optimizationResult.error}。请稍后再试。`);
          }
          
          // 获取优化结果
          const { optimalWeights, performance, portfolioAnalysis } = optimizationResult.data;
          
          // 构建优化建议
          let optimizationSummary = `# 投资组合优化分析 (目标: ${target})

## 绩效指标
- 预期年化收益率: ${(performance.annualizedReturn * 100).toFixed(2)}%
- 年化风险(波动率): ${(performance.annualizedRisk * 100).toFixed(2)}%
- 夏普比率: ${performance.sharpeRatio.toFixed(2)}
- 最大回撤: ${(performance.maxDrawdown * 100).toFixed(2)}%

## 最优权重分配
`;

          // 添加最优权重
          const sortedWeights = portfolioAnalysis.weightDistribution.sort((a, b) => b.weight - a.weight);
          sortedWeights.forEach(item => {
            optimizationSummary += `- ${item.ticker}: ${(item.weight * 100).toFixed(1)}%\n`;
          });
          
          // 添加调整建议
          optimizationSummary += `\n## 当前与建议持仓对比`;
          
          const totalPortfolioValue = state.portfolio.positions.reduce((sum, position) => {
            return sum + (position.shares * position.averagePrice);
          }, 0);
          
          sortedWeights.forEach(item => {
            const currentPosition = state.portfolio.positions.find(p => p.ticker === item.ticker);
            const currentShares = currentPosition ? currentPosition.shares : 0;
            const currentPrice = currentPosition ? currentPosition.averagePrice : 0;
            const currentValue = currentShares * currentPrice;
            const currentWeight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;
            const weightDifference = (item.weight * 100) - currentWeight;
            
            optimizationSummary += `\n- ${item.ticker}: 当前 ${currentWeight.toFixed(1)}%, 建议 ${(item.weight * 100).toFixed(1)}% (${weightDifference >= 0 ? '+' : ''}${weightDifference.toFixed(1)}%)`;
          });
          
          // 添加具体调整建议
          optimizationSummary += `\n\n## 建议操作`;
          
          let hasAdjustments = false;
          
          sortedWeights.forEach(item => {
            const currentPosition = state.portfolio.positions.find(p => p.ticker === item.ticker);
            const currentShares = currentPosition ? currentPosition.shares : 0;
            const currentPrice = currentPosition ? currentPosition.averagePrice : 0;
            const currentValue = currentShares * currentPrice;
            const currentWeight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;
            const targetValue = totalPortfolioValue * (item.weight);
            const valueDifference = targetValue - currentValue;
            
            // 只有当权重差异大于1%时才提出调整建议
            if (Math.abs(valueDifference) / totalPortfolioValue > 0.01) {
              hasAdjustments = true;
              const estimatedSharesChange = Math.floor(Math.abs(valueDifference) / currentPrice);
              
              if (valueDifference > 0) {
                optimizationSummary += `\n- 买入约${estimatedSharesChange}股${item.ticker}，估计金额$${Math.abs(valueDifference).toFixed(2)}`;
              } else {
                optimizationSummary += `\n- 卖出约${estimatedSharesChange}股${item.ticker}，估计金额$${Math.abs(valueDifference).toFixed(2)}`;
              }
            }
          });
          
          if (!hasAdjustments) {
            optimizationSummary += `\n您的投资组合已经接近最优配置，无需大幅调整。`;
          }
          
          // 添加优化分析总结
          optimizationSummary += `\n\n## 分析总结
${portfolioAnalysis.performanceSummary}

`;

          // 添加改进建议
          if (portfolioAnalysis.suggestions.length > 0) {
            optimizationSummary += `## 改进建议\n`;
            portfolioAnalysis.suggestions.forEach(suggestion => {
              optimizationSummary += `- ${suggestion}\n`;
            });
          }
          
          return message(optimizationSummary);
        } catch (error) {
          console.error(`优化投资组合时出错:`, error);
          return message(`很抱歉，优化投资组合时出现了问题。请稍后再试。`);
        }
      },
      
      // 添加股票到监视列表
      addToWatchlist: async (state, options) => {
        const { ticker } = options;
        
        // 检查股票是否已经在监视列表中
        if (state.watchlist.includes(ticker)) {
          return message(`${ticker}已经在您的监视列表中。`);
        }
        
        // 验证股票代码
        try {
          const today = getTodayDate();
          const startDate = getDateDaysAgo(5);
          
          const priceResult = await stockPriceTool.execute({
            ticker,
            startDate,
            endDate: today
          });
          
          if (!priceResult.success) {
            return message(`无法验证${ticker}的股票信息。请检查股票代码是否正确。`);
          }
          
          // 添加到监视列表
          state.watchlist.push(ticker);
          
          // 返回确认消息，包括当前价格信息
          const latestPrice = priceResult.data.data[priceResult.data.data.length - 1].close;
          return message(`已将${ticker}添加到您的监视列表。当前价格: $${latestPrice.toFixed(2)}`);
        } catch (error) {
          console.error(`添加股票到监视列表时出错:`, error);
          return message(`添加${ticker}到监视列表时出现了问题。请稍后再试。`);
        }
      },
      
      // 查看监视列表
      viewWatchlist: async (state) => {
        try {
          const { watchlist } = state;
          
          if (watchlist.length === 0) {
            return message(`您的监视列表是空的。使用"添加到监视列表"命令来添加股票。`);
          }
          
          // 获取每支股票的最新价格和表现
          const watchlistData = await Promise.all(watchlist.map(async ticker => {
            const today = getTodayDate();
            const startDate = getDateDaysAgo(30); // 获取过去30天的数据
            
            const priceResult = await stockPriceTool.execute({
              ticker,
              startDate,
              endDate: today
            });
            
            if (!priceResult.success) {
              return {
                ticker,
                price: "无法获取",
                change: "N/A",
                changePercent: "N/A"
              };
            }
            
            const prices = priceResult.data.data;
            const latestPrice = prices[prices.length - 1].close;
            const previousPrice = prices[prices.length > 1 ? prices.length - 2 : 0].close;
            const change = latestPrice - previousPrice;
            const changePercent = (change / previousPrice) * 100;
            
            return {
              ticker,
              price: latestPrice,
              change,
              changePercent
            };
          }));
          
          // 构建监视列表摘要
          let watchlistSummary = `# 监视列表

| 股票 | 当前价格 | 变动 | 变动百分比 |
|------|--------|------|---------|`;
          
          watchlistData.forEach(item => {
            const changeStr = item.change === "N/A" ? "N/A" : `${item.change >= 0 ? '+' : ''}$${typeof item.change === 'number' ? item.change.toFixed(2) : item.change}`;
            const changePercentStr = item.changePercent === "N/A" ? "N/A" : `${item.changePercent >= 0 ? '+' : ''}${typeof item.changePercent === 'number' ? item.changePercent.toFixed(2) : item.changePercent}%`;
            
            watchlistSummary += `\n| ${item.ticker} | $${typeof item.price === 'number' ? item.price.toFixed(2) : item.price} | ${changeStr} | ${changePercentStr} |`;
          });
          
          return message(watchlistSummary);
        } catch (error) {
          console.error(`查看监视列表时出错:`, error);
          return message(`很抱歉，获取监视列表信息时出现了问题。请稍后再试。`);
        }
      },
      
      // 设置交易策略
      setStrategy: async (state, options) => {
        const { type = 'balanced', riskProfile, timeHorizon, parameters = {} } = options;
        
        // 更新策略
        state.strategy.type = type;
        
        if (riskProfile) {
          state.strategy.riskProfile = riskProfile;
        }
        
        if (timeHorizon) {
          state.strategy.timeHorizon = timeHorizon;
        }
        
        // 合并参数
        state.strategy.parameters = {
          ...state.strategy.parameters,
          ...parameters
        };
        
        return message(`您的交易策略已更新为"${type}"。
风险偏好: ${state.strategy.riskProfile}
时间范围: ${state.strategy.timeHorizon}
${Object.keys(state.strategy.parameters).length > 0 ? '策略参数:\n' + JSON.stringify(state.strategy.parameters, null, 2) : ''}`);
      }
    },
  });
  
  return agent;
};

/**
 * 获取今天的日期（YYYY-MM-DD格式）
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 获取n天前的日期（YYYY-MM-DD格式）
 */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// 导出用于客户端的函数
export async function startTradingAgent(initialCash = 100000, riskProfile = 'moderate', timeHorizon = 'medium') {
  const agent = createTradingAgent(initialCash, riskProfile, timeHorizon);
  
  try {
    // 启动代理
    const result = await agent.run();
    return result;
  } catch (error) {
    console.error('启动交易代理时出错:', error);
    throw new Error(`启动交易代理失败: ${error.message}`);
  }
} 