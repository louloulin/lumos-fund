'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// 设置类型定义
type GeneralSettings = {
  theme: string;
  language: string;
  notifications: boolean;
};

type TradingSettings = {
  defaultInitialCapital: number;
  defaultStockCode: string;
  defaultRiskTolerance: string;
  autosaveAnalysis: boolean;
  realTimeData: boolean;
};

type AISettings = {
  preferredModel: string;
  detailedAnalysis: boolean;
  memory: boolean;
  maxResponseTokens: number;
};

type BacktestSettings = {
  defaultPeriod: string;
  defaultStrategy: string;
  includeDividends: boolean;
  includeTransactionCosts: boolean;
  transactionFeeRate: number;
  slippageRate: number;
};

type AppSettings = {
  general: GeneralSettings;
  trading: TradingSettings;
  ai: AISettings;
  backtest: BacktestSettings;
};

// 默认设置
const defaultSettings: AppSettings = {
  general: {
    theme: 'system',
    language: 'zh-CN',
    notifications: true,
  },
  trading: {
    defaultInitialCapital: 100000,
    defaultStockCode: '600519', // 贵州茅台
    defaultRiskTolerance: 'medium',
    autosaveAnalysis: true,
    realTimeData: false, // 实时数据订阅（需付费）
  },
  ai: {
    preferredModel: 'gpt-4o-mini',
    detailedAnalysis: true,
    memory: true,
    maxResponseTokens: 2000,
  },
  backtest: {
    defaultPeriod: 'year',
    defaultStrategy: 'value',
    includeDividends: true,
    includeTransactionCosts: true,
    transactionFeeRate: 0.0003, // 0.03%
    slippageRate: 0.001, // 0.1%
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 处理设置保存
  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // 这里会存储设置到本地或服务器
      localStorage.setItem('lumosFundSettings', JSON.stringify(settings));
      
      // 更新主题
      setTheme(settings.general.theme);
      
      toast({
        title: "设置已保存",
        description: "您的偏好设置已成功更新。",
      });
    } catch (error) {
      console.error('保存设置失败:', error);
      toast({
        title: "保存失败",
        description: "无法保存您的设置，请稍后重试。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 重置设置
  const handleResetSettings = () => {
    setSettings(defaultSettings);
    toast({
      title: "设置已重置",
      description: "所有设置已恢复到默认值。",
    });
  };
  
  // 更新单个设置字段
  const updateSetting = (
    category: keyof AppSettings,
    field: string,
    value: any
  ) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value
      }
    });
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">设置</h1>
        </div>
        
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          <Button 
            variant="outline" 
            onClick={handleResetSettings}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            重置
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            保存设置
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">通用设置</TabsTrigger>
          <TabsTrigger value="trading">交易偏好</TabsTrigger>
          <TabsTrigger value="ai">AI助手设置</TabsTrigger>
          <TabsTrigger value="backtest">回测设置</TabsTrigger>
        </TabsList>
        
        {/* 通用设置 */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>通用设置</CardTitle>
              <CardDescription>
                配置应用的基本设置和用户界面偏好
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="theme">界面主题</Label>
                  <Select 
                    value={settings.general.theme} 
                    onValueChange={(value) => updateSetting('general', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择主题" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">浅色</SelectItem>
                      <SelectItem value="dark">深色</SelectItem>
                      <SelectItem value="system">跟随系统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="language">语言</Label>
                  <Select 
                    value={settings.general.language} 
                    onValueChange={(value) => updateSetting('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择语言" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      接收通知
                    </Label>
                    <CardDescription>
                      允许应用发送关于市场变化和交易机会的通知
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.general.notifications}
                    onCheckedChange={(checked: boolean) => 
                      updateSetting('general', 'notifications', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 交易偏好 */}
        <TabsContent value="trading">
          <Card>
            <CardHeader>
              <CardTitle>交易偏好</CardTitle>
              <CardDescription>
                配置您的默认交易参数和风险偏好
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="defaultInitialCapital">默认初始资金（元）</Label>
                  <Input
                    id="defaultInitialCapital"
                    type="number"
                    value={settings.trading.defaultInitialCapital}
                    onChange={(e) => 
                      updateSetting('trading', 'defaultInitialCapital', Number(e.target.value))
                    }
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="defaultStockCode">默认股票代码</Label>
                  <Input
                    id="defaultStockCode"
                    value={settings.trading.defaultStockCode}
                    onChange={(e) => 
                      updateSetting('trading', 'defaultStockCode', e.target.value)
                    }
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="defaultRiskTolerance">默认风险承受能力</Label>
                  <Select 
                    value={settings.trading.defaultRiskTolerance} 
                    onValueChange={(value) => updateSetting('trading', 'defaultRiskTolerance', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择风险承受能力" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低风险</SelectItem>
                      <SelectItem value="medium">中等风险</SelectItem>
                      <SelectItem value="high">高风险</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      自动保存分析
                    </Label>
                    <CardDescription>
                      自动保存AI生成的分析结果
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.trading.autosaveAnalysis}
                    onCheckedChange={(checked: boolean) => 
                      updateSetting('trading', 'autosaveAnalysis', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      实时数据订阅
                    </Label>
                    <CardDescription>
                      启用实时市场数据（需付费）
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.trading.realTimeData}
                    onCheckedChange={(checked: boolean) => 
                      updateSetting('trading', 'realTimeData', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI设置 */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI助手设置</CardTitle>
              <CardDescription>
                配置AI代理的行为和偏好
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="preferredModel">首选AI模型</Label>
                  <Select 
                    value={settings.ai.preferredModel} 
                    onValueChange={(value) => updateSetting('ai', 'preferredModel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择AI模型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o（高级）</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini（标准）</SelectItem>
                      <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      详细分析
                    </Label>
                    <CardDescription>
                      生成更详细的分析报告（消耗更多token）
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.ai.detailedAnalysis}
                    onCheckedChange={(checked: boolean) => 
                      updateSetting('ai', 'detailedAnalysis', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      记忆功能
                    </Label>
                    <CardDescription>
                      允许AI助手记住对话历史
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.ai.memory}
                    onCheckedChange={(checked: boolean) => 
                      updateSetting('ai', 'memory', checked)
                    }
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxResponseTokens">
                      最大响应长度 ({settings.ai.maxResponseTokens} tokens)
                    </Label>
                  </div>
                  <Slider
                    id="maxResponseTokens"
                    defaultValue={[settings.ai.maxResponseTokens]}
                    max={4000}
                    min={500}
                    step={100}
                    onValueChange={(value: number[]) => 
                      updateSetting('ai', 'maxResponseTokens', value[0])
                    }
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>简短</span>
                    <span>中等</span>
                    <span>详细</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 回测设置 */}
        <TabsContent value="backtest">
          <Card>
            <CardHeader>
              <CardTitle>回测设置</CardTitle>
              <CardDescription>
                配置策略回测的默认参数和计算方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="defaultPeriod">默认回测周期</Label>
                  <Select 
                    value={settings.backtest.defaultPeriod} 
                    onValueChange={(value) => updateSetting('backtest', 'defaultPeriod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择回测周期" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">近1个月</SelectItem>
                      <SelectItem value="quarter">近3个月</SelectItem>
                      <SelectItem value="halfYear">近6个月</SelectItem>
                      <SelectItem value="year">近1年</SelectItem>
                      <SelectItem value="threeYears">近3年</SelectItem>
                      <SelectItem value="fiveYears">近5年</SelectItem>
                      <SelectItem value="custom">自定义</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="defaultStrategy">默认策略</Label>
                  <Select 
                    value={settings.backtest.defaultStrategy} 
                    onValueChange={(value) => updateSetting('backtest', 'defaultStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择默认策略" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="value">价值投资</SelectItem>
                      <SelectItem value="momentum">动量策略</SelectItem>
                      <SelectItem value="meanReversion">均值回归</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      包含股息
                    </Label>
                    <CardDescription>
                      在回测计算中考虑股息收入
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.backtest.includeDividends}
                    onCheckedChange={(checked: boolean) => 
                      updateSetting('backtest', 'includeDividends', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      包含交易成本
                    </Label>
                    <CardDescription>
                      在回测计算中考虑交易费用和滑点
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.backtest.includeTransactionCosts}
                    onCheckedChange={(checked: boolean) => 
                      updateSetting('backtest', 'includeTransactionCosts', checked)
                    }
                  />
                </div>
                
                {settings.backtest.includeTransactionCosts && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="transactionFeeRate">
                          交易费率 ({(settings.backtest.transactionFeeRate * 100).toFixed(3)}%)
                        </Label>
                      </div>
                      <Slider
                        id="transactionFeeRate"
                        defaultValue={[settings.backtest.transactionFeeRate]}
                        max={0.003}
                        min={0}
                        step={0.0001}
                        onValueChange={(value: number[]) => 
                          updateSetting('backtest', 'transactionFeeRate', value[0])
                        }
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="slippageRate">
                          滑点率 ({(settings.backtest.slippageRate * 100).toFixed(2)}%)
                        </Label>
                      </div>
                      <Slider
                        id="slippageRate"
                        defaultValue={[settings.backtest.slippageRate]}
                        max={0.01}
                        min={0}
                        step={0.001}
                        onValueChange={(value: number[]) => 
                          updateSetting('backtest', 'slippageRate', value[0])
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleResetSettings}>重置到默认值</Button>
              <Button onClick={handleSaveSettings} disabled={isLoading}>保存设置</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 