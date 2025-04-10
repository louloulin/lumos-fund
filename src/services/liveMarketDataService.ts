'use server';

import { EventEmitter } from 'events';
import { createLogger } from '@/lib/logger.server';
import { 
  RealTimeQuote, 
  HistoricalBar, 
  MarketOverview, 
  MarketNews 
} from './realTimeMarketDataService';

const logger = createLogger('liveMarketDataService');

/**
 * 实时市场数据服务
 * 负责与外部API对接，获取真实市场数据
 */
export class LiveMarketDataService extends EventEmitter {
  private apiKey: string;
  private baseUrl: string;
  private isInitialized: boolean = false;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 30 * 1000; // 实时数据缓存30秒
  private wsConnections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();
  
  constructor(apiKey?: string, baseUrl?: string) {
    super();
    this.apiKey = apiKey || process.env.MARKET_DATA_API_KEY || '';
    this.baseUrl = baseUrl || process.env.MARKET_DATA_API_URL || 'https://finnhub.io/api/v1';
  }
  
  /**
   * 初始化服务
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('初始化实时市场数据服务');
      
      if (!this.apiKey) {
        logger.error('缺少API密钥');
        return false;
      }
      
      // 验证API密钥
      const isValid = await this.validateApiKey();
      
      if (isValid) {
        this.isInitialized = true;
        logger.info('实时市场数据服务初始化成功');
        return true;
      } else {
        logger.error('API密钥验证失败');
        return false;
      }
    } catch (error) {
      logger.error('初始化实时市场数据服务失败', error);
      return false;
    }
  }
  
  /**
   * 验证API密钥
   */
  private async validateApiKey(): Promise<boolean> {
    try {
      // 使用一个简单的API调用来验证密钥是否有效
      const response = await fetch(`${this.baseUrl}/stock/symbol?exchange=US&token=${this.apiKey}`);
      return response.ok;
    } catch (error) {
      logger.error('API密钥验证失败', error);
      return false;
    }
  }
  
  /**
   * 获取实时股票报价
   */
  async getQuote(symbol: string): Promise<RealTimeQuote | null> {
    try {
      this.ensureInitialized();
      
      // 检查缓存
      const cachedData = this.getFromCache(`quote:${symbol}`);
      if (cachedData) {
        return cachedData as RealTimeQuote;
      }
      
      // 调用API获取实时报价
      const response = await fetch(`${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 转换API响应为标准格式
      const quote: RealTimeQuote = {
        symbol,
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        volume: data.v,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        timestamp: new Date().toISOString(),
        exchange: 'NA' // Finnhub API返回中没有这个信息
      };
      
      // 存入缓存
      this.addToCache(`quote:${symbol}`, quote);
      
      return quote;
    } catch (error) {
      logger.error(`获取${symbol}实时报价失败`, error);
      return null;
    }
  }
  
  /**
   * 获取多个股票的实时报价
   */
  async getBatchQuotes(symbols: string[]): Promise<Record<string, RealTimeQuote | null>> {
    try {
      this.ensureInitialized();
      
      const result: Record<string, RealTimeQuote | null> = {};
      
      // 并行请求多个股票数据
      const quotesPromises = symbols.map(symbol => this.getQuote(symbol));
      const quotes = await Promise.all(quotesPromises);
      
      // 构建结果对象
      symbols.forEach((symbol, index) => {
        result[symbol] = quotes[index];
      });
      
      return result;
    } catch (error) {
      logger.error('批量获取股票实时报价失败', error);
      return {};
    }
  }
  
  /**
   * 获取历史K线数据
   */
  async getHistoricalData(
    symbol: string,
    interval: '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1w' | '1mo',
    startTime?: string,
    endTime?: string
  ): Promise<HistoricalBar[]> {
    try {
      this.ensureInitialized();
      
      // 缓存键
      const cacheKey = `history:${symbol}:${interval}:${startTime || 'default'}:${endTime || 'default'}`;
      
      // 检查缓存
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData as HistoricalBar[];
      }
      
      // 转换时间间隔为API格式
      const resolution = this.convertIntervalToResolution(interval);
      
      // 转换时间为UNIX时间戳
      const from = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : 
                  Math.floor(Date.now() / 1000 - 30 * 24 * 60 * 60);
      const to = endTime ? Math.floor(new Date(endTime).getTime() / 1000) : 
                Math.floor(Date.now() / 1000);
      
      // 调用API获取历史数据
      const response = await fetch(
        `${this.baseUrl}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // API响应格式验证
      if (data.s === 'no_data') {
        logger.warn(`没有找到${symbol}的历史数据`);
        return [];
      }
      
      // 转换API响应为标准格式
      const bars: HistoricalBar[] = [];
      
      for (let i = 0; i < data.t.length; i++) {
        bars.push({
          timestamp: new Date(data.t[i] * 1000).toISOString(),
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v[i]
        });
      }
      
      // 存入缓存
      this.addToCache(cacheKey, bars);
      
      return bars;
    } catch (error) {
      logger.error(`获取${symbol}历史数据失败`, error);
      return [];
    }
  }
  
  /**
   * 转换内部时间间隔格式为API使用的分辨率格式
   */
  private convertIntervalToResolution(interval: string): string {
    switch (interval) {
      case '1m': return '1';
      case '5m': return '5';
      case '15m': return '15';
      case '30m': return '30';
      case '1h': return '60';
      case '1d': return 'D';
      case '1w': return 'W';
      case '1mo': return 'M';
      default: return 'D';
    }
  }
  
  /**
   * 获取市场概览数据
   */
  async getMarketOverview(): Promise<MarketOverview> {
    try {
      this.ensureInitialized();
      
      // 检查缓存
      const cachedData = this.getFromCache('market:overview');
      if (cachedData) {
        return cachedData as MarketOverview;
      }
      
      // 主要指数符号
      const indices = ['SPY', 'DIA', 'QQQ', 'IWM'];
      
      // 获取指数数据
      const indexQuotes = await this.getBatchQuotes(indices);
      
      // 获取涨幅最大的股票（这里使用S&P 500成分股）
      const gainersResponse = await fetch(`${this.baseUrl}/stock/us?exchange=us&token=${this.apiKey}`);
      const stocksData = await gainersResponse.json();
      
      // 为这些股票获取报价
      const stockSymbols = stocksData.slice(0, 50).map((stock: any) => stock.symbol);
      const stockQuotes = await this.getBatchQuotes(stockSymbols);
      
      // 按涨跌幅排序
      const sortedStocks = Object.values(stockQuotes)
        .filter(quote => quote !== null) as RealTimeQuote[];
      
      const gainers = sortedStocks
        .filter(quote => quote.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5);
      
      const losers = sortedStocks
        .filter(quote => quote.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5);
      
      const mostActive = sortedStocks
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);
      
      // 构建市场概览对象
      const overview: MarketOverview = {
        indices: Object.values(indexQuotes)
          .filter(quote => quote !== null)
          .map(quote => {
            const q = quote as RealTimeQuote;
            return {
              name: this.getIndexName(q.symbol),
              symbol: q.symbol,
              value: q.price,
              change: q.change,
              changePercent: q.changePercent
            };
          }),
        topGainers: gainers.map(quote => ({
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent
        })),
        topLosers: losers.map(quote => ({
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent
        })),
        mostActive: mostActive.map(quote => ({
          symbol: quote.symbol,
          price: quote.price,
          volume: quote.volume,
          changePercent: quote.changePercent
        }))
      };
      
      // 存入缓存
      this.addToCache('market:overview', overview);
      
      return overview;
    } catch (error) {
      logger.error('获取市场概览数据失败', error);
      return {
        indices: [],
        topGainers: [],
        topLosers: [],
        mostActive: []
      };
    }
  }
  
  /**
   * 获取指数名称
   */
  private getIndexName(symbol: string): string {
    switch (symbol) {
      case 'SPY': return 'S&P 500';
      case 'DIA': return 'Dow Jones';
      case 'QQQ': return 'Nasdaq';
      case 'IWM': return 'Russell 2000';
      default: return symbol;
    }
  }
  
  /**
   * 获取市场新闻
   */
  async getMarketNews(symbols?: string[], limit: number = 10): Promise<MarketNews[]> {
    try {
      this.ensureInitialized();
      
      // 缓存键
      const cacheKey = `news:${symbols?.join(',') || 'general'}:${limit}`;
      
      // 检查缓存
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData as MarketNews[];
      }
      
      let newsEndpoint = `${this.baseUrl}/news?category=general&token=${this.apiKey}`;
      
      // 如果指定了股票符号，获取相关新闻
      if (symbols && symbols.length > 0) {
        newsEndpoint = `${this.baseUrl}/company-news?symbol=${symbols[0]}&from=${this.getDateString(-7)}&to=${this.getDateString(0)}&token=${this.apiKey}`;
      }
      
      const response = await fetch(newsEndpoint);
      
      if (!response.ok) {
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }
      
      const newsData = await response.json();
      
      // 转换API响应为标准格式
      const news: MarketNews[] = newsData
        .slice(0, limit)
        .map((item: any) => ({
          id: item.id.toString(),
          headline: item.headline,
          summary: item.summary || '',
          source: item.source,
          url: item.url,
          timestamp: new Date(item.datetime * 1000).toISOString(),
          relatedSymbols: item.related ? item.related.split(',') : [],
          sentiment: this.analyzeSentiment(item.headline, item.summary)
        }));
      
      // 存入缓存
      this.addToCache(cacheKey, news);
      
      return news;
    } catch (error) {
      logger.error('获取市场新闻失败', error);
      return [];
    }
  }
  
  /**
   * 获取日期字符串，用于API调用
   */
  private getDateString(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }
  
  /**
   * 简单情感分析
   */
  private analyzeSentiment(headline: string, summary: string): 'positive' | 'negative' | 'neutral' {
    const text = (headline + ' ' + (summary || '')).toLowerCase();
    
    const positiveWords = ['gain', 'rise', 'up', 'growth', 'positive', 'profit', 'surge', 'rally', 'record', 'beat'];
    const negativeWords = ['loss', 'fall', 'down', 'drop', 'negative', 'bearish', 'miss', 'plunge', 'crash', 'fail'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }
  
  /**
   * 订阅实时数据更新
   */
  subscribeToRealtimeUpdates(symbol: string, callback: (data: RealTimeQuote) => void): string {
    // 生成订阅ID
    const subscriptionId = `${symbol}:${Date.now()}:${Math.random().toString(36).substring(2, 10)}`;
    
    // 记录订阅
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
      
      // 如果是第一个订阅，建立WebSocket连接
      this.connectWebSocket(symbol);
    }
    
    // 添加到订阅列表
    this.subscriptions.get(symbol)?.add(subscriptionId);
    
    // 监听事件
    this.on(`update:${symbol}`, callback);
    
    return subscriptionId;
  }
  
  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId: string): boolean {
    try {
      const [symbol, timestamp, randomId] = subscriptionId.split(':');
      
      if (!this.subscriptions.has(symbol)) {
        return false;
      }
      
      // 从订阅列表移除
      this.subscriptions.get(symbol)?.delete(subscriptionId);
      
      // 如果该符号没有更多订阅，关闭WebSocket连接
      if (this.subscriptions.get(symbol)?.size === 0) {
        this.disconnectWebSocket(symbol);
        this.subscriptions.delete(symbol);
      }
      
      // 移除所有此符号的事件监听器
      this.removeAllListeners(`update:${symbol}`);
      
      return true;
    } catch (error) {
      logger.error('取消订阅失败', error);
      return false;
    }
  }
  
  /**
   * 建立WebSocket连接
   */
  private connectWebSocket(symbol: string): void {
    try {
      logger.info(`为${symbol}建立WebSocket连接`);
      
      // Finnhub WebSocket端点
      const socket = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);
      
      socket.onopen = () => {
        logger.info(`WebSocket连接已打开，订阅${symbol}`);
        // 发送订阅消息
        socket.send(JSON.stringify({ type: 'subscribe', symbol }));
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 处理交易数据
          if (data.type === 'trade' && data.data && data.data.length > 0) {
            const trade = data.data[0];
            
            // 创建报价对象
            const quote: RealTimeQuote = {
              symbol: trade.s,
              price: trade.p,
              change: 0, // WebSocket数据中没有这些信息
              changePercent: 0,
              volume: trade.v,
              high: 0,
              low: 0,
              open: 0,
              previousClose: 0,
              timestamp: new Date(trade.t).toISOString(),
              exchange: trade.x
            };
            
            // 发送更新事件
            this.emit(`update:${symbol}`, quote);
          }
        } catch (error) {
          logger.error('处理WebSocket消息失败', error);
        }
      };
      
      socket.onerror = (error) => {
        logger.error(`WebSocket错误: ${error}`);
      };
      
      socket.onclose = () => {
        logger.info(`WebSocket连接已关闭: ${symbol}`);
      };
      
      // 存储WebSocket连接
      this.wsConnections.set(symbol, socket);
    } catch (error) {
      logger.error(`为${symbol}建立WebSocket连接失败`, error);
    }
  }
  
  /**
   * 断开WebSocket连接
   */
  private disconnectWebSocket(symbol: string): void {
    const socket = this.wsConnections.get(symbol);
    if (socket) {
      // 发送取消订阅消息
      socket.send(JSON.stringify({ type: 'unsubscribe', symbol }));
      socket.close();
      this.wsConnections.delete(symbol);
      logger.info(`断开${symbol}的WebSocket连接`);
    }
  }
  
  /**
   * 从缓存中获取数据
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    
    // 缓存过期或不存在
    return null;
  }
  
  /**
   * 添加数据到缓存
   */
  private addToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * 确保服务已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('实时市场数据服务尚未初始化');
    }
  }
}

// 创建单例实例
export const liveMarketDataService = new LiveMarketDataService(); 