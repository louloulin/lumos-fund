import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 英雄区域 */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            智能量化交易<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">让投资更智能</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            利用人工智能和量化策略为您的投资组合赋能，实现数据驱动的投资决策。
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/portfolio">开始投资</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/market">探索市场</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 功能区域 */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>AI 驱动分析</CardTitle>
                <CardDescription>利用先进的人工智能模型分析市场数据和趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <p>结合多种AI模型，包括价值投资分析器、技术分析引擎和情绪分析系统，全方位评估投资机会。</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/mastra">了解Mastra AI</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>量化交易策略</CardTitle>
                <CardDescription>基于数据和算法的智能交易决策系统</CardDescription>
              </CardHeader>
              <CardContent>
                <p>构建可定制的量化交易策略，结合技术指标、基本面分析和市场情绪，实现系统化投资决策。</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/strategies">探索策略</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>回测与优化</CardTitle>
                <CardDescription>全面的历史数据回测系统，验证策略有效性</CardDescription>
              </CardHeader>
              <CardContent>
                <p>使用历史市场数据回测您的交易策略，分析风险和收益指标，不断优化投资组合表现。</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/backtest">开始回测</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* 特色区域 */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">全面的市场数据</h2>
              <p className="text-lg text-muted-foreground mb-4">
                接入全球金融市场数据，包括股票、指数、加密货币和外汇，为您的投资决策提供坚实的数据基础。
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="bg-primary/20 text-primary p-1 rounded-full">✓</span>
                  实时市场价格和指标
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary/20 text-primary p-1 rounded-full">✓</span>
                  财务报表和基本面数据
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary/20 text-primary p-1 rounded-full">✓</span>
                  技术指标和图表分析
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary/20 text-primary p-1 rounded-full">✓</span>
                  市场新闻和情绪分析
                </li>
              </ul>
              <Button className="mt-6" asChild>
                <Link href="/market">浏览市场数据</Link>
              </Button>
            </div>
            <div className="bg-muted/40 p-8 rounded-xl">
              <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">市场数据可视化</h3>
                  <p className="text-muted-foreground">交互式图表和实时市场数据</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">开始您的智能投资之旅</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            利用人工智能和量化交易技术，提升您的投资策略和市场洞察力。
          </p>
          <Button size="lg" asChild>
            <Link href="/portfolio">开始使用</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
