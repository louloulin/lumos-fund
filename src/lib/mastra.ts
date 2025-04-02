import { MastraClient } from '@mastra/client-js';

// 初始化Mastra客户端
export const mastraClient = new MastraClient({
  baseUrl: process.env.NEXT_PUBLIC_MASTRA_API_URL || 'http://localhost:4111',
});

// 获取各种预定义代理
export const getValueInvestingAgent = () => {
  return mastraClient.getAgent('valueInvestingAgent');
};

export const getTechnicalAnalysisAgent = () => {
  return mastraClient.getAgent('technicalAnalysisAgent');
};

export const getSentimentAnalysisAgent = () => {
  return mastraClient.getAgent('sentimentAnalysisAgent');
};

export const getRiskManagementAgent = () => {
  return mastraClient.getAgent('riskManagementAgent');
};

// 获取智能交易代理
export const getTradingAgent = () => {
  return mastraClient.getAgent('tradingAgent');
};

// 使用交易决策工作流
export const executeTradingWorkflow = async (ticker: string, data: any = {}) => {
  const workflow = mastraClient.getWorkflow('tradingDecisionWorkflow');
  
  try {
    const result = await workflow.execute({
      context: {
        ticker,
        data,
        timestamp: new Date().toISOString(),
      }
    });
    
    return result;
  } catch (error) {
    console.error('Trading workflow error:', error);
    throw error;
  }
};

// 获取特定股票的AI分析
export const getStockAnalysis = async (ticker: string) => {
  const agent = getTradingAgent();
  
  try {
    const response = await agent.generate({
      messages: [
        { 
          role: 'user', 
          content: `分析股票 ${ticker} 的投资价值，给出投资建议和理由。` 
        }
      ],
    });
    
    return response.text;
  } catch (error) {
    console.error('Stock analysis error:', error);
    throw error;
  }
};

// 获取市场洞察
export const getMarketInsights = async () => {
  const agent = getTradingAgent();
  
  try {
    const response = await agent.generate({
      messages: [
        { 
          role: 'user', 
          content: '给出当前市场的主要趋势和洞察，包括主要指数、行业表现和重要事件影响。' 
        }
      ],
    });
    
    return response.text;
  } catch (error) {
    console.error('Market insights error:', error);
    throw error;
  }
}; 