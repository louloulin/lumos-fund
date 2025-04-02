"use client";

import { useState } from 'react';
import { FaChartLine, FaChartBar } from 'react-icons/fa';

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

// 投资组合页子标签页配置
const portfolioSubTabs = [
  { id: 'overview', label: '投资组合概览', icon: FaChartLine },
  { id: 'analysis', label: '绩效分析', icon: FaChartBar }
];

// 持仓项组件
function PortfolioItem({ symbol, quantity, avgCost, currentPrice, totalValue, profit, profitPercent }: 
  { symbol: string, quantity: number, avgCost: string, currentPrice: string, totalValue: string, profit: string, profitPercent: string }) {
  const isPositive = !profit.startsWith('-');
  return (
    <div className="grid grid-cols-7 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className="font-medium">{symbol}</div>
      <div>{quantity}</div>
      <div>{avgCost}</div>
      <div>{currentPrice}</div>
      <div>{totalValue}</div>
      <div className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {profit}
      </div>
      <div className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {profitPercent}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">投资组合</h2>
        <p className="text-sm text-gray-500">管理您的投资资产和分析绩效</p>
      </div>
      
      {/* 子标签页 */}
      <Tabs 
        tabs={portfolioSubTabs} 
        activeTab={activeSubTab} 
        setActiveTab={setActiveSubTab} 
      />
      
      {/* 投资组合概览内容 */}
      {activeSubTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">总资产价值</p>
              <p className="text-2xl font-bold mt-2">¥125,000</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-green-500">↑ +1.2% 今日</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">总盈亏</p>
              <p className="text-2xl font-bold mt-2 text-green-500">+¥12,500</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">+11.1% 总收益率</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">持仓数量</p>
              <p className="text-2xl font-bold mt-2">5</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">跨3个行业</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">持仓明细</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 text-sm text-gray-500 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                  <div>股票</div>
                  <div>数量</div>
                  <div>平均成本</div>
                  <div>当前价格</div>
                  <div>总价值</div>
                  <div>盈亏</div>
                  <div>盈亏率</div>
                </div>
                <PortfolioItem 
                  symbol="AAPL" 
                  quantity={50} 
                  avgCost="¥175.32" 
                  currentPrice="¥188.63" 
                  totalValue="¥9,431.50" 
                  profit="+¥665.50" 
                  profitPercent="+7.59%" 
                />
                <PortfolioItem 
                  symbol="MSFT" 
                  quantity={8} 
                  avgCost="¥390.80" 
                  currentPrice="¥405.28" 
                  totalValue="¥3,242.24" 
                  profit="+¥115.84" 
                  profitPercent="+3.7%" 
                />
                <PortfolioItem 
                  symbol="NVDA" 
                  quantity={5} 
                  avgCost="¥780.25" 
                  currentPrice="¥840.25" 
                  totalValue="¥4,201.25" 
                  profit="+¥300.00" 
                  profitPercent="+7.7%" 
                />
                <PortfolioItem 
                  symbol="TSLA" 
                  quantity={10} 
                  avgCost="¥175.60" 
                  currentPrice="¥168.42" 
                  totalValue="¥1,684.20" 
                  profit="-¥71.80" 
                  profitPercent="-4.1%" 
                />
                <PortfolioItem 
                  symbol="GOOGL" 
                  quantity={15} 
                  avgCost="¥138.42" 
                  currentPrice="¥143.96" 
                  totalValue="¥2,159.40" 
                  profit="+¥83.10" 
                  profitPercent="+4.0%" 
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">资产配置</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">科技股</span>
                      <span className="text-sm">67%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">汽车</span>
                      <span className="text-sm">15%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">半导体</span>
                      <span className="text-sm">18%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    调整投资组合
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 绩效分析内容 */}
      {activeSubTab === 'analysis' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-medium">绩效历史</h3>
            </div>
            <div className="p-4 h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <p className="text-gray-500 text-center">绩效图表将在此处加载</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">绩效指标</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500">年化收益率</div>
                    <div className="font-medium text-green-500">+8.3%</div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500">夏普比率</div>
                    <div className="font-medium">1.2</div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500">最大回撤</div>
                    <div className="font-medium text-red-500">-12.5%</div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500">波动率</div>
                    <div className="font-medium">14.2%</div>
                  </div>
                  <div className="flex justify-between py-2">
                    <div className="text-gray-500">贝塔系数</div>
                    <div className="font-medium">0.85</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">与指数对比</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">您的投资组合</span>
                      <span className="text-sm text-green-500">+8.3%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '83%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">标普500</span>
                      <span className="text-sm text-green-500">+7.1%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '71%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">纳斯达克</span>
                      <span className="text-sm text-green-500">+9.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">年化收益率比较（过去12个月）</p>
                  <button className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    查看详细报告
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 