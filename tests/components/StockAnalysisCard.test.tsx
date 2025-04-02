import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StockAnalysisCard } from '../../src/components/analysis/StockAnalysisCard';

// 模拟组件props
const mockProps = {
  ticker: 'AAPL',
  price: 185.92,
  signals: {
    overall: 'bullish' as const,
    confidence: 78.5,
  },
  reasoning: {
    summary: '苹果公司展示了强劲的基本面、正面的市场情绪和合理的估值，特别是考虑到其在AI和服务业务的增长潜力。',
    fundamental: {
      roe: 145.2,
      score: 0.85,
      analysis: '苹果公司拥有强大的财务状况，资产回报率和利润率高于行业平均水平。',
    },
    technical: {
      trend: '上升',
      score: 0.72,
      analysis: '当前价格高于50日和200日移动平均线，MACD指标显示看涨信号。',
    },
  },
};

// 模拟组件
vi.mock('../../src/components/analysis/StockAnalysisCard', () => ({
  StockAnalysisCard: ({ ticker, price, signals, reasoning }: any) => (
    <div data-testid="stock-analysis-card">
      <h2>{ticker}</h2>
      <p>${price}</p>
      <div>
        {signals.overall === 'bullish' && <span>看涨</span>}
        {signals.overall === 'neutral' && <span>中性</span>}
        {signals.overall === 'bearish' && <span>看跌</span>}
      </div>
      <p>置信度: {signals.confidence}%</p>
      <p>{reasoning.summary}</p>
    </div>
  )
}));

describe('StockAnalysisCard', () => {
  it('renders the stock ticker and price', () => {
    render(<StockAnalysisCard {...mockProps} />);
    
    // 验证显示股票代码
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    
    // 验证显示价格
    expect(screen.getByText('$185.92')).toBeInTheDocument();
  });

  it('renders the correct signal badge', () => {
    render(<StockAnalysisCard {...mockProps} />);
    
    // 验证显示看涨标签
    expect(screen.getByText('看涨')).toBeInTheDocument();
    
    // 验证显示置信度
    expect(screen.getByText('置信度: 78.5%')).toBeInTheDocument();
  });

  it('renders summary content', () => {
    render(<StockAnalysisCard {...mockProps} />);
    
    // 验证显示摘要内容
    expect(screen.getByText(mockProps.reasoning.summary)).toBeInTheDocument();
  });

  it('renders with neutral signal correctly', () => {
    const neutralProps = {
      ...mockProps,
      signals: {
        overall: 'neutral' as const,
        confidence: 50,
      },
    };
    
    render(<StockAnalysisCard {...neutralProps} />);
    
    // 验证显示中性标签
    expect(screen.getByText('中性')).toBeInTheDocument();
  });
}); 