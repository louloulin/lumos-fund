"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockAnalysisCard } from "@/components/analysis/StockAnalysisCard";
import { AppLayout } from "@/components/layout/AppLayout";

// 示例数据
const portfolioData = {
  totalValue: 125000,
  dailyChange: 1250,
  dailyChangePercent: 1.01,
  holdings: [
    { ticker: "AAPL", shares: 50, value: 8500, change: 1.2 },
    { ticker: "MSFT", shares: 30, value: 9000, change: -0.5 },
    { ticker: "GOOGL", shares: 15, value: 12000, change: 2.1 },
  ],
};

const stockAnalysis = {
  ticker: "AAPL",
  price: 185.92,
  signals: {
    overall: "bullish" as const,
    confidence: 78.5,
  },
  reasoning: {
    summary: "苹果公司展示了强劲的基本面、正面的市场情绪和合理的估值，尤其是考虑到其在AI和服务业务的增长潜力。技术指标显示上升趋势。",
    fundamental: {
      roe: 145.2,
      score: 0.85,
      analysis: "苹果公司拥有强大的财务状况，资产回报率和利润率高于行业平均水平。最近的财报显示收入和利润增长稳健。",
    },
    technical: {
      trend: "上升",
      score: 0.72,
      analysis: "当前价格高于50日和200日移动平均线，MACD指标显示看涨信号。近期成交量上升支撑价格上涨。",
    },
    sentiment: {
      score: 0.68,
      analysis: "分析师普遍看好苹果的前景，近期新闻和社交媒体情绪偏正面，特别是关于AI集成的消息引起积极关注。",
    },
  },
};

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-4 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                投资组合总值
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolioData.totalValue.toLocaleString()}</div>
              <p className={`text-xs ${portfolioData.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolioData.dailyChange >= 0 ? '+' : ''}{portfolioData.dailyChange.toLocaleString()} 
                ({portfolioData.dailyChangePercent.toFixed(2)}%)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                持仓数量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioData.holdings.length}</div>
              <p className="text-xs text-muted-foreground">股票种类</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                最佳表现
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GOOGL</div>
              <p className="text-xs text-green-500">+2.1%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                最差表现
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MSFT</div>
              <p className="text-xs text-red-500">-0.5%</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          <StockAnalysisCard {...stockAnalysis} />
        </div>
      </div>
    </AppLayout>
  );
} 