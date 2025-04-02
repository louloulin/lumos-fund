'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, ArrowUpRight, ArrowDownRight, RefreshCw, Zap } from 'lucide-react';

// 模拟市场数据类型
type MarketData = {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: Date;
  dataSource: 'realtime' | 'delayed' | 'simulated';
};

export function MarketDataService() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<number>(100);

  // 模拟连接到市场数据源
  const connectToDataSource = () => {
    setIsLoading(true);
    
    // 模拟连接延迟
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      
      // 添加一些初始数据
      setMarketData([
        {
          ticker: 'AAPL',
          price: 198.45,
          change: 2.34,
          changePercent: 1.23,
          volume: 29837492,
          lastUpdated: new Date(),
          dataSource: 'realtime'
        },
        {
          ticker: 'MSFT',
          price: 412.78,
          change: -3.22,
          changePercent: -0.78,
          volume: 18432798,
          lastUpdated: new Date(),
          dataSource: 'realtime'
        },
        {
          ticker: 'GOOGL',
          price: 145.23,
          change: 1.05,
          changePercent: 0.72,
          volume: 15234567,
          lastUpdated: new Date(),
          dataSource: 'realtime'
        }
      ]);
      
      // 设置自动刷新间隔（模拟实时数据更新）
      const interval = window.setInterval(refreshData, 5000);
      setRefreshInterval(interval);
      
      toast({
        title: "数据源连接成功",
        description: "已经成功连接到市场数据源",
      });
    }, 1500);
  };
  
  // 断开数据源连接
  const disconnectFromDataSource = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    setIsConnected(false);
    setMarketData([]);
    
    toast({
      title: "数据源已断开",
      description: "已断开与市场数据源的连接",
    });
  };
  
  // 模拟刷新数据
  const refreshData = () => {
    setMarketData(prev => 
      prev.map(stock => {
        // 随机生成价格变动
        const priceChange = (Math.random() * 2 - 1) * (stock.price * 0.005);
        const newPrice = +(stock.price + priceChange).toFixed(2);
        const newChange = +(stock.change + priceChange).toFixed(2);
        const newChangePercent = +((newChange / (stock.price - stock.change)) * 100).toFixed(2);
        
        // 模拟连接质量变化
        const qualityChange = Math.random() > 0.8 ? -Math.random() * 5 : 0;
        setConnectionQuality(prev => Math.max(70, Math.min(100, prev + qualityChange)));
        
        return {
          ...stock,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          lastUpdated: new Date(),
          volume: stock.volume + Math.floor(Math.random() * 10000)
        };
      })
    );
  };
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <LineChart className="mr-2 h-5 w-5" />
              市场数据服务
            </CardTitle>
            <CardDescription>连接到实时市场数据源</CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "outline"}>
            {isConnected ? "已连接" : "未连接"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {isConnected ? (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center text-sm mb-1">
                <span>连接质量</span>
                <span>{connectionQuality}%</span>
              </div>
              <Progress value={connectionQuality} className="h-2" />
            </div>
            
            <div className="space-y-4">
              {marketData.map((stock) => (
                <div key={stock.ticker} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <div className="font-medium flex items-center">
                      {stock.ticker}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {stock.dataSource === 'realtime' ? (
                          <Zap className="inline h-3 w-3 mr-1" />
                        ) : null}
                        {stock.dataSource}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      更新时间: {stock.lastUpdated.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">${stock.price.toFixed(2)}</div>
                    <div className={`text-xs flex items-center ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stock.change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-muted-foreground mb-4">
              未连接到市场数据源。点击下方按钮连接以获取实时市场数据。
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {isConnected ? (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              刷新数据
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={disconnectFromDataSource}
            >
              断开连接
            </Button>
          </>
        ) : (
          <Button 
            onClick={connectToDataSource} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "连接中..." : "连接到数据源"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 