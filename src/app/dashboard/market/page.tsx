"use client";

import { useState } from 'react';
import { FaSearch, FaDatabase } from 'react-icons/fa';

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

// 市场数据子标签页配置
const marketSubTabs = [
  { id: 'search', label: '市场数据查询', icon: FaSearch },
  { id: 'news', label: '市场新闻', icon: FaDatabase }
];

export default function MarketPage() {
  const [activeSubTab, setActiveSubTab] = useState<string>('search');
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">市场数据</h2>
        <p className="text-sm text-gray-500">实时市场行情数据与新闻资讯</p>
      </div>
      
      {/* 子标签页 */}
      <Tabs 
        tabs={marketSubTabs} 
        activeTab={activeSubTab} 
        setActiveTab={setActiveSubTab} 
      />
      
      {/* 市场数据查询内容 */}
      {activeSubTab === 'search' && (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-medium">市场数据查询</h3>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <div className="flex mb-4">
                  <input 
                    type="text" 
                    className="flex-grow p-2 border border-gray-200 dark:border-gray-700 rounded-l" 
                    placeholder="输入股票代码、公司名称或行业..." 
                  />
                  <button className="bg-indigo-600 text-white px-4 rounded-r hover:bg-indigo-700">
                    查询
                  </button>
                </div>
                <div className="flex gap-2 mb-4">
                  <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded">
                    股票
                  </button>
                  <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded">
                    ETF
                  </button>
                  <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded">
                    期货
                  </button>
                  <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded">
                    指数
                  </button>
                </div>
              </div>
              
              <div className="p-6 text-center text-gray-500">
                <p>输入查询条件获取市场数据</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">热门行业板块</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">科技</span>
                      <span className="text-sm text-green-500">+1.8%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">金融</span>
                      <span className="text-sm text-green-500">+0.7%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '54%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">能源</span>
                      <span className="text-sm text-red-500">-0.3%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">医疗健康</span>
                      <span className="text-sm text-green-500">+1.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">消费</span>
                      <span className="text-sm text-green-500">+0.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '51%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">全球市场指数</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-medium">标普500</div>
                      <div className="text-xs text-gray-500">美国</div>
                    </div>
                    <div className="text-right">
                      <div>5,123.41</div>
                      <div className="text-xs text-green-500">+0.67%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-medium">道琼斯</div>
                      <div className="text-xs text-gray-500">美国</div>
                    </div>
                    <div className="text-right">
                      <div>39,807.37</div>
                      <div className="text-xs text-green-500">+0.23%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-medium">纳斯达克</div>
                      <div className="text-xs text-gray-500">美国</div>
                    </div>
                    <div className="text-right">
                      <div>16,302.24</div>
                      <div className="text-xs text-green-500">+1.12%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-medium">上证指数</div>
                      <div className="text-xs text-gray-500">中国</div>
                    </div>
                    <div className="text-right">
                      <div>3,052.87</div>
                      <div className="text-xs text-red-500">-0.34%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <div className="font-medium">日经225</div>
                      <div className="text-xs text-gray-500">日本</div>
                    </div>
                    <div className="text-right">
                      <div>38,079.70</div>
                      <div className="text-xs text-green-500">+0.89%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 市场新闻内容 */}
      {activeSubTab === 'news' && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">市场要闻</h3>
              </div>
              <div className="p-4">
                <NewsItem 
                  title="美联储暗示可能在今年晚些时候降息" 
                  source="财经日报" 
                  time="2小时前" 
                />
                <NewsItem 
                  title="NVIDIA市值突破1.6万亿美元，成为全球第三大上市公司" 
                  source="科技资讯" 
                  time="4小时前" 
                />
                <NewsItem 
                  title="中国央行宣布降准0.5个百分点，释放流动性1万亿元" 
                  source="经济观察者" 
                  time="昨天" 
                />
                <NewsItem 
                  title="特斯拉宣布全新电池技术，续航里程提升30%" 
                  source="新能源报道" 
                  time="昨天" 
                />
                <NewsItem 
                  title="全球半导体行业有望今年恢复增长，预计增幅超10%" 
                  source="产业分析" 
                  time="2天前" 
                />
                <div className="mt-4 text-center">
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm">
                    查看更多新闻
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">财经日历</h3>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">今天</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="min-w-[60px] text-sm">09:30</div>
                      <div>
                        <div className="text-sm font-medium">中国5月PMI数据公布</div>
                        <div className="text-xs text-gray-500">预期51.2，前值51.0</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="min-w-[60px] text-sm">20:30</div>
                      <div>
                        <div className="text-sm font-medium">美国初请失业金人数</div>
                        <div className="text-xs text-gray-500">预期22.5万，前值22.7万</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">明天</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="min-w-[60px] text-sm">08:30</div>
                      <div>
                        <div className="text-sm font-medium">日本央行利率决议</div>
                        <div className="text-xs text-gray-500">预期维持不变</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="min-w-[60px] text-sm">21:00</div>
                      <div>
                        <div className="text-sm font-medium">美国非农就业数据</div>
                        <div className="text-xs text-gray-500">预期增加18万，前值增加17.5万</div>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  完整财经日历
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 