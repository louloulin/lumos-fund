"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaChartLine, FaDatabase, FaServer, FaCodeBranch, FaSearch, FaHistory, FaChartBar, FaExchangeAlt, FaRobot, FaTable, FaBriefcase } from 'react-icons/fa';

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

// 新闻项组件
function NewsItem({ title, source, time }: { title: string, source: string, time: string }) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-700 py-4">
      <h3 className="font-medium mb-1">{title}</h3>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{source}</span>
        <span>{time}</span>
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

// 所有可能的主标签页和子标签页配置
const mainTabs = {
  'dashboard': { label: '仪表盘概览', icon: FaChartBar },
  'trading': { label: '交易中心', icon: FaExchangeAlt },
  'market': { label: '市场数据', icon: FaChartLine },
  'portfolio': { label: '投资组合', icon: FaDatabase },
  'history': { label: '交易历史', icon: FaHistory },
  'agents': { label: 'AI代理', icon: FaRobot },
  'data': { label: '数据管理', icon: FaTable }
};

const subTabs = {
  'dashboard': [
    { id: 'overview', label: '概览', icon: FaChartBar }
  ],
  'trading': [
    { id: 'realtime', label: '实时行情', icon: FaChartLine },
    { id: 'ai-analysis', label: 'AI股票分析', icon: FaServer }
  ],
  'market': [
    { id: 'search', label: '市场数据查询', icon: FaSearch },
    { id: 'news', label: '市场新闻', icon: FaDatabase }
  ],
  'portfolio': [
    { id: 'overview', label: '投资组合概览', icon: FaChartLine },
    { id: 'analysis', label: '绩效分析', icon: FaChartBar }
  ],
  'history': [
    { id: 'all', label: '全部', icon: FaHistory },
    { id: 'buy', label: '买入', icon: FaHistory },
    { id: 'sell', label: '卖出', icon: FaHistory }
  ],
  'agents': [
    { id: 'overview', label: 'AI助手', icon: FaRobot },
    { id: 'strategies', label: 'AI策略', icon: FaRobot }
  ],
  'data': [
    { id: 'overview', label: '数据概览', icon: FaTable },
    { id: 'import', label: '数据导入', icon: FaTable }
  ]
};

export default function Dashboard() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  
  // 默认显示仪表盘，否则从URL参数获取
  const [activeMainTab, setActiveMainTab] = useState<string>(urlTab || 'dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('');

  // 当主标签页变化或URL参数变化时，重置子标签页
  useEffect(() => {
    // 如果URL中有tab参数，则使用它
    if (urlTab && Object.keys(mainTabs).includes(urlTab)) {
      setActiveMainTab(urlTab);
    }
    
    // 设置默认的子标签页
    const defaultSubTab = subTabs[activeMainTab as keyof typeof subTabs]?.[0]?.id || '';
    setActiveSubTab(defaultSubTab);
  }, [urlTab, activeMainTab]);
  
  // 将主标签页对象转换为数组以便传递给Tabs组件
  const mainTabsArray = Object.keys(mainTabs).map(key => ({
    id: key,
    label: mainTabs[key as keyof typeof mainTabs].label,
    icon: mainTabs[key as keyof typeof mainTabs].icon
  }));
  
  return (
    <div className="p-6">
      {/* 主标签页 */}
      <Tabs 
        tabs={mainTabsArray} 
        activeTab={activeMainTab} 
        setActiveTab={(tab) => {
          setActiveMainTab(tab);
          const defaultSubTab = subTabs[tab as keyof typeof subTabs][0].id;
          setActiveSubTab(defaultSubTab);
          
          // 如果需要在这里可以更新URL，但需要使用useRouter
        }} 
      />
      
      {/* 子标签页 */}
      {subTabs[activeMainTab as keyof typeof subTabs] && (
        <Tabs 
          tabs={subTabs[activeMainTab as keyof typeof subTabs]} 
          activeTab={activeSubTab} 
          setActiveTab={setActiveSubTab} 
        />
      )}
      
      {/* 仪表盘概览 */}
      {activeMainTab === 'dashboard' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">投资平台概览</h2>
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
                  <div>¥8,500</div>
                  <div className="w-24 text-right text-green-500">+1.2%</div>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 py-3">
                  <div className="font-medium">MSFT</div>
                  <div>30</div>
                  <div>¥9,000</div>
                  <div className="w-24 text-right text-red-500">-0.5%</div>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 py-3">
                  <div className="font-medium">GOOGL</div>
                  <div>15</div>
                  <div>¥12,000</div>
                  <div className="w-24 text-right text-green-500">+2.1%</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">最新市场动态</h3>
              </div>
              <div className="p-4">
                <NewsItem 
                  title="美联储主席鲍威尔预示今年可能降息三次" 
                  source="Bloomberg" 
                  time="2025/4/2 22:00:00" 
                />
                <NewsItem 
                  title="科技股表现强劲，纳斯达克再创新高" 
                  source="CNBC" 
                  time="2025/4/2 20:20:00" 
                />
                <NewsItem 
                  title="通胀数据好于预期，市场情绪改善" 
                  source="Reuters" 
                  time="2025/4/2 17:20:00" 
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 交易中心 - 实时行情 */}
      {activeMainTab === 'trading' && activeSubTab === 'realtime' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">实时行情</h2>
            <p className="text-sm text-gray-500">最重要的市场动向</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">热门股票</h3>
              <div className="text-xs text-gray-500">最后更新: 22:20:00</div>
            </div>
            <div className="p-4">
              <div className="flex justify-between text-sm text-gray-500 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                <div>股票代码</div>
                <div>价格</div>
                <div className="w-24 text-right">涨跌额</div>
                <div className="w-24 text-right">涨跌幅</div>
                <div>操作</div>
              </div>
              <StockRow symbol="AAPL" price="¥186.50" change="+0.27" changePercent="+0.15%" />
              <StockRow symbol="MSFT" price="¥426.97" change="+0.58" changePercent="+0.14%" />
              <StockRow symbol="GOOGL" price="¥154.16" change="+0.65" changePercent="+0.43%" />
              <StockRow symbol="AMZN" price="¥181.12" change="+0.37" changePercent="+0.20%" />
              <StockRow symbol="NVDA" price="¥902.70" change="+0.20" changePercent="+0.02%" />
            </div>
          </div>
        </div>
      )}
      
      {/* 交易中心 - AI分析 */}
      {activeMainTab === 'trading' && activeSubTab === 'ai-analysis' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">AI股票分析</h2>
            <p className="text-sm text-gray-500">基于多种因素的股票智能分析</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">股票查询</h3>
              </div>
              <div className="p-6">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="输入股票代码 (例如: AAPL)"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700">
                    分析
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">智能代理代码分析</h3>
              </div>
              <div className="flex items-center justify-center p-16 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <FaServer size={48} className="mx-auto mb-4 text-indigo-500" />
                  <p>输入股票代码开始AI分析</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 市场数据 - 查询 */}
      {activeMainTab === 'market' && activeSubTab === 'search' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">市场数据查询</h2>
            <p className="text-sm text-gray-500">查询和比较市场指标和股票数据</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-medium">数据搜索</h3>
            </div>
            <div className="p-6">
              <div className="flex mb-4">
                <input
                  type="text"
                  placeholder="输入股票代码 (例如: AAPL)"
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700">
                  搜索
                </button>
              </div>
              <div className="text-sm text-gray-500">
                搜索指标类型: 价格、交易量、市值、P/E比率等
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 市场数据 - 新闻 */}
      {activeMainTab === 'market' && activeSubTab === 'news' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">市场新闻</h2>
            <p className="text-sm text-gray-500">最新市场动态和财经新闻</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-medium">最新新闻</h3>
            </div>
            <div className="p-4">
              <NewsItem 
                title="美联储主席鲍威尔预示今年可能降息三次" 
                source="Bloomberg" 
                time="2025/4/2 22:00:00" 
              />
              <NewsItem 
                title="科技股表现强劲，纳斯达克再创新高" 
                source="CNBC" 
                time="2025/4/2 20:20:00" 
              />
              <NewsItem 
                title="通胀数据好于预期，市场情绪改善" 
                source="Reuters" 
                time="2025/4/2 17:20:00" 
              />
              <NewsItem 
                title="全球供应链问题缓解，可能影响第二季度业绩" 
                source="Financial Times" 
                time="2025/4/2 14:20:00" 
              />
              <NewsItem 
                title="石油价格上涨，能源股走强" 
                source="WSJ" 
                time="2025/4/2 12:00:00" 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* 交易历史 */}
      {activeMainTab === 'history' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">交易历史</h2>
            <p className="text-sm text-gray-500">查看您的交易记录</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">全部</button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600">买入</button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600">卖出</button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600">入金</button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600">出金</button>
              </div>
              <select className="text-sm border border-gray-300 dark:border-gray-600 rounded p-1">
                <option>按交易类型...</option>
              </select>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-5 text-sm text-gray-500 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                <div>类型</div>
                <div>股票代码</div>
                <div>数量/金额</div>
                <div>价格</div>
                <div>日期</div>
              </div>
              <TransactionRow type="卖出" symbol="AAPL" quantity="10 股" price="¥183.58" date="2025年3月31日 22:19" />
              <TransactionRow type="卖出" symbol="MSFT" quantity="5 股" price="¥426.89" date="2025年3月28日 22:19" />
              <TransactionRow type="入金" symbol="-" quantity="¥10,000.00" price="-" date="2025年3月23日 22:19" />
              <TransactionRow type="卖出" symbol="NVDA" quantity="3 股" price="¥894.32" date="2025年3月21日 22:19" />
              <TransactionRow type="卖出" symbol="GOOGL" quantity="8 股" price="¥151.24" date="2025年3月19日 22:19" />
              <TransactionRow type="买入" symbol="MSFT" quantity="¥42.50" price="-" date="2025年3月13日 22:19" />
              <TransactionRow type="出金" symbol="-" quantity="¥2,500.00" price="-" date="2025年3月8日 22:19" />
            </div>
          </div>
        </div>
      )}
      
      {/* 投资组合 */}
      {activeMainTab === 'portfolio' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">投资组合</h2>
            <p className="text-sm text-gray-500">管理您的投资资产</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">资产配置</h3>
              <div className="text-xs text-gray-500">总价值: ¥125,000</div>
            </div>
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <FaChartLine size={48} className="mx-auto mb-4 text-indigo-500" />
                <p className="text-gray-500">资产配置图表将显示在这里</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* AI代理 */}
      {activeMainTab === 'agents' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">AI交易代理</h2>
            <p className="text-sm text-gray-500">配置和管理您的AI交易助手</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-medium">AI交易助手</h3>
            </div>
            <div className="p-6 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FaRobot size={48} className="mx-auto mb-4 text-indigo-500" />
                <p>您的AI交易助手已就绪</p>
                <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  开始交谈
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 数据管理 */}
      {activeMainTab === 'data' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">数据管理</h2>
            <p className="text-sm text-gray-500">管理和分析您的交易数据</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-medium">数据导入</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col mb-4">
                <label className="mb-2 text-sm font-medium">选择数据源</label>
                <select className="p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                  <option>CSV文件</option>
                  <option>Excel文件</option>
                  <option>API连接</option>
                </select>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                导入数据
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 