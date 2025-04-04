import { createLogger } from '@/lib/logger.server';

const logger = createLogger('mockMarketDataService');

/**
 * 模拟市场数据接口
 */
export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change?: number;
  changePercent?: number;
}

/**
 * 模拟市场数据服务
 * 提供测试时使用的模拟股票、财务和新闻数据
 */
export class MockMarketDataService {
  private initialized: boolean = false;
  private mockData: Record<string, any> = {};
  
  /**
   * 初始化市场数据服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    logger.info('初始化模拟市场数据服务');
    
    // 预加载一些模拟数据
    this.loadMockData();
    
    this.initialized = true;
    logger.info('模拟市场数据服务初始化完成');
  }
  
  /**
   * 获取股票价格历史数据
   */
  async fetchStockPriceHistory(ticker: string, period: string = '1y'): Promise<any[]> {
    logger.info('获取股票价格历史', { ticker, period });
    
    // 检查初始化状态
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 返回模拟数据
    const mockKey = `price_${ticker.toLowerCase()}`;
    if (this.mockData[mockKey]) {
      return this.mockData[mockKey];
    }
    
    // 如果没有指定股票的数据，生成一些随机数据
    return this.generateRandomPriceData(ticker, 180); // 半年数据
  }
  
  /**
   * 获取财务数据
   */
  async fetchFinancialData(ticker: string): Promise<any> {
    logger.info('获取财务数据', { ticker });
    
    // 检查初始化状态
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 返回模拟数据
    const mockKey = `financial_${ticker.toLowerCase()}`;
    if (this.mockData[mockKey]) {
      return this.mockData[mockKey];
    }
    
    // 如果没有指定股票的数据，生成一些随机数据
    return this.generateRandomFinancialData(ticker);
  }
  
  /**
   * 获取新闻数据
   */
  async fetchNewsData(ticker: string, limit: number = 10): Promise<any[]> {
    logger.info('获取新闻数据', { ticker, limit });
    
    // 检查初始化状态
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 返回模拟数据
    const mockKey = `news_${ticker.toLowerCase()}`;
    if (this.mockData[mockKey]) {
      return this.mockData[mockKey].slice(0, limit);
    }
    
    // 如果没有指定股票的数据，生成一些随机数据
    return this.generateRandomNewsData(ticker, limit);
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
    const data = [];
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
  private generateRandomFinancialData(ticker: string): any {
    const randomPositiveValue = (base: number) => base * (1 + (Math.random() * 0.5));
    const randomPercentage = () => parseFloat((Math.random() * 0.4).toFixed(4));
    const randomRatio = () => parseFloat((0.5 + Math.random() * 2).toFixed(2));
    
    return {
      symbol: ticker,
      name: `${ticker} Corporation`,
      sector: ['Technology', 'Healthcare', 'Consumer', 'Financial', 'Industrial'][Math.floor(Math.random() * 5)],
      industry: 'General',
      metrics: {
        pe: parseFloat((15 + Math.random() * 25).toFixed(2)),
        eps: parseFloat((2 + Math.random() * 8).toFixed(2)),
        roe: randomPercentage(),
        roa: randomPercentage() * 0.6,
        debtToEquity: randomRatio(),
        currentRatio: randomRatio(),
        revenueGrowth: randomPercentage() * 0.6,
        profitMargin: randomPercentage() * 0.8,
        dividend: parseFloat((Math.random() * 0.03).toFixed(4))
      },
      statements: {
        income: {
          revenue: randomPositiveValue(10000000000),
          costOfRevenue: randomPositiveValue(5000000000),
          grossProfit: randomPositiveValue(5000000000),
          operatingExpense: randomPositiveValue(2000000000),
          operatingIncome: randomPositiveValue(3000000000),
          netIncome: randomPositiveValue(2500000000)
        },
        balance: {
          totalAssets: randomPositiveValue(20000000000),
          totalLiabilities: randomPositiveValue(10000000000),
          totalEquity: randomPositiveValue(10000000000),
          cash: randomPositiveValue(3000000000),
          debt: randomPositiveValue(5000000000)
        },
        cashFlow: {
          operatingCashFlow: randomPositiveValue(4000000000),
          capitalExpenditures: -randomPositiveValue(1000000000),
          freeCashFlow: randomPositiveValue(3000000000)
        }
      }
    };
  }
  
  /**
   * 生成随机新闻数据
   */
  private generateRandomNewsData(ticker: string, count: number = 10): any[] {
    const sources = ['Bloomberg', 'CNBC', 'WSJ', 'Reuters', 'Forbes', 'Financial Times'];
    const sentiments: Array<'positive' | 'negative' | 'neutral'> = ['positive', 'negative', 'neutral'];
    const topics = ['earnings', 'product', 'management', 'regulatory', 'market', 'competition'];
    
    const news = [];
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
} 