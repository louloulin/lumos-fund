import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const agents = [
  {
    id: 'stock',
    name: '通用股票分析代理',
    description: '提供全面的市场分析和投资建议',
    type: 'analysis',
    status: 'active'
  },
  {
    id: 'value',
    name: '价值投资代理',
    description: '基于巴菲特投资理念，专注于企业价值分析',
    type: 'strategy',
    status: 'active'
  },
  {
    id: 'growth',
    name: '成长投资代理',
    description: '专注于高增长公司的分析和投资机会',
    type: 'strategy',
    status: 'active'
  },
  {
    id: 'trend',
    name: '趋势投资代理',
    description: '基于技术分析的趋势跟踪策略',
    type: 'strategy',
    status: 'active'
  },
  {
    id: 'quant',
    name: '量化投资代理',
    description: '多因子模型分析和统计套利策略',
    type: 'strategy',
    status: 'active'
  },
  {
    id: 'macro',
    name: '宏观分析代理',
    description: '分析宏观经济环境对投资的影响',
    type: 'analysis',
    status: 'active'
  },
  {
    id: 'risk',
    name: '风险管理代理',
    description: '投资组合风险评估和管理',
    type: 'risk',
    status: 'active'
  },
  {
    id: 'sentiment',
    name: '情绪分析代理',
    description: '分析市场情绪和新闻影响',
    type: 'analysis',
    status: 'active'
  }
];

export default function AgentsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">AI 交易代理</h1>
          <p className="text-muted-foreground mt-2">
            管理和监控您的AI交易代理系统
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </TabsContent>

          {['strategy', 'analysis', 'risk'].map((type) => (
            <TabsContent key={type} value={type} className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents
                  .filter((agent) => agent.type === type)
                  .map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: typeof agents[0] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{agent.name}</CardTitle>
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
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">状态</span>
            <span className="font-medium">
              {agent.status === 'active' ? '正常运行' : '已停止运行'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 