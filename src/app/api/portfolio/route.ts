import { NextResponse } from 'next/server';

// 模拟用户投资组合数据库
const mockPortfolios: Record<string, any> = {
  'user1': {
    id: 'user1',
    name: '成长型投资组合',
    cash: 35642.18,
    totalValue: 187469.23,
    lastUpdated: new Date().toISOString(),
    positions: [
      { ticker: 'AAPL', name: 'Apple Inc.', shares: 50, avgPrice: 175.32, currentPrice: 186.23 },
      { ticker: 'MSFT', name: 'Microsoft Corp.', shares: 25, avgPrice: 375.45, currentPrice: 426.39 },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', shares: 15, avgPrice: 760.23, currentPrice: 902.50 },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', shares: 30, avgPrice: 165.78, currentPrice: 180.75 },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', shares: 20, avgPrice: 142.36, currentPrice: 153.51 }
    ],
    performance: {
      day: 1.24,
      week: 2.37,
      month: 4.85,
      year: 16.42,
      total: 28.73
    },
    transactions: [
      { id: 'tx1', type: 'buy', ticker: 'NVDA', shares: 5, price: 845.32, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'tx2', type: 'sell', ticker: 'TSLA', shares: 10, price: 175.48, timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'tx3', type: 'buy', ticker: 'AAPL', shares: 20, price: 172.45, timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  }
};

// 获取投资组合
export async function GET(req: Request) {
  try {
    // 从URL获取用户ID和其他参数
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || 'user1';
    
    // 检查是否存在这个用户的投资组合
    if (!mockPortfolios[userId]) {
      return NextResponse.json(
        { error: '未找到投资组合' },
        { status: 404 }
      );
    }
    
    // 返回投资组合数据
    return NextResponse.json(mockPortfolios[userId], { status: 200 });
  } catch (error) {
    console.error('投资组合API错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取投资组合数据时出错' },
      { status: 500 }
    );
  }
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