'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { marketDataService, StockQuote } from '@/services/marketDataService';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface WatchlistItem {
  symbol: string;
  quote?: StockQuote;
  isLoading: boolean;
  error?: string;
}

export function RealTimeQuotes() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { symbol: 'AAPL', isLoading: true },
    { symbol: 'MSFT', isLoading: true },
    { symbol: 'GOOGL', isLoading: true },
    { symbol: 'AMZN', isLoading: true },
    { symbol: 'NVDA', isLoading: true }
  ]);
  const [newSymbol, setNewSymbol] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(60000); // 1分钟
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 初始化市场数据服务
  useEffect(() => {
    if (!isInitialized) {
      marketDataService.initialize()
        .then(() => {
          setIsInitialized(true);
          // 配置更新间隔
          marketDataService.updateConfig({ updateInterval });
        })
        .catch(error => {
          console.error('初始化市场数据服务失败:', error);
        });
    }
    
    return () => {
      // 组件卸载时移除事件监听器
      if (isInitialized) {
        marketDataService.removeAllListeners();
      }
    };
  }, [isInitialized, updateInterval]);

  // 加载股票数据
  useEffect(() => {
    if (!isInitialized) return;
    
    // 加载所有观察列表项目
    watchlist.forEach(item => {
      if (!item.quote) {
        fetchQuote(item.symbol);
      }
    });
    
    // 监听股票更新事件
    marketDataService.on('stock-quote-updated', (symbol: string, quote: StockQuote) => {
      setWatchlist(prev => 
        prev.map(item => 
          item.symbol === symbol 
            ? { ...item, quote, isLoading: false, error: undefined }
            : item
        )
      );
      setLastUpdated(new Date());
    });

    // 监听错误事件
    marketDataService.on('error', (error: Error) => {
      console.error('市场数据服务错误:', error);
    });
    
    // 每隔一段时间更新数据
    const intervalTimer = setInterval(() => {
      watchlist.forEach(item => {
        fetchQuote(item.symbol);
      });
    }, updateInterval);
    
    return () => {
      clearInterval(intervalTimer);
    };
  }, [watchlist, isInitialized, updateInterval]);

  // 获取股票报价
  const fetchQuote = async (symbol: string) => {
    try {
      setWatchlist(prev => 
        prev.map(item => 
          item.symbol === symbol 
            ? { ...item, isLoading: true }
            : item
        )
      );
      
      await marketDataService.fetchStockQuote(symbol);
    } catch (error) {
      console.error(`获取股票报价失败 (${symbol}):`, error);
      
      setWatchlist(prev => 
        prev.map(item => 
          item.symbol === symbol 
            ? { ...item, isLoading: false, error: '获取数据失败' }
            : item
        )
      );
    }
  };

  // 添加股票到观察列表
  const addToWatchlist = () => {
    if (!newSymbol.trim()) return;
    
    const symbol = newSymbol.trim().toUpperCase();
    
    // 检查是否已存在
    if (watchlist.some(item => item.symbol === symbol)) {
      alert(`股票 ${symbol} 已在观察列表中`);
      return;
    }
    
    // 添加到观察列表
    setWatchlist(prev => [...prev, { symbol, isLoading: true }]);
    setNewSymbol('');
    
    // 获取股票数据
    if (isInitialized) {
      fetchQuote(symbol);
    }
  };

  // 从观察列表中移除股票
  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
  };

  // 刷新所有股票
  const refreshAll = () => {
    watchlist.forEach(item => {
      fetchQuote(item.symbol);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <CardTitle>实时行情</CardTitle>
            <CardDescription>
              股票实时价格和变动
            </CardDescription>
          </div>
          
          <div className="flex items-center mt-4 sm:mt-0">
            <span className="text-xs text-muted-foreground mr-2">
              最后更新: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button size="sm" variant="outline" onClick={refreshAll}>
              刷新
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex mb-4">
          <Input
            placeholder="添加股票代码 (例如: AAPL)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="max-w-xs mr-2"
            onKeyDown={(e) => e.key === 'Enter' && addToWatchlist()}
          />
          <Button onClick={addToWatchlist}>添加</Button>
        </div>
        
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left whitespace-nowrap p-2 font-medium">股票代码</th>
                <th className="text-right whitespace-nowrap p-2 font-medium">价格</th>
                <th className="text-right whitespace-nowrap p-2 font-medium">涨跌幅</th>
                <th className="text-right whitespace-nowrap p-2 font-medium">变动</th>
                <th className="text-right whitespace-nowrap p-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted-foreground">
                    观察列表为空
                  </td>
                </tr>
              ) : (
                watchlist.map((item) => (
                  <tr key={item.symbol} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-2 font-medium">
                      {item.symbol}
                    </td>
                    <td className="p-2 text-right">
                      {item.isLoading ? (
                        <span className="inline-block w-16 h-4 bg-muted animate-pulse rounded"></span>
                      ) : item.error ? (
                        <span className="text-destructive">错误</span>
                      ) : (
                        formatCurrency(item.quote?.price || 0)
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {item.isLoading ? (
                        <span className="inline-block w-16 h-4 bg-muted animate-pulse rounded"></span>
                      ) : item.error ? (
                        <span className="text-destructive">-</span>
                      ) : (
                        <Badge className={`
                          ${item.quote?.changePercent && item.quote.changePercent >= 0 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                          } font-medium border-0
                        `}>
                          {formatPercent(Math.abs((item.quote?.changePercent || 0) / 100))}
                          {item.quote?.changePercent && item.quote.changePercent >= 0 ? ' ↑' : ' ↓'}
                        </Badge>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {item.isLoading ? (
                        <span className="inline-block w-16 h-4 bg-muted animate-pulse rounded"></span>
                      ) : item.error ? (
                        <span className="text-destructive">-</span>
                      ) : (
                        <span className={item.quote?.change && item.quote.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.quote?.change && item.quote.change >= 0 ? '+' : ''}
                          {formatCurrency(item.quote?.change || 0)}
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromWatchlist(item.symbol)}
                        className="h-8 px-2"
                      >
                        删除
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground">
          注：数据每 {updateInterval / 1000} 秒自动更新一次
        </div>
      </CardContent>
    </Card>
  );
} 