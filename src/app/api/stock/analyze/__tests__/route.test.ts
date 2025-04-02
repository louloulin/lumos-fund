import { POST } from '../route';
import { stockAgent, valueInvestingAgent, growthInvestingAgent, trendInvestingAgent } from '@/mastra';

// Mock Mastra agents
jest.mock('@/mastra', () => ({
  stockAgent: {
    generate: jest.fn().mockResolvedValue({
      agent: 'Stock Analysis Agent',
      text: '分析结果 置信度: 85'
    })
  },
  valueInvestingAgent: {
    generate: jest.fn().mockResolvedValue({
      agent: 'Value Investing Agent',
      text: '价值分析 置信度: 75'
    })
  },
  growthInvestingAgent: {
    generate: jest.fn().mockResolvedValue({
      agent: 'Growth Investing Agent',
      text: '成长分析 置信度: 80'
    })
  },
  trendInvestingAgent: {
    generate: jest.fn().mockResolvedValue({
      agent: 'Trend Investing Agent',
      text: '趋势分析 置信度: 70'
    })
  }
}));

describe('Stock Analysis API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if symbol is missing', async () => {
    const request = new Request('http://localhost:3000/api/stock/analyze', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Symbol is required');
  });

  it('should analyze stock with all agents by default', async () => {
    const request = new Request('http://localhost:3000/api/stock/analyze', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'AAPL' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.symbol).toBe('AAPL');
    expect(data.analyses).toHaveLength(4);
    expect(stockAgent.generate).toHaveBeenCalled();
    expect(valueInvestingAgent.generate).toHaveBeenCalled();
    expect(growthInvestingAgent.generate).toHaveBeenCalled();
    expect(trendInvestingAgent.generate).toHaveBeenCalled();
  });

  it('should analyze stock with specific agent type', async () => {
    const request = new Request('http://localhost:3000/api/stock/analyze', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'AAPL', analysisType: 'value' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.symbol).toBe('AAPL');
    expect(data.analyses).toHaveLength(1);
    expect(data.analyses[0].type).toBe('Value Investing Agent');
    expect(valueInvestingAgent.generate).toHaveBeenCalled();
    expect(stockAgent.generate).not.toHaveBeenCalled();
  });

  it('should extract confidence scores correctly', async () => {
    const request = new Request('http://localhost:3000/api/stock/analyze', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'AAPL', analysisType: 'value' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.analyses[0].confidence).toBe(75);
  });

  it('should handle agent errors gracefully', async () => {
    // Mock agent error
    (valueInvestingAgent.generate as jest.Mock).mockRejectedValueOnce(new Error('Agent error'));

    const request = new Request('http://localhost:3000/api/stock/analyze', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'AAPL', analysisType: 'value' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to analyze stock');
  });
}); 