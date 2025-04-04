"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { testInnovationTool } from "@/actions/testFinancialTools";
import { testRevenueTool } from "@/actions/testFinancialTools";

export function TestToolsClient() {
  const [ticker, setTicker] = useState("AAPL");
  const [years, setYears] = useState(5);
  
  const [innovationLoading, setInnovationLoading] = useState(false);
  const [innovationResults, setInnovationResults] = useState<any>(null);
  const [innovationError, setInnovationError] = useState<string | null>(null);
  
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueResults, setRevenueResults] = useState<any>(null);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  
  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicker(e.target.value.toUpperCase());
  };
  
  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 10) {
      setYears(value);
    }
  };
  
  const runInnovationTest = async () => {
    if (!ticker) return;
    
    setInnovationLoading(true);
    setInnovationError(null);
    
    try {
      const result = await testInnovationTool(ticker);
      setInnovationResults(result);
    } catch (error: any) {
      setInnovationError(error.message || "测试创新评估工具时出错");
    } finally {
      setInnovationLoading(false);
    }
  };
  
  const runRevenueTest = async () => {
    if (!ticker) return;
    
    setRevenueLoading(true);
    setRevenueError(null);
    
    try {
      const result = await testRevenueTool(ticker, years);
      setRevenueResults(result);
    } catch (error: any) {
      setRevenueError(error.message || "测试收入增长工具时出错");
    } finally {
      setRevenueLoading(false);
    }
  };
  
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>股票信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">股票代码</Label>
              <Input
                id="ticker"
                placeholder="输入股票代码 (例如 AAPL)"
                value={ticker}
                onChange={handleTickerChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="years">分析年数 (1-10)</Label>
              <Input
                id="years"
                type="number"
                min="1"
                max="10"
                placeholder="5"
                value={years}
                onChange={handleYearsChange}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={runInnovationTest} 
              disabled={innovationLoading || !ticker}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {innovationLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                "测试创新评估工具"
              )}
            </Button>
            <Button 
              onClick={runRevenueTest} 
              disabled={revenueLoading || !ticker}
              className="bg-green-600 hover:bg-green-700"
            >
              {revenueLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                "测试收入增长工具"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="innovation" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="innovation">创新能力评估</TabsTrigger>
          <TabsTrigger value="revenue">收入增长分析</TabsTrigger>
        </TabsList>
        
        <TabsContent value="innovation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                创新能力评估结果
                {innovationResults && (
                  <span className="ml-auto flex items-center text-sm font-normal">
                    得分: <span className="ml-1 font-bold text-lg">{innovationResults.score}/10</span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {innovationError ? (
                <div className="rounded-md bg-destructive/15 p-4 text-destructive flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {innovationError}
                </div>
              ) : innovationLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin opacity-50" />
                </div>
              ) : innovationResults ? (
                <div className="space-y-4">
                  <div className="rounded-md bg-muted p-4">
                    <p className="text-sm font-medium">分析结论</p>
                    <p className="mt-1">{innovationResults.analysis}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">研发投入</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">研发支出:</span>
                          <span>${innovationResults.rdData.annualRDSpend}M</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">收入占比:</span>
                          <span>{(innovationResults.rdData.percentageOfRevenue * 100).toFixed(1)}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">同比增长率:</span>
                          <span>{(innovationResults.rdData.growthYoY * 100).toFixed(1)}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">效率:</span>
                          <span>{(innovationResults.rdData.efficiency * 10).toFixed(1)}/10</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">专利分析</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">专利总数:</span>
                          <span>{innovationResults.patentData.totalPatents}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">近一年:</span>
                          <span>{innovationResults.patentData.lastYearPatents}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">增长率:</span>
                          <span>{(innovationResults.patentData.growthRate * 100).toFixed(1)}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">专利质量:</span>
                          <span>{innovationResults.patentData.quality}/10</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">产品创新</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">近一年推出产品数:</span>
                        <span>{innovationResults.productInnovation.newProductsLaunched}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">平均产品周期:</span>
                        <span>{innovationResults.productInnovation.avgProductCycle}个月</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">成功率:</span>
                        <span>{(innovationResults.productInnovation.successRate * 100).toFixed(0)}%</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">颠覆潜力:</span>
                        <span>{innovationResults.productInnovation.disruptionPotential}/10</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">关键创新领域</h4>
                    <div className="flex flex-wrap gap-2">
                      {innovationResults.patentData.keyAreas.map((area: string, index: number) => (
                        <div key={index} className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs">
                          {area}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  点击"测试创新评估工具"按钮来生成分析结果
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                收入增长分析结果
                {revenueResults && (
                  <span className="ml-auto flex items-center text-sm font-normal">
                    得分: <span className="ml-1 font-bold text-lg">{revenueResults.score}/10</span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueError ? (
                <div className="rounded-md bg-destructive/15 p-4 text-destructive flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {revenueError}
                </div>
              ) : revenueLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin opacity-50" />
                </div>
              ) : revenueResults ? (
                <div className="space-y-4">
                  <div className="rounded-md bg-muted p-4">
                    <p className="text-sm font-medium">分析结论</p>
                    <p className="mt-1">{revenueResults.analysis}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">历史收入数据</h4>
                      <div className="rounded-md border overflow-hidden">
                        <table className="min-w-full divide-y">
                          <thead className="bg-muted">
                            <tr className="text-xs">
                              <th className="px-3 py-2 text-left">年份</th>
                              <th className="px-3 py-2 text-right">收入 (百万)</th>
                              <th className="px-3 py-2 text-right">增长率</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y bg-card">
                            {revenueResults.revenueHistory.yearly.map((item: any) => (
                              <tr key={item.year} className="text-xs">
                                <td className="px-3 py-2">{item.year}</td>
                                <td className="px-3 py-2 text-right">${item.revenue.toLocaleString()}</td>
                                <td className="px-3 py-2 text-right">
                                  {(item.growthRate * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">CAGR</div>
                          <div className="font-medium">{(revenueResults.revenueHistory.cagr * 100).toFixed(1)}%</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">一致性</div>
                          <div className="font-medium">{(revenueResults.revenueHistory.consistency * 100).toFixed(0)}%</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">波动性</div>
                          <div className="font-medium">{revenueResults.revenueHistory.volatility.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">季度表现</h4>
                      <div className="rounded-md border overflow-hidden">
                        <table className="min-w-full divide-y">
                          <thead className="bg-muted">
                            <tr className="text-xs">
                              <th className="px-3 py-2 text-left">季度</th>
                              <th className="px-3 py-2 text-right">收入 (百万)</th>
                              <th className="px-3 py-2 text-right">同比</th>
                              <th className="px-3 py-2 text-right">环比</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y bg-card">
                            {revenueResults.quarterlyPerformance.lastFourQuarters.map((item: any) => (
                              <tr key={item.quarter} className="text-xs">
                                <td className="px-3 py-2">{item.quarter}</td>
                                <td className="px-3 py-2 text-right">${item.revenue.toLocaleString()}</td>
                                <td className="px-3 py-2 text-right">
                                  {(item.growthYoY * 100).toFixed(1)}%
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {(item.growthQoQ * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">超预期季度</div>
                          <div className="font-medium">{revenueResults.quarterlyPerformance.beatsEstimates}/4</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">季节性</div>
                          <div className="font-medium">{revenueResults.quarterlyPerformance.seasonality}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">趋势</div>
                          <div className="font-medium">{revenueResults.quarterlyPerformance.trend}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">收入组成</h4>
                      <div className="rounded-md border p-3">
                        <ul className="space-y-2">
                          {revenueResults.revenueComposition.segments.map((segment: any, index: number) => (
                            <li key={index} className="text-sm flex items-center">
                              <div className="w-2 h-2 rounded-full bg-blue-600 mr-2"></div>
                              <span>{segment.name}</span>
                              <span className="ml-1 text-muted-foreground">
                                {(segment.percentage * 100).toFixed(1)}%
                              </span>
                              <span className="ml-auto text-green-600">
                                +{(segment.growthRate * 100).toFixed(1)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">多样化评分: </span>
                            <span className="font-medium">{revenueResults.revenueComposition.diversificationScore.toFixed(1)}/10</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">地域多样化: </span>
                            <span className="font-medium">{revenueResults.revenueComposition.geographicDiversification}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">未来预期</h4>
                      <div className="rounded-md border p-3 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">下一年收入预期</span>
                          <span className="font-medium">${revenueResults.revenueForecast.nextYearRevenue.toLocaleString()}M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">下一年增长率</span>
                          <span className="font-medium">{(revenueResults.revenueForecast.nextYearGrowthRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">五年CAGR预期</span>
                          <span className="font-medium">{(revenueResults.revenueForecast.fiveYearCAGR * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">分析师预期</span>
                          <span className="font-medium">
                            {revenueResults.revenueForecast.analystConsensus === 'beat' ? '超预期' : 
                             revenueResults.revenueForecast.analystConsensus === 'meet' ? '符合预期' : '低于预期'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">置信度</span>
                          <span className="font-medium">
                            {revenueResults.revenueForecast.confidence === 'high' ? '高' : 
                             revenueResults.revenueForecast.confidence === 'medium' ? '中' : '低'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  点击"测试收入增长工具"按钮来生成分析结果
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 