import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  BarChart3Icon,
  CoinsIcon,
  GanttChartIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  ScaleIcon,
  Settings2Icon,
  BrainCircuitIcon,
  ActivityIcon,
} from "lucide-react";

interface MainNavProps {
  className?: string;
  showMobileMenu: boolean;
}

export function MainNav({ className, showMobileMenu }: MainNavProps) {
  const pathname = usePathname();

  const routes = [
    {
      href: "/",
      label: "首页",
      icon: HomeIcon,
      active: pathname === "/",
    },
    {
      href: "/dashboard",
      label: "分析面板",
      icon: LayoutDashboardIcon,
      active: pathname === "/dashboard",
    },
    {
      href: "/portfolio",
      label: "投资组合",
      icon: GanttChartIcon,
      active: pathname === "/portfolio",
    },
    {
      href: "/markets",
      label: "市场行情",
      icon: LineChartIcon,
      active: pathname === "/markets",
    },
    {
      href: "/strategy",
      label: "策略推荐",
      icon: ScaleIcon,
      active: pathname === "/strategy",
    },
    {
      href: "/quantitative",
      label: "量化分析",
      icon: BarChart3Icon,
      active: pathname === "/quantitative",
    },
    {
      href: "/trading",
      label: "交易",
      icon: CoinsIcon,
      active: pathname === "/trading",
    },
    {
      href: "/backtest",
      label: "回测系统",
      icon: ActivityIcon,
      active: pathname === "/backtest",
    },
    {
      href: "/test-agents",
      label: "AI代理测试",
      icon: BrainCircuitIcon,
      active: pathname === "/test-agents",
    },
    {
      href: "/settings",
      label: "设置",
      icon: Settings2Icon,
      active: pathname === "/settings",
    },
  ];

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {routes.map((route) => {
        const Icon = route.icon;
        return showMobileMenu ? (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              route.active
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "justify-start"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {route.label}
          </Link>
        ) : (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              route.active ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
} 