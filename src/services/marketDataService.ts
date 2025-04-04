// 市场数据服务，用于集成各种市场数据源
import { EventEmitter } from 'events';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('marketDataService');

// 市场数据类型定义
export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface SectorData {
  name: string;
  performance: number;
  volume: number;
}

export interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

export interface NewsItem {
  date: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface MarketOverview {
  indices: MarketIndex[];
  sectors: SectorData[];
  topGainers: StockMover[];
  topLosers: StockMover[];
  mostActive: StockMover[];
  marketNews: NewsItem[];
  lastUpdated: string;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  dividend: number;
  dividendYield: number;
  eps: number;
  high52: number;
  low52: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

/**
 * 价格历史数据接口
 */
export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number;
  ma60?: number;
  rsi?: number;
  macd?: number;
}

/**
 * 财务数据接口
 */
export interface FinancialData {
  ticker: string;
  period: string;
  revenue: number;
  netIncome: number;
  eps: number;
  pe: number;
  pbv: number;
  roe: number;
  dividendYield: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  freeCashFlow: number;
  profitMargin: number;
  revenueGrowth: number;
  epsGrowth: number;
}

// 数据源配置类型
export interface DataSourceConfig {
  provider: 'alpha-vantage' | 'yahoo-finance' | 'finnhub' | 'tiingo' | 'mock';
  apiKey?: string;
  updateInterval: number; // 毫秒
}

// 默认配置
const DEFAULT_CONFIG: DataSourceConfig = {
  provider: 'mock',
  updateInterval: 60000 // 1分钟
};

class MarketDataService extends EventEmitter {
  private config: DataSourceConfig;
  private marketOverview: MarketOverview | null = null;
  private stockData: Map<string, StockData> = new Map();
  private stockQuotes: Map<string, StockQuote> = new Map();
  private updateTimers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor(config: DataSourceConfig = DEFAULT_CONFIG) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 初始化市场数据服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 获取市场概览数据
      await this.fetchMarketOverview();
      
      // 设置定时更新
      this.setupUpdateInterval();
      
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('初始化市场数据服务失败:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 设置更新间隔
   */
  private setupUpdateInterval(): void {
    // 清除现有定时器
    this.clearUpdateIntervals();
    
    // 设置市场概览更新
    const overviewTimer = setInterval(() => {
      this.fetchMarketOverview().catch(error => {
        console.error('更新市场概览失败:', error);
        this.emit('error', error);
      });
    }, this.config.updateInterval);
    
    this.updateTimers.set('overview', overviewTimer);
  }

  /**
   * 清除所有更新定时器
   */
  private clearUpdateIntervals(): void {
    for (const timer of this.updateTimers.values()) {
      clearInterval(timer);
    }
    this.updateTimers.clear();
  }

  /**
   * 获取市场概览数据
   */
  async fetchMarketOverview(): Promise<MarketOverview> {
    try {
      let data: MarketOverview;
      
      if (this.config.provider === 'mock') {
        data = await this.mockMarketOverview();
      } else {
        data = await this.fetchFromExternalAPI('overview');
      }
      
      this.marketOverview = data;
      this.emit('market-overview-updated', data);
      
      return data;
    } catch (error) {
      console.error('获取市场概览失败:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 获取股票数据
   */
  async fetchStockData(symbol: string): Promise<StockData> {
    try {
      let data: StockData;
      
      if (this.config.provider === 'mock') {
        data = await this.mockStockData(symbol);
      } else {
        data = await this.fetchFromExternalAPI('stock', { symbol });
      }
      
      this.stockData.set(symbol, data);
      this.emit('stock-data-updated', symbol, data);
      
      // 设置定时更新
      if (!this.updateTimers.has(`stock:${symbol}`)) {
        const timer = setInterval(() => {
          this.fetchStockData(symbol).catch(error => {
            console.error(`更新股票数据失败 (${symbol}):`, error);
          });
        }, this.config.updateInterval);
        
        this.updateTimers.set(`stock:${symbol}`, timer);
      }
      
      return data;
    } catch (error) {
      console.error(`获取股票数据失败 (${symbol}):`, error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 获取股票报价
   */
  async fetchStockQuote(symbol: string): Promise<StockQuote> {
    try {
      let data: StockQuote;
      
      if (this.config.provider === 'mock') {
        data = await this.mockStockQuote(symbol);
      } else {
        data = await this.fetchFromExternalAPI('quote', { symbol });
      }
      
      this.stockQuotes.set(symbol, data);
      this.emit('stock-quote-updated', symbol, data);
      
      return data;
    } catch (error) {
      console.error(`获取股票报价失败 (${symbol}):`, error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 模拟市场概览数据
   */
  private async mockMarketOverview(): Promise<MarketOverview> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timestamp = new Date().toISOString();
    
    return {
      indices: [
        { symbol: 'SPX', name: 'S&P 500', value: 5217.49 + (Math.random() * 20 - 10), change: 35.21, changePercent: 0.68, timestamp },
        { symbol: 'DJI', name: '道琼斯工业平均指数', value: 39170.35 + (Math.random() * 100 - 50), change: 311.58, changePercent: 0.80, timestamp },
        { symbol: 'IXIC', name: '纳斯达克综合指数', value: 16274.09 + (Math.random() * 50 - 25), change: 130.26, changePercent: 0.81, timestamp },
        { symbol: 'HSI', name: '恒生指数', value: 16512.99 + (Math.random() * 100 - 50), change: -31.99, changePercent: -0.19, timestamp },
        { symbol: 'N225', name: '日经225指数', value: 40846.96 + (Math.random() * 150 - 75), change: 364.80, changePercent: 0.90, timestamp }
      ],
      sectors: [
        { name: '科技', performance: 1.24, volume: 3423458921 },
        { name: '金融', performance: 0.45, volume: 1853928471 },
        { name: '医疗保健', performance: -0.32, volume: 982345710 },
        { name: '消费者非必需品', performance: 0.67, volume: 1234587190 },
        { name: '工业', performance: 0.28, volume: 872345982 },
        { name: '能源', performance: -0.54, volume: 743928172 },
        { name: '公用事业', performance: 0.12, volume: 324567891 },
        { name: '材料', performance: -0.08, volume: 563492871 },
        { name: '房地产', performance: -0.76, volume: 432198765 },
        { name: '通信服务', performance: 0.95, volume: 876543219 },
        { name: '消费者必需品', performance: 0.23, volume: 654321987 }
      ],
      topGainers: [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 186.23, change: 5.67, changePercent: 3.14 },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: 426.39, change: 12.49, changePercent: 3.02 },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 902.50, change: 24.35, changePercent: 2.77 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 180.75, change: 3.92, changePercent: 2.22 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 153.51, change: 2.86, changePercent: 1.90 }
      ],
      topLosers: [
        { symbol: 'BA', name: 'Boeing Co.', price: 176.80, change: -5.24, changePercent: -2.88 },
        { symbol: 'KO', name: 'Coca-Cola Co.', price: 60.12, change: -1.43, changePercent: -2.32 },
        { symbol: 'JNJ', name: 'Johnson & Johnson', price: 147.89, change: -3.21, changePercent: -2.13 },
        { symbol: 'PFE', name: 'Pfizer Inc.', price: 26.78, change: -0.56, changePercent: -2.05 },
        { symbol: 'CVX', name: 'Chevron Corp.', price: 154.63, change: -2.94, changePercent: -1.87 }
      ],
      mostActive: [
        { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 902.50, volume: 78245690, change: 24.35, changePercent: 2.77 },
        { symbol: 'AAPL', name: 'Apple Inc.', price: 186.23, volume: 67453218, change: 5.67, changePercent: 3.14 },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.48, volume: 54327891, change: 1.23, changePercent: 0.71 },
        { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', price: 168.42, volume: 48765432, change: 2.56, changePercent: 1.54 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 180.75, volume: 41234567, change: 3.92, changePercent: 2.22 }
      ],
      marketNews: [
        {
          date: new Date().toISOString().split('T')[0],
          title: 'Fed维持利率不变，暗示今年可能降息',
          summary: '美联储在最新决议中维持利率不变，但暗示今年可能会降息以支持经济增长',
          source: '路透社',
          url: 'https://example.com/news/fed-rate-decision',
          sentiment: 'positive'
        },
        {
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          title: '美国通胀数据好于预期，股市上涨',
          summary: '最新公布的CPI数据显示通胀压力有所缓解，美国股市应声上涨',
          source: '华尔街日报',
          url: 'https://example.com/news/inflation-data',
          sentiment: 'positive'
        },
        {
          date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
          title: '欧洲央行暗示可能进一步收紧货币政策',
          summary: '欧洲央行表示，如果通胀压力持续，将考虑进一步收紧货币政策',
          source: '金融时报',
          url: 'https://example.com/news/ecb-policy',
          sentiment: 'negative'
        },
        {
          date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
          title: '中国公布新经济刺激措施，全球市场反应积极',
          summary: '中国政府公布新一轮经济刺激措施，重点支持房地产和消费，全球市场反应积极',
          source: '彭博社',
          url: 'https://example.com/news/china-stimulus',
          sentiment: 'positive'
        },
        {
          date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
          title: '全球供应链中断风险上升，引发市场担忧',
          summary: '由于地缘政治冲突和自然灾害，全球供应链中断风险上升，引发市场对经济增长的担忧',
          source: 'CNBC',
          url: 'https://example.com/news/supply-chain',
          sentiment: 'negative'
        }
      ],
      lastUpdated: timestamp
    };
  }

  /**
   * 模拟股票数据
   */
  private async mockStockData(symbol: string): Promise<StockData> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const basePrice = this.getBasePriceForSymbol(symbol);
    const price = basePrice + (Math.random() * 5 - 2.5);
    const change = price - basePrice + (Math.random() * 2 - 1);
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol,
      name: this.getNameForSymbol(symbol),
      price,
      change,
      changePercent,
      volume: Math.floor(10000000 + Math.random() * 50000000),
      marketCap: price * (1000000000 + Math.random() * 2000000000),
      pe: 15 + Math.random() * 30,
      dividend: 0.5 + Math.random() * 3,
      dividendYield: (0.5 + Math.random() * 3) / price * 100,
      eps: price / (15 + Math.random() * 10),
      high52: price * (1.1 + Math.random() * 0.3),
      low52: price * (0.7 - Math.random() * 0.2),
      open: price - (Math.random() * 3 - 1.5),
      high: price + (Math.random() * 3),
      low: price - (Math.random() * 3),
      previousClose: price - change,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 模拟股票报价
   */
  private async mockStockQuote(symbol: string): Promise<StockQuote> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const basePrice = this.getBasePriceForSymbol(symbol);
    const price = basePrice + (Math.random() * 2 - 1);
    const change = price - basePrice;
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol,
      price,
      change,
      changePercent,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 从外部API获取数据
   */
  private async fetchFromExternalAPI(
    type: 'overview' | 'stock' | 'quote',
    params?: Record<string, string>
  ): Promise<any> {
    // 这里应该实现实际的API调用
    // 目前仅返回模拟数据
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (type === 'overview') {
      return this.mockMarketOverview();
    } else if (type === 'stock' && params?.symbol) {
      return this.mockStockData(params.symbol);
    } else if (type === 'quote' && params?.symbol) {
      return this.mockStockQuote(params.symbol);
    }
    
    throw new Error(`未知的API类型: ${type}`);
  }

  /**
   * 为股票代码获取基础价格
   */
  private getBasePriceForSymbol(symbol: string): number {
    // 为不同股票返回不同的基础价格
    const priceMap: Record<string, number> = {
      'AAPL': 186.23,
      'MSFT': 426.39,
      'GOOGL': 153.51,
      'AMZN': 180.75,
      'NVDA': 902.50,
      'TSLA': 175.48,
      'META': 493.50,
      'NFLX': 630.20,
      'AMD': 168.42,
      'INTC': 42.35
    };
    
    return priceMap[symbol] || 100 + Math.random() * 200;
  }

  /**
   * 为股票代码获取公司名称
   */
  private getNameForSymbol(symbol: string): string {
    // 为不同股票返回不同的公司名称
    const nameMap: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'NVDA': 'NVIDIA Corp.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.',
      'AMD': 'Advanced Micro Devices, Inc.',
      'INTC': 'Intel Corp.'
    };
    
    return nameMap[symbol] || `${symbol} Corp.`;
  }

  /**
   * 更新数据源配置
   */
  updateConfig(config: Partial<DataSourceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 如果更新了更新间隔，重新设置定时器
    if (config.updateInterval) {
      this.setupUpdateInterval();
    }
    
    this.emit('config-updated', this.config);
  }

  /**
   * 获取当前市场概览
   */
  getMarketOverview(): MarketOverview | null {
    return this.marketOverview;
  }

  /**
   * 获取股票数据
   */
  getStockData(symbol: string): StockData | undefined {
    return this.stockData.get(symbol);
  }

  /**
   * 获取股票报价
   */
  getStockQuote(symbol: string): StockQuote | undefined {
    return this.stockQuotes.get(symbol);
  }

  /**
   * 关闭服务
   */
  shutdown(): void {
    this.clearUpdateIntervals();
    this.removeAllListeners();
    this.isInitialized = false;
  }

  /**
   * 获取股票价格历史数据
   * @param symbol 股票代码
   * @param period 时间段: 1d, 5d, 1m, 3m, 6m, 1y, 2y, 5y, max
   */
  async fetchStockPriceHistory(symbol: string, period: string = '1y'): Promise<PriceData[]> {
    try {
      logger.info('获取股票价格历史数据', { symbol, period });
      
      // 在实际应用中，这里会调用外部API
      // 目前使用模拟数据
      const today = new Date();
      let startDate = new Date();
      
      // 根据period计算开始日期
      switch (period) {
        case '1d': startDate.setDate(today.getDate() - 1); break;
        case '5d': startDate.setDate(today.getDate() - 5); break;
        case '1m': startDate.setMonth(today.getMonth() - 1); break;
        case '3m': startDate.setMonth(today.getMonth() - 3); break;
        case '6m': startDate.setMonth(today.getMonth() - 6); break;
        case '1y': startDate.setFullYear(today.getFullYear() - 1); break;
        case '2y': startDate.setFullYear(today.getFullYear() - 2); break;
        case '5y': startDate.setFullYear(today.getFullYear() - 5); break;
        case 'max': startDate.setFullYear(2000); break;
        default: startDate.setFullYear(today.getFullYear() - 1);
      }
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      return this.generateMockPriceData(symbol, startDateStr, endDateStr);
    } catch (error) {
      logger.error('获取股票价格历史数据失败', { symbol, period, error });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 获取股票财务数据
   * @param symbol 股票代码
   */
  async fetchFinancialData(symbol: string): Promise<FinancialData> {
    try {
      logger.info('获取股票财务数据', { symbol });
      
      // 在实际应用中，这里会调用外部API
      // 目前使用模拟数据
      return this.generateMockFinancialData(symbol);
    } catch (error) {
      logger.error('获取股票财务数据失败', { symbol, error });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 获取股票相关新闻
   * @param symbol 股票代码
   * @param days 获取最近多少天的新闻，默认30天
   */
  async fetchNewsData(symbol: string, days: number = 30): Promise<NewsItem[]> {
    try {
      logger.info('获取股票相关新闻', { symbol, days });
      
      // 在实际应用中，这里会调用外部API
      // 目前使用模拟数据
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - days);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      return this.generateMockNewsData(symbol, startDateStr, endDateStr);
    } catch (error) {
      logger.error('获取股票相关新闻失败', { symbol, days, error });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 生成模拟价格历史数据
   */
  private generateMockPriceData(symbol: string, startDate: string, endDate: string): PriceData[] {
    const result: PriceData[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 根据股票代码设置基础价格
    const basePrice = this.getBasePriceForSymbol(symbol);
    
    // 生成日期范围内的价格数据
    let lastClose = basePrice;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // 跳过周末
      const day = d.getDay();
      if (day === 0 || day === 6) continue;
      
      // 随机波动 (-3% to +3%)
      const change = (Math.random() * 6 - 3) / 100;
      const close = +(lastClose * (1 + change)).toFixed(2);
      const open = +(lastClose * (1 + (Math.random() * 2 - 1) / 100)).toFixed(2);
      const high = +Math.max(open, close, open * (1 + Math.random() * 2 / 100)).toFixed(2);
      const low = +Math.min(open, close, open * (1 - Math.random() * 2 / 100)).toFixed(2);
      const volume = Math.floor(Math.random() * 10000000) + 5000000;
      
      const date = d.toISOString().split('T')[0];
      result.push({ date, open, high, low, close, volume });
      lastClose = close;
    }
    
    // 计算技术指标
    return this.calculateTechnicalIndicators(result);
  }

  /**
   * 计算技术指标
   */
  private calculateTechnicalIndicators(priceData: PriceData[]): PriceData[] {
    // 计算移动平均线
    const ma20 = this.calculateMA(priceData.map(item => item.close), 20);
    const ma60 = this.calculateMA(priceData.map(item => item.close), 60);
    
    // 计算RSI
    const rsi = this.calculateRSI(priceData.map(item => item.close), 14);
    
    // 计算MACD
    const macd = this.calculateMACD(priceData.map(item => item.close));
    
    // 合并指标到价格数据
    return priceData.map((item, index) => ({
      ...item,
      ma20: ma20[index],
      ma60: ma60[index],
      rsi: rsi[index],
      macd: macd.macdLine[index]
    }));
  }

  /**
   * 计算移动平均线
   */
  private calculateMA(data: number[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(undefined); // 不足周期的点设为undefined
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
        result.push(+(sum / period).toFixed(2));
      }
    }
    
    return result;
  }

  /**
   * 计算RSI指标
   */
  private calculateRSI(data: number[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = [];
    let gains = 0;
    let losses = 0;
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        result.push(undefined);
        continue;
      }
      
      const change = data[i] - data[i - 1];
      
      if (i < period) {
        gains += change > 0 ? change : 0;
        losses += change < 0 ? -change : 0;
        result.push(undefined);
        continue;
      }
      
      if (i === period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(+rsi.toFixed(2));
        continue;
      }
      
      const prevAvgGain = (gains / period) * (period - 1);
      const prevAvgLoss = (losses / period) * (period - 1);
      
      const avgGain = (prevAvgGain + (change > 0 ? change : 0)) / period;
      const avgLoss = (prevAvgLoss + (change < 0 ? -change : 0)) / period;
      
      gains = avgGain * period;
      losses = avgLoss * period;
      
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      result.push(+rsi.toFixed(2));
    }
    
    return result;
  }

  /**
   * 计算MACD指标
   */
  private calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const ema12 = this.calculateEMA(data, fastPeriod);
    const ema26 = this.calculateEMA(data, slowPeriod);
    
    const macdLine: (number | undefined)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < slowPeriod - 1) {
        macdLine.push(undefined);
      } else {
        const ema12Value = ema12[i];
        const ema26Value = ema26[i];
        if (ema12Value !== undefined && ema26Value !== undefined) {
          macdLine.push(+(ema12Value - ema26Value).toFixed(2));
        } else {
          macdLine.push(undefined);
        }
      }
    }
    
    // 过滤掉undefined值再计算EMA
    const validMacdValues = macdLine.filter((value): value is number => value !== undefined);
    const signalLine = this.calculateEMA(validMacdValues, signalPeriod);
    
    // 补齐signalLine前面缺失的值
    const fullSignalLine: (number | undefined)[] = [];
    for (let i = 0; i < macdLine.length; i++) {
      if (i < slowPeriod + signalPeriod - 2) {
        fullSignalLine.push(undefined);
      } else {
        fullSignalLine.push(signalLine[i - (slowPeriod - 1)]);
      }
    }
    
    const histogram: (number | undefined)[] = [];
    for (let i = 0; i < macdLine.length; i++) {
      if (i < slowPeriod + signalPeriod - 2) {
        histogram.push(undefined);
      } else {
        const macdValue = macdLine[i];
        const signalValue = fullSignalLine[i];
        if (macdValue !== undefined && signalValue !== undefined) {
          histogram.push(+(macdValue - signalValue).toFixed(2));
        } else {
          histogram.push(undefined);
        }
      }
    }
    
    return {
      macdLine,
      signalLine: fullSignalLine,
      histogram
    };
  }

  /**
   * 计算指数移动平均线
   */
  private calculateEMA(data: number[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = [];
    const k = 2 / (period + 1);
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else if (i === period - 1) {
        // 第一个EMA值使用简单平均
        const sum = data.slice(0, period).reduce((acc, val) => acc + val, 0);
        result.push(+(sum / period).toFixed(2));
      } else {
        const prevEMA = result[i - 1];
        if (prevEMA !== undefined) {
          const ema = data[i] * k + prevEMA * (1 - k);
          result.push(+ema.toFixed(2));
        } else {
          result.push(undefined);
        }
      }
    }
    
    return result;
  }

  /**
   * 生成模拟财务数据
   */
  private generateMockFinancialData(symbol: string): FinancialData {
    // 根据股票代码设置基础财务数据
    let baseRevenue, baseEPS, basePE, baseROE, baseMargin, baseGrowth;
    switch (symbol) {
      case 'AAPL':
        baseRevenue = 400000000000; // 4000亿美元
        baseEPS = 6.5;
        basePE = 28;
        baseROE = 0.35; // 35%
        baseMargin = 0.25; // 25%
        baseGrowth = 0.08; // 8%
        break;
      case 'MSFT':
        baseRevenue = 200000000000;
        baseEPS = 9.2;
        basePE = 32;
        baseROE = 0.40;
        baseMargin = 0.38;
        baseGrowth = 0.15;
        break;
      case 'GOOGL':
        baseRevenue = 300000000000;
        baseEPS = 5.8;
        basePE = 25;
        baseROE = 0.28;
        baseMargin = 0.22;
        baseGrowth = 0.12;
        break;
      case 'AMZN':
        baseRevenue = 500000000000;
        baseEPS = 3.2;
        basePE = 38;
        baseROE = 0.18;
        baseMargin = 0.06;
        baseGrowth = 0.18;
        break;
      case 'TSLA':
        baseRevenue = 100000000000;
        baseEPS = 4.3;
        basePE = 45;
        baseROE = 0.22;
        baseMargin = 0.15;
        baseGrowth = 0.25;
        break;
      case 'NVDA':
        baseRevenue = 60000000000;
        baseEPS = 12.5;
        basePE = 55;
        baseROE = 0.60;
        baseMargin = 0.45;
        baseGrowth = 0.60;
        break;
      default:
        baseRevenue = 50000000000;
        baseEPS = 3.0;
        basePE = 20;
        baseROE = 0.15;
        baseMargin = 0.12;
        baseGrowth = 0.10;
    }
    
    // 添加一些随机变化
    const randomFactor = 1 + (Math.random() * 0.2 - 0.1); // ±10%
    
    const revenue = Math.floor(baseRevenue * randomFactor);
    const eps = +(baseEPS * randomFactor).toFixed(2);
    const pe = +(basePE * randomFactor).toFixed(2);
    const roe = +(baseROE * randomFactor).toFixed(2);
    const profitMargin = +(baseMargin * randomFactor).toFixed(2);
    const revenueGrowth = +(baseGrowth * randomFactor).toFixed(2);
    
    const netIncome = Math.floor(revenue * profitMargin);
    const pbv = +(pe * roe).toFixed(2);
    const dividendYield = +(Math.random() * 0.03).toFixed(2); // 0-3%
    const debtToEquity = +(Math.random() * 0.5 + 0.1).toFixed(2); // 0.1-0.6
    const currentRatio = +(Math.random() * 2 + 1).toFixed(2); // 1-3
    const quickRatio = +(currentRatio * 0.8).toFixed(2);
    const freeCashFlow = Math.floor(netIncome * (Math.random() * 0.4 + 0.8)); // 80-120% of net income
    const epsGrowth = +(revenueGrowth * (Math.random() * 0.5 + 0.75)).toFixed(2); // 75-125% of revenue growth
    
    return {
      ticker: symbol,
      period: 'TTM', // 过去12个月
      revenue,
      netIncome,
      eps,
      pe,
      pbv,
      roe,
      dividendYield,
      debtToEquity,
      currentRatio,
      quickRatio,
      freeCashFlow,
      profitMargin,
      revenueGrowth,
      epsGrowth
    };
  }

  /**
   * 生成模拟新闻数据
   */
  private generateMockNewsData(symbol: string, startDate: string, endDate: string): NewsItem[] {
    const result: NewsItem[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 新闻模板，根据不同股票准备一些标题和摘要
    const newsTemplates: Record<string, Array<{title: string, summary: string, sentiment: 'positive' | 'negative' | 'neutral'}>> = {
      'AAPL': [
        { title: 'Apple发布新一代iPhone Pro', summary: '苹果公司今日发布新一代iPhone Pro，配备更快的处理器和更高的拍照能力', sentiment: 'positive' },
        { title: 'Apple第四季度财报超出预期', summary: '苹果公司第四季度营收和利润超出分析师预期，主要受服务业务增长推动', sentiment: 'positive' },
        { title: 'Apple将扩大在印度的生产', summary: '苹果计划在印度建立更多生产线，减少对中国供应链的依赖', sentiment: 'neutral' },
        { title: 'Apple新MacBook销售不及预期', summary: '分析师报告显示，新款MacBook销量低于市场预期，可能影响下季度业绩', sentiment: 'negative' },
        { title: 'Apple Vision Pro销量突破预期', summary: 'Apple首款空间计算设备Vision Pro销量超出分析师预期，显示新品类潜力', sentiment: 'positive' }
      ],
      'default': [
        { title: '公司宣布新产品线', summary: '公司今日宣布推出全新产品线，旨在拓展市场份额并提升用户体验', sentiment: 'positive' },
        { title: '季度财报超出预期', summary: '公司最新季度财报显示营收和利润均超出分析师预期，股价应声上涨', sentiment: 'positive' },
        { title: '公司完成战略融资', summary: '公司宣布完成新一轮战略融资，将加速业务扩张和技术研发', sentiment: 'positive' },
        { title: '分析师下调目标价', summary: '多家投行分析师下调公司目标价，认为当前估值已反映未来增长', sentiment: 'negative' },
        { title: '公司宣布裁员计划', summary: '公司为了优化成本结构，宣布新一轮全球范围的裁员计划', sentiment: 'negative' },
        { title: '公司与行业巨头达成合作', summary: '公司宣布与行业领导者达成战略合作，共同开发下一代技术', sentiment: 'positive' },
        { title: '监管机构对公司展开调查', summary: '监管机构就公司商业实践可能违反竞争法展开调查', sentiment: 'negative' },
        { title: '公司扩大国际业务', summary: '公司宣布进入多个新市场，加速国际化战略实施', sentiment: 'neutral' }
      ]
    };
    
    // 选择适合股票的新闻模板
    const templates = newsTemplates[symbol] || newsTemplates['default'];
    
    // 生成日期范围内的随机新闻
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const newsCount = Math.min(20, Math.max(5, Math.floor(totalDays / 3))); // 平均每3天一条新闻，最少5条，最多20条
    
    for (let i = 0; i < newsCount; i++) {
      // 随机选择一个模板
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      // 随机生成日期
      const randomDays = Math.floor(Math.random() * totalDays);
      const newsDate = new Date(start);
      newsDate.setDate(newsDate.getDate() + randomDays);
      
      const date = newsDate.toISOString().split('T')[0];
      const title = template.title.replace('公司', symbol);
      const source = ['华尔街日报', '彭博社', '路透社', '金融时报', 'CNBC'][Math.floor(Math.random() * 5)];
      const url = `https://example.com/news/${symbol.toLowerCase()}/${date.replace(/-/g, '')}`;
      
      result.push({
        date,
        title,
        summary: template.summary.replace('公司', symbol),
        source,
        url,
        sentiment: template.sentiment
      });
    }
    
    // 按日期排序，最新的在前
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

// 创建单例实例
const marketDataService = new MarketDataService();

export { marketDataService, MarketDataService };
export default marketDataService; 