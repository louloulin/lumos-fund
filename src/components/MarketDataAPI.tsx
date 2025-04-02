'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/utils';

// 定义市场数据API类型
interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  dividend: number;
  eps: number;
  high52: number;
  low52: number;
  open: number;
  previousClose: number;
  timestamp: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// 模拟市场数据获取
const fetchStockData = async (symbol: string): Promise<StockData> => {
  // 在实际项目中，这里应该调用真实的API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        symbol,
        price: 180.25 + Math.random() * 10,
        change: 2.35 * (Math.random() > 0.3 ? 1 : -1),
        changePercent: 1.32 * (Math.random() > 0.3 ? 1 : -1),
        volume: 25436789,
        marketCap: 2890000000000,
        pe: 28.5,
        dividend: 0.82,
        eps: 6.15,
        high52: 198.23,
        low52: 142.18,
        open: 178.90,
        previousClose: 177.90,
        timestamp: new Date().toISOString(),
      });
    }, 500);
  });
};

const fetchMarketNews = async (symbol?: string): Promise<NewsItem[]> => {
  // 在实际项目中，这里应该调用真实的API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          title: `${symbol || '市场'} 在最新财报发布后股价上涨`,
          summary: '公司最新季度财报显示收入超出市场预期，股价因此上涨超过3%...',
          url: '#',
          source: '财经网',
          publishedAt: new Date().toISOString(),
          sentiment: 'positive',
        },
        {
          id: '2',
          title: '分析师看好科技股未来发展',
          summary: '多家投行分析师发布报告，看好科技股未来6个月表现，特别是人工智能相关领域...',
          url: '#',
          source: '市场观察',
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
          sentiment: 'positive',
        },
        {
          id: '3',
          title: '美联储政策引发市场担忧',
          summary: '美联储最新政策声明暗示可能维持高利率更长时间，引发市场对经济增长放缓的担忧...',
          url: '#',
          source: '经济日报',
          publishedAt: new Date(Date.now() - 172800000).toISOString(),
          sentiment: 'negative',
        },
      ]);
    }, 700);
  });
};

// 股票数据展示组件
function StockDataDisplay({ data }: { data: StockData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold">{data.symbol}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatCurrency(data.price)}</span>
            <span className={`text-lg ${data.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {data.change >= 0 ? '+' : ''}{formatCurrency(data.change)} ({formatPercent(data.changePercent / 100)})
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            最后更新: {formatDate(data.timestamp)}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">开盘价</p>
            <p className="text-base font-medium">{formatCurrency(data.open)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">前收盘价</p>
            <p className="text-base font-medium">{formatCurrency(data.previousClose)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">52周最高</p>
            <p className="text-base font-medium">{formatCurrency(data.high52)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">52周最低</p>
            <p className="text-base font-medium">{formatCurrency(data.low52)}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">成交量</p>
            <p className="text-base font-medium">{formatNumber(data.volume)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">市值</p>
            <p className="text-base font-medium">{formatCurrency(data.marketCap)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">市盈率</p>
            <p className="text-base font-medium">{formatNumber(data.pe, 2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">每股收益</p>
            <p className="text-base font-medium">{formatCurrency(data.eps)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">股息率</p>
            <p className="text-base font-medium">{formatPercent(data.dividend / 100)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 新闻展示组件
function NewsDisplay({ news }: { news: NewsItem[] }) {
  return (
    <div className="space-y-4">
      {news.map((item) => (
        <div key={item.id} className="border-b pb-4 last:border-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">{item.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${
              item.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
              item.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {item.sentiment === 'positive' ? '正面' :
               item.sentiment === 'negative' ? '负面' : '中性'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{item.summary}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">
              {item.source} · {formatDate(item.publishedAt)}
            </span>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary">
              阅读更多
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// 数据源选择组件
function DataSourceSelector() {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">数据提供商</label>
        <Select defaultValue="alpha-vantage">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择数据提供商" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alpha-vantage">Alpha Vantage</SelectItem>
            <SelectItem value="yahoo-finance">Yahoo Finance</SelectItem>
            <SelectItem value="finnhub">Finnhub</SelectItem>
            <SelectItem value="tiingo">Tiingo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium">数据更新频率</label>
        <Select defaultValue="realtime">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择更新频率" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="realtime">实时</SelectItem>
            <SelectItem value="1min">每分钟</SelectItem>
            <SelectItem value="5min">每5分钟</SelectItem>
            <SelectItem value="15min">每15分钟</SelectItem>
            <SelectItem value="1h">每小时</SelectItem>
            <SelectItem value="eod">每日收盘</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium">API密钥</label>
        <Input type="password" placeholder="输入API密钥" />
      </div>
      
      <Button className="w-full">保存设置</Button>
    </div>
  );
}

export function MarketDataAPI() {
  const [symbol, setSymbol] = useState('AAPL');
  const [inputSymbol, setInputSymbol] = useState('AAPL');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stock-data');
  
  const handleSearch = async () => {
    setIsLoading(true);
    setSymbol(inputSymbol);
    
    try {
      const data = await fetchStockData(inputSymbol);
      setStockData(data);
      
      const newsData = await fetchMarketNews(inputSymbol);
      setNews(newsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>市场数据</CardTitle>
        <CardDescription>
          获取实时市场数据和新闻
        </CardDescription>
        
        <div className="flex mt-4">
          <Input
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value)}
            placeholder="输入股票代码"
            className="mr-2"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
          >
            {isLoading ? '加载中...' : '搜索'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="stock-data">股票数据</TabsTrigger>
            <TabsTrigger value="news">相关新闻</TabsTrigger>
            <TabsTrigger value="settings">数据源设置</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stock-data">
            {stockData ? (
              <StockDataDisplay data={stockData} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isLoading ? '加载中...' : '请输入股票代码并点击搜索'}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="news">
            {news.length > 0 ? (
              <NewsDisplay news={news} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isLoading ? '加载中...' : '无相关新闻'}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings">
            <DataSourceSelector />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 