// 市场数据服务，用于集成各种市场数据源
import { EventEmitter } from 'events';

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
  id: string;
  title: string;
  source: string;
  timestamp: string;
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
          id: 'news-1',
          title: '美联储主席鲍威尔暗示今年可能降息三次',
          source: 'Bloomberg',
          timestamp: new Date().toISOString(),
          url: 'https://example.com/news/fed-rate-cuts',
          sentiment: 'positive'
        },
        {
          id: 'news-2',
          title: '科技股表现强劲，纳斯达克再创新高',
          source: 'CNBC',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          url: 'https://example.com/news/tech-stocks-rally',
          sentiment: 'positive'
        },
        {
          id: 'news-3',
          title: '通胀数据好于预期，市场情绪改善',
          source: 'Reuters',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          url: 'https://example.com/news/inflation-data',
          sentiment: 'positive'
        },
        {
          id: 'news-4',
          title: '全球供应链问题持续，可能影响第二季度业绩',
          source: 'Financial Times',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          url: 'https://example.com/news/supply-chain-issues',
          sentiment: 'negative'
        },
        {
          id: 'news-5',
          title: '石油价格上涨，能源股受益',
          source: 'WSJ',
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          url: 'https://example.com/news/oil-prices',
          sentiment: 'neutral'
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
}

// 创建单例实例
const marketDataService = new MarketDataService();

export { marketDataService, MarketDataService };
export default marketDataService; 