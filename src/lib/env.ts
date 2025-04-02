/**
 * 环境变量处理工具
 * 安全地处理客户端和服务器端的环境变量
 */

// 默认值
const defaults = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
};

// 定义环境变量类型
type EnvVars = Record<string, string | undefined>;

// 客户端安全的环境变量
// 只包含NEXT_PUBLIC_开头的变量或特定允许的变量
export const clientEnv: EnvVars = {
  NODE_ENV: process.env.NODE_ENV,
  // 添加所有需要在客户端可用的环境变量
  ...Object.entries(process.env || {}).reduce((acc, [key, value]) => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      acc[key] = value;
    }
    return acc;
  }, {} as EnvVars),
};

// 服务器端环境变量
// 包含所有环境变量，但只在服务器端可用
export function getServerEnv(): EnvVars {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv 只能在服务器端使用');
  }
  
  return {
    ...defaults,
    ...process.env,
  };
}

// 安全获取环境变量，如果未定义则使用默认值
export function getEnv(key: string, defaultValue: string = ''): string {
  if (typeof window === 'undefined') {
    // 服务器端
    return (process.env[key] as string) || defaultValue;
  } else {
    // 客户端，只能访问NEXT_PUBLIC_变量
    if (key.startsWith('NEXT_PUBLIC_')) {
      return clientEnv[key] || defaultValue;
    }
    console.warn(`在客户端尝试访问非公共环境变量: ${key}`);
    return defaultValue;
  }
} 