#!/bin/bash

# 清理Next.js应用缓存的脚本

echo "🧹 开始清理Next.js缓存..."

# 删除Next.js缓存目录
if [ -d ".next" ]; then
  echo "删除.next目录..."
  rm -rf .next
fi

# 删除node_modules缓存
if [ -d "node_modules/.cache" ]; then
  echo "删除node_modules/.cache目录..."
  rm -rf node_modules/.cache
fi

# 清理其他可能的缓存
echo "删除其他缓存文件..."
find . -name ".turbo" -type d -exec rm -rf {} +

# 添加可执行权限
chmod +x scripts/clean.sh

echo "✅ 缓存清理完成！"
echo "现在可以运行 'pnpm dev' 重新启动应用。" 