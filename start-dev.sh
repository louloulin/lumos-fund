#!/bin/bash

# 检查环境变量文件
if [ ! -f .env ]; then
  echo "错误：找不到 .env 文件。请确认已创建 .env 文件并设置必要的环境变量。"
  exit 1
fi

# 检查依赖
if ! command -v npm &> /dev/null; then
  echo "错误：找不到 npm。请确认已安装 Node.js 和 npm。"
  exit 1
fi

if ! command -v cargo &> /dev/null; then
  echo "错误：找不到 cargo。请确认已安装 Rust 和 Cargo。"
  exit 1
fi

echo "======================="
echo "启动 LumosFund 开发环境"
echo "======================="

# 安装依赖（如果需要）
echo "正在检查并安装依赖..."
npm install

# 启动应用
echo "正在启动 Next.js 和 Tauri..."
npm run dev 