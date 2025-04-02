'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  IconHome,
  IconChartBar, 
  IconDatabase,
  IconCode,
  IconRobot,
  IconSettings,
  IconUser,
  IconHistory,
  IconBrandGithub,
  IconLogout,
  IconChartPie,
  IconChartLine,
} from '@tabler/icons-react';

// 侧边栏菜单项定义
const menuItems = [
  {
    title: '概览',
    items: [
      {
        title: '仪表盘',
        href: '/dashboard',
        icon: <IconHome size={16} stroke={1.5} />,
      },
    ],
  },
  {
    title: '数据存储',
    items: [
      {
        title: '股票数据',
        href: '/stocks',
        icon: <IconChartLine size={16} stroke={1.5} />,
      },
      {
        title: '数据源',
        href: '/datasources',
        icon: <IconDatabase size={16} stroke={1.5} />,
      },
    ],
  },
  {
    title: 'AI代理',
    items: [
      {
        title: '代理管理',
        href: '/agents',
        icon: <IconRobot size={16} stroke={1.5} />,
      },
      {
        title: '投资策略',
        href: '/strategies',
        icon: <IconCode size={16} stroke={1.5} />,
      },
    ],
  },
  {
    title: '监控与分析',
    items: [
      {
        title: '分析面板',
        href: '/analytics',
        icon: <IconChartBar size={16} stroke={1.5} />,
      },
      {
        title: '交易历史',
        href: '/history',
        icon: <IconHistory size={16} stroke={1.5} />,
      },
    ],
  },
  {
    title: '系统管理',
    items: [
      {
        title: '设置',
        href: '/settings',
        icon: <IconSettings size={16} stroke={1.5} />,
      },
      {
        title: '个人资料',
        href: '/profile',
        icon: <IconUser size={16} stroke={1.5} />,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="flex items-center gap-2.5">
          <IconChartPie size={18} className="text-foreground" stroke={2} />
          <span className="font-medium">LumosFund</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {menuItems.map((section, i) => (
          <div key={i} className="sidebar-section">
            <div className="sidebar-section-title">
              {section.title}
            </div>
            {section.items.map((item, j) => (
              <Link 
                key={j} 
                href={item.href}
                className={cn(
                  "sidebar-item",
                  pathname === item.href && "active"
                )}
              >
                <span className="text-current opacity-70">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto p-3 border-t border-[#e2e8f0] dark:border-[#2d3748]">
        <div className="space-y-1">
          <a 
            href="https://github.com/lumos-fund" 
            target="_blank" 
            rel="noopener noreferrer"
            className="sidebar-item"
          >
            <IconBrandGithub size={16} stroke={1.5} className="opacity-70" />
            <span>GitHub</span>
          </a>
          <button className="sidebar-item w-full text-left">
            <IconLogout size={16} stroke={1.5} className="text-destructive opacity-70" />
            <span className="text-destructive">退出登录</span>
          </button>
        </div>
      </div>
    </div>
  );
} 