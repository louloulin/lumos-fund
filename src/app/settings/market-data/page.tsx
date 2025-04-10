'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { 
  InfoIcon, 
  CheckIcon, 
  AlertCircleIcon, 
  DatabaseIcon, 
  GlobeIcon 
} from 'lucide-react';
import { saveMarketDataSettings, getMarketDataSettings, testAPIConnection } from '@/actions/market-data-settings';

interface APIProvider {
  id: string;
  name: string;
  description: string;
  url: string;
  docUrl: string;
  freeTier: boolean;
}

const API_PROVIDERS: APIProvider[] = [
  {
    id: 'finnhub',
    name: 'Finnhub',
    description: '提供实时股票、外汇和加密货币数据',
    url: 'https://finnhub.io/api/v1',
    docUrl: 'https://finnhub.io/docs/api',
    freeTier: true
  },
  {
    id: 'alpha_vantage',
    name: 'Alpha Vantage',
    description: '提供股票、外汇和加密货币的实时和历史数据',
    url: 'https://www.alphavantage.co/query',
    docUrl: 'https://www.alphavantage.co/documentation/',
    freeTier: true
  },
  {
    id: 'tiingo',
    name: 'Tiingo',
    description: '金融市场数据API，包括股票、ETF、加密货币等',
    url: 'https://api.tiingo.com',
    docUrl: 'https://api.tiingo.com/documentation/general/overview',
    freeTier: true
  },
  {
    id: 'polygon',
    name: 'Polygon.io',
    description: '提供股票、期权、外汇和加密货币的市场数据',
    url: 'https://api.polygon.io',
    docUrl: 'https://polygon.io/docs',
    freeTier: false
  },
  {
    id: 'iex',
    name: 'IEX Cloud',
    description: '提供金融数据和API，包括股票、ETF、共同基金等',
    url: 'https://cloud.iexapis.com',
    docUrl: 'https://iexcloud.io/docs/api/',
    freeTier: false
  },
  {
    id: 'marketstack',
    name: 'Marketstack',
    description: '提供实时、当天和历史股票市场数据',
    url: 'https://api.marketstack.com/v1',
    docUrl: 'https://marketstack.com/documentation',
    freeTier: true
  },
  {
    id: 'custom',
    name: '自定义',
    description: '使用自定义API端点',
    url: '',
    docUrl: '',
    freeTier: false
  }
];

export default function MarketDataSettings() {
  const { toast } = useToast();
  
  // 设置状态
  const [selectedProvider, setSelectedProvider] = useState<string>('finnhub');
  const [apiKey, setApiKey] = useState<string>('');
  const [customBaseUrl, setCustomBaseUrl] = useState<string>('');
  const [dataMode, setDataMode] = useState<'simulation' | 'live'>('simulation');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  
  // 当前选择的提供商
  const currentProvider = API_PROVIDERS.find(p => p.id === selectedProvider) || API_PROVIDERS[0];
  
  // 获取保存的设置
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getMarketDataSettings();
        if (settings) {
          setSelectedProvider(settings.provider || 'finnhub');
          setApiKey(settings.apiKey || '');
          setCustomBaseUrl(settings.customBaseUrl || '');
          setDataMode(settings.dataMode || 'simulation');
        }
      } catch (error) {
        console.error('加载设置失败', error);
        toast({
          title: '加载设置失败',
          description: '无法加载现有市场数据设置',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [toast]);
  
  // 保存设置
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // 确定基础URL
      const baseUrl = selectedProvider === 'custom' 
        ? customBaseUrl 
        : currentProvider.url;
      
      // 保存设置
      await saveMarketDataSettings({
        provider: selectedProvider,
        apiKey,
        customBaseUrl,
        baseUrl,
        dataMode
      });
      
      toast({
        title: '设置已保存',
        description: '市场数据设置已成功保存并应用',
        variant: 'default'
      });
    } catch (error) {
      console.error('保存设置失败', error);
      toast({
        title: '保存设置失败',
        description: '无法保存市场数据设置',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // 测试API连接
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      // 确定基础URL
      const baseUrl = selectedProvider === 'custom' 
        ? customBaseUrl 
        : currentProvider.url;
      
      // 测试连接
      const result = await testAPIConnection(selectedProvider, apiKey, baseUrl);
      
      setTestResult(result);
      
      toast({
        title: result.success ? 'API连接成功' : 'API连接失败',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('测试API连接失败', error);
      setTestResult({
        success: false,
        message: '测试连接时发生错误'
      });
      
      toast({
        title: 'API连接测试失败',
        description: '无法执行API连接测试',
        variant: 'destructive'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">市场数据设置</h1>
          <p className="text-muted-foreground mt-1">
            配置市场数据来源和API连接
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="data-source" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data-source">数据来源</TabsTrigger>
          <TabsTrigger value="api-config">API配置</TabsTrigger>
          <TabsTrigger value="advanced">高级设置</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data-source" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>选择数据模式</CardTitle>
              <CardDescription>
                选择使用模拟数据还是实时市场数据
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`relative cursor-pointer border-2 ${dataMode === 'simulation' ? 'border-primary' : 'border-border'}`}
                  onClick={() => setDataMode('simulation')}>
                  {dataMode === 'simulation' && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <CheckIcon className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <DatabaseIcon className="h-5 w-5" />
                      <CardTitle className="text-lg">模拟数据</CardTitle>
                    </div>
                    <CardDescription>
                      使用模拟生成的市场数据，适用于测试和开发
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <CheckIcon className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                        <span>无需API密钥或外部连接</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                        <span>立即可用，无设置要求</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                        <span>支持全部功能测试和演示</span>
                      </li>
                      <li className="flex items-start">
                        <AlertCircleIcon className="h-4 w-4 mr-2 text-amber-600 mt-0.5" />
                        <span>数据不反映真实市场情况</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className={`relative cursor-pointer border-2 ${dataMode === 'live' ? 'border-primary' : 'border-border'}`}
                  onClick={() => setDataMode('live')}>
                  {dataMode === 'live' && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <CheckIcon className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <GlobeIcon className="h-5 w-5" />
                      <CardTitle className="text-lg">实时数据</CardTitle>
                    </div>
                    <CardDescription>
                      连接到实时市场数据API，获取真实市场信息
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <CheckIcon className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                        <span>获取真实市场数据和价格</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                        <span>支持实时交易和市场分析</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                        <span>获取公司新闻和市场事件</span>
                      </li>
                      <li className="flex items-start">
                        <AlertCircleIcon className="h-4 w-4 mr-2 text-amber-600 mt-0.5" />
                        <span>需要有效的API密钥和配置</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              {dataMode === 'live' && (
                <div className="rounded-md bg-muted p-4 text-sm">
                  <div className="flex items-start">
                    <InfoIcon className="h-5 w-5 mr-2 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">使用实时数据需要API配置</p>
                      <p className="mt-1">要使用实时市场数据，您需要在"API配置"选项卡中设置有效的API提供商和密钥。</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api-config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API提供商配置</CardTitle>
              <CardDescription>
                选择市场数据API提供商并配置访问凭据
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">API提供商</Label>
                  <Select
                    value={selectedProvider}
                    onValueChange={setSelectedProvider}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="选择API提供商" />
                    </SelectTrigger>
                    <SelectContent>
                      {API_PROVIDERS.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center">
                            <span>{provider.name}</span>
                            {provider.freeTier && (
                              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                免费版
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4 rounded-md bg-muted">
                  <h4 className="font-medium mb-1">{currentProvider.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{currentProvider.description}</p>
                  {currentProvider.id !== 'custom' && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">API基础URL: <code className="bg-background px-1 py-0.5 rounded">{currentProvider.url}</code></div>
                      <a href={currentProvider.docUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary">
                        查看文档
                      </a>
                    </div>
                  )}
                </div>
                
                {selectedProvider === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customBaseUrl">自定义API基础URL</Label>
                    <Input
                      id="customBaseUrl"
                      placeholder="https://api.example.com/v1"
                      value={customBaseUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      输入自定义API服务的基础URL，包括协议和版本路径
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API密钥</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="输入您的API密钥"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    从{currentProvider.id === 'custom' ? '您的API提供商' : currentProvider.name}获取的API密钥或访问令牌
                  </p>
                </div>
                
                {testResult && (
                  <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <div className="flex items-start">
                      {testResult.success 
                        ? <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                        : <AlertCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                      }
                      <span>{testResult.message}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={
                      isTestingConnection || 
                      (selectedProvider !== 'custom' && !apiKey) || 
                      (selectedProvider === 'custom' && (!apiKey || !customBaseUrl))
                    }
                  >
                    {isTestingConnection ? '测试中...' : '测试连接'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>高级设置</CardTitle>
              <CardDescription>
                配置数据缓存和更新频率
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-cache">启用数据缓存</Label>
                    <p className="text-sm text-muted-foreground">
                      缓存请求数据以减少API调用和提高性能
                    </p>
                  </div>
                  <Switch
                    id="enable-cache"
                    defaultChecked={true}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cache-ttl">缓存持续时间 (秒)</Label>
                  <Input
                    id="cache-ttl"
                    type="number"
                    defaultValue="30"
                    min="5"
                    max="3600"
                  />
                  <p className="text-sm text-muted-foreground">
                    数据缓存的有效期，设置较短的时间以获取更频繁的更新
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="throttle-rate">API请求限制 (每分钟)</Label>
                  <Input
                    id="throttle-rate"
                    type="number"
                    defaultValue="60"
                    min="1"
                    max="1000"
                  />
                  <p className="text-sm text-muted-foreground">
                    限制每分钟API请求数，以符合API提供商的使用限制
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="fallback-simulation">数据不可用时回退到模拟数据</Label>
                    <p className="text-sm text-muted-foreground">
                      当API无法响应或达到限制时，使用模拟数据
                    </p>
                  </div>
                  <Switch
                    id="fallback-simulation"
                    defaultChecked={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-3">
        <Button
          variant="default"
          onClick={handleSaveSettings}
          disabled={isSaving || (dataMode === 'live' && !apiKey)}
        >
          {isSaving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  );
} 