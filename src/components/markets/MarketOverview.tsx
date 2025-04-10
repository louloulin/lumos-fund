'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart4Icon,
  NewspaperIcon,
  AlertCircleIcon
} from 'lucide-react';
import { 
  MarketOverview as MarketOverviewType,
  MarketNews
} from '@/services/realTimeMarketDataService';
import { marketDataServiceFactory } from '@/services/marketDataServiceFactory';
import { getCurrentMarketDataMode } from '@/actions/market-data-settings';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"

// 保留原始的模拟数据，以备服务初始化失败或数据加载中时使用
const mockIndexData = [
  { name: "沪深300", value: 3764.32, change: 0.76 },
  { name: "上证指数", value: 2968.45, change: 0.54 },
  { name: "创业板", value: 1892.17, change: -0.32 },
  { name: "科创50", value: 872.56, change: 1.21 }
]

const mockNewsData = [
  { title: "央行宣布降息0.25个百分点", time: "10:30", sentiment: "positive" },
  { title: "美联储可能继续维持高利率", time: "09:15", sentiment: "negative" },
  { title: "科技股普遍回调", time: "11:20", sentiment: "negative" },
  { title: "新能源汽车销量持续走高", time: "14:05", sentiment: "positive" }
]

const mockTrendingStocks = [
  { symbol: "600519", name: "贵州茅台", price: 1876.50, change: 2.34 },
  { symbol: "300750", name: "宁德时代", price: 243.75, change: -1.26 },
  { symbol: "601318", name: "中国平安", price: 46.82, change: 0.87 },
  { symbol: "000858", name: "五粮液", price: 168.23, change: 1.53 },
  { symbol: "600036", name: "招商银行", price: 34.58, change: 0.63 }
]

const mockChartData = [
  { time: "09:30", value: 3740 },
  { time: "10:00", value: 3745 },
  { time: "10:30", value: 3752 },
  { time: "11:00", value: 3749 },
  { time: "11:30", value: 3755 },
  { time: "13:00", value: 3760 },
  { time: "13:30", value: 3758 },
  { time: "14:00", value: 3763 },
  { time: "14:30", value: 3764 },
  { time: "15:00", value: 3764 }
]

export function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketOverviewType | null>(null);
  const [marketNews, setMarketNews] = useState<MarketNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('indices');
  const [dataMode, setDataMode] = useState<'simulation' | 'live'>('simulation');
  const [serviceError, setServiceError] = useState<string | null>(null);

  useEffect(() => {
    initializeAndLoadData();
  }, []);

  const initializeAndLoadData = async () => {
    try {
      setIsLoading(true);
      setServiceError(null);
      
      // 获取当前数据模式
      const currentMode = await getCurrentMarketDataMode();
      setDataMode(currentMode);
      
      // 初始化市场数据服务
      const marketDataService = marketDataServiceFactory.getService();
      const initialized = await marketDataService.initialize();
      
      if (initialized) {
        // 加载市场概览数据
        await fetchMarketData();
        
        // 加载市场新闻
        await fetchMarketNews();
      } else {
        setServiceError('无法初始化市场数据服务');
        console.error('无法初始化市场数据服务');
      }
    } catch (error) {
      setServiceError('加载市场数据失败');
      console.error('加载市场数据失败', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const marketDataService = marketDataServiceFactory.getService();
      const overview = await marketDataService.getMarketOverview();
      setMarketData(overview);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('获取市场概览数据失败', error);
    }
  };

  const fetchMarketNews = async () => {
    try {
      const marketDataService = marketDataServiceFactory.getService();
      const news = await marketDataService.getMarketNews();
      setMarketNews(news);
    } catch (error) {
      console.error('获取市场新闻失败', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchMarketData();
      await fetchMarketNews();
    } catch (error) {
      console.error('刷新市场数据失败', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderChangeValue = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;
    const color = isPositive ? 'text-green-500' : 'text-red-500';
    
    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{change.toFixed(2)}</span>
        <span className="ml-1">({Math.abs(changePercent).toFixed(2)}%)</span>
      </div>
    );
  };

  const renderIndices = () => {
    if (!marketData) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {marketData.indices.map((index, i) => (
          <Card key={`index-${i}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{index.name}</CardTitle>
              <CardDescription>{index.symbol}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">
                  {index.value.toFixed(2)}
                </div>
                {renderChangeValue(index.change, index.changePercent)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderStockList = (
    title: string, 
    description: string, 
    stocks: any[], 
    renderExtraInfo?: (stock: any) => React.ReactNode
  ) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stocks.map((stock, i) => (
              <div 
                key={`stock-${i}`} 
                className="flex justify-between items-center p-2 hover:bg-muted rounded-md"
              >
                <div>
                  <div className="font-medium">{stock.symbol}</div>
                  {renderExtraInfo && renderExtraInfo(stock)}
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-bold">{stock.price.toFixed(2)}</div>
                  {stock.change !== undefined && (
                    renderChangeValue(stock.change, stock.changePercent)
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTopGainers = () => {
    if (!marketData) return null;
    
    return renderStockList(
      '涨幅最大', 
      '今日表现最佳的股票', 
      marketData.topGainers
    );
  };

  const renderTopLosers = () => {
    if (!marketData) return null;
    
    return renderStockList(
      '跌幅最大', 
      '今日表现最差的股票', 
      marketData.topLosers
    );
  };

  const renderMostActive = () => {
    if (!marketData) return null;
    
    return renderStockList(
      '成交最活跃', 
      '今日交易量最大的股票', 
      marketData.mostActive,
      (stock) => (
        <div className="text-sm text-muted-foreground">
          成交量: {(stock.volume / 1000000).toFixed(2)}M
        </div>
      )
    );
  };

  const renderMarketNews = () => {
    if (marketNews.length === 0) return null;
    
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>市场新闻</CardTitle>
          <CardDescription>最新市场动态和公司新闻</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketNews.map((news, i) => (
              <div key={`news-${i}`} className="border-b last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 mt-1 flex items-center justify-center rounded-full bg-primary/10">
                    <NewspaperIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{news.headline}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{news.summary}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline">{news.source}</Badge>
                      {news.relatedSymbols.map((symbol, j) => (
                        <Badge key={`symbol-${j}`} variant="secondary">{symbol}</Badge>
                      ))}
                      <Badge variant={
                        news.sentiment === 'positive' ? 'secondary' : 
                        news.sentiment === 'negative' ? 'destructive' : 
                        'outline'
                      }>
                        {news.sentiment === 'positive' ? '利好' : 
                         news.sentiment === 'negative' ? '利空' : '中性'}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(news.timestamp).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLoading = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={`skeleton-${i}`}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-5 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`list-skeleton-${i}`} className="flex justify-between items-center p-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`list-skeleton-${i+5}`} className="flex justify-between items-center p-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>市场概览</CardTitle>
            <CardDescription className="mt-1">
              今日主要指数表现和市场热点
              {dataMode === 'simulation' && (
                <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  模拟数据
                </span>
              )}
              {dataMode === 'live' && (
                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  实时数据
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCwIcon className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? '正在刷新...' : '刷新'}</span>
          </Button>
        </CardHeader>
        <CardContent>
          {serviceError && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center">
              <AlertCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">{serviceError}</p>
                <p className="text-sm mt-1">使用模拟数据展示</p>
              </div>
            </div>
          )}
          
          {isLoading ? (
            renderLoading()
          ) : (
            <>
              {/* 实际数据的展示 */}
              {marketData && (
                <div className="space-y-6">
                  {renderIndices()}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTopGainers()}
                    {renderTopLosers()}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderMostActive()}
                    {marketNews.length > 0 && renderMarketNews()}
                  </div>
                </div>
              )}
              
              {/* 如果没有实际数据，显示模拟数据 */}
              {!marketData && (
                <Tabs defaultValue="indices" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="indices">主要指数</TabsTrigger>
                    <TabsTrigger value="news">市场新闻</TabsTrigger>
                    <TabsTrigger value="trending">热门股票</TabsTrigger>
                  </TabsList>
                  <TabsContent value="indices" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {mockIndexData.map((index) => (
                        <Card key={index.name}>
                          <CardContent className="p-4">
                            <div className="text-sm font-medium">{index.name}</div>
                            <div className="text-2xl font-bold">{index.value}</div>
                            <div className={`text-sm ${index.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {index.change >= 0 ? '+' : ''}{index.change}%
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="h-[300px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={mockChartData}
                          margin={{
                            top: 5,
                            right: 10,
                            left: 10,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  <TabsContent value="news" className="space-y-4">
                    {mockNewsData.map((news, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b">
                        <div>
                          <div className="font-medium">{news.title}</div>
                          <div className="text-sm text-muted-foreground">{news.time}</div>
                        </div>
                        <Badge variant={news.sentiment === "positive" ? "default" : "destructive"}>
                          {news.sentiment === "positive" ? "利好" : "利空"}
                        </Badge>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="trending" className="space-y-4">
                    <div className="space-y-2">
                      {mockTrendingStocks.map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <div className="font-medium">{stock.name}</div>
                            <div className="text-sm text-muted-foreground">{stock.symbol}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{stock.price}</div>
                            <div className={`text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.change}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
              
              {lastUpdated && (
                <div className="mt-6 text-xs text-muted-foreground text-right">
                  最后更新: {lastUpdated.toLocaleString()}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 