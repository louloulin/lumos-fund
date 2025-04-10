'use client';

import { useState } from 'react';
import { VolatilityForecast } from '@/services/volatilityPredictionService';
import dynamic from 'next/dynamic';

// 动态加载VolatilityPrediction组件以避免SSR问题
const VolatilityPrediction = dynamic(
  () => import('@/components/analysis/VolatilityPrediction'),
  { ssr: false, loading: () => <div className="p-8 text-center">加载波动率预测工具...</div> }
);

interface VolatilityPredictionClientProps {
  initialForecast?: VolatilityForecast;
  symbols?: string[];
  generateForecast: (symbol: string, days: number) => Promise<VolatilityForecast>;
}

export default function VolatilityPredictionClient({
  initialForecast,
  symbols,
  generateForecast
}: VolatilityPredictionClientProps) {
  return (
    <VolatilityPrediction
      initialForecast={initialForecast}
      symbols={symbols}
      onGenerate={generateForecast}
    />
  );
} 