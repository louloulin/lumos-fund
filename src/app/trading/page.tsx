import { RealTimeQuotes } from '@/components/RealTimeQuotes';
import { MarketDataAPI } from '@/components/MarketDataAPI';
import { TradeHistoryTable } from '@/components/TradeHistoryTable';
import { StockAnalysis } from '@/components/analysis/StockAnalysis';
import { MOCK_TRANSACTIONS } from '@/lib/mock-data';

export default function TradingPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">交易中心</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeQuotes />
        <StockAnalysis />
      </div>
      
      <MarketDataAPI />
      
      <TradeHistoryTable transactions={MOCK_TRANSACTIONS} />
    </div>
  );
} 