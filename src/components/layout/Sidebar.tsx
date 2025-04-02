import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: '仪表盘' },
    { href: '/analysis', label: '分析' },
    { href: '/backtest', label: '回测' },
    { href: '/agents', label: 'AI代理' },
    { href: '/settings', label: '设置' },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-primary">LumosFund</h2>
        <p className="text-sm text-muted-foreground">AI驱动的量化交易平台</p>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 rounded-md transition-colors",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full">
          创建AI策略
        </Button>
      </div>
    </div>
  );
} 