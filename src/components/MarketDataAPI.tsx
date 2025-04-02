'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, LineChart, TrendingUp, Clock, Newspaper, Loader2 } from 'lucide-react';
import { marketDataService, StockData, NewsItem } from '@/services/marketDataService';

export function MarketDataAPI() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [marketNews, setMarketNews] = useState<NewsItem[]>([]);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化市场数据服务
  useEffect(() => {
    if (!isInitialized) {
      marketDataService.initialize()
        .then(() => {
          setIsInitialized(true);
          fetchMarketNews();
        })
        .catch(error => {
          console.error('初始化市场数据服务失败:', error);
          setDataFetchError('无法初始化市场数据服务');
        });
    }
    
    return () => {
      // 组件卸载时移除事件监听器
      if (isInitialized) {
        marketDataService.removeAllListeners();
      }
    };
  }, [isInitialized]);

  // 获取特定股票数据
  const fetchStockData = async (symbol: string) => {
    if (!symbol.trim()) return;
    
    setIsLoading(true);
    setDataFetchError(null);
    
    try {
      const data = await marketDataService.fetchStockData(symbol.toUpperCase());
      setStockData(data);
    } catch (error) {
      console.error('获取股票数据失败:', error);
      setDataFetchError('获取数据失败，请检查股票代码是否正确');
      setStockData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取市场新闻
  const fetchMarketNews = async () => {
    try {
      const overview = await marketDataService.fetchMarketOverview();
      setMarketNews(overview.marketNews);
    } catch (error) {
      console.error('获取市场新闻失败:', error);
    }
  };

  // 处理搜索表单提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchStockData(searchQuery);
    }
  };

  // 格式化大数字
  const formatLargeNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            市场数据查询
          </CardTitle>
          <CardDescription>
            查询特定股票的市场数据和相关信息
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <Input
              type="text"
              placeholder="输入股票代码 (例如: AAPL)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  加载中...
                </>
              ) : (
                '查询'
              )}
            </Button>
          </form>
          
          {dataFetchError && (
            <div className="p-4 mb-6 bg-destructive/10 text-destructive rounded-md">
              {dataFetchError}
            </div>
          )}
          
          {stockData && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{stockData.name} ({stockData.symbol})</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">${stockData.price.toFixed(2)}</span>
                    <span className={`flex items-center ${stockData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    最后更新: {formatDate(stockData.timestamp)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">市值</div>
                    <div className="font-medium">${formatLargeNumber(stockData.marketCap)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">交易量</div>
                    <div className="font-medium">{formatLargeNumber(stockData.volume)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">市盈率</div>
                    <div className="font-medium">{stockData.pe.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">开盘价</div>
                    <div className="font-medium">${stockData.open.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">最高价</div>
                    <div className="font-medium">${stockData.high.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">最低价</div>
                    <div className="font-medium">${stockData.low.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  价格表现
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-sm text-muted-foreground">52周最高</div>
                    <div className="font-medium">${stockData.high52.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-sm text-muted-foreground">52周最低</div>
                    <div className="font-medium">${stockData.low52.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-sm text-muted-foreground">EPS</div>
                    <div className="font-medium">${stockData.eps.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-sm text-muted-foreground">股息收益率</div>
                    <div className="font-medium">{stockData.dividendYield.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <Newspaper className="mr-2 h-4 w-4" />
              市场新闻
            </h4>
            
            {marketNews.length > 0 ? (
              <div className="space-y-3">
                {marketNews.map((news) => (
                  <div key={news.id} className="p-3 border rounded-md">
                    <h5 className="font-semibold">{news.title}</h5>
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{news.source}</span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDate(news.timestamp)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        news.sentiment === 'positive' 
                          ? 'bg-green-100 text-green-800' 
                          : news.sentiment === 'negative'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {news.sentiment === 'positive' 
                          ? '看涨' 
                          : news.sentiment === 'negative'
                            ? '看跌'
                            : '中性'
                        }
                      </span>
                      <a 
                        href={news.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        阅读更多
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isInitialized ? '暂无新闻数据' : '正在加载市场新闻...'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 