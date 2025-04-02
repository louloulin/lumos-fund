/**
 * 服务器端专用的日志工具
 * 仅在服务器端组件中使用此模块
 * 
 * 使用方法:
 * import { logger } from '@/lib/logger.server';
 */

let logger: any;

// 注意：此文件应该只在服务器端导入
// 导入pino
try {
  const pino = require('pino');
  logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard'
      }
    }
  });
} catch (error) {
  console.warn('无法初始化服务器日志器', error);
  // 回退方案
  logger = {
    info: console.info,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
    trace: console.trace
  };
}

export { logger };

// 创建一个方便的日志创建函数
export function createLogger(name: string) {
  return logger.child({ name });
} 