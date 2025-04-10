'use client';

import { useState, useEffect } from 'react';
import { PerformanceDashboard } from '@/components/dashboard/PerformanceDashboard';
import { mockTradingService } from '@/services/mockTradingService';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PerformancePage() {
  const [portfolios, setPortfolios] = useState<{ id: string; name: string }[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        await mockTradingService.initialize();
        const allPortfolios = mockTradingService.getAllPortfolios();
        
        if (allPortfolios.length > 0) {
          setPortfolios(allPortfolios.map(p => ({ id: p.id, name: p.name || `Portfolio ${p.id.substring(0, 8)}` })));
          setSelectedPortfolioId(allPortfolios[0].id);
        }
      } catch (error) {
        console.error('Error loading portfolios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPortfolios();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">绩效仪表盘</h1>
        
        {isLoading ? (
          <div>加载投资组合中...</div>
        ) : portfolios.length > 0 ? (
          <div className="w-[300px]">
            <Select
              value={selectedPortfolioId}
              onValueChange={setSelectedPortfolioId}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择投资组合" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>没有可用的投资组合</div>
        )}
      </div>
      
      {selectedPortfolioId ? (
        <PerformanceDashboard portfolioId={selectedPortfolioId} />
      ) : (
        <div className="flex items-center justify-center h-[600px] border rounded-lg">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-2">没有可用的投资组合</h3>
            <p className="text-muted-foreground">
              请先创建投资组合或等待数据加载
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 