import { describe, expect, it, jest } from "@jest/globals";
import { factorModelTool } from "../src/mastra/tools/factorModelTool";
import { technicalIndicatorsTool } from "../src/mastra/tools/technicalIndicatorsTool";
import { statisticalArbitrageTool } from "../src/mastra/tools/statisticalArbitrageTool";

// 模拟 createLogger
jest.mock("@/lib/logger.server", () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

describe("Quantitative Analysis Tools", () => {
  describe("Factor Model Tool", () => {
    it("should analyze stock factors correctly", async () => {
      const result = await factorModelTool.execute({
        ticker: "AAPL",
        factors: ["value", "quality", "momentum"],
        benchmark: "SPY",
        period: "6m",
      });

      // 基本结构检查
      expect(result).toBeDefined();
      expect(result.ticker).toBe("AAPL");
      expect(result.timestamp).toBeDefined();
      expect(result.signal).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.factors).toBeDefined();

      // 检查因子分析结果
      expect(result.factors.value).toBeDefined();
      expect(result.factors.quality).toBeDefined();
      expect(result.factors.momentum).toBeDefined();
      
      // 检查强弱因子
      expect(Array.isArray(result.strongFactors)).toBe(true);
      expect(Array.isArray(result.weakFactors)).toBe(true);
    });
  });

  describe("Technical Indicators Tool", () => {
    it("should calculate technical indicators correctly", async () => {
      const result = await technicalIndicatorsTool.execute({
        ticker: "MSFT",
        period: "daily",
        indicators: ["RSI", "MACD", "SMA", "BollingerBands"],
      });

      // 基本结构检查
      expect(result).toBeDefined();
      expect(result.ticker).toBe("MSFT");
      expect(result.timestamp).toBeDefined();
      expect(result.indicators).toBeDefined();
      expect(result.signal).toBeDefined();
      expect(result.confidence).toBeDefined();

      // 检查指标计算结果
      expect(Array.isArray(result.indicators)).toBe(true);
      expect(result.indicators.length).toBeGreaterThan(0);
      
      // 检查支持和反对的指标
      expect(Array.isArray(result.supportingIndicators)).toBe(true);
      expect(Array.isArray(result.opposingIndicators)).toBe(true);
    });
  });

  describe("Statistical Arbitrage Tool", () => {
    it("should analyze pairs trading opportunities correctly", async () => {
      const result = await statisticalArbitrageTool.execute({
        ticker1: "AAPL",
        ticker2: "MSFT",
        period: "6m",
        lookbackDays: 180,
        thresholdZScore: 2,
      });

      // 基本结构检查
      expect(result).toBeDefined();
      expect(result.ticker1).toBe("AAPL");
      expect(result.ticker2).toBe("MSFT");
      expect(result.timestamp).toBeDefined();
      
      // 检查统计指标
      expect(result.statistics).toBeDefined();
      expect(result.statistics.correlation).toBeDefined();
      expect(result.statistics.cointegration).toBeDefined();
      expect(result.statistics.currentZScore).toBeDefined();
      
      // 检查信号和回测
      expect(result.signal).toBeDefined();
      expect(result.backtest).toBeDefined();
      
      // 检查分析结果
      expect(result.analysis).toBeDefined();
      expect(result.analysis.opportunity).toBeDefined();
      expect(result.analysis.confidence).toBeDefined();
      expect(result.analysis.recommendation).toBeDefined();
    });
  });
}); 