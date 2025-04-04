import { BacktestClient } from './client';

export const metadata = {
  title: 'AI 代理回测系统 - LumosFund',
  description: '使用多种AI代理进行股票交易策略回测，获取交易表现和绩效指标对比'
};

export default function BacktestPage() {
  return (
    <div className="container py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI 代理回测系统</h1>
        <p className="text-muted-foreground">
          使用AI代理策略进行交易回测，评估不同投资风格在历史市场中的表现
        </p>
      </div>
      
      <BacktestClient />
    </div>
  );
} 