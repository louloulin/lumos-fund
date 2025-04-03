import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  newsSentimentTool, 
  socialSentimentTool, 
  sentimentAnalysisTool 
} from '@/mastra/tools/newsSentimentTools';

// Mock the global fetch function
global.fetch = vi.fn();

describe('newsSentimentTools', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('newsSentimentTool', () => {
    it('should return news sentiment data for a given ticker', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ticker: 'AAPL',
          company: 'Apple Inc.',
          articles: [
            {
              title: 'Apple Reports Record Quarterly Results',
              source: 'Financial News',
              date: '2023-04-01',
              url: 'https://example.com/news/1',
              summary: 'Apple announced record quarterly revenue...',
              sentiment: {
                score: 0.85,
                label: 'positive'
              }
            },
            {
              title: 'Apple Faces Supply Chain Challenges',
              source: 'Tech News',
              date: '2023-03-30',
              url: 'https://example.com/news/2',
              summary: 'Apple is dealing with supply constraints...',
              sentiment: {
                score: -0.25,
                label: 'negative'
              }
            }
          ],
          overallSentiment: {
            score: 0.42,
            label: 'positive',
            distribution: {
              positive: 0.65,
              neutral: 0.2,
              negative: 0.15
            }
          }
        })
      });

      // Execute the tool
      const result = await newsSentimentTool.execute({ ticker: 'AAPL', days: 7 });

      // Verify the fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/news-sentiment?ticker=AAPL&days=7`,
        expect.anything()
      );

      // Verify the results structure
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('days', 7);
      expect(result).toHaveProperty('company', 'Apple Inc.');
      expect(result).toHaveProperty('articles');
      expect(result.articles).toHaveLength(2);
      expect(result).toHaveProperty('overallSentiment');
      expect(result.overallSentiment).toHaveProperty('score', 0.42);
      expect(result.overallSentiment).toHaveProperty('label', 'positive');
      expect(result).toHaveProperty('success', true);
    });

    it('should handle default days parameter', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ticker: 'AAPL',
          company: 'Apple Inc.',
          articles: [],
          overallSentiment: {
            score: 0,
            label: 'neutral',
            distribution: {
              positive: 0,
              neutral: 1,
              negative: 0
            }
          }
        })
      });

      // Execute the tool with just the ticker
      await newsSentimentTool.execute({ ticker: 'AAPL' });

      // Verify the fetch was called with the correct URL including default days
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/news-sentiment?ticker=AAPL&days=7`,
        expect.anything()
      );
    });

    it('should handle API errors correctly', async () => {
      // Mock the fetch response to simulate an error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Execute the tool
      const result = await newsSentimentTool.execute({ ticker: 'AAPL', days: 7 });

      // Verify error handling
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('days', 7);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('socialSentimentTool', () => {
    it('should return social media sentiment data for a given ticker', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ticker: 'AAPL',
          platform: 'Social Media',
          mentions: 12500,
          volume: {
            total: 12500,
            daily: [1800, 1650, 1900, 2200, 1600, 1750, 1600]
          },
          sentiment: {
            score: 0.65,
            label: 'positive',
            volumeChange: '+15.3%'
          },
          buzzwords: [
            { term: 'iPhone', count: 4500 },
            { term: 'earnings', count: 3200 },
            { term: 'innovation', count: 2800 }
          ]
        })
      });

      // Execute the tool
      const result = await socialSentimentTool.execute({ ticker: 'AAPL', days: 7 });

      // Verify the fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/social-sentiment?ticker=AAPL&days=7`,
        expect.anything()
      );

      // Verify the results structure
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('days', 7);
      expect(result).toHaveProperty('platform', 'Social Media');
      expect(result).toHaveProperty('mentions', 12500);
      expect(result).toHaveProperty('volume');
      expect(result).toHaveProperty('sentiment');
      expect(result.sentiment).toHaveProperty('score', 0.65);
      expect(result.sentiment).toHaveProperty('label', 'positive');
      expect(result).toHaveProperty('buzzwords');
      expect(result.buzzwords).toHaveLength(3);
      expect(result).toHaveProperty('success', true);
    });

    it('should handle API errors correctly', async () => {
      // Mock the fetch response to simulate an error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Execute the tool
      const result = await socialSentimentTool.execute({ ticker: 'AAPL', days: 7 });

      // Verify error handling
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('days', 7);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('sentimentAnalysisTool', () => {
    it('should return combined sentiment analysis for a given ticker', async () => {
      // Mock the fetch responses for news and social media
      const mockNewsData = {
        ticker: 'AAPL',
        company: 'Apple Inc.',
        articles: [
          {
            title: 'Apple Reports Record Quarterly Results',
            source: 'Financial News',
            date: '2023-04-01',
            url: 'https://example.com/news/1',
            summary: 'Apple announced record quarterly revenue...',
            sentiment: {
              score: 0.85,
              label: 'positive'
            }
          }
        ],
        overallSentiment: {
          score: 0.42,
          label: 'positive',
          distribution: {
            positive: 0.65,
            neutral: 0.2,
            negative: 0.15
          }
        }
      };

      const mockSocialData = {
        ticker: 'AAPL',
        platform: 'Social Media',
        mentions: 12500,
        volume: {
          total: 12500,
          daily: [1800, 1650, 1900, 2200, 1600, 1750, 1600]
        },
        sentiment: {
          score: 0.65,
          label: 'positive',
          volumeChange: '+15.3%'
        },
        buzzwords: [
          { term: 'iPhone', count: 4500 },
          { term: 'earnings', count: 3200 },
          { term: 'innovation', count: 2800 }
        ]
      };

      // Setup the sequential mock responses
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewsData
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSocialData
      });

      // Execute the tool
      const result = await sentimentAnalysisTool.execute({ ticker: 'AAPL', days: 7 });

      // Verify the fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/news-sentiment?ticker=AAPL&days=7`,
        expect.anything()
      );
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/social-sentiment?ticker=AAPL&days=7`,
        expect.anything()
      );

      // Verify the results structure
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('days', 7);
      expect(result).toHaveProperty('company', 'Apple Inc.');
      expect(result).toHaveProperty('sentiment');
      expect(result.sentiment).toHaveProperty('news');
      expect(result.sentiment).toHaveProperty('social');
      expect(result.sentiment).toHaveProperty('combined');
      
      // Verify combined sentiment calculation (news 0.42 * 0.6 + social 0.65 * 0.4 = 0.512)
      expect(result.sentiment.combined.score).toBeCloseTo(0.512, 2);
      expect(result.sentiment.combined.label).toBe('positive');
      
      expect(result).toHaveProperty('topNews');
      expect(result.topNews).toHaveLength(1);
      expect(result).toHaveProperty('topBuzzwords');
      expect(result.topBuzzwords).toHaveLength(3);
      expect(result).toHaveProperty('success', true);
    });

    it('should handle API errors correctly', async () => {
      // Mock the fetch response to simulate an error on the first call
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Execute the tool
      const result = await sentimentAnalysisTool.execute({ ticker: 'AAPL', days: 7 });

      // Verify error handling
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('days', 7);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });
}); 