'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Brain, TrendingUp, BarChart, ShieldAlert, Calendar, Send, RefreshCw } from 'lucide-react';
import { testAgent, getStockAnalysis, getMarketInsights, getStrategyRecommendation } from '@/actions/mastra';

// 模拟代理数据
const agents = {
  tradingAssistant: {
    id: 'tradingAssistant',
    name: 'Trading Assistant Agent',
    description: 'Comprehensive market analysis and investment recommendations',
    type: 'analysis',
    status: 'active',
    icon: <Brain className="h-6 w-6 text-primary" />,
    stats: [
      { name: 'Accuracy', value: '87%' },
      { name: 'Response Time', value: '2.3s' },
      { name: 'Queries Today', value: '24' }
    ],
    recentAnalyses: [
      { id: 1, date: '2024-07-21', title: 'AAPL Market Analysis', ticker: 'AAPL' },
      { id: 2, date: '2024-07-20', title: 'MSFT Technical Review', ticker: 'MSFT' },
      { id: 3, date: '2024-07-19', title: 'TSLA Volatility Analysis', ticker: 'TSLA' }
    ]
  },
  valueInvestor: {
    id: 'valueInvestor',
    name: 'Value Investing Agent',
    description: 'Based on Warren Buffett\'s investment philosophy, focuses on company valuation',
    type: 'strategy',
    status: 'active',
    icon: <BarChart className="h-6 w-6 text-primary" />,
    stats: [
      { name: 'Accuracy', value: '92%' },
      { name: 'Response Time', value: '3.1s' },
      { name: 'Queries Today', value: '18' }
    ],
    recentAnalyses: [
      { id: 1, date: '2024-07-21', title: 'BRK.B Value Analysis', ticker: 'BRK.B' },
      { id: 2, date: '2024-07-20', title: 'KO Dividend Analysis', ticker: 'KO' },
      { id: 3, date: '2024-07-19', title: 'PG Cash Flow Review', ticker: 'PG' }
    ]
  },
  technicalAnalyst: {
    id: 'technicalAnalyst',
    name: 'Technical Analysis Agent',
    description: 'Focuses on price trends and technical indicators analysis',
    type: 'strategy', 
    status: 'active',
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
    stats: [
      { name: 'Accuracy', value: '85%' },
      { name: 'Response Time', value: '1.8s' },
      { name: 'Queries Today', value: '31' }
    ],
    recentAnalyses: [
      { id: 1, date: '2024-07-21', title: 'NVDA Momentum Analysis', ticker: 'NVDA' },
      { id: 2, date: '2024-07-20', title: 'AMD Support & Resistance', ticker: 'AMD' },
      { id: 3, date: '2024-07-19', title: 'AMZN Chart Patterns', ticker: 'AMZN' }
    ]
  },
  riskManager: {
    id: 'riskManager',
    name: 'Risk Management Agent',
    description: 'Portfolio risk assessment and management',
    type: 'risk',
    status: 'active',
    icon: <ShieldAlert className="h-6 w-6 text-primary" />,
    stats: [
      { name: 'Accuracy', value: '94%' },
      { name: 'Response Time', value: '2.5s' },
      { name: 'Queries Today', value: '12' }
    ],
    recentAnalyses: [
      { id: 1, date: '2024-07-21', title: 'Portfolio Volatility Analysis', ticker: 'PORTFOLIO' },
      { id: 2, date: '2024-07-20', title: 'Risk-Adjusted Returns', ticker: 'PORTFOLIO' },
      { id: 3, date: '2024-07-19', title: 'Drawdown Protection Strategy', ticker: 'PORTFOLIO' }
    ]
  }
};

export default function AgentPage({ params }: { params: { id: string } }) {
  const agent = agents[params.id as keyof typeof agents];
  const [activeTab, setActiveTab] = useState('overview');
  const [ticker, setTicker] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('daily');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Return 404 if agent not found
  if (!agent) {
    notFound();
  }

  // Handle custom query to agent
  const handleCustomQuery = async () => {
    if (!prompt) return;
    
    try {
      setLoading(true);
      const result = await testAgent(agent.id, prompt);
      setResponse(result);
    } catch (error) {
      console.error('Error querying agent:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle pre-defined analyses based on agent type
  const handlePredefinedAnalysis = async (analysisType: string) => {
    try {
      setLoading(true);
      let result = '';
      
      switch (analysisType) {
        case 'market':
          result = await getMarketInsights(ticker, timeframe);
          break;
        case 'stock':
          result = await getStockAnalysis(ticker);
          break;
        case 'strategy':
          result = await getStrategyRecommendation(ticker, 'moderate');
          break;
        default:
          result = `Analysis type '${analysisType}' not implemented`;
      }
      
      setResponse(result);
    } catch (error) {
      console.error('Error running analysis:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        {/* Agent Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {agent.icon}
            <div>
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <p className="text-muted-foreground">{agent.description}</p>
            </div>
          </div>
          <Badge
            variant={agent.status === 'active' ? 'default' : 'secondary'}
            className="px-3 py-1 text-sm"
          >
            {agent.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Agent Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {agent.stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Agent Interaction Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="interact">Interact</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Capabilities</CardTitle>
                <CardDescription>
                  This agent provides {agent.type === 'analysis' ? 'market analysis' : 
                    agent.type === 'strategy' ? 'investment strategy recommendations' : 'risk management insights'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-medium">Quick Actions</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          handlePredefinedAnalysis('market');
                          setActiveTab('interact');
                        }}
                      >
                        Market Analysis
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          handlePredefinedAnalysis('stock');
                          setActiveTab('interact');
                        }}
                      >
                        Stock Analysis
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          handlePredefinedAnalysis('strategy');
                          setActiveTab('interact');
                        }}
                      >
                        Strategy Recommendation
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interact Tab */}
          <TabsContent value="interact" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Interaction</CardTitle>
                <CardDescription>
                  Ask questions or request analysis from this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="AAPL" 
                      value={ticker} 
                      onChange={(e) => setTicker(e.target.value)} 
                      className="w-48"
                    />
                    <select 
                      value={timeframe} 
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                    <Button 
                      variant="outline" 
                      onClick={() => handlePredefinedAnalysis('market')}
                      disabled={loading}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Analysis
                    </Button>
                  </div>
                  
                  <div className="grid w-full gap-1.5">
                    <Textarea 
                      placeholder={`Ask ${agent.name} about market analysis or investment advice...`}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleCustomQuery} disabled={loading || !prompt}>
                      {loading ? 'Processing...' : 'Submit Query'}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  
                  {response && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <h3 className="font-medium mb-2">Response:</h3>
                      <div className="text-sm text-muted-foreground whitespace-pre-line">
                        {response}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Analyses</CardTitle>
                <CardDescription>
                  History of recent analyses and interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {agent.recentAnalyses.map((analysis) => (
                    <div 
                      key={analysis.id} 
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{analysis.date}</span>
                        <Badge variant="outline" className="ml-2">
                          {analysis.ticker}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">{analysis.title}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setTicker(analysis.ticker);
                            handlePredefinedAnalysis('stock');
                            setActiveTab('interact');
                          }}
                          className="ml-2"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 