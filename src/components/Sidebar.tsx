'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  Home,
  BarChart, 
  Layers, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  FileText,
  Moon,
  LogOut
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navSections = [
  {
    title: "概览",
    items: [
      {
        label: '仪表盘',
        href: '/',
        icon: Home,
      }
    ]
  },
  {
    title: "数据存储",
    items: [
      {
        label: 'SQLite',
        href: '/sqlite',
        icon: Database,
      },
      {
        label: 'DuckDB',
        href: '/duckdb',
        icon: Database,
      },
      {
        label: 'SQL 编辑器',
        href: '/sql-editor',
        icon: FileText,
      },
      {
        label: '向量数据',
        href: '/vector-data',
        icon: Layers,
      }
    ]
  },
  {
    title: "监控与分析",
    items: [
      {
        label: '分析面板',
        href: '/analytics',
        icon: BarChart,
      },
      {
        label: '实时数据',
        href: '/real-time',
        icon: ExternalLink,
      }
    ]
  },
  {
    title: "系统管理",
    items: [
      {
        label: '设置',
        href: '/settings',
        icon: Settings,
      }
    ]
  },
  {
    title: "Backup & Recovery",
    items: [
      {
        label: 'Backup',
        href: '/backup',
        icon: RotateCcw,
      }
    ]
  },
  {
    title: "Documentation",
    items: [
      {
        label: 'Documentation',
        href: '/documentation',
        icon: FileText,
      }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "border-r border-[#e2e8f0] dark:border-[#2d3748] bg-sidebar h-screen flex flex-col relative group transition-all duration-200 ease-in-out",
      collapsed ? "w-16" : "w-[225px]"
    )}>
      <div className="p-4 flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#2d3748]">
        <div className={cn(
          "flex items-center transition-opacity",
          collapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}>
          <div className="h-8 w-8 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mr-2">
            <Database className="h-5 w-5" />
          </div>
          <h1 className="text-base font-semibold text-sidebar-foreground">LumosDB</h1>
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="h-6 w-6 rounded-sm bg-sidebar-accent/30 flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-auto py-2">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-4">
            {!collapsed && (
              <h2 className="text-xs uppercase font-medium text-muted-foreground px-4 py-1">
                {section.title}
              </h2>
            )}
            <nav className="grid gap-1 px-2 mt-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive 
                        ? "bg-secondary/50 text-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/30",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4", 
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className={cn("flex flex-col space-y-2", collapsed && "items-center")}>
          <Link
            href="/theme"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/30"
          >
            <Moon className="h-4 w-4" />
            {!collapsed && <span>暗色主题</span>}
          </Link>
          <Link
            href="/logout"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/30"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>退出登录</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
} 