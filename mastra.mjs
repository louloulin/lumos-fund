#!/usr/bin/env node

import { testTrendAgent } from './src/actions/testAIAgent.js';

// Parse command-line arguments
const args = process.argv.slice(2);
const ticker = args[0] || 'AAPL';

console.log(`\n🧠 测试趋势投资AI代理，分析 ${ticker}...\n`);

// Test the trend investing agent
testTrendAgent(ticker)
  .then(result => {
    if (result.success) {
      console.log('✅ 测试成功!\n');
      
      if (result.parsedSignal) {
        console.log('📊 解析结果:');
        console.log(`- 操作: ${result.parsedSignal.action}`);
        console.log(`- 置信度: ${Math.round(result.parsedSignal.confidence * 100)}%`);
        if (result.parsedSignal.position !== undefined) {
          console.log(`- 建议仓位: ${Math.round(result.parsedSignal.position * 100)}%`);
        }
        console.log();
      }
      
      console.log('📝 分析内容:');
      console.log(result.analysis);
      console.log();
    } else {
      console.error('❌ 测试失败:', result.error);
    }
  })
  .catch(error => {
    console.error('❌ 执行错误:', error);
  }); 