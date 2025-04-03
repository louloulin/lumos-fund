'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle, Brain, TrendingUp, BarChart, ShieldAlert } from 'lucide-react';
import { testAgent } from '@/actions/mastra';

const agents = [
  {
    id: 'tradingAssistant',
    name: '交易助手代理',
    description: '提供全面的市场分析和投资建议',
    type: 'analysis',
    status: 'active',
    icon: <Brain className="h-6 w-6 text-primary" />
  },
  {
    id: 'valueInvestor',
    name: '价值投资代理',
    description: '基于巴菲特投资理念，专注于企业价值分析',
    type: 'strategy',
    status: 'active',
    icon: <BarChart className="h-6 w-6 text-primary" />
  },
  {
    id: 'technicalAnalyst',
    name: '技术分析代理',
    description: '专注于价格走势和技术指标分析',
    type: 'strategy',
    status: 'active',
    icon: <TrendingUp className="h-6 w-6 text-primary" />
  },
  {
    id: 'riskManager',
    name: '风险管理代理',
    description: '投资组合风险评估和管理',
    type: 'risk',
    status: 'active',
    icon: <ShieldAlert className="h-6 w-6 text-primary" />
  }
];

export default function AgentsPage() {
  const [testResponses, setTestResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // 测试代理响应
  const handleTestAgent = async (agentId: string) => {
    try {
      setLoading(prev => ({ ...prev, [agentId]: true }));
      
      const defaultPrompts: Record<string, string> = {
        tradingAssistant: '分析AAPL股票的当前市场状况',
        valueInvestor: '从价值投资角度分析AAPL',
        technicalAnalyst: '分析AAPL的技术指标和价格走势',
        riskManager: '评估投资AAPL的风险因素'
      };
      
      const prompt = defaultPrompts[agentId] || '分析当前市场状况';
      const response = await testAgent(agentId, prompt);
      
      setTestResponses(prev => ({
        ...prev,
        [agentId]: response
      }));
    } catch (error) {
      console.error(`测试代理 ${agentId} 出错:`, error);
      setTestResponses(prev => ({
        ...prev,
        [agentId]: `错误: ${error instanceof Error ? error.message : String(error)}`
      }));
    } finally {
      setLoading(prev => ({ ...prev, [agentId]: false }));
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">AI 交易代理</h1>
          <p className="text-muted-foreground mt-2">
            基于Mastra AI框架的专业交易助手代理系统
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">全部代理</TabsTrigger>
            <TabsTrigger value="strategy">投资策略</TabsTrigger>
            <TabsTrigger value="analysis">市场分析</TabsTrigger>
            <TabsTrigger value="risk">风险管理</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {agents.map((agent) => (
                <AgentCard 
                  key={agent.id} 
                  agent={agent} 
                  testResponse={testResponses[agent.id]} 
                  loading={loading[agent.id]} 
                  onTest={() => handleTestAgent(agent.id)}
                />
              ))}
            </div>
          </TabsContent>

          {['strategy', 'analysis', 'risk'].map((type) => (
            <TabsContent key={type} value={type} className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {agents
                  .filter((agent) => agent.type === type)
                  .map((agent) => (
                    <AgentCard 
                      key={agent.id} 
                      agent={agent} 
                      testResponse={testResponses[agent.id]} 
                      loading={loading[agent.id]} 
                      onTest={() => handleTestAgent(agent.id)}
                    />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

interface AgentCardProps {
  agent: typeof agents[0];
  testResponse?: string;
  loading?: boolean;
  onTest: () => void;
}

function AgentCard({ agent, testResponse, loading, onTest }: AgentCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {agent.icon}
            <CardTitle className="text-xl">{agent.name}</CardTitle>
          </div>
          <Badge
            variant={agent.status === 'active' ? 'default' : 'secondary'}
          >
            {agent.status === 'active' ? '运行中' : '已停止'}
          </Badge>
        </div>
        <CardDescription>{agent.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">类型</span>
            <span className="font-medium">
              {agent.type === 'strategy' && '投资策略'}
              {agent.type === 'analysis' && '市场分析'}
              {agent.type === 'risk' && '风险管理'}
            </span>
          </div>
          
          {testResponse && (
            <div className="mt-2 p-3 bg-muted rounded-md text-sm">
              <p className="font-medium mb-1">测试响应:</p>
              <p className="text-muted-foreground line-clamp-4">{testResponse}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onTest}
          disabled={loading}
        >
          {loading ? '处理中...' : '测试代理'}
          <PlayCircle className="ml-1 h-4 w-4" />
        </Button>
        
        <Link href={`/agents/${agent.id}`}>
          <Button size="sm" variant="ghost">
            查看详情
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 