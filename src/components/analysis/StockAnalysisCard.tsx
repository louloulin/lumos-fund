import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface StockAnalysisProps {
  ticker: string;
  price: number;
  signals: {
    overall: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
  reasoning: {
    summary: string;
    fundamental: {
      roe: number;
      score: number;
      analysis: string;
    };
    technical: {
      trend: string;
      score: number;
      analysis: string;
    };
    sentiment?: {
      score: number;
      analysis: string;
    };
  };
}

export function StockAnalysisCard({ 
  ticker, 
  price, 
  signals, 
  reasoning 
}: StockAnalysisProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{ticker}</CardTitle>
          <div className="text-2xl font-bold">${price.toFixed(2)}</div>
        </div>
        <div className="flex gap-2">
          {signals.overall === 'bullish' && (
            <Badge className="bg-green-500 hover:bg-green-600">看涨</Badge>
          )}
          {signals.overall === 'bearish' && (
            <Badge className="bg-red-500 hover:bg-red-600">看跌</Badge>
          )}
          {signals.overall === 'neutral' && (
            <Badge variant="secondary">中性</Badge>
          )}
          <div className="text-sm text-muted-foreground">
            置信度: {signals.confidence}%
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="w-full">
            <TabsTrigger value="summary" className="flex-1">摘要</TabsTrigger>
            <TabsTrigger value="fundamental" className="flex-1">基本面</TabsTrigger>
            <TabsTrigger value="technical" className="flex-1">技术面</TabsTrigger>
            {reasoning.sentiment && (
              <TabsTrigger value="sentiment" className="flex-1">情绪分析</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="summary">
            <p className="text-sm text-muted-foreground">{reasoning.summary}</p>
          </TabsContent>
          <TabsContent value="fundamental">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>ROE</span>
                <span>{reasoning.fundamental.roe}%</span>
              </div>
              <Progress value={reasoning.fundamental.score * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{reasoning.fundamental.analysis}</p>
            </div>
          </TabsContent>
          <TabsContent value="technical">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>趋势</span>
                <span>{reasoning.technical.trend}</span>
              </div>
              <Progress value={reasoning.technical.score * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{reasoning.technical.analysis}</p>
            </div>
          </TabsContent>
          {reasoning.sentiment && (
            <TabsContent value="sentiment">
              <div className="space-y-2">
                <Progress value={reasoning.sentiment.score * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">{reasoning.sentiment.analysis}</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
} 