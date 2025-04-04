#!/bin/bash

# 切换到项目目录
cd "$(dirname "$0")"

# 显示当前目录
echo "当前工作目录: $(pwd)"

# 检查package.json是否存在
if [ ! -f "./package.json" ]; then
  echo "错误: 没有找到package.json文件!"
  exit 1
fi

# 安装依赖(如果需要)
if [ ! -d "./node_modules" ]; then
  echo "正在安装依赖..."
  npm install
fi

# 运行开发服务器
echo "启动开发服务器..."
npm run dev 