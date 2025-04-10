'use server';

import { EventEmitter } from 'events';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('realTimeMarketDataService');

// 数据类型定义
export interface RealTimeQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
  exchange: string;
}

export interface HistoricalBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketOverview {
  indices: {
    name: string;
    symbol: string;
    value: number;
    change: number;
    changePercent: number;
  }[];
  topGainers: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
  }[];
  topLosers: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
  }[];
  mostActive: {
    symbol: string;
    price: number;
    volume: number;
    changePercent: number;
  }[];
}

export interface MarketNews {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  timestamp: string;
  relatedSymbols: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

// 市场数据服务类
export class RealTimeMarketDataService extends EventEmitter {
  private apiKey: string;
  private baseUrl: string;
  private isInitialized: boolean = false;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 60 * 1000; // 默认缓存时间为60秒
  private wsConnections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();

  constructor(apiKey?: string) {
    super();
    // 如果没有提供API密钥，使用环境变量中的密钥
    this.apiKey = apiKey || process.env.MARKET_DATA_API_KEY || 'demo';
    this.baseUrl = process.env.MARKET_DATA_API_URL || 'https://api.marketdata.example.com';
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('初始化实时市场数据服务');
      
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
    // 在实际实现中，这将调用API进行验证
    // 现在我们直接返回true进行模拟
    return true;
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

      // 在实际实现中，这将调用外部API
      // 现在我们生成模拟数据
      const quote = this.generateMockQuote(symbol);
      
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
      
      // 在实际实现中，这将调用外部API
      // 现在我们生成模拟数据
      const bars = this.generateMockHistoricalData(symbol, interval, startTime, endTime);
      
      // 存入缓存
      this.addToCache(cacheKey, bars);
      
      return bars;
    } catch (error) {
      logger.error(`获取${symbol}历史数据失败`, error);
      return [];
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
      
      // 在实际实现中，这将调用外部API
      // 现在我们生成模拟数据
      const overview = this.generateMockMarketOverview();
      
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
      
      // 在实际实现中，这将调用外部API
      // 现在我们生成模拟数据
      const news = this.generateMockMarketNews(symbols, limit);
      
      // 存入缓存
      this.addToCache(cacheKey, news);
      
      return news;
    } catch (error) {
      logger.error('获取市场新闻失败', error);
      return [];
    }
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
    // 在实际实现中，这将连接到真实的WebSocket服务器
    // 现在我们使用模拟的连接
    
    logger.info(`为${symbol}建立WebSocket连接`);
    
    // 模拟WebSocket连接
    const mockWsConnection = {
      close: () => {
        logger.info(`关闭${symbol}的WebSocket连接`);
        // 清理模拟的定时器
        clearInterval(this.wsConnections.get(symbol) as any);
      }
    };
    
    // 每隔一段时间发送模拟的更新数据
    const intervalId = setInterval(() => {
      const quote = this.generateMockQuote(symbol);
      this.emit(`update:${symbol}`, quote);
    }, 5000); // 每5秒更新一次
    
    // 存储连接(在这里我们存储的是定时器ID)
    this.wsConnections.set(symbol, intervalId as any as WebSocket);
  }

  /**
   * 断开WebSocket连接
   */
  private disconnectWebSocket(symbol: string): void {
    const connection = this.wsConnections.get(symbol);
    if (connection) {
      clearInterval(connection as any);
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

  /**
   * 生成模拟的实时报价数据
   */
  private generateMockQuote(symbol: string): RealTimeQuote {
    // 基于符号生成一个伪随机数
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // 基础价格在50-500之间
    const basePrice = 50 + (seed % 450);
    
    // 生成-5%到+5%之间的随机变化
    const changePercent = (Math.sin(Date.now() / 10000000 + seed) * 5).toFixed(2);
    const change = (basePrice * parseFloat(changePercent) / 100).toFixed(2);
    
    // 当前价格
    const price = (basePrice + parseFloat(change)).toFixed(2);
    
    // 其他数据
    const volume = Math.floor(100000 + Math.random() * 10000000);
    const high = (parseFloat(price) * (1 + Math.random() * 0.02)).toFixed(2);
    const low = (parseFloat(price) * (1 - Math.random() * 0.02)).toFixed(2);
    const open = (parseFloat(price) * (1 + (Math.random() * 0.04 - 0.02))).toFixed(2);
    const previousClose = (parseFloat(price) - parseFloat(change)).toFixed(2);
    
    return {
      symbol,
      price: parseFloat(price),
      change: parseFloat(change),
      changePercent: parseFloat(changePercent),
      volume,
      high: parseFloat(high),
      low: parseFloat(low),
      open: parseFloat(open),
      previousClose: parseFloat(previousClose),
      timestamp: new Date().toISOString(),
      exchange: this.getExchangeForSymbol(symbol)
    };
  }

  /**
   * 获取股票对应的交易所
   */
  private getExchangeForSymbol(symbol: string): string {
    // 简单的模拟规则
    if (symbol.length <= 3) {
      return 'NYSE';
    } else if (symbol.startsWith('A') || symbol.startsWith('Z')) {
      return 'NASDAQ';
    } else if (symbol.includes('.')) {
      return 'OTC';
    } else {
      return 'NYSE';
    }
  }

  /**
   * 生成模拟的历史数据
   */
  private generateMockHistoricalData(
    symbol: string,
    interval: string,
    startTime?: string,
    endTime?: string
  ): HistoricalBar[] {
    // 确定时间跨度
    const start = startTime ? new Date(startTime) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endTime ? new Date(endTime) : new Date();
    
    // 基于时间间隔确定数据点数量
    let intervalMs: number;
    switch (interval) {
      case '1m': intervalMs = 60 * 1000; break;
      case '5m': intervalMs = 5 * 60 * 1000; break;
      case '15m': intervalMs = 15 * 60 * 1000; break;
      case '30m': intervalMs = 30 * 60 * 1000; break;
      case '1h': intervalMs = 60 * 60 * 1000; break;
      case '1d': intervalMs = 24 * 60 * 60 * 1000; break;
      case '1w': intervalMs = 7 * 24 * 60 * 60 * 1000; break;
      case '1mo': intervalMs = 30 * 24 * 60 * 60 * 1000; break;
      default: intervalMs = 24 * 60 * 60 * 1000; // 默认为日线
    }
    
    // 计算数据点数量
    const dataPoints = Math.min(1000, Math.ceil((end.getTime() - start.getTime()) / intervalMs));
    
    // 生成随机起始价格
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = 50 + (seed % 450);
    
    // 生成历史数据
    const result: HistoricalBar[] = [];
    
    let currentPrice = basePrice;
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(start.getTime() + i * intervalMs);
      
      // 生成当前时间点的随机价格变动
      const priceChange = currentPrice * (Math.random() * 0.05 - 0.025);
      currentPrice += priceChange;
      
      // 确保价格不会为负
      currentPrice = Math.max(1, currentPrice);
      
      // 生成开高低收价格
      const open = currentPrice;
      const close = currentPrice + currentPrice * (Math.random() * 0.02 - 0.01);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      
      // 生成交易量
      const volume = Math.floor(10000 + Math.random() * 1000000);
      
      result.push({
        timestamp: timestamp.toISOString(),
        open,
        high,
        low,
        close,
        volume
      });
      
      // 更新当前价格为收盘价
      currentPrice = close;
    }
    
    return result;
  }

  /**
   * 生成模拟的市场概览数据
   */
  private generateMockMarketOverview(): MarketOverview {
    // 模拟主要指数
    const indices = [
      {
        name: 'S&P 500',
        symbol: 'SPX',
        value: 4500 + Math.random() * 100 - 50,
        change: Math.random() * 40 - 20,
        changePercent: Math.random() * 2 - 1
      },
      {
        name: 'Dow Jones',
        symbol: 'DJI',
        value: 36000 + Math.random() * 500 - 250,
        change: Math.random() * 200 - 100,
        changePercent: Math.random() * 2 - 1
      },
      {
        name: 'Nasdaq',
        symbol: 'IXIC',
        value: 14000 + Math.random() * 300 - 150,
        change: Math.random() * 100 - 50,
        changePercent: Math.random() * 2 - 1
      },
      {
        name: 'Russell 2000',
        symbol: 'RUT',
        value: 2200 + Math.random() * 50 - 25,
        change: Math.random() * 20 - 10,
        changePercent: Math.random() * 2 - 1
      }
    ];
    
    // 模拟股票符号
    const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'FB', 'TSLA', 'NFLX', 'NVDA', 'JPM', 'V'];
    
    // 模拟涨幅最大的股票
    const topGainers = stockSymbols.slice(0, 5).map(symbol => {
      const price = 100 + Math.random() * 400;
      const changePercent = 2 + Math.random() * 8; // 2% to 10%
      const change = price * changePercent / 100;
      
      return {
        symbol,
        price,
        change,
        changePercent
      };
    });
    
    // 模拟跌幅最大的股票
    const topLosers = stockSymbols.slice(5).map(symbol => {
      const price = 100 + Math.random() * 400;
      const changePercent = -(2 + Math.random() * 8); // -2% to -10%
      const change = price * changePercent / 100;
      
      return {
        symbol,
        price,
        change,
        changePercent
      };
    });
    
    // 模拟成交量最大的股票
    const mostActive = stockSymbols.map(symbol => {
      const price = 100 + Math.random() * 400;
      const changePercent = Math.random() * 10 - 5; // -5% to 5%
      const volume = 1000000 + Math.random() * 20000000;
      
      return {
        symbol,
        price,
        volume,
        changePercent
      };
    }).sort((a, b) => b.volume - a.volume).slice(0, 5);
    
    return {
      indices,
      topGainers,
      topLosers,
      mostActive
    };
  }

  /**
   * 生成模拟的市场新闻
   */
  private generateMockMarketNews(symbols?: string[], limit: number = 10): MarketNews[] {
    // 新闻标题模板
    const headlineTemplates = [
      "{{SYMBOL}} Reports Quarterly Earnings Above Expectations",
      "{{SYMBOL}} Announces New Product Launch",
      "Analysts Upgrade {{SYMBOL}} to Buy Rating",
      "{{SYMBOL}} CEO Steps Down, New Leadership Appointed",
      "{{SYMBOL}} Expands Operations in Global Markets",
      "{{SYMBOL}} Shares Surge on Strong Forecast",
      "{{SYMBOL}} Faces Regulatory Scrutiny Over Recent Practices",
      "{{SYMBOL}} Completes Acquisition of Tech Startup",
      "Investors React to {{SYMBOL}}'s New Strategic Direction",
      "{{SYMBOL}} Reports Strong Revenue Growth in Q2",
      "Market Volatility Impacts {{SYMBOL}} Trading",
      "{{SYMBOL}} Partners with {{SYMBOL2}} for New Initiative",
      "Economic Outlook Impacts {{SYMBOL}}'s Market Position",
      "{{SYMBOL}} Announces Share Buyback Program",
      "Analysts Debate {{SYMBOL}}'s Valuation After Recent Rally"
    ];
    
    // 摘要模板
    const summaryTemplates = [
      "{{SYMBOL}} posted earnings of $X per share, exceeding analyst expectations of $Y. Revenue also beat forecasts, rising Z% year-over-year.",
      "In a press conference today, {{SYMBOL}} unveiled its latest product, which analysts believe could significantly impact the company's growth trajectory.",
      "Financial analysts at major firms upgraded {{SYMBOL}} stock today, citing improved growth prospects and competitive positioning.",
      "After X years at the helm, {{SYMBOL}}'s CEO announced retirement. The board has appointed the current COO as successor.",
      "{{SYMBOL}} announced plans to expand operations into new international markets, with initial focus on Asia and Europe.",
      "Shares of {{SYMBOL}} climbed X% following the company's optimistic forecast for the upcoming fiscal year.",
      "Regulatory authorities have launched an investigation into {{SYMBOL}}'s business practices, particularly focusing on recent acquisitions.",
      "{{SYMBOL}} finalized the acquisition of a promising tech startup for $X million, expected to enhance their product capabilities.",
      "Investors responded positively to {{SYMBOL}}'s new strategic initiative, focusing on digital transformation and cost efficiency.",
      "{{SYMBOL}} reported X% revenue growth in Q2, driven primarily by strong performance in its cloud services division.",
      "Amid broader market volatility, {{SYMBOL}} shares experienced significant trading volume as investors reassessed positions.",
      "{{SYMBOL}} and {{SYMBOL2}} announced a strategic partnership to develop new technologies for the renewable energy sector.",
      "The latest economic forecasts have analysts reevaluating their outlook for {{SYMBOL}}'s performance in the upcoming quarters.",
      "{{SYMBOL}} announced a $X billion share repurchase program, representing approximately Y% of outstanding shares.",
      "Following a X% rally in recent weeks, market analysts are divided on whether {{SYMBOL}} stock remains a good value at current levels."
    ];
    
    // 来源列表
    const sources = ['Bloomberg', 'Reuters', 'CNBC', 'Financial Times', 'Wall Street Journal', 'MarketWatch', 'Barron\'s'];
    
    // 情绪类型
    const sentiments: ('positive' | 'negative' | 'neutral')[] = ['positive', 'negative', 'neutral'];
    
    // 默认股票符号
    const defaultSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'FB', 'TSLA', 'NFLX', 'NVDA', 'JPM', 'V', 'DIS', 'BAC', 'WMT', 'PG'];
    
    // 使用提供的符号或默认符号
    const targetSymbols = symbols && symbols.length > 0 ? symbols : defaultSymbols;
    
    // 生成新闻
    const news: MarketNews[] = [];
    
    for (let i = 0; i < limit; i++) {
      // 选择随机符号和模板
      const symbolIndex = Math.floor(Math.random() * targetSymbols.length);
      const symbol = targetSymbols[symbolIndex];
      
      const headlineIndex = Math.floor(Math.random() * headlineTemplates.length);
      const summaryIndex = Math.floor(Math.random() * summaryTemplates.length);
      
      // 选择第二个随机符号（用于合作新闻）
      const symbolIndex2 = (symbolIndex + 1 + Math.floor(Math.random() * (targetSymbols.length - 1))) % targetSymbols.length;
      const symbol2 = targetSymbols[symbolIndex2];
      
      // 格式化标题和摘要
      let headline = headlineTemplates[headlineIndex].replace('{{SYMBOL}}', symbol).replace('{{SYMBOL2}}', symbol2);
      let summary = summaryTemplates[summaryIndex].replace('{{SYMBOL}}', symbol).replace('{{SYMBOL2}}', symbol2);
      
      // 插入随机数字
      summary = summary.replace(/\$X/g, (Math.random() * 5 + 1).toFixed(2));
      summary = summary.replace(/\$Y/g, (Math.random() * 3 + 1).toFixed(2));
      summary = summary.replace(/Z%/g, (Math.random() * 20 + 5).toFixed(1) + '%');
      summary = summary.replace(/X%/g, (Math.random() * 25 + 5).toFixed(1) + '%');
      summary = summary.replace(/Y%/g, (Math.random() * 10 + 1).toFixed(1) + '%');
      summary = summary.replace(/\$X billion/g, '$' + (Math.random() * 10 + 1).toFixed(1) + ' billion');
      summary = summary.replace(/\$X million/g, '$' + (Math.random() * 900 + 100).toFixed(0) + ' million');
      
      // 随机相关符号
      const relatedSymbolsCount = Math.floor(Math.random() * 3) + 1;
      const relatedSymbols = [symbol];
      
      for (let j = 0; j < relatedSymbolsCount; j++) {
        const randSymbolIndex = Math.floor(Math.random() * targetSymbols.length);
        const randSymbol = targetSymbols[randSymbolIndex];
        
        if (!relatedSymbols.includes(randSymbol)) {
          relatedSymbols.push(randSymbol);
        }
      }
      
      // 随机来源和情绪
      const source = sources[Math.floor(Math.random() * sources.length)];
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      
      // 随机时间戳（过去48小时内）
      const timestamp = new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString();
      
      // 创建新闻项
      news.push({
        id: `news-${i}-${Date.now()}`,
        headline,
        summary,
        source,
        url: `https://finance.example.com/news/${symbol.toLowerCase()}-${Date.now()}`,
        timestamp,
        relatedSymbols,
        sentiment
      });
    }
    
    // 按时间戳排序，最新的在前
    return news.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

// 创建单例实例
export const realTimeMarketDataService = new RealTimeMarketDataService(); 