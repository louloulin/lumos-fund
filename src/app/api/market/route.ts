import { NextResponse } from 'next/server';

// 模拟获取市场数据的函数
async function fetchMarketData(endpoint: string, params: Record<string, string>) {
  console.log(`获取市场数据: ${endpoint}`, params);
  
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 模拟不同的市场数据端点
  switch (endpoint) {
    case 'indices':
      return {
        indices: [
          { symbol: 'SPX', name: 'S&P 500', value: 5217.49, change: 35.21, changePercent: 0.68 },
          { symbol: 'DJI', name: '道琼斯工业平均指数', value: 39170.35, change: 311.58, changePercent: 0.80 },
          { symbol: 'IXIC', name: '纳斯达克综合指数', value: 16274.09, change: 130.26, changePercent: 0.81 },
          { symbol: 'HSI', name: '恒生指数', value: 16512.99, change: -31.99, changePercent: -0.19 },
          { symbol: 'N225', name: '日经225指数', value: 40846.96, change: 364.80, changePercent: 0.90 }
        ]
      };
      
    case 'sectors':
      return {
        sectors: [
          { name: '科技', performance: 1.24, volume: 3423458921 },
          { name: '金融', performance: 0.45, volume: 1853928471 },
          { name: '医疗保健', performance: -0.32, volume: 982345710 },
          { name: '消费者非必需品', performance: 0.67, volume: 1234587190 },
          { name: '工业', performance: 0.28, volume: 872345982 },
          { name: '能源', performance: -0.54, volume: 743928172 },
          { name: '公用事业', performance: 0.12, volume: 324567891 },
          { name: '材料', performance: -0.08, volume: 563492871 },
          { name: '房地产', performance: -0.76, volume: 432198765 },
          { name: '通信服务', performance: 0.95, volume: 876543219 },
          { name: '消费者必需品', performance: 0.23, volume: 654321987 }
        ]
      };
      
    case 'movers':
      return {
        topGainers: [
          { symbol: 'AAPL', name: 'Apple Inc.', price: 186.23, change: 5.67, changePercent: 3.14 },
          { symbol: 'MSFT', name: 'Microsoft Corp.', price: 426.39, change: 12.49, changePercent: 3.02 },
          { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 902.50, change: 24.35, changePercent: 2.77 },
          { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 180.75, change: 3.92, changePercent: 2.22 },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 153.51, change: 2.86, changePercent: 1.90 }
        ],
        topLosers: [
          { symbol: 'BA', name: 'Boeing Co.', price: 176.80, change: -5.24, changePercent: -2.88 },
          { symbol: 'KO', name: 'Coca-Cola Co.', price: 60.12, change: -1.43, changePercent: -2.32 },
          { symbol: 'JNJ', name: 'Johnson & Johnson', price: 147.89, change: -3.21, changePercent: -2.13 },
          { symbol: 'PFE', name: 'Pfizer Inc.', price: 26.78, change: -0.56, changePercent: -2.05 },
          { symbol: 'CVX', name: 'Chevron Corp.', price: 154.63, change: -2.94, changePercent: -1.87 }
        ],
        mostActive: [
          { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 902.50, volume: 78245690 },
          { symbol: 'AAPL', name: 'Apple Inc.', price: 186.23, volume: 67453218 },
          { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.48, volume: 54327891 },
          { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', price: 168.42, volume: 48765432 },
          { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 180.75, volume: 41234567 }
        ]
      };
      
    case 'news':
      return {
        marketNews: [
          {
            id: 'news-1',
            title: '美联储主席鲍威尔暗示今年可能降息三次',
            source: 'Bloomberg',
            timestamp: new Date().toISOString(),
            url: 'https://example.com/news/fed-rate-cuts',
            sentiment: 'positive'
          },
          {
            id: 'news-2',
            title: '科技股表现强劲，纳斯达克再创新高',
            source: 'CNBC',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            url: 'https://example.com/news/tech-stocks-rally',
            sentiment: 'positive'
          },
          {
            id: 'news-3',
            title: '通胀数据好于预期，市场情绪改善',
            source: 'Reuters',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            url: 'https://example.com/news/inflation-data',
            sentiment: 'positive'
          },
          {
            id: 'news-4',
            title: '全球供应链问题持续，可能影响第二季度业绩',
            source: 'Financial Times',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            url: 'https://example.com/news/supply-chain-issues',
            sentiment: 'negative'
          },
          {
            id: 'news-5',
            title: '石油价格上涨，能源股受益',
            source: 'WSJ',
            timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
            url: 'https://example.com/news/oil-prices',
            sentiment: 'neutral'
          }
        ]
      };
      
    default:
      return { error: '未知的市场数据端点' };
  }
}

export async function GET(req: Request) {
  try {
    // 从URL获取参数
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'indices';
    
    // 收集所有查询参数
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        params[key] = value;
      }
    });
    
    // 获取市场数据
    const marketData = await fetchMarketData(endpoint, params);
    
    // 返回数据
    return NextResponse.json(marketData, { status: 200 });
  } catch (error) {
    console.error('市场数据API错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取市场数据时出错' },
      { status: 500 }
    );
  }
} 