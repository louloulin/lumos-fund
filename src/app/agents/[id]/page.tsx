import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 模拟代理数据
const agents = {
  stock: {
    id: 'stock',
    name: '通用股票分析代理',
    description: '提供全面的市场分析和投资建议',
    type: 'analysis',
    status: 'active',
    stats: {
      accuracy: 85,
      totalAnalyses: 1250,
      successfulPredictions: 1062,
      averageConfidence: 78
    },
    recentAnalyses: [
      {
        id: 1,
        symbol: 'AAPL',
        type: '综合分析',
        result: '看涨',
        confidence: 85,
        timestamp: '2024-03-15T10:30:00Z'
      },
      {
        id: 2,
        symbol: 'MSFT',
        type: '综合分析',
        result: '中性',
        confidence: 65,
        timestamp: '2024-03-15T09:45:00Z'
      }
    ]
  },
  value: {
    id: 'value',
    name: '价值投资代理',
    description: '基于巴菲特投资理念，专注于企业价值分析',
    type: 'strategy',
    status: 'active',
    stats: {
      accuracy: 82,
      totalAnalyses: 850,
      successfulPredictions: 697,
      averageConfidence: 75
    },
    recentAnalyses: [
      {
        id: 1,
        symbol: 'BRK.B',
        type: '价值分析',
        result: '看涨',
        confidence: 90,
        timestamp: '2024-03-15T11:00:00Z'
      }
    ]
  }
  // ... 其他代理数据
};

export default function AgentPage({ params }: { params: { id: string } }) {
  const agent = agents[params.id as keyof typeof agents];

  if (!agent) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground mt-2">{agent.description}</p>
          </div>
          <Badge
            variant={agent.status === 'active' ? 'default' : 'secondary'}
            className="h-6"
          >
            {agent.status === 'active' ? '运行中' : '已停止'}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                准确率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent.stats.accuracy}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                分析总数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent.stats.totalAnalyses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                成功预测
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agent.stats.successfulPredictions}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                平均置信度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent.stats.averageConfidence}%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>最近分析</CardTitle>
            <CardDescription>代理最近完成的分析结果</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agent.recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{analysis.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      {analysis.type} · {new Date(analysis.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        analysis.result === '看涨'
                          ? 'default'
                          : analysis.result === '看跌'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {analysis.result}
                    </Badge>
                    <span className="text-sm font-medium">
                      {analysis.confidence}% 置信度
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 