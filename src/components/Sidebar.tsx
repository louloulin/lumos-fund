'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  BarChart,
  Lightbulb
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: '仪表盘',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: '交易中心',
    href: '/dashboard/trading',
    icon: ArrowRightLeft,
  },
  {
    label: '市场分析',
    href: '/dashboard/market',
    icon: LineChart,
  },
  {
    label: '投资组合',
    href: '/dashboard/portfolio',
    icon: Briefcase,
  },
  {
    label: '策略推荐',
    href: '/strategy',
    icon: Lightbulb,
  },
  {
    label: '回测系统',
    href: '/dashboard/trading?tab=backtest',
    icon: BarChart,
  },
  {
    label: 'AI代理',
    href: '/dashboard/agents',
    icon: Brain,
  },
  {
    label: '数据管理',
    href: '/dashboard/data',
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
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const [collapsed, setCollapsed] = useState(false);
  
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
      <div className={cn(
          "border-r bg-background h-screen flex flex-col relative group",
          collapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4 flex items-center justify-between">
          <div className={cn(
              "flex items-center transition-opacity",
              collapsed ? "opacity-0 invisible" : "opacity-100 visible"
          )}>
            <div className="h-8 w-8 rounded-full bg-primary/90 flex items-center justify-center text-white font-bold text-lg mr-3">
              L
            </div>
            <h1 className="text-xl font-bold tracking-tight">LumosFund</h1>
          </div>
          <button
              onClick={() => setCollapsed(!collapsed)}
              className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className={cn(
            "px-3 mb-4",
            collapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <input
                type="text"
                placeholder="搜索..."
                className="w-full h-9 rounded-md bg-muted pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto py-2">
          <nav className="grid gap-1 px-2">
            {navItems.map((item) => {
              const isItemActive = isActive(item.href);

              return (
                  <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                          isItemActive ? "bg-muted font-medium" : "text-muted-foreground",
                          collapsed && "justify-center"
                      )}
                  >
                    <item.icon className={cn("h-4 w-4", isItemActive && "text-primary")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t">
          <div className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center"
          )}>
            <div className="h-8 w-8 rounded-full bg-muted" />
            {!collapsed && (
                <div>
                  <p className="text-sm font-medium">用户名</p>
                  <p className="text-xs text-muted-foreground">user@example.com</p>
                </div>
            )}
          </div>
        </div>
      </div>
  );
} 