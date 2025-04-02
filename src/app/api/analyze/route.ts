import { NextResponse } from 'next/server';
import { tradingDecisionWorkflow } from '@/mastra/workflows/tradingDecisionWorkflow';

export async function POST(request: Request) {
  try {
    const { ticker, portfolio } = await request.json();
    
    // 这里是模拟数据，实际应用中会从API或数据库获取
    const financialData = {
      ticker,
      period: 'annual',
      metrics: {
        'return_on_equity': 0.245,
        'return_on_assets': 0.178,
        'debt_to_equity': 1.2,
        'current_ratio': 1.8,
        'quick_ratio': 1.5,
        'operating_margin': 0.21,
        'net_margin': 0.185,
        'price_to_earnings': 18.5,
        'price_to_book': 3.2,
        'price_to_sales': 1.9,
        'revenue_growth': 0.15,
        'earnings_growth': 0.12,
      }
    };
    
    const priceData = {
      ticker,
      currentPrice: 185.92,
      historicalData: [
        { date: '2023-12-01', open: 184.20, high: 186.84, low: 183.57, close: 185.92, volume: 58324156 },
        { date: '2023-11-30', open: 182.96, high: 184.12, low: 182.04, close: 183.92, volume: 54892345 },
        { date: '2023-11-29', open: 181.54, high: 183.87, low: 181.33, close: 182.96, volume: 51234789 },
      ]
    };
    
    // 调用Mastra工作流
    const result = await tradingDecisionWorkflow.execute({
      context: {
        ticker,
        data: {
          financial: financialData,
          price: priceData,
        },
        portfolio: portfolio || {
          cash: 100000,
          positions: []
        },
        cash: portfolio?.cash || 100000,
      }
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze stock' },
      { status: 500 }
    );
  }
} 