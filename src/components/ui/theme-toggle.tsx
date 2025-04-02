"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";

// 简单实现主题切换功能
export function ThemeToggle() {
  const [theme, setThemeState] = React.useState<string>('light');
  const [mounted, setMounted] = React.useState(false);

  // 组件挂载时初始化主题
  React.useEffect(() => {
    setMounted(true);
    
    // 检查本地存储或系统偏好
    const savedTheme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // 应用主题到HTML元素
  const applyTheme = (newTheme: string) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // 避免服务端渲染与客户端渲染不匹配
  if (!mounted) {
    return null;
  }

  return (
    <button
      className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      onClick={toggleTheme}
      title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
    >
      {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
} 