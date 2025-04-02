const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 使用实验性配置替代serverExternalPackages
  experimental: {
    serverComponentsExternalPackages: [
      "@mastra/*", 
      "@libsql/*", 
      "libsql"
    ]
  },
  
  // 常规配置
  reactStrictMode: true,
  
  // 图像配置
  images: {
    unoptimized: true,
  },
  
  // Webpack配置
  webpack: (config, { isServer }) => {
    // 客户端配置
    if (!isServer) {
      // 在客户端构建中，将这些Node.js模块设置为false
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        path: false,
        util: false,
        stream: false,
        os: false,
        crypto: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        url: false,
        buffer: false,
        querystring: false,
        events: false,
        dns: false,
        dgram: false,
        worker_threads: false,
      };
      
      // 忽略所有node:协议和服务器库的导入
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(node:|@mastra\/|libsql$|@libsql\/)/,
        })
      );
      
      // 为这些库提供客户端替代实现
      config.resolve.alias = {
        ...config.resolve.alias,
        '@mastra/core': require.resolve('./src/mastra-client.ts'),
        '@mastra/core/agent': require.resolve('./src/mastra-client.ts'),
        '@mastra/core/tools': require.resolve('./src/mastra-client.ts'),
        '@mastra/core/workflow': require.resolve('./src/mastra-client.ts'),
        '@/mastra': require.resolve('./src/mastra-client.ts'),
      };
      
      // 处理README.md文件（用于libsql的问题）
      config.module.rules.push({
        test: /\.md$/,
        use: 'null-loader'
      });
    }
    
    return config;
  },
};

module.exports = nextConfig; 