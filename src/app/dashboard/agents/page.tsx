"use client";

import { useState } from 'react';
import { FaRobot, FaCode } from 'react-icons/fa';

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

// AI代理页子标签页配置
const agentSubTabs = [
  { id: 'overview', label: 'AI助手', icon: FaRobot },
  { id: 'strategies', label: 'AI策略', icon: FaCode }
];

// 策略项组件
function StrategyItem({ name, description, performance, status }: 
  { name: string, description: string, performance: string, status: string }) {
  return (
    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg mb-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{name}</h3>
        <div className={`text-sm px-2 py-1 rounded ${
          status === '活跃' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          status === '暂停' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {status}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <div className="flex justify-between text-sm">
        <span>历史表现:</span>
        <span className="font-medium text-green-500">{performance}</span>
      </div>
      <div className="mt-3 flex space-x-2">
        <button className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
          运行
        </button>
        <button className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 text-sm rounded hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
          编辑
        </button>
        <button className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 text-sm rounded hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
          复制
        </button>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'system', content: '我是LumosFund的AI投资助手，可以帮您分析市场、提供投资建议、解答金融问题。您有什么需要帮助的吗？' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  
  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;
    
    // 添加用户消息
    const newMessages = [
      ...messages,
      { role: 'user', content: inputMessage.trim() }
    ];
    setMessages(newMessages);
    setInputMessage('');
    
    // 模拟AI响应
    setTimeout(() => {
      setMessages([
        ...newMessages,
        { 
          role: 'system', 
          content: '我已收到您的请求。作为AI投资助手，我可以分析您的投资组合、提供个性化建议并帮助您做出更明智的投资决策。请提供更多细节，我可以为您提供更具体的分析和建议。' 
        }
      ]);
    }, 1000);
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">AI投资助手</h2>
        <p className="text-sm text-gray-500">使用人工智能辅助您的投资决策</p>
      </div>
      
      {/* 子标签页 */}
      <Tabs 
        tabs={agentSubTabs} 
        activeTab={activeSubTab} 
        setActiveTab={setActiveSubTab} 
      />
      
      {/* AI助手内容 */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-medium">AI投资助手对话</h3>
            </div>
            <div className="flex flex-col h-[500px]">
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}
                  >
                    <div 
                      className={`inline-block max-w-3/4 rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                <div className="flex">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="询问AI助手..."
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
                    onClick={handleSendMessage}
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">AI助手能力</h3>
              </div>
              <div className="p-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>市场行情分析与预测</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>个股深度研究报告</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>投资组合优化建议</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>风险评估与管理策略</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>财经新闻分析与解读</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">AI建议</h3>
              </div>
              <div className="p-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-3 dark:bg-blue-900/20 dark:border-blue-900/30">
                  <h4 className="font-medium text-sm mb-1">投资组合多样化</h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300">考虑增加不同行业的资产以降低风险</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-100 dark:bg-green-900/20 dark:border-green-900/30">
                  <h4 className="font-medium text-sm mb-1">近期关注科技板块</h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300">AI和半导体行业有增长潜力</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* AI策略内容 */}
      {activeSubTab === 'strategies' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">活跃策略</p>
              <p className="text-2xl font-bold mt-2">3</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">共5个策略</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">策略收益率</p>
              <p className="text-2xl font-bold mt-2 text-green-500">+12.8%</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">过去12个月平均</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">最近执行</p>
              <p className="text-2xl font-bold mt-2">今天</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">10:30 AM</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">AI投资策略</h3>
              <button className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
                创建新策略
              </button>
            </div>
            <div className="p-4">
              <StrategyItem 
                name="价值投资选股器" 
                description="基于基本面分析寻找被低估的高质量公司，着重分析P/E比率、股息收益率和自由现金流" 
                performance="+15.3%" 
                status="活跃" 
              />
              <StrategyItem 
                name="动量交易策略" 
                description="追踪市场趋势，利用技术指标寻找具有强劲上升动能的股票，包含止损和获利了结机制" 
                performance="+22.7%" 
                status="活跃" 
              />
              <StrategyItem 
                name="波动性套利系统" 
                description="利用期权定价模型和隐含波动率差异寻找套利机会，适合低风险偏好投资者" 
                performance="+8.2%" 
                status="活跃" 
              />
              <StrategyItem 
                name="全球宏观配置" 
                description="基于全球宏观经济指标进行资产配置，包括股票、债券、大宗商品和现金的动态调整" 
                performance="+5.1%" 
                status="暂停" 
              />
              <StrategyItem 
                name="高频算法交易" 
                description="利用市场微观结构和短期价格异常进行高频交易，要求极低延迟和高执行效率" 
                performance="+17.9%" 
                status="草稿" 
              />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-medium">策略执行历史</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="font-medium">动量交易策略</div>
                    <div className="text-xs text-gray-500">买入 NVDA x 2</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-500">+$32.40</div>
                    <div className="text-xs text-gray-500">今天 10:30</div>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="font-medium">价值投资选股器</div>
                    <div className="text-xs text-gray-500">买入 AAPL x 5</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-500">+$67.85</div>
                    <div className="text-xs text-gray-500">昨天 15:45</div>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="font-medium">波动性套利系统</div>
                    <div className="text-xs text-gray-500">卖出 TSLA 看涨期权</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-500">+$120.50</div>
                    <div className="text-xs text-gray-500">昨天 14:20</div>
                  </div>
                </div>
                <div className="flex justify-between py-2">
                  <div>
                    <div className="font-medium">动量交易策略</div>
                    <div className="text-xs text-gray-500">卖出 MSFT x 3</div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-500">-$28.96</div>
                    <div className="text-xs text-gray-500">2023/4/1 09:15</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <button className="text-indigo-600 hover:text-indigo-800 text-sm">
                  查看完整历史
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 