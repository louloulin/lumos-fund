"use client";

import { useState } from 'react';
import { FaShoppingCart, FaChartLine, FaHistory } from 'react-icons/fa';

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
  { id: 'orders', label: '订单历史', icon: FaHistory },
  { id: 'market', label: '行情数据', icon: FaChartLine }
];

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

export default function TradingPage() {
  const [activeSubTab, setActiveSubTab] = useState<string>('trade');
  const [orderType, setOrderType] = useState<string>('buy');
  const [orderPrice, setOrderPrice] = useState<string>('market');
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">交易中心</h2>
        <p className="text-sm text-gray-500">买卖股票、查看订单和行情</p>
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
    </div>
  );
} 