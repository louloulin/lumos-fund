'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Save, ChevronRight, AlertCircle } from 'lucide-react';

export interface AgentEditorProps {
  initialAgent?: AgentConfig;
  onSave: (agent: AgentConfig) => void;
  onCancel: () => void;
}

export interface AgentConfig {
  id?: string;
  name: string;
  description: string;
  type: 'value' | 'growth' | 'trend' | 'quant' | 'custom';
  model: string;
  enabled: boolean;
  prompt: string;
  parameters: {
    [key: string]: any;
  };
  tools: string[];
}

const defaultAgent: AgentConfig = {
  name: '新AI代理',
  description: '描述这个AI代理的功能和特点',
  type: 'custom',
  model: 'gpt-4o',
  enabled: true,
  prompt: '你是一个专业的投资分析AI。请分析以下股票数据并提供详细的投资建议。',
  parameters: {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.95,
  },
  tools: ['marketData', 'financialMetrics', 'technicalIndicators']
};

export function AgentEditor({ initialAgent, onSave, onCancel }: AgentEditorProps) {
  const [agent, setAgent] = useState<AgentConfig>(initialAgent || defaultAgent);
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof AgentConfig, value: any) => {
    setAgent(prev => ({ ...prev, [field]: value }));
    // Clear error if field is now valid
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleParameterChange = (param: string, value: any) => {
    setAgent(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [param]: value
      }
    }));
  };

  const toggleTool = (tool: string) => {
    setAgent(prev => {
      const tools = prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool];
      return { ...prev, tools };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!agent.name.trim()) {
      newErrors.name = '代理名称不能为空';
    }
    
    if (!agent.prompt.trim()) {
      newErrors.prompt = '提示词不能为空';
    }
    
    if (agent.parameters.temperature < 0 || agent.parameters.temperature > 1) {
      newErrors.temperature = '温度必须在0到1之间';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(agent);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {initialAgent ? '编辑AI代理' : '创建AI代理'}
        </CardTitle>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">基本设置</TabsTrigger>
            <TabsTrigger value="prompt">提示词</TabsTrigger>
            <TabsTrigger value="advanced">高级设置</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-6">
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                代理名称 {errors.name && <span className="text-red-500 text-xs ml-2">{errors.name}</span>}
              </Label>
              <Input
                id="name"
                value={agent.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                placeholder="例如：价值投资专家"
                className={errors.name ? 'border-red-500' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">代理描述</Label>
              <Textarea
                id="description"
                value={agent.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                placeholder="描述这个AI代理的主要功能和用途"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">代理类型</Label>
              <Select 
                value={agent.type} 
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择代理类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">价值投资</SelectItem>
                  <SelectItem value="growth">成长投资</SelectItem>
                  <SelectItem value="trend">趋势投资</SelectItem>
                  <SelectItem value="quant">量化投资</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">大语言模型</Label>
              <Select 
                value={agent.model} 
                onValueChange={(value) => handleChange('model', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={agent.enabled}
                onCheckedChange={(value) => handleChange('enabled', value)}
                id="enabled"
              />
              <Label htmlFor="enabled">启用代理</Label>
            </div>
          </TabsContent>
          
          <TabsContent value="prompt" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="prompt">
                  代理提示词 {errors.prompt && <span className="text-red-500 text-xs ml-2">{errors.prompt}</span>}
                </Label>
                <span className="text-xs text-muted-foreground">
                  定义代理的角色、专业知识和任务
                </span>
              </div>
              <Textarea
                id="prompt"
                value={agent.prompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('prompt', e.target.value)}
                placeholder="你是一个专业的投资分析师..."
                rows={12}
                className={errors.prompt ? 'border-red-500' : ''}
              />
            </div>
            
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200 flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">提示词指南</p>
                <p>在提示词中明确指定代理的专业领域，要分析的内容，以及输出格式。例如："你是一个专注于价值投资的分析师，请分析以下股票的基本面指标，并给出买入/卖出建议。"</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">
                  温度 ({agent.parameters.temperature})
                  {errors.temperature && <span className="text-red-500 text-xs ml-2">{errors.temperature}</span>}
                </Label>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={agent.parameters.temperature}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleParameterChange('temperature', parseFloat(e.target.value))}
                  className={errors.temperature ? 'border-red-500' : ''}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>精确</span>
                  <span>创意</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxTokens">最大Token数</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="100"
                  max="4000"
                  value={agent.parameters.maxTokens}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleParameterChange('maxTokens', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>可用工具</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { id: 'marketData', name: '市场数据工具' },
                  { id: 'financialMetrics', name: '财务指标工具' },
                  { id: 'technicalIndicators', name: '技术指标工具' },
                  { id: 'newsSentiment', name: '新闻情绪分析' },
                  { id: 'macroEconomic', name: '宏观经济分析' },
                  { id: 'riskAssessment', name: '风险评估工具' }
                ].map(tool => (
                  <div key={tool.id} className="flex items-center space-x-2">
                    <Switch
                      checked={agent.tools.includes(tool.id)}
                      onCheckedChange={() => toggleTool(tool.id)}
                      id={`tool-${tool.id}`}
                    />
                    <Label htmlFor={`tool-${tool.id}`}>{tool.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          取消
        </Button>
        <Button onClick={handleSubmit}>
          <Save className="mr-2 h-4 w-4" />
          保存代理
        </Button>
      </CardFooter>
    </Card>
  );
} 