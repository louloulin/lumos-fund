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

export class MarketDataService extends EventEmitter {
  private config: DataSourceConfig;
  private marketOverview: MarketOverview | null = null;
  private stockData: Map<string, StockData> = new Map();
  private stockQuotes: Map<string, StockQuote> = new Map();
  private updateTimers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;
  private mockData: Record<string, any> = {};

  constructor(config: DataSourceConfig = DEFAULT_CONFIG) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 初始化市场数据服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    logger.info('初始化市场数据服务');
      
    // 在实际应用中，这里会连接到数据库或API
    // 为了演示，我们预加载一些模拟数据
    this.loadMockData();
      
      this.isInitialized = true;
    logger.info('市场数据服务初始化完成');
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
      
      // 检查初始化状态
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // 返回模拟数据
      const mockKey = `price_${symbol.toLowerCase()}`;
      if (this.mockData[mockKey]) {
        return this.mockData[mockKey];
      }
      
      // 如果没有指定股票的数据，生成一些随机数据
      return this.generateRandomPriceData(symbol, 180); // 半年数据
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
      
      // 检查初始化状态
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // 返回模拟数据
      const mockKey = `financial_${symbol.toLowerCase()}`;
      if (this.mockData[mockKey]) {
        return this.mockData[mockKey];
      }
      
      // 如果没有指定股票的数据，生成一些随机数据
      return this.generateRandomFinancialData(symbol);
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
      
      // 检查初始化状态
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // 返回模拟数据
      const mockKey = `news_${symbol.toLowerCase()}`;
      if (this.mockData[mockKey]) {
        return this.mockData[mockKey].slice(0, Math.min(20, Math.max(5, Math.floor(days / 3))));
      }
      
      // 如果没有指定股票的数据，生成一些随机数据
      return this.generateRandomNewsData(symbol, days);
    } catch (error) {
      logger.error('获取股票相关新闻失败', { symbol, days, error });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 加载模拟数据
   */
  private loadMockData(): void {
    // AAPL价格数据
    this.mockData['price_aapl'] = this.generateRandomPriceData('AAPL', 180, 150, 180);
    
    // MSFT价格数据
    this.mockData['price_msft'] = this.generateRandomPriceData('MSFT', 180, 280, 330);
    
    // AMZN价格数据
    this.mockData['price_amzn'] = this.generateRandomPriceData('AMZN', 180, 130, 160);
    
    // GOOGL价格数据
    this.mockData['price_googl'] = this.generateRandomPriceData('GOOGL', 180, 120, 150);
    
    // META价格数据
    this.mockData['price_meta'] = this.generateRandomPriceData('META', 180, 300, 500);
    
    // 财务数据
    this.mockData['financial_aapl'] = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      metrics: {
        pe: 32.15,
        eps: 5.23,
        roe: 0.1785,
        roa: 0.1235,
        debtToEquity: 1.68,
        currentRatio: 1.05,
        revenueGrowth: 0.089,
        profitMargin: 0.255,
        dividend: 0.0085
      },
      statements: {
        income: {
          revenue: 378323000000,
          costOfRevenue: 210676000000,
          grossProfit: 167647000000,
          operatingExpense: 48178000000,
          operatingIncome: 119469000000,
          netIncome: 96995000000
        },
        balance: {
          totalAssets: 352755000000,
          totalLiabilities: 290452000000,
          totalEquity: 62303000000,
          cash: 62632000000,
          debt: 119420000000
        },
        cashFlow: {
          operatingCashFlow: 116425000000,
          capitalExpenditures: -10940000000,
          freeCashFlow: 105485000000
        }
      }
    };
    
    // MSFT财务数据
    this.mockData['financial_msft'] = {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      sector: 'Technology',
      industry: 'Software—Infrastructure',
      metrics: {
        pe: 35.42,
        eps: 9.20,
        roe: 0.3765,
        roa: 0.1863,
        debtToEquity: 0.42,
        currentRatio: 1.78,
        revenueGrowth: 0.181,
        profitMargin: 0.357,
        dividend: 0.0072
      },
      statements: {
        income: {
          revenue: 211915000000,
          costOfRevenue: 64700000000,
          grossProfit: 147215000000,
          operatingExpense: 68085000000,
          operatingIncome: 79130000000,
          netIncome: 72361000000
        },
        balance: {
          totalAssets: 364840000000,
          totalLiabilities: 185200000000,
          totalEquity: 179640000000,
          cash: 111255000000,
          debt: 75189000000
        },
        cashFlow: {
          operatingCashFlow: 87650000000,
          capitalExpenditures: -23886000000,
          freeCashFlow: 63764000000
        }
      }
    };
    
    // 新闻数据示例
    this.mockData['news_aapl'] = [
      {
        title: "Apple Unveils New iPhone with Revolutionary AI Features",
        date: "2024-05-10",
        source: "TechCrunch",
        sentiment: "positive",
        url: "https://example.com/apple-new-iphone"
      },
      {
        title: "Apple's Service Revenue Hits All-Time High",
        date: "2024-05-08",
        source: "CNBC",
        sentiment: "positive",
        url: "https://example.com/apple-service-revenue"
      },
      {
        title: "Apple Faces Regulatory Challenges in EU",
        date: "2024-05-05",
        source: "The Wall Street Journal",
        sentiment: "negative",
        url: "https://example.com/apple-eu-regulations"
      }
    ];
    
    this.mockData['news_msft'] = [
      {
        title: "Microsoft Cloud Business Exceeds Expectations",
        date: "2024-05-12",
        source: "Bloomberg",
        sentiment: "positive",
        url: "https://example.com/microsoft-cloud-growth"
      },
      {
        title: "Microsoft's AI Integration Boosts Office 365 Adoption",
        date: "2024-05-09",
        source: "Forbes",
        sentiment: "positive",
        url: "https://example.com/microsoft-ai-office"
      },
      {
        title: "Microsoft Announces New Surface Lineup",
        date: "2024-05-03",
        source: "The Verge",
        sentiment: "neutral",
        url: "https://example.com/microsoft-surface"
      }
    ];
  }
  
  /**
   * 生成随机价格数据
   */
  private generateRandomPriceData(
    ticker: string, 
    days: number = 180, 
    startPrice: number = 100, 
    endPrice: number = 120
  ): PriceData[] {
    const data: PriceData[] = [];
    const now = new Date();
    let currentPrice = startPrice;
    const priceRange = endPrice - startPrice;
    const dailyChange = priceRange / days;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(now.getDate() - (days - i));
      
      // 添加一些随机波动
      const randomFactor = 0.01 * (Math.random() - 0.5);
      currentPrice += dailyChange + (currentPrice * randomFactor);
      
      // 确保价格合理
      currentPrice = Math.max(currentPrice, startPrice * 0.7);
      currentPrice = Math.min(currentPrice, endPrice * 1.3);
      
      // 计算其他指标
      const open = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
      const high = Math.max(open, currentPrice) * (1 + Math.random() * 0.01);
      const low = Math.min(open, currentPrice) * (1 - Math.random() * 0.01);
      const volume = Math.floor(1000000 + Math.random() * 9000000);
      
      data.push({
        date: date.toISOString().split('T')[0],
        ticker,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(currentPrice.toFixed(2)),
        volume,
        change: parseFloat(((currentPrice - open) / open * 100).toFixed(2)),
        changePercent: parseFloat(((currentPrice - open) / open).toFixed(4))
      });
    }
    
    return data;
  }
  
  /**
   * 生成随机财务数据
   */
  private generateRandomFinancialData(ticker: string): FinancialData {
    const randomPositiveValue = (base: number) => base * (1 + (Math.random() * 0.5));
    const randomPercentage = () => parseFloat((Math.random() * 0.4).toFixed(4));
    const randomRatio = () => parseFloat((0.5 + Math.random() * 2).toFixed(2));
    
    return {
      ticker,
      period: 'TTM', // 过去12个月
      revenue: randomPositiveValue(10000000000),
      netIncome: randomPositiveValue(2500000000),
      eps: parseFloat((2 + Math.random() * 8).toFixed(2)),
      pe: parseFloat((15 + Math.random() * 25).toFixed(2)),
      pbv: parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)),
      roe: randomPercentage(),
      dividendYield: parseFloat((Math.random() * 0.03).toFixed(4)),
      debtToEquity: randomRatio(),
      currentRatio: randomRatio(),
      quickRatio: parseFloat((randomRatio() * 0.8).toFixed(2)),
      freeCashFlow: randomPositiveValue(3000000000),
      profitMargin: randomPercentage() * 0.8,
      revenueGrowth: randomPercentage() * 0.6,
      epsGrowth: parseFloat((randomPercentage() * 0.75 + 0.75).toFixed(2))
    };
  }

  /**
   * 生成随机新闻数据
   */
  private generateRandomNewsData(ticker: string, count: number = 10): NewsItem[] {
    const sources = ['Bloomberg', 'CNBC', 'WSJ', 'Reuters', 'Forbes', 'Financial Times'];
    const sentiments = ['positive', 'negative', 'neutral'];
    const topics = ['earnings', 'product', 'management', 'regulatory', 'market', 'competition'];
    
    const news: NewsItem[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i - Math.floor(Math.random() * 7));
      
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      let title = '';
      if (sentiment === 'positive') {
        title = [
          `${ticker} Reports Strong ${topic.charAt(0).toUpperCase() + topic.slice(1)} Performance`,
          `${ticker} Exceeds Market Expectations`,
          `Analysts Upgrade ${ticker} on Positive Outlook`,
          `${ticker} Announces Expansion Plans`
        ][Math.floor(Math.random() * 4)];
      } else if (sentiment === 'negative') {
        title = [
          `${ticker} Misses ${topic.charAt(0).toUpperCase() + topic.slice(1)} Targets`,
          `${ticker} Faces Challenges in Current Market`,
          `Analysts Downgrade ${ticker}`,
          `${ticker} Announces Restructuring`
        ][Math.floor(Math.random() * 4)];
      } else {
        title = [
          `${ticker} Reports Mixed Results`,
          `${ticker} Maintains Steady Course Despite Market Volatility`,
          `Analysts Hold Neutral Stance on ${ticker}`,
          `${ticker} Announces Strategic Partnership`
        ][Math.floor(Math.random() * 4)];
      }
      
      news.push({
        date: date.toISOString().split('T')[0],
        title,
        summary: `This is a summary of the news article about ${ticker}. The article discusses ${topic} and its impact on the company.`,
        source,
        url: `https://example.com/${ticker.toLowerCase()}-${topic}-${date.getTime()}`,
        sentiment
      });
    }
    
    return news;
  }

  /**
   * 获取最新价格
   */
  public async fetchLatestPrice(ticker: string): Promise<{ price: number; timestamp: string; change: number; changePercent: number }> {
    try {
      // 在实际实现中，这里应该调用真实的市场数据API
      // 目前使用模拟数据
      const basePrice = this.getBasePrice(ticker);
      const variation = (Math.random() - 0.5) * 0.05 * basePrice;
      const currentPrice = basePrice + variation;
      
      return {
        price: parseFloat(currentPrice.toFixed(2)),
        timestamp: new Date().toISOString(),
        change: parseFloat(variation.toFixed(2)),
        changePercent: parseFloat(((variation / basePrice) * 100).toFixed(2))
      };
    } catch (error) {
      logger.error(`获取${ticker}最新价格失败: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`获取${ticker}最新价格失败`);
    }
  }

  /**
   * 获取股票基准价格（模拟）
   */
  private getBasePrice(ticker: string): number {
    // 为常见股票代码分配固定的基准价格
    const basePrices: Record<string, number> = {
      'AAPL': 150.00,
      'MSFT': 300.00,
      'GOOGL': 120.00,
      'AMZN': 130.00,
      'META': 280.00,
      'TSLA': 220.00,
      'NVDA': 400.00,
      'BABA': 85.00,
      'TCEHY': 40.00,
      'BIDU': 120.00,
      'PDD': 90.00,
      'JD': 30.00
    };
    
    // 返回基准价格，如果不存在则生成一个随机的价格
    return basePrices[ticker] || 50 + Math.random() * 150;
  }
}

// 创建单例实例
const marketDataService = new MarketDataService();

export { marketDataService };
export default marketDataService; 