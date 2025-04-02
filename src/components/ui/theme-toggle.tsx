"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

// 简单实现主题切换功能
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // 组件挂载时初始化
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 避免服务端渲染与客户端渲染不匹配
  if (!mounted) {
    return null;
  }

  return (
    <button
      className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
    >
      {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
} 