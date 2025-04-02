'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  LineChart, 
  BarChartHorizontal, 
  ArrowRightLeft, 
  Brain, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Search,
  BarChart
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: '仪表盘',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: '交易中心',
    href: '/trading',
    icon: ArrowRightLeft,
  },
  {
    label: '市场分析',
    href: '/market',
    icon: LineChart,
  },
  {
    label: '投资组合',
    href: '/portfolio',
    icon: Briefcase,
  },
  {
    label: '回测系统',
    href: '/backtest',
    icon: BarChart,
  },
  {
    label: 'AI代理',
    href: '/agents',
    icon: Brain,
  },
  {
    label: '数据管理',
    href: '/data',
    icon: BarChartHorizontal,
  },
  {
    label: '系统设置',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "border-r border-border bg-background h-screen flex flex-col relative group transition-all duration-200 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className={cn(
          "flex items-center transition-opacity",
          collapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mr-2">
            L
          </div>
          <h1 className="text-xl font-bold">LumosFund</h1>
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className={cn(
        "px-3 py-2",
        collapsed ? "opacity-0 invisible h-0" : "opacity-100 visible h-auto"
      )}>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="搜索..." 
            className="w-full h-9 rounded-md bg-secondary/50 pl-8 pr-4 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive 
                    ? "bg-secondary text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4", 
                  isActive ? "text-foreground" : "text-muted-foreground"
                )} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-medium text-sm">
            U
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium">用户名</p>
              <p className="text-xs text-muted-foreground">user@example.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
} 