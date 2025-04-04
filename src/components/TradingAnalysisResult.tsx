import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TradingAnalysisResultProps {
  result: {
    success: boolean;
    data: {
      ticker: string;
      decision: {
        action: 'buy' | 'sell' | 'hold';
        confidence: number;
        reasoning: string;
      };
      analyses: {
        fundamental?: {
          summary: string;
          metrics: Record<string, any>;
          outlook: string;
        };
        technical?: {
          summary: string;
          indicators: Record<string, any>;
          patterns: string[];
        };
        sentiment?: {
          summary: string;
          score: number;
          sources: string[];
        };
        risk?: {
          summary: string;
          level: 'low' | 'medium' | 'high';
          factors: string[];
        };
        strategy?: {
          summary: string;
          entryPoints: string[];
          exitPoints: string[];
          stopLoss: number;
          takeProfit: number;
        };
      };
    };
  };
}

export function TradingAnalysisResult({ result }: TradingAnalysisResultProps) {
  if (!result || !result.success || !result.data) {
    return null;
  }

  const { ticker, decision, analyses } = result.data;

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'bg-green-100 text-green-800';
      case 'sell': return 'bg-red-100 text-red-800';
      case 'hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-blue-600';
    if (confidence >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      // 如果是百分比
      if (value <= 1 && value >= 0) {
        return `${(value * 100).toFixed(2)}%`;
      }
      return value.toFixed(2);
    }
    return value;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{ticker} 交易决策</CardTitle>
            <Badge className={`text-lg px-4 py-1 ${getActionColor(decision.action)}`}>
              {decision.action === 'buy' ? '买入' : 
               decision.action === 'sell' ? '卖出' : '持有'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <span className="font-medium mr-2">决策信心:</span>
              <span className={`font-bold ${getConfidenceColor(decision.confidence)}`}>
                {decision.confidence}%
              </span>
            </div>
            <p className="text-gray-700">{decision.reasoning}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={Object.keys(analyses)[0] || "fundamental"}>
        <TabsList className="grid grid-cols-5">
          {analyses.fundamental && <TabsTrigger value="fundamental">基本面</TabsTrigger>}
          {analyses.technical && <TabsTrigger value="technical">技术面</TabsTrigger>}
          {analyses.sentiment && <TabsTrigger value="sentiment">市场情绪</TabsTrigger>}
          {analyses.risk && <TabsTrigger value="risk">风险评估</TabsTrigger>}
          {analyses.strategy && <TabsTrigger value="strategy">策略</TabsTrigger>}
        </TabsList>

        {analyses.fundamental && (
          <TabsContent value="fundamental">
            <Card>
              <CardHeader>
                <CardTitle>基本面分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{analyses.fundamental.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analyses.fundamental.metrics || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 border-b">
                      <span className="font-medium">{key}:</span>
                      <span>{formatValue(value)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">展望</h4>
                  <p className="text-gray-700">{analyses.fundamental.outlook}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {analyses.technical && (
          <TabsContent value="technical">
            <Card>
              <CardHeader>
                <CardTitle>技术面分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{analyses.technical.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analyses.technical.indicators || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 border-b">
                      <span className="font-medium">{key}:</span>
                      <span>{formatValue(value)}</span>
                    </div>
                  ))}
                </div>
                {analyses.technical.patterns && analyses.technical.patterns.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">识别到的模式</h4>
                    <ul className="list-disc pl-5">
                      {analyses.technical.patterns.map((pattern, idx) => (
                        <li key={idx} className="text-gray-700">{pattern}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {analyses.sentiment && (
          <TabsContent value="sentiment">
            <Card>
              <CardHeader>
                <CardTitle>市场情绪分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{analyses.sentiment.summary}</p>
                <div className="flex items-center mb-4">
                  <span className="font-medium mr-2">情绪得分:</span>
                  <span className={`font-bold ${getConfidenceColor(analyses.sentiment.score * 100)}`}>
                    {formatValue(analyses.sentiment.score)}
                  </span>
                </div>
                {analyses.sentiment.sources && analyses.sentiment.sources.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">信息来源</h4>
                    <ul className="list-disc pl-5">
                      {analyses.sentiment.sources.map((source, idx) => (
                        <li key={idx} className="text-gray-700">{source}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {analyses.risk && (
          <TabsContent value="risk">
            <Card>
              <CardHeader>
                <CardTitle>风险评估</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{analyses.risk.summary}</p>
                <div className="flex items-center mb-4">
                  <span className="font-medium mr-2">风险等级:</span>
                  <Badge className={`
                    ${analyses.risk.level === 'low' ? 'bg-green-100 text-green-800' : 
                      analyses.risk.level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}
                  `}>
                    {analyses.risk.level === 'low' ? '低' : 
                     analyses.risk.level === 'medium' ? '中' : '高'}
                  </Badge>
                </div>
                {analyses.risk.factors && analyses.risk.factors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">风险因素</h4>
                    <ul className="list-disc pl-5">
                      {analyses.risk.factors.map((factor, idx) => (
                        <li key={idx} className="text-gray-700">{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {analyses.strategy && (
          <TabsContent value="strategy">
            <Card>
              <CardHeader>
                <CardTitle>交易策略</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{analyses.strategy.summary}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">入场点</h4>
                    <ul className="list-disc pl-5">
                      {analyses.strategy.entryPoints.map((point, idx) => (
                        <li key={idx} className="text-gray-700">{point}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">出场点</h4>
                    <ul className="list-disc pl-5">
                      {analyses.strategy.exitPoints.map((point, idx) => (
                        <li key={idx} className="text-gray-700">{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">止损:</span>
                    <span className="text-red-600 font-bold">{analyses.strategy.stopLoss}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">止盈:</span>
                    <span className="text-green-600 font-bold">{analyses.strategy.takeProfit}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 