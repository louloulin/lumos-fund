"use client";

import { FaChartBar, FaDatabase, FaChartLine, FaExchangeAlt, FaBriefcase } from 'react-icons/fa';

// 简单的卡片组件
function StatCard({ title, value, icon: Icon, description, change }: { title: string, value: string | number, icon: any, description: string, change?: { value: string, isPositive: boolean } }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {change && (
            <div className="flex items-center mt-1">
              <span className={`text-xs ${change.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {change.isPositive ? '↑' : '↓'} {change.value}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <div className="text-indigo-600 dark:text-indigo-400">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

// 交易历史项
function TransactionRow({ type, symbol, quantity, price, date }: { type: string, symbol: string, quantity: string, price: string, date: string }) {
  return (
    <div className="grid grid-cols-5 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className={`${
        type === '买入' ? 'text-green-500' :
        type === '卖出' ? 'text-red-500' : 
        type === '入金' ? 'text-blue-500' : 
        type === '出金' ? 'text-orange-500' : ''
      } font-medium`}>
        {type}
      </div>
      <div>{symbol}</div>
      <div>{quantity}</div>
      <div>{price}</div>
      <div className="text-gray-500 text-sm">{date}</div>
    </div>
  );
}

// 股票行情组件
function StockRow({ symbol, price, change, changePercent }: { symbol: string, price: string, change: string, changePercent: string }) {
  const isPositive = !change.startsWith('-');
  return (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 py-3">
      <div className="font-medium">{symbol}</div>
      <div className="text-right">{price}</div>
      <div className={`w-24 text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {change}
      </div>
      <div className={`w-24 text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {changePercent}
      </div>
      <button className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">
        交易
      </button>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">投资平台概览</h2>
        <p className="text-sm text-gray-500">主要市场指标和账户状态</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="账户总资产" 
          value="¥125,000" 
          description="截至今日" 
          icon={FaDatabase}
          change={{ value: "+1.2%", isPositive: true }}
        />
        <StatCard 
          title="今日盈亏" 
          value="¥1,250" 
          description="相比昨日" 
          icon={FaChartLine}
          change={{ value: "+1.01%", isPositive: true }}
        />
        <StatCard 
          title="活跃持仓" 
          value="5" 
          description="当前持有资产" 
          icon={FaBriefcase} 
        />
        <StatCard 
          title="本月交易" 
          value="12" 
          description="交易总次数" 
          icon={FaExchangeAlt} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-medium">热门持仓</h3>
            <div className="text-xs text-gray-500">实时更新</div>
          </div>
          <div className="p-4">
            <div className="flex justify-between text-sm text-gray-500 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
              <div>股票代码</div>
              <div>持仓股数</div>
              <div>价值</div>
              <div className="w-24 text-right">日涨跌幅</div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 py-3">
              <div className="font-medium">AAPL</div>
              <div>50</div>
              <div>¥47,150</div>
              <div className="w-24 text-right text-green-500">+0.67%</div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 py-3">
              <div className="font-medium">TSLA</div>
              <div>10</div>
              <div>¥16,842</div>
              <div className="w-24 text-right text-red-500">-1.38%</div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 py-3">
              <div className="font-medium">NVDA</div>
              <div>5</div>
              <div>¥42,012</div>
              <div className="w-24 text-right text-green-500">+1.90%</div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="font-medium">MSFT</div>
              <div>8</div>
              <div>¥32,422</div>
              <div className="w-24 text-right text-green-500">+0.94%</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-medium">最近交易</h3>
            <div className="text-xs text-gray-500">最近5笔</div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 text-sm text-gray-500 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
              <div>类型</div>
              <div>股票</div>
              <div>数量</div>
              <div>价格</div>
              <div>日期</div>
            </div>
            <TransactionRow 
              type="买入" 
              symbol="AAPL" 
              quantity="10" 
              price="¥188.63" 
              date="2023-04-01" 
            />
            <TransactionRow 
              type="卖出" 
              symbol="TSLA" 
              quantity="5" 
              price="¥173.86" 
              date="2023-03-28" 
            />
            <TransactionRow 
              type="买入" 
              symbol="NVDA" 
              quantity="3" 
              price="¥824.52" 
              date="2023-03-25" 
            />
            <TransactionRow 
              type="入金" 
              symbol="-" 
              quantity="-" 
              price="¥10,000" 
              date="2023-03-20" 
            />
            <TransactionRow 
              type="卖出" 
              symbol="MSFT" 
              quantity="2" 
              price="¥401.45" 
              date="2023-03-15" 
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-medium">市场热门股票</h3>
        </div>
        <div className="p-4">
          <div className="flex justify-between text-sm text-gray-500 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
            <div>股票代码</div>
            <div>最新价格</div>
            <div className="w-24 text-right">涨跌幅</div>
            <div className="w-24 text-right">涨跌百分比</div>
            <div></div>
          </div>
          <StockRow symbol="AAPL" price="188.63" change="+1.25" changePercent="+0.67%" />
          <StockRow symbol="MSFT" price="405.28" change="+3.78" changePercent="+0.94%" />
          <StockRow symbol="TSLA" price="168.42" change="-2.35" changePercent="-1.38%" />
          <StockRow symbol="NVDA" price="840.25" change="+15.67" changePercent="+1.90%" />
          <StockRow symbol="GOOGL" price="143.96" change="+0.56" changePercent="+0.39%" />
        </div>
      </div>
    </div>
  );
} 