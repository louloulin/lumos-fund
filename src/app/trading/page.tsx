import { RealTimeQuotes } from '@/components/RealTimeQuotes';
import { MarketDataAPI } from '@/components/MarketDataAPI';
import { TradeHistoryTable } from '@/components/TradeHistoryTable';
import { Transaction } from '@/types/trading';

export default function TradingPage() {
  // 模拟交易历史数据
  const mockTransactions: Transaction[] = [
    { 
      id: 'tx1', 
      type: 'buy' as const, 
      ticker: 'AAPL', 
      shares: 10, 
      price: 183.58, 
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
    },
    { 
      id: 'tx2', 
      type: 'sell' as const, 
      ticker: 'MSFT', 
      shares: 5, 
      price: 426.89, 
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() 
    },
    { 
      id: 'tx3', 
      type: 'deposit' as const, 
      amount: 10000, 
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() 
    },
    { 
      id: 'tx4', 
      type: 'buy' as const, 
      ticker: 'NVDA', 
      shares: 3, 
      price: 894.32, 
      timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() 
    },
    { 
      id: 'tx5', 
      type: 'sell' as const, 
      ticker: 'GOOGL', 
      shares: 8, 
      price: 151.24, 
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() 
    },
    { 
      id: 'tx6', 
      type: 'dividend' as const, 
      ticker: 'MSFT', 
      amount: 42.50, 
      timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() 
    },
    { 
      id: 'tx7', 
      type: 'withdrawal' as const, 
      amount: 2500, 
      timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() 
    }
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">交易中心</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <RealTimeQuotes />
        
        <MarketDataAPI />
        
        <div>
          <h2 className="text-2xl font-bold mb-4">近期交易历史</h2>
          <TradeHistoryTable transactions={mockTransactions} />
        </div>
      </div>
    </div>
  );
} 