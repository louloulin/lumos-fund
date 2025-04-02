"use client";

import { useState } from 'react';
import { FaTable, FaUpload } from 'react-icons/fa';

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

// 数据管理页子标签页配置
const dataSubTabs = [
  { id: 'overview', label: '数据概览', icon: FaTable },
  { id: 'import', label: '数据导入', icon: FaUpload }
];

// 数据项组件
function DataItem({ name, type, size, date, status }: 
  { name: string, type: string, size: string, date: string, status: string }) {
  return (
    <div className="grid grid-cols-5 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className="font-medium">{name}</div>
      <div>{type}</div>
      <div>{size}</div>
      <div>{date}</div>
      <div className={`${
        status === '已处理' ? 'text-green-500' :
        status === '处理中' ? 'text-blue-500' : 
        status === '失败' ? 'text-red-500' : 
        'text-gray-500'
      }`}>
        {status}
      </div>
    </div>
  );
}

export default function DataPage() {
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">数据管理</h2>
        <p className="text-sm text-gray-500">管理和处理您的金融数据</p>
      </div>
      
      {/* 子标签页 */}
      <Tabs 
        tabs={dataSubTabs} 
        activeTab={activeSubTab} 
        setActiveTab={setActiveSubTab} 
      />
      
      {/* 数据概览内容 */}
      {activeSubTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">数据集数量</p>
              <p className="text-2xl font-bold mt-2">12</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-green-500">+3 本月新增</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">数据存储用量</p>
              <p className="text-2xl font-bold mt-2">256MB</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">配额: 5GB</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">最近更新</p>
              <p className="text-2xl font-bold mt-2">今天</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">09:45 AM</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">数据集列表</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="搜索数据集..."
                  className="p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
                  搜索
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-5 text-sm text-gray-500 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                <div>名称</div>
                <div>类型</div>
                <div>大小</div>
                <div>日期</div>
                <div>状态</div>
              </div>
              <DataItem 
                name="股票历史价格" 
                type="CSV" 
                size="45 MB" 
                date="2023/4/2" 
                status="已处理" 
              />
              <DataItem 
                name="交易记录" 
                type="Excel" 
                size="12 MB" 
                date="2023/4/1" 
                status="已处理" 
              />
              <DataItem 
                name="投资组合分析" 
                type="JSON" 
                size="3 MB" 
                date="2023/3/28" 
                status="已处理" 
              />
              <DataItem 
                name="市场指数数据" 
                type="API数据" 
                size="18 MB" 
                date="2023/3/25" 
                status="处理中" 
              />
              <DataItem 
                name="财务报表" 
                type="PDF" 
                size="8 MB" 
                date="2023/3/20" 
                status="失败" 
              />
              <DataItem 
                name="基金净值历史" 
                type="CSV" 
                size="22 MB" 
                date="2023/3/15" 
                status="已处理" 
              />
              
              <div className="flex justify-between mt-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-500">显示 1-6 共 12 项</div>
                <div className="flex space-x-1">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">上一页</button>
                  <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded">1</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">2</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded dark:bg-gray-700 dark:text-gray-300">下一页</button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">数据存储用量统计</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">股票数据</span>
                      <span className="text-sm">128MB (50%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">交易记录</span>
                      <span className="text-sm">64MB (25%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">财务报表</span>
                      <span className="text-sm">32MB (12.5%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '12.5%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">其他</span>
                      <span className="text-sm">32MB (12.5%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '12.5%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">最近活动</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                    <div>
                      <div className="font-medium">数据导入完成</div>
                      <div className="text-xs text-gray-500">股票历史价格数据已更新</div>
                    </div>
                    <div className="text-xs text-gray-500">今天 09:45</div>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                    <div>
                      <div className="font-medium">处理失败</div>
                      <div className="text-xs text-gray-500">财务报表解析出错</div>
                    </div>
                    <div className="text-xs text-gray-500">昨天 14:30</div>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                    <div>
                      <div className="font-medium">自动更新</div>
                      <div className="text-xs text-gray-500">市场指数数据通过API获取</div>
                    </div>
                    <div className="text-xs text-gray-500">昨天 09:00</div>
                  </div>
                  <div className="flex justify-between pb-2">
                    <div>
                      <div className="font-medium">数据分析完成</div>
                      <div className="text-xs text-gray-500">投资组合分析报告生成</div>
                    </div>
                    <div className="text-xs text-gray-500">2023/3/28 16:15</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 数据导入内容 */}
      {activeSubTab === 'import' && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium">数据导入</h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">数据类型</label>
                  <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>股票价格数据</option>
                    <option>交易记录</option>
                    <option>投资组合数据</option>
                    <option>财务报表</option>
                    <option>市场指数数据</option>
                    <option>其他</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">文件格式</label>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="format" className="text-indigo-600" defaultChecked />
                      <span>CSV</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="format" className="text-indigo-600" />
                      <span>Excel</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="format" className="text-indigo-600" />
                      <span>JSON</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="format" className="text-indigo-600" />
                      <span>API</span>
                    </label>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">数据源</label>
                  <div className="flex space-x-2">
                    <select className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>本地文件上传</option>
                      <option>URL链接</option>
                      <option>API连接</option>
                      <option>数据库导入</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <FaUpload className="mx-auto text-gray-400 mb-4" size={32} />
                    <p className="text-gray-500 mb-2">拖放文件到此处或</p>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                      浏览文件
                    </button>
                    <p className="text-xs text-gray-500 mt-2">支持 CSV, Excel, JSON (最大 50MB)</p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                    取消
                  </button>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    导入
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-medium">数据导入指南</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">1. 选择正确的数据类型</h4>
                      <p className="text-gray-500">确保选择与您的数据匹配的类型，这将帮助系统正确处理您的数据。</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">2. 准备您的数据</h4>
                      <p className="text-gray-500">确保数据格式正确，包含必要的列和标题。</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">3. 上传文件</h4>
                      <p className="text-gray-500">拖放文件或使用浏览按钮选择文件上传。</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">4. 验证和处理</h4>
                      <p className="text-gray-500">系统将验证您的数据并进行处理，您可以在数据概览页面查看进度。</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-medium">数据模板</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-4">下载标准格式的数据模板，以确保导入成功。</p>
                  <div className="space-y-2">
                    <button className="w-full py-2 px-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200 rounded-md text-sm dark:bg-gray-700 dark:hover:bg-gray-600">
                      <span>股票数据模板</span>
                      <span className="text-indigo-600">下载</span>
                    </button>
                    <button className="w-full py-2 px-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200 rounded-md text-sm dark:bg-gray-700 dark:hover:bg-gray-600">
                      <span>交易记录模板</span>
                      <span className="text-indigo-600">下载</span>
                    </button>
                    <button className="w-full py-2 px-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200 rounded-md text-sm dark:bg-gray-700 dark:hover:bg-gray-600">
                      <span>投资组合模板</span>
                      <span className="text-indigo-600">下载</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 