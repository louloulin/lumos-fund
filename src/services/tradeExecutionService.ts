'use server';

import { createLogger } from '@/lib/logger.server';
import { MarketDataService } from './marketDataService';

// 创建日志记录器
const logger = createLogger('trade-execution-service');

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',
  FILLED = 'filled',
  PARTIALLY_FILLED = 'partially_filled',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// 订单类型枚举
export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit'
}

// 交易方向枚举
export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
  SHORT = 'short',
  COVER = 'cover'
}

// 订单有效期枚举
export enum TimeInForce {
  DAY = 'day',
  GTC = 'gtc',  // Good Till Cancelled
  IOC = 'ioc',  // Immediate or Cancel
  FOK = 'fok'   // Fill or Kill
}

// 订单接口
export interface Order {
  id: string;
  portfolioId: string;
  ticker: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;  // 限价或止损价
  stopPrice?: number;  // 止损订单的触发价格
  timeInForce: TimeInForce;
  status: OrderStatus;
  filledQuantity: number;
  averagePrice?: number;
  submittedAt: Date;
  updatedAt: Date;
  notes?: string;
  tags?: string[];
}

// 交易接口
export interface Trade {
  id: string;
  orderId: string;
  portfolioId: string;
  ticker: string;
  side: OrderSide;
  quantity: number;
  price: number;
  executedAt: Date;
  commission?: number;
  tax?: number;
}

// 持仓接口
export interface Position {
  portfolioId: string;
  ticker: string;
  quantity: number;
  averageCost: number;
  lastPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  costBasis: number;
  openedAt: Date;
  updatedAt: Date;
}

// 投资组合接口
export interface Portfolio {
  id: string;
  name: string;
  cash: number;
  totalValue: number;
  positions: Position[];
  orders: Order[];
  trades: Trade[];
  lastUpdatedAt: Date;
}

/**
 * 交易执行服务类
 */
export class TradeExecutionService {
  private marketDataService: MarketDataService;
  private mockExecutionMode: boolean;
  private portfolios: Map<string, Portfolio>;
  private orders: Map<string, Order>;
  private trades: Map<string, Trade>;
  
  constructor(mockExecutionMode: boolean = true) {
    this.marketDataService = new MarketDataService();
    this.mockExecutionMode = mockExecutionMode;
    this.portfolios = new Map<string, Portfolio>();
    this.orders = new Map<string, Order>();
    this.trades = new Map<string, Trade>();
    
    // 初始化默认投资组合（实际应用中应从数据库加载）
    this.initializeDefaultPortfolio();
  }
  
  /**
   * 初始化默认投资组合
   */
  private initializeDefaultPortfolio() {
    const portfolioId = 'default';
    const defaultPortfolio: Portfolio = {
      id: portfolioId,
      name: '默认投资组合',
      cash: 100000, // 初始资金10万
      totalValue: 100000,
      positions: [],
      orders: [],
      trades: [],
      lastUpdatedAt: new Date()
    };
    
    this.portfolios.set(portfolioId, defaultPortfolio);
    logger.info(`初始化默认投资组合，ID: ${portfolioId}, 初始资金: ${defaultPortfolio.cash}`);
  }
  
  /**
   * 生成唯一ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * 获取投资组合
   */
  public async getPortfolio(portfolioId: string = 'default'): Promise<Portfolio | null> {
    const portfolio = this.portfolios.get(portfolioId);
    
    if (!portfolio) {
      logger.warn(`获取投资组合失败，未找到ID为 ${portfolioId} 的投资组合`);
      return null;
    }
    
    // 更新持仓的最新市场价格
    await this.updatePortfolioPositions(portfolio);
    
    return portfolio;
  }
  
  /**
   * 更新投资组合持仓的市场价值
   */
  private async updatePortfolioPositions(portfolio: Portfolio): Promise<void> {
    try {
      // 更新持仓的市场价值
      for (const position of portfolio.positions) {
        // 获取最新价格
        const latestPrice = await this.marketDataService.fetchLatestPrice(position.ticker);
        position.lastPrice = latestPrice.price;
        position.marketValue = position.quantity * position.lastPrice;
        position.unrealizedPnL = position.marketValue - position.costBasis;
        position.unrealizedPnLPercent = position.costBasis > 0 ? 
          (position.unrealizedPnL / position.costBasis) * 100 : 0;
        position.updatedAt = new Date();
      }
      
      // 更新投资组合总价值
      const positionsValue = portfolio.positions.reduce(
        (total, position) => total + position.marketValue, 0
      );
      portfolio.totalValue = portfolio.cash + positionsValue;
      portfolio.lastUpdatedAt = new Date();
    } catch (error) {
      logger.error(`更新投资组合持仓失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 创建订单
   */
  public async createOrder(
    portfolioId: string = 'default',
    ticker: string,
    side: OrderSide,
    quantity: number,
    type: OrderType = OrderType.MARKET,
    price?: number,
    stopPrice?: number,
    timeInForce: TimeInForce = TimeInForce.DAY,
    notes?: string,
    tags?: string[]
  ): Promise<Order> {
    try {
      logger.info(`创建订单: ${ticker}, ${side}, 数量: ${quantity}, 价格: ${price || '市价'}`);
      
      // 验证投资组合是否存在
      const portfolio = await this.getPortfolio(portfolioId);
      if (!portfolio) {
        throw new Error(`投资组合 ${portfolioId} 不存在`);
      }
      
      // 验证股票代码是否有效
      try {
        await this.marketDataService.fetchLatestPrice(ticker);
      } catch {
        throw new Error(`无效的股票代码: ${ticker}`);
      }
      
      // 验证数量是否为正数
      if (quantity <= 0) {
        throw new Error('订单数量必须大于0');
      }
      
      // 验证限价或止损价（如适用）
      if ((type === OrderType.LIMIT || type === OrderType.STOP_LIMIT) && (!price || price <= 0)) {
        throw new Error('限价订单必须指定有效的价格');
      }
      
      if ((type === OrderType.STOP || type === OrderType.STOP_LIMIT) && (!stopPrice || stopPrice <= 0)) {
        throw new Error('止损订单必须指定有效的止损价格');
      }
      
      // 检查卖单的可用股票数量
      if (side === OrderSide.SELL) {
        const position = portfolio.positions.find(p => p.ticker === ticker);
        if (!position || position.quantity < quantity) {
          throw new Error(`没有足够的 ${ticker} 股票可供卖出`);
        }
      }
      
      // 创建订单对象
      const now = new Date();
      const orderId = this.generateId('order');
      const order: Order = {
        id: orderId,
        portfolioId,
        ticker,
        side,
        type,
        quantity,
        price,
        stopPrice,
        timeInForce,
        status: OrderStatus.PENDING,
        filledQuantity: 0,
        submittedAt: now,
        updatedAt: now,
        notes,
        tags
      };
      
      // 存储订单
      this.orders.set(orderId, order);
      
      // 添加到投资组合的订单列表
      portfolio.orders.push(order);
      
      // 如果是市价单，立即执行
      if (type === OrderType.MARKET) {
        return await this.executeOrder(orderId);
      }
      
      return order;
    } catch (error) {
      logger.error(`创建订单失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 执行订单
   */
  public async executeOrder(orderId: string): Promise<Order> {
    try {
      // 获取订单
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error(`订单不存在: ${orderId}`);
      }
      
      // 检查订单状态
      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PARTIALLY_FILLED) {
        throw new Error(`无法执行状态为 ${order.status} 的订单`);
      }
      
      // 获取投资组合
      const portfolio = await this.getPortfolio(order.portfolioId);
      if (!portfolio) {
        throw new Error(`投资组合不存在: ${order.portfolioId}`);
      }
      
      logger.info(`执行订单: ${orderId}, ${order.ticker}, ${order.side}, 数量: ${order.quantity}`);
      
      // 获取最新价格
      const latestPrice = await this.marketDataService.fetchLatestPrice(order.ticker);
      
      // 检查限价或止损条件
      const currentPrice = latestPrice.price;
      
      if (order.type === OrderType.LIMIT) {
        // 买入限价单 - 仅当市场价格低于或等于限价时执行
        if (order.side === OrderSide.BUY && currentPrice > (order.price || Infinity)) {
          logger.info(`限价买入未执行: 市场价 ${currentPrice} > 限价 ${order.price}`);
          return order;
        }
        
        // 卖出限价单 - 仅当市场价格高于或等于限价时执行
        if (order.side === OrderSide.SELL && currentPrice < (order.price || 0)) {
          logger.info(`限价卖出未执行: 市场价 ${currentPrice} < 限价 ${order.price}`);
          return order;
        }
      }
      
      if (order.type === OrderType.STOP || order.type === OrderType.STOP_LIMIT) {
        // 买入止损单 - 仅当市场价格突破（高于）止损价时执行
        if (order.side === OrderSide.BUY && currentPrice < (order.stopPrice || Infinity)) {
          logger.info(`止损买入未执行: 市场价 ${currentPrice} < 止损价 ${order.stopPrice}`);
          return order;
        }
        
        // 卖出止损单 - 仅当市场价格突破（低于）止损价时执行
        if (order.side === OrderSide.SELL && currentPrice > (order.stopPrice || 0)) {
          logger.info(`止损卖出未执行: 市场价 ${currentPrice} > 止损价 ${order.stopPrice}`);
          return order;
        }
        
        // 如果是止损限价单，还需检查限价条件
        if (order.type === OrderType.STOP_LIMIT) {
          if (order.side === OrderSide.BUY && currentPrice > (order.price || Infinity)) {
            logger.info(`止损限价买入未执行: 市场价 ${currentPrice} > 限价 ${order.price}`);
            return order;
          }
          
          if (order.side === OrderSide.SELL && currentPrice < (order.price || 0)) {
            logger.info(`止损限价卖出未执行: 市场价 ${currentPrice} < 限价 ${order.price}`);
            return order;
          }
        }
      }
      
      // 执行价格 - 对于市价单使用当前价格，对于限价单使用限价
      const executionPrice = order.type === OrderType.MARKET ? 
        currentPrice : 
        (order.price || currentPrice);
      
      // 计算佣金（模拟为成交金额的0.1%）
      const commission = executionPrice * order.quantity * 0.001;
      
      // 执行交易
      if (order.side === OrderSide.BUY) {
        // 检查资金是否足够
        const requiredFunds = executionPrice * order.quantity + commission;
        if (portfolio.cash < requiredFunds) {
          const affordableQuantity = Math.floor(portfolio.cash / (executionPrice * 1.001));
          
          if (affordableQuantity <= 0) {
            order.status = OrderStatus.REJECTED;
            order.notes = `资金不足，无法执行买入`;
            order.updatedAt = new Date();
            logger.warn(`订单拒绝: ${orderId}, 原因: 资金不足`);
            return order;
          }
          
          // 部分执行订单
          const partialQuantity = affordableQuantity;
          const partialCost = partialQuantity * executionPrice;
          const partialCommission = partialCost * 0.001;
          
          // 更新资金
          portfolio.cash -= (partialCost + partialCommission);
          
          // 创建交易记录
          const tradeId = this.generateId('trade');
          const trade: Trade = {
            id: tradeId,
            orderId,
            portfolioId: order.portfolioId,
            ticker: order.ticker,
            side: order.side,
            quantity: partialQuantity,
            price: executionPrice,
            executedAt: new Date(),
            commission: partialCommission
          };
          
          this.trades.set(tradeId, trade);
          portfolio.trades.push(trade);
          
          // 更新持仓
          this.updatePosition(portfolio, order.ticker, order.side, partialQuantity, executionPrice);
          
          // 更新订单状态
          order.filledQuantity = partialQuantity;
          order.averagePrice = executionPrice;
          order.status = OrderStatus.PARTIALLY_FILLED;
          order.notes = `部分执行，仅买入 ${partialQuantity} 股，受资金限制`;
          order.updatedAt = new Date();
          
          logger.info(`订单部分执行: ${orderId}, 买入 ${partialQuantity} 股 ${order.ticker}, 价格: ${executionPrice}`);
        } else {
          // 完全执行订单
          // 更新资金
          portfolio.cash -= (executionPrice * order.quantity + commission);
          
          // 创建交易记录
          const tradeId = this.generateId('trade');
          const trade: Trade = {
            id: tradeId,
            orderId,
            portfolioId: order.portfolioId,
            ticker: order.ticker,
            side: order.side,
            quantity: order.quantity,
            price: executionPrice,
            executedAt: new Date(),
            commission
          };
          
          this.trades.set(tradeId, trade);
          portfolio.trades.push(trade);
          
          // 更新持仓
          this.updatePosition(portfolio, order.ticker, order.side, order.quantity, executionPrice);
          
          // 更新订单状态
          order.filledQuantity = order.quantity;
          order.averagePrice = executionPrice;
          order.status = OrderStatus.FILLED;
          order.updatedAt = new Date();
          
          logger.info(`订单完全执行: ${orderId}, 买入 ${order.quantity} 股 ${order.ticker}, 价格: ${executionPrice}`);
        }
      } else if (order.side === OrderSide.SELL) {
        // 检查持仓是否足够
        const position = portfolio.positions.find(p => p.ticker === order.ticker);
        
        if (!position || position.quantity < order.quantity) {
          const availableQuantity = position ? position.quantity : 0;
          
          if (availableQuantity <= 0) {
            order.status = OrderStatus.REJECTED;
            order.notes = `没有持有 ${order.ticker} 股票，无法执行卖出`;
            order.updatedAt = new Date();
            logger.warn(`订单拒绝: ${orderId}, 原因: 没有足够的持仓`);
            return order;
          }
          
          // 部分执行订单
          const partialQuantity = availableQuantity;
          const partialValue = partialQuantity * executionPrice;
          const partialCommission = partialValue * 0.001;
          
          // 更新资金
          portfolio.cash += (partialValue - partialCommission);
          
          // 创建交易记录
          const tradeId = this.generateId('trade');
          const trade: Trade = {
            id: tradeId,
            orderId,
            portfolioId: order.portfolioId,
            ticker: order.ticker,
            side: order.side,
            quantity: partialQuantity,
            price: executionPrice,
            executedAt: new Date(),
            commission: partialCommission
          };
          
          this.trades.set(tradeId, trade);
          portfolio.trades.push(trade);
          
          // 更新持仓
          this.updatePosition(portfolio, order.ticker, order.side, partialQuantity, executionPrice);
          
          // 更新订单状态
          order.filledQuantity = partialQuantity;
          order.averagePrice = executionPrice;
          order.status = OrderStatus.PARTIALLY_FILLED;
          order.notes = `部分执行，仅卖出 ${partialQuantity} 股，受持仓限制`;
          order.updatedAt = new Date();
          
          logger.info(`订单部分执行: ${orderId}, 卖出 ${partialQuantity} 股 ${order.ticker}, 价格: ${executionPrice}`);
        } else {
          // 完全执行订单
          const saleValue = order.quantity * executionPrice;
          const commission = saleValue * 0.001;
          
          // 更新资金
          portfolio.cash += (saleValue - commission);
          
          // 创建交易记录
          const tradeId = this.generateId('trade');
          const trade: Trade = {
            id: tradeId,
            orderId,
            portfolioId: order.portfolioId,
            ticker: order.ticker,
            side: order.side,
            quantity: order.quantity,
            price: executionPrice,
            executedAt: new Date(),
            commission
          };
          
          this.trades.set(tradeId, trade);
          portfolio.trades.push(trade);
          
          // 更新持仓
          this.updatePosition(portfolio, order.ticker, order.side, order.quantity, executionPrice);
          
          // 更新订单状态
          order.filledQuantity = order.quantity;
          order.averagePrice = executionPrice;
          order.status = OrderStatus.FILLED;
          order.updatedAt = new Date();
          
          logger.info(`订单完全执行: ${orderId}, 卖出 ${order.quantity} 股 ${order.ticker}, 价格: ${executionPrice}`);
        }
      }
      
      // 处理IOC和FOK时间有效期逻辑
      if (order.timeInForce === TimeInForce.IOC && order.status === OrderStatus.PARTIALLY_FILLED) {
        const remainingQuantity = order.quantity - order.filledQuantity;
        order.notes += `; 取消剩余 ${remainingQuantity} 股的订单 (IOC)`;
        order.updatedAt = new Date();
      }
      
      if (order.timeInForce === TimeInForce.FOK && order.status === OrderStatus.PARTIALLY_FILLED) {
        throw new Error('FOK订单必须全部成交或全部取消，部分成交的逻辑不应执行到此处');
      }
      
      return order;
    } catch (error) {
      logger.error(`执行订单失败: ${error instanceof Error ? error.message : String(error)}`);
      
      // 更新订单状态为拒绝
      const order = this.orders.get(orderId);
      if (order) {
        order.status = OrderStatus.REJECTED;
        order.notes = `执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
        order.updatedAt = new Date();
      }
      
      throw error;
    }
  }
  
  /**
   * 更新持仓信息
   */
  private updatePosition(
    portfolio: Portfolio,
    ticker: string,
    side: OrderSide,
    quantity: number,
    price: number
  ): void {
    // 查找现有持仓
    const existingPositionIndex = portfolio.positions.findIndex(p => p.ticker === ticker);
    
    if (side === OrderSide.BUY) {
      if (existingPositionIndex === -1) {
        // 新建持仓
        const costBasis = quantity * price;
        const position: Position = {
          portfolioId: portfolio.id,
          ticker,
          quantity,
          averageCost: price,
          lastPrice: price,
          marketValue: costBasis,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          realizedPnL: 0,
          costBasis,
          openedAt: new Date(),
          updatedAt: new Date()
        };
        
        portfolio.positions.push(position);
      } else {
        // 更新现有持仓
        const position = portfolio.positions[existingPositionIndex];
        const newTotalQuantity = position.quantity + quantity;
        const newTotalCost = position.costBasis + (quantity * price);
        
        position.quantity = newTotalQuantity;
        position.costBasis = newTotalCost;
        position.averageCost = newTotalCost / newTotalQuantity;
        position.lastPrice = price;
        position.marketValue = newTotalQuantity * price;
        position.unrealizedPnL = position.marketValue - position.costBasis;
        position.unrealizedPnLPercent = (position.unrealizedPnL / position.costBasis) * 100;
        position.updatedAt = new Date();
      }
    } else if (side === OrderSide.SELL) {
      if (existingPositionIndex === -1) {
        logger.error(`尝试卖出不存在的持仓: ${ticker}`);
        throw new Error(`没有持有 ${ticker} 股票`);
      } else {
        // 更新现有持仓
        const position = portfolio.positions[existingPositionIndex];
        
        // 计算已实现盈亏
        const realizedPnL = (price - position.averageCost) * quantity;
        position.realizedPnL += realizedPnL;
        
        // 更新持仓数量
        position.quantity -= quantity;
        
        // 按比例减少成本基础
        const soldRatio = quantity / (position.quantity + quantity);
        const removedCost = position.costBasis * soldRatio;
        position.costBasis -= removedCost;
        
        // 更新市场价值和未实现盈亏
        position.lastPrice = price;
        position.marketValue = position.quantity * price;
        position.unrealizedPnL = position.marketValue - position.costBasis;
        position.unrealizedPnLPercent = position.costBasis > 0 ? 
          (position.unrealizedPnL / position.costBasis) * 100 : 0;
        position.updatedAt = new Date();
        
        // 如果持仓数量为0，则移除该持仓
        if (position.quantity <= 0) {
          portfolio.positions.splice(existingPositionIndex, 1);
        }
      }
    }
  }
  
  /**
   * 取消订单
   */
  public async cancelOrder(orderId: string): Promise<Order> {
    try {
      // 获取订单
      const order = this.orders.get(orderId);
      if (!order) {
        throw new Error(`订单不存在: ${orderId}`);
      }
      
      // 检查订单是否可以取消
      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PARTIALLY_FILLED) {
        throw new Error(`无法取消状态为 ${order.status} 的订单`);
      }
      
      logger.info(`取消订单: ${orderId}, ${order.ticker}, ${order.side}, 数量: ${order.quantity}`);
      
      // 更新订单状态
      order.status = OrderStatus.CANCELLED;
      order.updatedAt = new Date();
      
      return order;
    } catch (error) {
      logger.error(`取消订单失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 获取订单
   */
  public getOrder(orderId: string): Order | null {
    return this.orders.get(orderId) || null;
  }
  
  /**
   * 获取投资组合的所有订单
   */
  public getOrders(portfolioId: string = 'default', status?: OrderStatus): Order[] {
    const allOrders = Array.from(this.orders.values())
      .filter(order => order.portfolioId === portfolioId);
    
    return status ? allOrders.filter(order => order.status === status) : allOrders;
  }
  
  /**
   * 获取投资组合的所有交易
   */
  public getTrades(portfolioId: string = 'default', ticker?: string): Trade[] {
    const allTrades = Array.from(this.trades.values())
      .filter(trade => trade.portfolioId === portfolioId);
    
    return ticker ? allTrades.filter(trade => trade.ticker === ticker) : allTrades;
  }
  
  /**
   * 获取持仓详情
   */
  public async getPosition(portfolioId: string = 'default', ticker: string): Promise<Position | null> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) {
      return null;
    }
    
    const position = portfolio.positions.find(p => p.ticker === ticker);
    return position || null;
  }
  
  /**
   * 获取所有持仓
   */
  public async getPositions(portfolioId: string = 'default'): Promise<Position[]> {
    const portfolio = await this.getPortfolio(portfolioId);
    return portfolio ? portfolio.positions : [];
  }
  
  /**
   * 更新所有未完成订单的状态
   */
  public async processOpenOrders(): Promise<void> {
    try {
      logger.info('开始处理未完成订单');
      
      // 获取所有未完成订单
      const pendingOrders = Array.from(this.orders.values())
        .filter(order => order.status === OrderStatus.PENDING || order.status === OrderStatus.PARTIALLY_FILLED);
      
      // 处理每个未完成订单
      for (const order of pendingOrders) {
        try {
          // 检查是否过期（日内订单在日结时过期）
          if (order.timeInForce === TimeInForce.DAY) {
            const now = new Date();
            const submittedDate = new Date(order.submittedAt);
            
            // 如果订单提交日期不是当天，则标记为过期
            if (submittedDate.getDate() !== now.getDate() ||
                submittedDate.getMonth() !== now.getMonth() ||
                submittedDate.getFullYear() !== now.getFullYear()) {
              order.status = OrderStatus.EXPIRED;
              order.updatedAt = now;
              logger.info(`订单已过期: ${order.id}, ${order.ticker}, ${order.side}`);
              continue;
            }
          }
          
          // 尝试执行订单
          await this.executeOrder(order.id);
        } catch (error) {
          logger.error(`处理订单 ${order.id} 时出错: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      logger.info(`处理未完成订单完毕，共处理 ${pendingOrders.length} 个订单`);
    } catch (error) {
      logger.error(`处理未完成订单出错: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 导出默认实例
export const tradeExecutionService = new TradeExecutionService(true); // 默认使用模拟执行模式 