"use client";

import { useState, useEffect } from 'react';
import { FaShoppingCart, FaChartLine, FaHistory, FaRobot, FaSpinner, FaChartBar } from 'react-icons/fa';
import { getStockAnalysis, getMarketInsights } from '@/actions/mastra';
import { runValueBacktest, runTechnicalBacktest, runSentimentBacktest, runMixedBacktest, runRiskBacktest, type BacktestResult } from '@/actions/backtest';
import { useSearchParams } from 'next/navigation';

// 标签页组件
function Tabs({ tabs, activeTab, setActiveTab }: { tabs: {id: string, label: string, icon: any}[], activeTab: string, setActiveTab: (id: string) => void }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`flex items-center px-4 py-2 -mb-px text-sm font-medium ${
            activeTab === tab.id
              ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <tab.icon className="mr-2" size={16} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// 交易中心子标签页配置
const tradingSubTabs = [
  { id: 'trade', label: '买入/卖出', icon: FaShoppingCart },
  { id: 'ai', label: 'AI智能分析', icon: FaRobot },
  { id: 'orders', label: '订单历史', icon: FaHistory },
  { id: 'market', label: '行情数据', icon: FaChartLine },
  { id: 'backtest', label: '策略回测', icon: FaChartBar }
];

// AI分析结果组件
function AIAnalysisResult({ analysis, loading }: { analysis: string | null, loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <FaSpinner className="animate-spin text-indigo-600 mr-2" size={24} />
        <span>AI正在分析中，请稍候...</span>
      </div>
    );
  }
  
  if (!analysis) {
    return (
      <div className="text-center p-10 text-gray-500">
        请在左侧输入股票代码并点击"AI分析"按钮
      </div>
    );
  }
  
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>') }} />
    </div>
  );
}

// 市场洞察组件
function MarketInsights({ insights, loading }: { insights: string | null, loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <FaSpinner className="animate-spin text-indigo-600 mr-2" size={20} />
        <span>加载市场洞察中...</span>
      </div>
    );
  }
  
  if (!insights) {
    return (
      <div className="text-center p-6 text-gray-500">
        暂无市场洞察数据
      </div>
    );
  }
  
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <div dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br/>') }} />
    </div>
  );
}

// 订单历史项
function OrderHistoryItem({ date, type, symbol, price, quantity, status }: 
  { date: string, type: string, symbol: string, price: string, quantity: string, status: string }) {
  return (
    <div className="grid grid-cols-6 py-3 border-b border-gray-100 dark:border-gray-700">
      <div>{date}</div>
      <div className={`${
        type === '买入' ? 'text-green-500' : 'text-red-500'
      } font-medium`}>
        {type}
      </div>
      <div>{symbol}</div>
      <div>{price}</div>
      <div>{quantity}</div>
      <div className={`${
        status === '已完成' ? 'text-green-500' :
        status === '进行中' ? 'text-blue-500' : 
        status === '已取消' ? 'text-red-500' : 
        'text-gray-500'
      }`}>
        {status}
      </div>
    </div>
  );
}

// 市场数据项
function MarketDataItem({ symbol, name, price, change, volume }: 
  { symbol: string, name: string, price: string, change: string, volume: string }) {
  const isPositive = !change.startsWith('-');
  
  return (
    <div className="grid grid-cols-5 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className="font-medium">{symbol}</div>
      <div>{name}</div>
      <div>{price}</div>
      <div className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {change}
      </div>
      <div>{volume}</div>
    </div>
  );
}

// 回测组件
function BacktestTab() {
  const [ticker, setTicker] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2022-01-01');
  const [endDate, setEndDate] = useState<string>('2023-01-01');
  const [initialCapital, setInitialCapital] = useState<string>('10000');
  const [strategyType, setStrategyType] = useState<string>('technical');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async () => {
    if (!ticker) {
      alert('请输入股票代码');
      return;
    }

    setIsLoading(true);
    setBacktestResult(null);
    setError(null);

    try {
      let result: BacktestResult;
      const capital = parseInt(initialCapital, 10);
      
      // 根据选择的策略类型调用不同的回测函数
      switch (strategyType) {
        case 'value':
          result = await runValueBacktest(ticker, capital, startDate, endDate);
          break;
        case 'technical':
          result = await runTechnicalBacktest(ticker, capital, startDate, endDate);
          break;
        case 'sentiment':
          result = await runSentimentBacktest(ticker, capital, startDate, endDate);
          break;
        case 'risk':
          result = await runRiskBacktest(ticker, capital, startDate, endDate);
          break;
        case 'mixed':
          result = await runMixedBacktest(ticker, capital, startDate, endDate);
          break;
        default:
          result = await runTechnicalBacktest(ticker, capital, startDate, endDate);
      }
      
      setBacktestResult(result);
    } catch (error: any) {
      console.error('回测失败:', error);
      setError(error.message || '回测过程中发生错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-medium">回测设置</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">股票代码</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="输入股票代码"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">起始资金</label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="输入起始资金"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">回测周期</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">策略类型</label>
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={strategyType}
              onChange={(e) => setStrategyType(e.target.value)}
            >
              <option value="value">价值投资策略</option>
              <option value="technical">技术分析策略</option>
              <option value="risk">风险管理策略</option>
              <option value="sentiment">情绪分析策略</option>
              <option value="mixed">混合策略</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {strategyType === 'value' && '基于基本面指标（PE、PB等）进行交易决策'}
              {strategyType === 'technical' && '基于技术指标（移动平均线、RSI等）进行交易决策'}
              {strategyType === 'risk' && '聚焦风险管理的策略，包括止损和风险平价'}
              {strategyType === 'sentiment' && '基于市场情绪和新闻分析进行交易决策'}
              {strategyType === 'mixed' && '综合多种指标的复合策略'}
            </p>
          </div>
          
          <button
            className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center"
            onClick={runBacktest}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                正在回测...
              </>
            ) : '运行回测'}
          </button>
        </div>
      </div>
      
      <div className="lg:col-span-2 space-y-6">
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center p-20">
            <FaSpinner className="animate-spin text-indigo-600 mr-2" size={24} />
            <span>正在进行回测计算，请稍候...</span>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 p-6">
            <div className="text-red-500 mb-2 font-medium">回测失败</div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              onClick={() => setError(null)}
            >
              返回
            </button>
          </div>
        ) : backtestResult ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">回测结果概览</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">总收益率</div>
                    <div className={`text-xl font-semibold ${
                      backtestResult.metrics.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {(backtestResult.metrics.totalReturn * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">年化收益率</div>
                    <div className={`text-xl font-semibold ${
                      backtestResult.metrics.annualizedReturn >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {(backtestResult.metrics.annualizedReturn * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">最大回撤</div>
                    <div className="text-xl font-semibold text-red-500">
                      {(backtestResult.metrics.maxDrawdown * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">夏普比率</div>
                    <div className="text-xl font-semibold">
                      {backtestResult.metrics.sharpeRatio.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">胜率</div>
                    <div className="text-xl font-semibold">
                      {(backtestResult.metrics.winRate * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">盈亏比</div>
                    <div className="text-xl font-semibold">
                      {backtestResult.metrics.profitFactor.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="h-64 bg-white dark:bg-gray-800 mt-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  {backtestResult.equityCurve && backtestResult.equityCurve.length > 0 ? (
                    <div className="w-full h-full relative">
                      <div className="absolute top-0 left-0 text-xs text-gray-500">
                        {Math.max(...backtestResult.equityCurve.map(p => p.value)).toFixed(2)}
                      </div>
                      <div className="absolute bottom-0 left-0 text-xs text-gray-500">
                        {Math.min(...backtestResult.equityCurve.map(p => p.value)).toFixed(2)}
                      </div>
                      <div className="absolute top-0 right-0 text-xs text-gray-500">
                        {backtestResult.equityCurve[backtestResult.equityCurve.length - 1].date}
                      </div>
                      <div className="absolute bottom-0 right-0 text-xs text-gray-500">
                        {backtestResult.equityCurve[0].date}
                      </div>
                      
                      <div className="h-full w-full flex items-end">
                        {backtestResult.equityCurve.map((point, index) => {
                          const max = Math.max(...backtestResult.equityCurve.map(p => p.value));
                          const min = Math.min(...backtestResult.equityCurve.map(p => p.value));
                          const range = max - min;
                          const heightPercent = range > 0 
                            ? ((point.value - min) / range) * 100 
                            : 50;
                          
                          return (
                            <div 
                              key={index}
                              className="flex-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                              style={{ height: `${heightPercent}%` }}
                              title={`日期: ${point.date}, 价值: ${point.value.toFixed(2)}`}
                            >
                              <div 
                                className={`w-full h-full ${
                                  point.value > backtestResult.equityCurve[0].value 
                                    ? 'bg-green-500' 
                                    : 'bg-red-500'
                                } opacity-40`}
                              ></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">无权益曲线数据</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">交易记录</h3>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">盈亏</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {backtestResult.trades.map((trade: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{trade.date}</td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                            trade.type === 'buy' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {trade.type === 'buy' ? '买入' : '卖出'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">${trade.price.toFixed(2)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{trade.shares}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {trade.profit 
                              ? <span className="text-green-500">${trade.profit.toFixed(2)}</span> 
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center p-20">
            <p className="text-gray-500">请在左侧设置回测参数并运行回测</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradingPage() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeSubTab, setActiveSubTab] = useState<string>(tabFromUrl || 'trade');
  const [orderType, setOrderType] = useState<string>('buy');
  const [orderPrice, setOrderPrice] = useState<string>('market');
  const [stockSymbol, setStockSymbol] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [marketInsights, setMarketInsights] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  
  // 自动加载市场洞察
  useEffect(() => {
    if (activeSubTab === 'ai' && !marketInsights && !loadingInsights) {
      loadMarketInsights();
    }
  }, [activeSubTab, marketInsights, loadingInsights]);
  
  // 获取AI分析
  const handleAIAnalysis = async () => {
    if (!stockSymbol.trim()) {
      alert('请输入股票代码');
      return;
    }
    
    setLoadingAnalysis(true);
    setAiAnalysis(null);
    
    try {
      const result = await getStockAnalysis(stockSymbol);
      setAiAnalysis(result);
    } catch (error) {
      console.error('AI分析出错:', error);
      setAiAnalysis('分析过程中发生错误，请稍后重试。');
    } finally {
      setLoadingAnalysis(false);
    }
  };
  
  // 获取市场洞察
  const loadMarketInsights = async () => {
    setLoadingInsights(true);
    
    try {
      const result = await getMarketInsights();
      setMarketInsights(result);
    } catch (error) {
      console.error('获取市场洞察出错:', error);
      setMarketInsights('获取市场洞察时发生错误，请稍后重试。');
    } finally {
      setLoadingInsights(false);
    }
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">交易中心</h2>
        <p className="text-sm text-gray-500">买卖股票、AI分析、查看订单和行情</p>
      </div>
      
      {/* 子标签页 */}
      <Tabs 
        tabs={tradingSubTabs} 
        activeTab={activeSubTab} 
        setActiveTab={setActiveSubTab} 
      />
      
      {/* 买入/卖出内容 */}
      {activeSubTab === 'trade' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex space-x-2">
                <button 
                  className={`px-4 py-1.5 rounded-md ${
                    orderType === 'buy' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => setOrderType('buy')}
                >
                  买入
                </button>
                <button 
                  className={`px-4 py-1.5 rounded-md ${
                    orderType === 'sell' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => setOrderType('sell')}
                >
                  卖出
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">股票代码</label>
                <div className="flex">
                  <input 
                    type="text" 
                    className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="输入股票代码或公司名称" 
                    value={stockSymbol}
                    onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                  />
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700">
                    查询
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">交易价格</label>
                <div className="flex space-x-2 mb-2">
                  <button 
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      orderPrice === 'market' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => setOrderPrice('market')}
                  >
                    市价
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      orderPrice === 'limit' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => setOrderPrice('limit')}
                  >
                    限价
                  </button>
                </div>
                
                {orderPrice === 'limit' && (
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="输入限价" 
                  />
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">交易数量</label>
                <div className="flex items-center">
                  <button className="px-3 py-1 bg-gray-200 rounded-l-md">-</button>
                  <input 
                    type="text" 
                    className="w-20 p-2 border-y border-gray-300 text-center" 
                    defaultValue="100" 
                  />
                  <button className="px-3 py-1 bg-gray-200 rounded-r-md">+</button>
                  <div className="ml-4 space-x-2">
                    <button className="px-2 py-1 text-xs bg-gray-100 rounded">25%</button>
                    <button className="px-2 py-1 text-xs bg-gray-100 rounded">50%</button>
                    <button className="px-2 py-1 text-xs bg-gray-100 rounded">75%</button>
                    <button className="px-2 py-1 text-xs bg-gray-100 rounded">100%</button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <div className="text-gray-500">预估成本</div>
                  <div className="font-medium">¥18,863.00</div>
                </div>
                <div>
                  <div className="text-gray-500">可用资金</div>
                  <div className="font-medium">¥125,000.00</div>
                </div>
                <div>
                  <div className="text-gray-500">手续费</div>
                  <div className="font-medium">¥5.00</div>
                </div>
                <div>
                  <div className="text-gray-500">总计</div>
                  <div className="font-medium">¥18,868.00</div>
                </div>
              </div>
              
              <button 
                className={`w-full py-3 rounded-md ${
                  orderType === 'buy' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                } text-white font-medium`}
              >
                {orderType === 'buy' ? '确认买入' : '确认卖出'}
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">股票信息</h3>
              </div>
              <div className="p-4">
                <div className="text-center p-8">
                  <p className="text-sm text-gray-500">请在左侧输入股票代码查询</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">最近交易</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-medium">AAPL</div>
                      <div className="text-xs text-green-500">买入</div>
                    </div>
                    <div className="text-right">
                      <div>¥188.63 x 10</div>
                      <div className="text-xs text-gray-500">今天 09:45</div>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-medium">TSLA</div>
                      <div className="text-xs text-red-500">卖出</div>
                    </div>
                    <div className="text-right">
                      <div>¥173.86 x 5</div>
                      <div className="text-xs text-gray-500">昨天 14:30</div>
                    </div>
                  </div>
                  <div className="flex justify-between py-2">
                    <div>
                      <div className="font-medium">NVDA</div>
                      <div className="text-xs text-green-500">买入</div>
                    </div>
                    <div className="text-right">
                      <div>¥824.52 x 3</div>
                      <div className="text-xs text-gray-500">2023/3/25</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* AI智能分析内容 */}
      {activeSubTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">AI智能投资分析</h3>
              <div>
                <select className="p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md mr-2">
                  <option value="all">综合分析</option>
                  <option value="fundamental">基本面分析</option>
                  <option value="technical">技术面分析</option>
                  <option value="sentiment">情绪面分析</option>
                </select>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex">
                  <input 
                    type="text" 
                    className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="输入股票代码" 
                    value={stockSymbol}
                    onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                  />
                  <button 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 flex items-center"
                    onClick={handleAIAnalysis}
                    disabled={loadingAnalysis}
                  >
                    {loadingAnalysis ? <FaSpinner className="animate-spin mr-2" /> : <FaRobot className="mr-2" />}
                    AI分析
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  使用人工智能分析股票的基本面、技术面和市场情绪，给出投资建议
                </p>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <AIAnalysisResult analysis={aiAnalysis} loading={loadingAnalysis} />
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">市场洞察</h3>
              </div>
              <div className="p-4">
                <MarketInsights insights={marketInsights} loading={loadingInsights} />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">热门分析</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">AAPL</div>
                      <div className="text-green-500 font-medium">买入</div>
                    </div>
                    <p className="text-xs text-gray-500">
                      苹果公司基本面强劲，技术指标显示上升趋势，建议长期持有。
                    </p>
                  </div>
                  <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">MSFT</div>
                      <div className="text-green-500 font-medium">买入</div>
                    </div>
                    <p className="text-xs text-gray-500">
                      微软云业务增长强劲，AI布局领先，长期增长前景看好。
                    </p>
                  </div>
                  <div className="py-2">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">TSLA</div>
                      <div className="text-gray-500 font-medium">持有</div>
                    </div>
                    <p className="text-xs text-gray-500">
                      特斯拉面临竞争加剧，但技术领先优势仍在，建议持有观望。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 订单历史内容 */}
      {activeSubTab === 'orders' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-medium">交易订单历史</h3>
            <div className="flex space-x-2">
              <select className="p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md">
                <option>全部订单</option>
                <option>买入订单</option>
                <option>卖出订单</option>
              </select>
              <select className="p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md">
                <option>全部状态</option>
                <option>已完成</option>
                <option>进行中</option>
                <option>已取消</option>
              </select>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 text-sm text-gray-500 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
              <div>日期</div>
              <div>类型</div>
              <div>股票</div>
              <div>价格</div>
              <div>数量</div>
              <div>状态</div>
            </div>
            <OrderHistoryItem 
              date="2023/4/2 09:45" 
              type="买入" 
              symbol="AAPL" 
              price="¥188.63" 
              quantity="10" 
              status="已完成" 
            />
            <OrderHistoryItem 
              date="2023/4/1 14:30" 
              type="卖出" 
              symbol="TSLA" 
              price="¥173.86" 
              quantity="5" 
              status="已完成" 
            />
            <OrderHistoryItem 
              date="2023/3/28 11:15" 
              type="买入" 
              symbol="NVDA" 
              price="¥824.52" 
              quantity="3" 
              status="已完成" 
            />
            <OrderHistoryItem 
              date="2023/3/25 10:20" 
              type="买入" 
              symbol="MSFT" 
              price="¥405.28" 
              quantity="2" 
              status="已取消" 
            />
            <OrderHistoryItem 
              date="2023/3/20 15:10" 
              type="卖出" 
              symbol="GOOGL" 
              price="¥143.96" 
              quantity="4" 
              status="已完成" 
            />
            <OrderHistoryItem 
              date="2023/3/15 09:35" 
              type="买入" 
              symbol="AMZN" 
              price="¥178.35" 
              quantity="6" 
              status="已完成" 
            />
            
            <div className="flex justify-between mt-4 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="text-sm text-gray-500">显示 1-6 共 24 项</div>
              <div className="flex space-x-1">
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">上一页</button>
                <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded">1</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">2</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">3</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">4</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">下一页</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 行情数据内容 */}
      {activeSubTab === 'market' && (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">市场行情</h3>
              <div className="flex">
                <input
                  type="text"
                  placeholder="搜索股票..."
                  className="p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-r-md hover:bg-indigo-700">
                  搜索
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-5 text-sm text-gray-500 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                <div>代码</div>
                <div>名称</div>
                <div>价格</div>
                <div>涨跌幅</div>
                <div>成交量</div>
              </div>
              <MarketDataItem 
                symbol="AAPL" 
                name="苹果公司" 
                price="¥188.63" 
                change="+0.67%" 
                volume="34.5M" 
              />
              <MarketDataItem 
                symbol="MSFT" 
                name="微软" 
                price="¥405.28" 
                change="+0.94%" 
                volume="22.1M" 
              />
              <MarketDataItem 
                symbol="TSLA" 
                name="特斯拉" 
                price="¥173.86" 
                change="-1.38%" 
                volume="58.6M" 
              />
              <MarketDataItem 
                symbol="NVDA" 
                name="英伟达" 
                price="¥824.52" 
                change="+1.90%" 
                volume="43.2M" 
              />
              <MarketDataItem 
                symbol="GOOGL" 
                name="Alphabet A" 
                price="¥143.96" 
                change="+0.39%" 
                volume="18.7M" 
              />
              <MarketDataItem 
                symbol="AMZN" 
                name="亚马逊" 
                price="¥178.35" 
                change="+0.72%" 
                volume="29.3M" 
              />
              <MarketDataItem 
                symbol="META" 
                name="Meta平台" 
                price="¥485.38" 
                change="+1.25%" 
                volume="15.8M" 
              />
              <MarketDataItem 
                symbol="NFLX" 
                name="Netflix" 
                price="¥614.92" 
                change="-0.54%" 
                volume="9.4M" 
              />
              
              <div className="flex justify-between mt-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-500">显示 1-8 共 100 项</div>
                <div className="flex space-x-1">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">上一页</button>
                  <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded">1</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">2</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">3</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">...</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">10</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">下一页</button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">涨幅榜</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="font-medium">股票 {index}</div>
                      <div className="text-green-500">+{(Math.random() * 8 + 2).toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">跌幅榜</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="font-medium">股票 {index}</div>
                      <div className="text-red-500">-{(Math.random() * 8 + 2).toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 回测内容 */}
      {activeSubTab === 'backtest' && <BacktestTab />}
    </div>
  );
} 