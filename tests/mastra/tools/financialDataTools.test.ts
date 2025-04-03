import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  financialMetricsTool, 
  financialStatementsTool, 
  financialHistoryTool 
} from '@/mastra/tools/financialDataTools';

// Mock the global fetch function
global.fetch = vi.fn();

describe('financialDataTools', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('financialMetricsTool', () => {
    it('should return financial metrics for a given ticker', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ticker: 'AAPL',
          period: 'ttm',
          metrics: {
            grossMargin: 0.45,
            operatingMargin: 0.32,
            netProfitMargin: 0.25,
            returnOnEquity: 0.42,
            returnOnAssets: 0.19,
            debtToEquity: 1.2,
            currentRatio: 1.4
          }
        })
      });

      // Execute the tool
      const result = await financialMetricsTool.execute({ ticker: 'AAPL', period: 'ttm' });

      // Verify the fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/financial-metrics?ticker=AAPL&period=ttm`,
        expect.anything()
      );

      // Verify the results structure
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('period', 'ttm');
      expect(result).toHaveProperty('metrics');
      expect(result.metrics).toHaveProperty('grossMargin', 0.45);
      expect(result.metrics).toHaveProperty('returnOnEquity', 0.42);
      expect(result).toHaveProperty('success', true);
    });

    it('should handle default period parameter', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ticker: 'AAPL',
          period: 'ttm',
          metrics: {}
        })
      });

      // Execute the tool with just the ticker
      await financialMetricsTool.execute({ ticker: 'AAPL' });

      // Verify the fetch was called with the correct URL including default period
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/financial-metrics?ticker=AAPL&period=ttm`,
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
      const result = await financialMetricsTool.execute({ ticker: 'AAPL', period: 'ttm' });

      // Verify error handling
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('period', 'ttm');
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('financialStatementsTool', () => {
    it('should return financial statements for a given ticker', async () => {
      // Mock the fetch responses for all three statements
      const mockIncomeStatement = {
        ticker: 'AAPL',
        currency: 'USD',
        period: 'annual',
        data: {
          revenue: 365000000000,
          costOfRevenue: 200000000000,
          grossProfit: 165000000000,
          operatingExpenses: 45000000000,
          operatingIncome: 120000000000,
          netIncome: 95000000000,
          eps: 6.12,
          sharesOutstanding: 15500000000
        }
      };

      const mockBalanceSheet = {
        ticker: 'AAPL',
        currency: 'USD',
        period: 'annual',
        data: {
          totalAssets: 350000000000,
          totalLiabilities: 250000000000,
          totalEquity: 100000000000,
          cashAndEquivalents: 40000000000,
          shortTermInvestments: 30000000000,
          inventory: 5000000000,
          accountsReceivable: 20000000000,
          propertyPlantEquipment: 40000000000,
          longTermDebt: 120000000000,
          shortTermDebt: 20000000000
        }
      };

      const mockCashFlow = {
        ticker: 'AAPL',
        currency: 'USD',
        period: 'annual',
        data: {
          operatingCashFlow: 110000000000,
          capitalExpenditures: -12000000000,
          freeCashFlow: 98000000000,
          dividendsPaid: -14000000000,
          netBorrowings: 5000000000,
          cashFromFinancing: -30000000000,
          cashFromInvesting: -25000000000
        }
      };

      // Setup the sequential mock responses
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIncomeStatement
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBalanceSheet
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCashFlow
      });

      // Execute the tool
      const result = await financialStatementsTool.execute({ ticker: 'AAPL', period: 'annual' });

      // Verify the fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/income-statement?ticker=AAPL&period=annual`,
        expect.anything()
      );
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/balance-sheet?ticker=AAPL&period=annual`,
        expect.anything()
      );
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/cash-flow?ticker=AAPL&period=annual`,
        expect.anything()
      );

      // Verify the results structure
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('period', 'annual');
      expect(result).toHaveProperty('currency', 'USD');
      expect(result).toHaveProperty('incomeStatement');
      expect(result).toHaveProperty('balanceSheet');
      expect(result).toHaveProperty('cashFlow');
      expect(result).toHaveProperty('success', true);
      
      // Verify data from statements
      expect(result.incomeStatement).toEqual(mockIncomeStatement.data);
      expect(result.balanceSheet).toEqual(mockBalanceSheet.data);
      expect(result.cashFlow).toEqual(mockCashFlow.data);
    });

    it('should handle API errors correctly', async () => {
      // Mock the fetch response to simulate an error on the first call
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Execute the tool
      const result = await financialStatementsTool.execute({ ticker: 'AAPL', period: 'annual' });

      // Verify error handling
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('period', 'annual');
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('financialHistoryTool', () => {
    it('should return financial history for a given ticker and years', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ticker: 'AAPL',
          years: [
            {
              year: '2023',
              revenue: 365000000000,
              netIncome: 95000000000,
              operatingCashFlow: 110000000000,
              grossMargin: 0.45,
              netMargin: 0.26,
              roe: 0.42
            },
            {
              year: '2022',
              revenue: 350000000000,
              netIncome: 90000000000,
              operatingCashFlow: 105000000000,
              grossMargin: 0.44,
              netMargin: 0.25,
              roe: 0.40
            },
            {
              year: '2021',
              revenue: 330000000000,
              netIncome: 80000000000,
              operatingCashFlow: 95000000000,
              grossMargin: 0.42,
              netMargin: 0.24,
              roe: 0.38
            }
          ]
        })
      });

      // Execute the tool
      const result = await financialHistoryTool.execute({ ticker: 'AAPL', years: 3 });

      // Verify the fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/financial-history?ticker=AAPL&years=3`,
        expect.anything()
      );

      // Verify the results structure
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('years', 3);
      expect(result).toHaveProperty('financialHistory');
      expect(result.financialHistory).toHaveLength(3);
      expect(result.financialHistory[0]).toHaveProperty('year', '2023');
      expect(result.financialHistory[0]).toHaveProperty('revenue', 365000000000);
      expect(result.financialHistory[0]).toHaveProperty('netIncome', 95000000000);
      expect(result).toHaveProperty('success', true);
    });

    it('should handle default years parameter', async () => {
      // Mock the fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ticker: 'AAPL',
          years: []
        })
      });

      // Execute the tool with just the ticker
      await financialHistoryTool.execute({ ticker: 'AAPL' });

      // Verify the fetch was called with the correct URL including default years
      expect(global.fetch).toHaveBeenCalledWith(
        `https://lumosfund-api.vercel.app/api/financial-history?ticker=AAPL&years=5`,
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
      const result = await financialHistoryTool.execute({ ticker: 'AAPL', years: 5 });

      // Verify error handling
      expect(result).toHaveProperty('ticker', 'AAPL');
      expect(result).toHaveProperty('years', 5);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });
}); 