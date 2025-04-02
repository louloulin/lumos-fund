"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockAnalysisCard } from "@/components/analysis/StockAnalysisCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCards } from '@/components/dashboard/StatsCards';
import { 
  DashboardTabs, 
  DashboardTab, 
  DashboardTabTrigger, 
  DashboardTabContent 
} from '@/components/dashboard/DashboardTabs';
import { IconInfoCircle, IconLayoutDashboard, IconServerCog } from '@tabler/icons-react';

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
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="page-title">投资平台概览</h1>
        <p className="page-description">监控您的交易策略和市场表现</p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8">
        <StatsCards />
      </div>

      {/* 标签页和内容区域 */}
      <div>
        <h2 className="text-lg font-medium mb-3">概览分析与最近查询</h2>
        
        <DashboardTabs defaultTab="overview">
          <DashboardTab value="overview">
            <DashboardTabTrigger value="overview">概览分析</DashboardTabTrigger>
            <DashboardTabContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="content-card">
                  <div className="content-card-header">
                    <div className="flex items-center gap-2">
                      <h3 className="content-card-title">平台健康状况</h3>
                    </div>
                  </div>
                  <div className="content-card-body">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <IconInfoCircle size={24} stroke={1.5} />
                      </div>
                      <p className="empty-state-text">性能指标可视化将显示在这里</p>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <div className="content-card-header">
                    <div className="flex items-center gap-2">
                      <h3 className="content-card-title">系统资源</h3>
                    </div>
                  </div>
                  <div className="content-card-body">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <IconInfoCircle size={24} stroke={1.5} />
                      </div>
                      <p className="empty-state-text">系统资源监控将显示在这里</p>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardTabContent>
          </DashboardTab>
          
          <DashboardTab value="analytics">
            <DashboardTabTrigger value="analytics">分析</DashboardTabTrigger>
            <DashboardTabContent value="analytics">
              <div className="content-card">
                <div className="content-card-header">
                  <div className="flex items-center gap-2">
                    <h3 className="content-card-title">性能分析</h3>
                  </div>
                </div>
                <div className="content-card-body">
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <IconInfoCircle size={24} stroke={1.5} />
                    </div>
                    <p className="empty-state-text">交易策略性能分析将显示在这里</p>
                  </div>
                </div>
              </div>
            </DashboardTabContent>
          </DashboardTab>
          
          <DashboardTab value="queries">
            <DashboardTabTrigger value="queries">最近查询</DashboardTabTrigger>
            <DashboardTabContent value="queries">
              <div className="content-card">
                <div className="content-card-header">
                  <div className="flex items-center gap-2">
                    <h3 className="content-card-title">查询历史</h3>
                  </div>
                </div>
                <div className="content-card-body">
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <IconInfoCircle size={24} stroke={1.5} />
                    </div>
                    <p className="empty-state-text">查询历史将显示在这里</p>
                  </div>
                </div>
              </div>
            </DashboardTabContent>
          </DashboardTab>
        </DashboardTabs>
      </div>
    </div>
  );
} 