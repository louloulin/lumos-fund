'use client';

import { useState, useEffect } from 'react';
import { MarketDataAPI } from '@/components/MarketDataAPI';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils';

// 定义市场数据类型
interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface SectorData {
  name: string;
  performance: number;
  volume: number;
}

interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

interface MarketNews {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  url: string;
  sentiment: string;
}

interface MarketData {
  indices?: MarketIndex[];
  sectors?: SectorData[];
  topGainers?: MarketMover[];
  topLosers?: MarketMover[];
  mostActive?: MarketMover[];
  marketNews?: MarketNews[];
}

// 获取市场数据
async function fetchMarketData(endpoint: string) {
  try {
    const res = await fetch(`/api/market?endpoint=${endpoint}`);
    if (!res.ok) {
      throw new Error('Failed to fetch market data');
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching market data:', error);
    return {};
  }
}

export default function MarketPage() {
  const [marketData, setMarketData] = useState<MarketData>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      const [indicesData, sectorsData, moversData, newsData] = await Promise.all([
        fetchMarketData('indices'),
        fetchMarketData('sectors'),
        fetchMarketData('movers'),
        fetchMarketData('news'),
      ]);
      
      setMarketData({
        indices: indicesData.indices,
        sectors: sectorsData.sectors,
        topGainers: moversData.topGainers,
        topLosers: moversData.topLosers,
        mostActive: moversData.mostActive,
        marketNews: newsData.marketNews,
      });
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">市场概览</h1>
        <p className="text-muted-foreground mt-1">
          实时市场数据和行情分析
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <div className="text-lg text-muted-foreground">加载市场数据中...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketData.indices?.slice(0, 3).map((index) => (
              <Card key={index.symbol}>
                <CardHeader className="pb-2">
                  <CardTitle>{index.name}</CardTitle>
                  <CardDescription>{index.symbol}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{formatCurrency(index.value, 'USD')}</span>
                    <span className={`text-lg ${index.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({formatPercent(index.changePercent / 100)})
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">市场概览</TabsTrigger>
              <TabsTrigger value="sectors">行业板块</TabsTrigger>
              <TabsTrigger value="movers">涨跌榜</TabsTrigger>
              <TabsTrigger value="news">市场新闻</TabsTrigger>
              <TabsTrigger value="lookup">股票查询</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>全球指数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {marketData.indices?.map((index) => (
                        <div key={index.symbol} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                          <div>
                            <div className="font-medium">{index.name}</div>
                            <div className="text-sm text-muted-foreground">{index.symbol}</div>
                          </div>
                          <div className="space-y-1 text-right">
                            <div>{formatCurrency(index.value, 'USD')}</div>
                            <div className={`text-sm ${index.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({formatPercent(index.changePercent / 100)})
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>市场新闻</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {marketData.marketNews?.slice(0, 5).map((news) => (
                        <div key={news.id} className="border-b pb-3 last:border-0">
                          <div className="flex items-start justify-between">
                            <a 
                              href={news.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-base font-medium hover:underline"
                            >
                              {news.title}
                            </a>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              news.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                              news.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {news.sentiment === 'positive' ? '正面' :
                              news.sentiment === 'negative' ? '负面' : '中性'}
                            </span>
                          </div>
                          <div className="flex text-xs text-muted-foreground mt-1">
                            <span>{news.source}</span>
                            <span className="mx-1">•</span>
                            <span>{new Date(news.timestamp).toLocaleString('zh-CN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="sectors">
              <Card>
                <CardHeader>
                  <CardTitle>行业板块表现</CardTitle>
                  <CardDescription>各行业今日表现和成交量</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {marketData.sectors?.map((sector) => (
                      <div 
                        key={sector.name} 
                        className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50"
                      >
                        <div className="font-medium">{sector.name}</div>
                        <div className="flex flex-col items-end">
                          <span className={`font-medium ${sector.performance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            成交量: {(sector.volume / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="movers">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>涨幅榜</CardTitle>
                    <CardDescription>今日涨幅最大的股票</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {marketData.topGainers?.map((stock) => (
                        <div key={stock.symbol} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                          <div>
                            <div className="font-medium">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground">{stock.name}</div>
                          </div>
                          <div className="space-y-1 text-right">
                            <div>{formatCurrency(stock.price)}</div>
                            <div className="text-sm text-green-500">
                              +{stock.change.toFixed(2)} ({formatPercent(stock.changePercent / 100)})
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>跌幅榜</CardTitle>
                    <CardDescription>今日跌幅最大的股票</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {marketData.topLosers?.map((stock) => (
                        <div key={stock.symbol} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                          <div>
                            <div className="font-medium">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground">{stock.name}</div>
                          </div>
                          <div className="space-y-1 text-right">
                            <div>{formatCurrency(stock.price)}</div>
                            <div className="text-sm text-red-500">
                              {stock.change.toFixed(2)} ({formatPercent(stock.changePercent / 100)})
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>活跃榜</CardTitle>
                    <CardDescription>今日成交量最大的股票</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {marketData.mostActive?.map((stock) => (
                        <div key={stock.symbol} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                          <div>
                            <div className="font-medium">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground">{stock.name}</div>
                          </div>
                          <div className="space-y-1 text-right">
                            <div>{formatCurrency(stock.price)}</div>
                            <div className="text-xs text-muted-foreground">
                              成交量: {(stock.volume ? stock.volume / 1000000 : 0).toFixed(1)}M
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="news">
              <Card>
                <CardHeader>
                  <CardTitle>市场新闻</CardTitle>
                  <CardDescription>最新财经新闻和市场动态</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {marketData.marketNews?.map((news) => (
                      <div key={news.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start justify-between">
                          <a 
                            href={news.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-lg font-medium hover:underline"
                          >
                            {news.title}
                          </a>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            news.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                            news.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {news.sentiment === 'positive' ? '正面' :
                            news.sentiment === 'negative' ? '负面' : '中性'}
                          </span>
                        </div>
                        <div className="flex text-sm text-muted-foreground mt-2">
                          <span className="font-medium">{news.source}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(news.timestamp).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="lookup">
              <MarketDataAPI />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 