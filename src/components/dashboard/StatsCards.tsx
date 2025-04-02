'use client';

import { 
  IconChartBar, 
  IconArrowUpRight, 
  IconArrowDownRight,
  IconRobot,
  IconClock,
  IconBrain
} from '@tabler/icons-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: React.ReactNode;
}

function StatCard({ title, value, description, trend, icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      
      <div className="flex items-center mt-1">
        {trend && (
          <div className={`stat-trend ${trend.direction === 'up' ? 'stat-trend-up' : trend.direction === 'down' ? 'stat-trend-down' : ''} mr-1.5`}>
            {trend.direction === 'up' ? (
              <IconArrowUpRight size={12} stroke={1.5} />
            ) : trend.direction === 'down' ? (
              <IconArrowDownRight size={12} stroke={1.5} />
            ) : null}
            <span className="text-xs">
              {trend.direction !== 'neutral' && (trend.direction === 'up' ? '+' : '')}
              {trend.value}%
            </span>
          </div>
        )}
        <div className="stat-description">{description}</div>
      </div>
    </div>
  );
}

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        title="活跃策略"
        value="12"
        description="交易策略数量"
        trend={{ value: 2.5, direction: 'up' }}
        icon={<IconChartBar size={16} stroke={1.5} />}
      />
      <StatCard
        title="分析代理"
        value="8"
        description="AI分析引擎"
        trend={{ value: 2.5, direction: 'up' }}
        icon={<IconBrain size={16} stroke={1.5} />}
      />
      <StatCard
        title="向量集合"
        value="5"
        description="AI训练数据"
        trend={{ value: 2.5, direction: 'up' }}
        icon={<IconRobot size={16} stroke={1.5} />}
      />
      <StatCard
        title="活跃查询"
        value="3"
        description="当前运行查询"
        trend={{ value: 1.2, direction: 'down' }}
        icon={<IconClock size={16} stroke={1.5} />}
      />
    </div>
  );
} 