import { Metadata } from 'next';
import { VolatilityForecast } from '@/services/volatilityPredictionService';
import { volatilityPredictionService } from '@/services/volatilityPredictionService';
import VolatilityPredictionClient from './volatility-prediction-client';

export const metadata: Metadata = {
  title: '波动率预测 | LumosFund',
  description: '使用GARCH模型预测股票波动率，提供详细的预测报告和风险评估。',
};

// 生成预测的服务器操作函数
async function generateVolatilityForecast(symbol: string, days: number): Promise<VolatilityForecast> {
  'use server';
  
  try {
    // 确保服务已初始化
    await volatilityPredictionService.init();
    
    // 获取详细预测
    return await volatilityPredictionService.generateDetailedForecast(symbol, days);
  } catch (error) {
    console.error('波动率预测失败:', error);
    throw new Error(`波动率预测生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 默认股票列表
const STOCK_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC',
  'JNJ', 'PG', 'V', 'MA', 'DIS', 'BABA', 'CRM', 'PFE', 'KO', 'PEP'
];

export default async function VolatilityPredictionPage() {
  // 为AAPL生成初始预测
  let initialForecast: VolatilityForecast | undefined;
  
  try {
    // 初始化服务
    await volatilityPredictionService.init();
    
    // 获取初始预测
    initialForecast = await volatilityPredictionService.generateDetailedForecast('AAPL', 30);
  } catch (error) {
    console.error('初始波动率预测加载失败:', error);
    // 初始预测失败不会阻止页面渲染
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">波动率预测</h1>
        <p className="text-muted-foreground mt-2">
          使用GARCH(1,1)模型分析和预测股票波动率，帮助投资者评估风险和做出决策。
        </p>
      </div>
      
      <VolatilityPredictionClient 
        initialForecast={initialForecast}
        symbols={STOCK_SYMBOLS}
        generateForecast={generateVolatilityForecast}
      />
    </div>
  );
} 