/**
 * 安全的日志工具，可在客户端和服务器端使用
 * 在服务器端使用pino，在客户端使用console
 */

let logger: any;

// 检查是否在浏览器环境
if (typeof window === 'undefined') {
  // 服务器端代码，使用动态导入避免客户端构建问题
  try {
    // 使用动态require，避免webpack尝试打包
    const pino = require('pino');
    logger = pino({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    });
  } catch (error) {
    // 如果pino不可用，使用console作为回退
    console.warn('Pino logger不可用，使用console作为回退', error);
    logger = {
      info: console.info,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
      trace: console.trace
    };
  }
} else {
  // 客户端代码，使用console
  logger = {
    info: console.info,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
    trace: console.trace
  };
}

export default logger; 