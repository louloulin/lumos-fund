/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@mastra/*"],
  // 避免一些服务器组件中的客户端错误
  transpilePackages: ["@mastra/core"],
  reactStrictMode: true,
  
  // Tauri配置
  output: "export",
  // 禁用图像优化，因为它依赖于Sharp，在Tauri Desktop环境中不需要
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 