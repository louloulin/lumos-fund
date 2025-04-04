import { QuantitativeAnalysisClient } from './client';

export const metadata = {
  title: '量化分析 - LumosFund',
  description: '使用先进的量化分析工具和AI智能代理，分析股票并获取投资建议',
}

export default function QuantitativePage() {
  return (
    <div className="container py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">量化分析</h1>
        <p className="text-muted-foreground">
          使用先进的量化分析工具和AI智能代理，分析股票并获取投资建议
        </p>
      </div>
      
      <QuantitativeAnalysisClient />
    </div>
  );
} 