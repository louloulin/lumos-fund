import { NextRequest, NextResponse } from 'next/server';
import { Portfolio } from '@/types/trading';

// 添加动态配置，解决静态导出问题
export const dynamic = 'force-dynamic';

// 模拟数据
const mockPortfolios: Record<string, Portfolio> = {
  'user1': {
    id: 'portfolio1',
    name: '我的投资组合',
    cash: 25000,
    totalValue: 145280.64,
    lastUpdated: new Date().toISOString(),
    positions: [
      { 
        ticker: 'AAPL', 
        name: 'Apple Inc.', 
        shares: 100, 
        avgPrice: 175.32, 
        currentPrice: 183.58 
      },
      { 
        ticker: 'MSFT', 
        name: 'Microsoft Corporation', 
        shares: 50, 
        avgPrice: 350.75, 
        currentPrice: 426.89 
      },
      { 
        ticker: 'NVDA', 
        name: 'NVIDIA Corporation', 
        shares: 30, 
        avgPrice: 750.45, 
        currentPrice: 894.32 
      },
      { 
        ticker: 'GOOGL', 
        name: 'Alphabet Inc.', 
        shares: 40, 
        avgPrice: 135.68, 
        currentPrice: 151.24 
      }
    ],
    performance: {
      day: 1.2,
      week: 2.8,
      month: 5.7,
      year: 22.4,
      total: 45.3
    },
    transactions: []
  }
};

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId parameter' },
      { status: 400 }
    );
  }
  
  const portfolio = mockPortfolios[userId];
  
  if (!portfolio) {
    return NextResponse.json(
      { error: 'Portfolio not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(portfolio);
}

// 更新投资组合
export async function POST(req: Request) {
  try {
    // 解析请求数据
    const body = await req.json();
    const { userId, action, data } = body;
    
    if (!userId || !action) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 获取用户投资组合
    const portfolio = mockPortfolios[userId];
    if (!portfolio) {
      return NextResponse.json(
        { error: '未找到投资组合' },
        { status: 404 }
      );
    }
    
    // 处理不同的操作
    switch (action) {
      case 'addCash': {
        const { amount } = data;
        if (!amount || typeof amount !== 'number' || amount <= 0) {
          return NextResponse.json(
            { error: '金额无效' },
            { status: 400 }
          );
        }
        
        // 更新现金余额
        portfolio.cash += amount;
        portfolio.totalValue += amount;
        portfolio.lastUpdated = new Date().toISOString();
        
        // 添加交易记录
        portfolio.transactions.unshift({
          id: `tx${Date.now()}`,
          type: 'deposit',
          amount,
          timestamp: new Date().toISOString()
        });
        
        break;
      }
      
      case 'buy': {
        const { ticker, shares, price } = data;
        if (!ticker || !shares || !price || shares <= 0 || price <= 0) {
          return NextResponse.json(
            { error: '交易参数无效' },
            { status: 400 }
          );
        }
        
        const totalCost = shares * price;
        
        // 检查现金是否足够
        if (portfolio.cash < totalCost) {
          return NextResponse.json(
            { error: '现金不足' },
            { status: 400 }
          );
        }
        
        // 更新现金余额
        portfolio.cash -= totalCost;
        portfolio.lastUpdated = new Date().toISOString();
        
        // 更新或添加持仓
        const existingPosition = portfolio.positions.find((p: any) => p.ticker === ticker);
        if (existingPosition) {
          // 更新现有持仓
          const totalShares = existingPosition.shares + shares;
          const totalCostBasis = (existingPosition.shares * existingPosition.avgPrice) + totalCost;
          existingPosition.shares = totalShares;
          existingPosition.avgPrice = totalCostBasis / totalShares;
          existingPosition.currentPrice = price; // 简化模拟
        } else {
          // 添加新持仓
          portfolio.positions.push({
            ticker,
            name: data.name || ticker,
            shares,
            avgPrice: price,
            currentPrice: price
          });
        }
        
        // 添加交易记录
        portfolio.transactions.unshift({
          id: `tx${Date.now()}`,
          type: 'buy',
          ticker,
          shares,
          price,
          timestamp: new Date().toISOString()
        });
        
        break;
      }
      
      case 'sell': {
        const { ticker, shares, price } = data;
        if (!ticker || !shares || !price || shares <= 0 || price <= 0) {
          return NextResponse.json(
            { error: '交易参数无效' },
            { status: 400 }
          );
        }
        
        // 查找持仓
        const positionIndex = portfolio.positions.findIndex((p: any) => p.ticker === ticker);
        if (positionIndex === -1) {
          return NextResponse.json(
            { error: '未找到持仓' },
            { status: 400 }
          );
        }
        
        const position = portfolio.positions[positionIndex];
        
        // 检查股票数量是否足够
        if (position.shares < shares) {
          return NextResponse.json(
            { error: '股票数量不足' },
            { status: 400 }
          );
        }
        
        const saleProceeds = shares * price;
        
        // 更新现金余额
        portfolio.cash += saleProceeds;
        portfolio.lastUpdated = new Date().toISOString();
        
        // 更新持仓
        position.shares -= shares;
        position.currentPrice = price; // 简化模拟
        
        // 如果股票数量为0，删除持仓
        if (position.shares === 0) {
          portfolio.positions.splice(positionIndex, 1);
        }
        
        // 添加交易记录
        portfolio.transactions.unshift({
          id: `tx${Date.now()}`,
          type: 'sell',
          ticker,
          shares,
          price,
          timestamp: new Date().toISOString()
        });
        
        break;
      }
      
      default:
        return NextResponse.json(
          { error: '未知操作' },
          { status: 400 }
        );
    }
    
    // 重新计算总价值
    portfolio.totalValue = portfolio.cash + portfolio.positions.reduce(
      (sum: number, pos: any) => sum + (pos.shares * pos.currentPrice), 0
    );
    
    // 返回更新后的投资组合
    return NextResponse.json({
      success: true,
      message: '投资组合已更新',
      portfolio
    }, { status: 200 });
  } catch (error) {
    console.error('投资组合更新API错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新投资组合时出错' },
      { status: 500 }
    );
  }
} 