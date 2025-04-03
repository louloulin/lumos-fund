import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stockPriceTool, volumeTool, historicalPriceTool } from '@/mastra/tools/marketDataTools';

// Mock the global fetch function
global.fetch = vi.fn();

describe('marketDataTools', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('stockPriceTool', () => {
    it('should return stock price data for a given ticker', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prices: {
            '1. open': '150.00',
            '2. high': '155.00',
            '3. low': '148.00',
            '4. close': '153.00',
            '5. trading date': '2023-04-01',
            '6. change': '3.00',
            '7. change percent': '2.00%'
          }
        })
      });

      // Execute the tool
      const result = await stockPriceTool.execute({ symbol: 'AAPL' });

      // Verify the fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        `https://mastra-stock-data.vercel.app/api/stock-data?symbol=AAPL`,
        expect.anything()
      );

      // Verify the results structure
      expect(result).toHaveProperty('symbol', 'AAPL');
      expect(result).toHaveProperty('currentPrice', 153);
      expect(result).toHaveProperty('openPrice', 150);
      expect(result).toHaveProperty('highPrice', 155);
      expect(result).toHaveProperty('lowPrice', 148);
      expect(result).toHaveProperty('tradingDate', '2023-04-01');
      expect(result).toHaveProperty('change', 3);
      expect(result).toHaveProperty('changePercent', 0.02);
      expect(result).toHaveProperty('success', true);
    });

    it('should handle API errors correctly', async () => {
      // Mock the fetch response to simulate an error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Execute the tool
      const result = await stockPriceTool.execute({ symbol: 'AAPL' });

      // Verify error handling
      expect(result).toHaveProperty('symbol', 'AAPL');
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('volumeTool', () => {
    it('should return volume data for a given ticker', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          volume: {
            volume: '1000000',
            averageVolume: '1200000',
            volumeRatio: '0.83',
            date: '2023-04-01'
          }
        })
      });

      // Execute the tool
      const result = await volumeTool.execute({ symbol: 'AAPL' });

      // Verify the fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        `https://mastra-stock-data.vercel.app/api/volume-data?symbol=AAPL`,
        expect.anything()
      );

      // Verify the results structure
      expect(result).toHaveProperty('symbol', 'AAPL');
      expect(result).toHaveProperty('volume', 1000000);
      expect(result).toHaveProperty('averageVolume', 1200000);
      expect(result).toHaveProperty('volumeRatio', 0.83);
      expect(result).toHaveProperty('date', '2023-04-01');
      expect(result).toHaveProperty('success', true);
    });

    it('should handle API errors correctly', async () => {
      // Mock the fetch response to simulate an error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Execute the tool
      const result = await volumeTool.execute({ symbol: 'AAPL' });

      // Verify error handling
      expect(result).toHaveProperty('symbol', 'AAPL');
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('historicalPriceTool', () => {
    it('should return historical price data for a given ticker and days', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          historicalPrices: [
            {
              date: '2023-04-01',
              open: '150.00',
              high: '155.00',
              low: '148.00',
              close: '153.00',
              volume: '1000000'
            },
            {
              date: '2023-03-31',
              open: '148.00',
              high: '152.00',
              low: '147.00',
              close: '149.00',
              volume: '900000'
            }
          ]
        })
      });

      // Execute the tool
      const result = await historicalPriceTool.execute({ symbol: 'AAPL', days: 30 });

      // Verify the fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        `https://mastra-stock-data.vercel.app/api/historical-data?symbol=AAPL&days=30`,
        expect.anything()
      );

      // Verify the results structure
      expect(result).toHaveProperty('symbol', 'AAPL');
      expect(result).toHaveProperty('days', 30);
      expect(result).toHaveProperty('historicalPrices');
      expect(result.historicalPrices).toHaveLength(2);
      expect(result.historicalPrices[0]).toHaveProperty('date', '2023-04-01');
      expect(result.historicalPrices[0]).toHaveProperty('open', 150);
      expect(result.historicalPrices[0]).toHaveProperty('high', 155);
      expect(result.historicalPrices[0]).toHaveProperty('low', 148);
      expect(result.historicalPrices[0]).toHaveProperty('close', 153);
      expect(result.historicalPrices[0]).toHaveProperty('volume', 1000000);
      expect(result).toHaveProperty('success', true);
    });

    it('should handle default days parameter', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          historicalPrices: []
        })
      });

      // Execute the tool with just the symbol
      await historicalPriceTool.execute({ symbol: 'AAPL' });

      // Verify the fetch was called with the correct URL including default days
      expect(global.fetch).toHaveBeenCalledWith(
        `https://mastra-stock-data.vercel.app/api/historical-data?symbol=AAPL&days=30`,
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
      const result = await historicalPriceTool.execute({ symbol: 'AAPL', days: 30 });

      // Verify error handling
      expect(result).toHaveProperty('symbol', 'AAPL');
      expect(result).toHaveProperty('days', 30);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });
}); 