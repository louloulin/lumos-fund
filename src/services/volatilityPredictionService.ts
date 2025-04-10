'use server';

import * as math from 'mathjs';
import { createLogger } from '@/lib/logger.server';
import { EventEmitter } from 'events';
import { MarketDataService } from '@/services/marketDataService';

// 创建日志记录器
const logger = createLogger('volatility-prediction-service');

/**
 * 波动率预测结果接口
 */
export interface VolatilityPrediction {
  // 当前波动率(标准差)
  current: number;
  // 预测波动率(标准差)
  predicted: number;
  // 预测信心区间 - 下限
  lowerBound: number;
  // 预测信心区间 - 上限
  upperBound: number;
  // 波动率变化百分比 (相对于当前)
  changePercent: number;
  // 预测时间范围(天数)
  forecastDays: number;
  // 预测增长或下降趋势
  trend: 'increasing' | 'decreasing' | 'stable';
  // 波动率级别分类
  volatilityLevel: 'low' | 'medium' | 'high' | 'extreme';
}

/**
 * 页面使用的波动率预测结果接口
 */
export interface VolatilityForecast {
  // 当前波动率
  currentVolatility: number;
  // 预测波动率
  predictedVolatility: number;
  // 信心区间 [下限, 上限]
  confidenceInterval: [number, number];
  // 预测时间范围(天数)
  forecastHorizon: number;
  // 波动率趋势
  volatilityTrend: 'increasing' | 'decreasing' | 'stable';
  // 历史波动率
  historicalVolatility: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  // 模型类型
  modelType: string;
  // 模型参数
  modelParams: {
    omega: number;
    alpha: number;
    beta: number;
  };
  // 预测时间戳
  timestamp: number;
}

/**
 * GARCH模型参数
 */
interface GARCHParams {
  omega: number;  // 常数项
  alpha: number;  // ARCH项系数
  beta: number;   // GARCH项系数
}

/**
 * 波动率预测服务
 * 使用GARCH模型预测资产价格的波动率
 */
export class VolatilityPredictionService extends EventEmitter {
  private isInitialized: boolean = false;
  private models: Map<string, any> = new Map();
  private marketDataService: MarketDataService;
  
  constructor(marketDataService?: MarketDataService) {
    super();
    this.marketDataService = marketDataService || new MarketDataService();
  }
  
  /**
   * 初始化服务
   */
  public async init(): Promise<void> {
    logger.info('初始化波动率预测服务');
    this.isInitialized = true;
    logger.info('波动率预测服务初始化完成');
  }
  
  /**
   * 检查服务是否已初始化
   */
  private checkInitialized() {
    if (!this.isInitialized) {
      throw new Error('波动率预测服务未初始化');
    }
  }
  
  /**
   * 为指定资产创建或更新预测模型
   * @param symbol 资产代码
   */
  private async createOrUpdateModel(symbol: string): Promise<any> {
    try {
      // 从市场数据服务获取历史价格数据
      const priceHistory = await this.marketDataService.fetchStockPriceHistory(symbol, '365d'); // 获取一年的历史数据
      
      // 计算每日收益率
      const returns: number[] = [];
      for (let i = 1; i < priceHistory.length; i++) {
        const dailyReturn = (priceHistory[i].close / priceHistory[i-1].close) - 1;
        returns.push(dailyReturn);
      }
      
      // 估计GARCH(1,1)模型参数
      const garchParams = this.estimateGARCHParams(returns);
      
      // 如果已有该资产的模型，则更新模型
      if (this.models.has(symbol)) {
        logger.info(`更新${symbol}的波动率预测模型`);
        const model = this.models.get(symbol);
        model.params = garchParams;
        model.lastUpdated = new Date();
        model.dataPoints = priceHistory.length;
        model.returns = returns;
        return model;
      }
      
      // 创建新模型
      logger.info(`为${symbol}创建波动率预测模型`);
      
      const model = {
        symbol,
        createdAt: new Date(),
        lastUpdated: new Date(),
        dataPoints: priceHistory.length,
        params: garchParams,
        returns: returns,
        modelType: 'GARCH(1,1)'
      };
      
      this.models.set(symbol, model);
      return model;
    } catch (error) {
      logger.error(`为${symbol}创建/更新预测模型失败:`, error);
      throw new Error(`预测模型创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 估计GARCH模型参数
   * 使用简化方法估计GARCH(1,1)参数
   */
  private estimateGARCHParams(returns: number[]): GARCHParams {
    try {
      // 计算样本方差作为初始条件
      const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
      const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
      
      // 在实际应用中，应使用最大似然估计等方法估计GARCH参数
      // 为简化起见，此处使用典型值
      // omega: 长期方差水平，通常是总方差的一小部分
      // alpha: ARCH项系数，衡量收益率冲击对波动率的影响
      // beta: GARCH项系数，衡量波动率持续性
      
      // 典型的GARCH(1,1)参数
      let omega = variance * 0.05; // 长期方差的5%
      let alpha = 0.1;             // 收益率冲击的影响
      let beta = 0.85;             // 波动率持续性
      
      // 确保参数满足稳定性条件: alpha + beta < 1
      if (alpha + beta >= 1) {
        alpha = 0.1;
        beta = 0.85;
      }
      
      return { omega, alpha, beta };
    } catch (error) {
      logger.error('估计GARCH参数失败:', error);
      // 返回默认参数
      return { omega: 0.00001, alpha: 0.1, beta: 0.85 };
    }
  }
  
  /**
   * 使用GARCH模型预测未来波动率
   * @param model GARCH模型
   * @param days 预测天数
   */
  private predictWithGARCH(model: any, days: number): number {
    try {
      const { params, returns } = model;
      const { omega, alpha, beta } = params;
      
      // 使用最后已知的方差作为起点
      let lastVariance = this.estimateCurrentVariance(returns, params);
      
      // 预测未来方差
      for (let i = 0; i < days; i++) {
        // GARCH(1,1)方差预测公式: σ²(t+1) = ω + α*ε²(t) + β*σ²(t)
        // 由于我们不知道未来的收益率，所以假设 ε²(t) = 0
        lastVariance = omega + beta * lastVariance;
      }
      
      // 返回预测的标准差(波动率)
      return Math.sqrt(lastVariance * 252); // 年化
    } catch (error) {
      logger.error('GARCH预测失败:', error);
      // 返回一个合理的默认值
      return 0.2; // 20%的年化波动率
    }
  }
  
  /**
   * 估计当前方差
   */
  private estimateCurrentVariance(returns: number[], params: GARCHParams): number {
    const { omega, alpha, beta } = params;
    
    // 获取最近的收益率
    const recentReturns = returns.slice(-20); // 使用最近20天的数据
    
    // 样本方差作为初始值
    const mean = recentReturns.reduce((sum, val) => sum + val, 0) / recentReturns.length;
    let variance = recentReturns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentReturns.length;
    
    // 使用GARCH递归公式计算当前方差
    for (let i = 1; i < recentReturns.length; i++) {
      const squaredReturn = Math.pow(recentReturns[i-1], 2);
      variance = omega + alpha * squaredReturn + beta * variance;
    }
    
    return variance;
  }
  
  /**
   * 预测指定资产的波动率
   * @param symbol 资产代码
   * @param days 预测天数
   * @returns 波动率预测结果
   */
  public async predictVolatility(symbol: string, days: number): Promise<VolatilityPrediction> {
    this.checkInitialized();
    
    try {
      // 获取或创建预测模型
      const model = await this.createOrUpdateModel(symbol);
      
      // 获取资产当前波动率
      const currentVolatility = await this.calculateCurrentVolatility(symbol);
      
      // 使用GARCH模型进行预测
      const predictedVolatility = this.predictWithGARCH(model, days);
      const changePercent = ((predictedVolatility - currentVolatility) / currentVolatility) * 100;
      
      // 计算信心区间 (假设正态分布)
      // 90%信心区间大约是±1.645个标准差
      const confidenceFactor = 1.645;
      const predictionError = Math.sqrt(days) * (predictedVolatility * 0.1); // 标准误差随时间的平方根增长
      const lowerBound = Math.max(0.001, predictedVolatility - confidenceFactor * predictionError);
      const upperBound = predictedVolatility + confidenceFactor * predictionError;
      
      // 确定波动率趋势
      const trend = this.determineTrend(changePercent);
      
      // 确定波动率等级
      const volatilityLevel = this.determineVolatilityLevel(predictedVolatility);
      
      // 构建并返回预测结果
      return {
        current: currentVolatility,
        predicted: predictedVolatility,
        lowerBound,
        upperBound,
        changePercent,
        forecastDays: days,
        trend,
        volatilityLevel,
      };
    } catch (error) {
      logger.error(`预测${symbol}波动率失败:`, error);
      throw new Error(`波动率预测失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 计算当前波动率
   * @param symbol 资产代码
   */
  private async calculateCurrentVolatility(symbol: string): Promise<number> {
    try {
      // 获取最近的价格历史数据
      const priceHistory = await this.marketDataService.fetchStockPriceHistory(symbol, '30d'); // 30天数据
      
      // 计算每日收益率
      const returns: number[] = [];
      for (let i = 1; i < priceHistory.length; i++) {
        const dailyReturn = (priceHistory[i].close / priceHistory[i-1].close) - 1;
        returns.push(dailyReturn);
      }
      
      // 计算标准差(波动率)
      const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
      const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      
      // 转换为年化波动率 (假设252个交易日)
      const annualizedVol = stdDev * Math.sqrt(252);
      
      return annualizedVol;
    } catch (error) {
      logger.error(`计算${symbol}当前波动率失败:`, error);
      throw new Error(`当前波动率计算失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 确定波动率趋势
   */
  private determineTrend(changePercent: number): 'increasing' | 'decreasing' | 'stable' {
    if (changePercent > 5) return 'increasing';
    if (changePercent < -5) return 'decreasing';
    return 'stable';
  }
  
  /**
   * 确定波动率等级
   */
  private determineVolatilityLevel(volatility: number): 'low' | 'medium' | 'high' | 'extreme' {
    if (volatility < 0.15) return 'low';
    if (volatility < 0.25) return 'medium';
    if (volatility < 0.35) return 'high';
    return 'extreme';
  }

  /**
   * 生成详细的波动率预测
   * 包含更多详细信息，如模型参数和历史波动率
   * @param symbol 资产代码
   * @param days 预测天数
   */
  public async generateDetailedForecast(symbol: string, days: number): Promise<VolatilityForecast> {
    this.checkInitialized();
    
    try {
      // 获取基本预测
      const basicPrediction = await this.predictVolatility(symbol, days);
      
      // 获取模型
      const model = this.models.get(symbol);
      if (!model) {
        throw new Error(`未找到${symbol}的预测模型`);
      }
      
      // 计算不同时间段的历史波动率
      const historicalVolatility = await this.calculateHistoricalVolatility(symbol);
      
      // 创建详细预测
      const forecast: VolatilityForecast = {
        currentVolatility: basicPrediction.current,
        predictedVolatility: basicPrediction.predicted,
        confidenceInterval: [basicPrediction.lowerBound, basicPrediction.upperBound],
        forecastHorizon: days,
        volatilityTrend: basicPrediction.trend,
        historicalVolatility,
        modelType: model.modelType,
        modelParams: model.params,
        timestamp: Date.now()
      };
      
      logger.info(`生成${symbol}的详细波动率预测`, { 
        current: forecast.currentVolatility, 
        predicted: forecast.predictedVolatility,
        trend: forecast.volatilityTrend
      });
      
      return forecast;
    } catch (error) {
      logger.error(`生成${symbol}的详细波动率预测失败:`, error);
      throw new Error(`详细波动率预测生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 计算不同时间段的历史波动率
   */
  private async calculateHistoricalVolatility(symbol: string): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
  }> {
    try {
      // 获取价格历史
      const priceHistory = await this.marketDataService.fetchStockPriceHistory(symbol, '365d');
      
      // 计算每日收益率
      const returns: number[] = [];
      for (let i = 1; i < priceHistory.length; i++) {
        const dailyReturn = (priceHistory[i].close / priceHistory[i-1].close) - 1;
        returns.push(dailyReturn);
      }
      
      // 计算每日波动率 (最近30天)
      const dailyReturns = returns.slice(-30);
      const dailyMean = dailyReturns.reduce((sum, val) => sum + val, 0) / dailyReturns.length;
      const dailyVariance = dailyReturns.reduce((sum, val) => sum + Math.pow(val - dailyMean, 2), 0) / dailyReturns.length;
      const dailyStdDev = Math.sqrt(dailyVariance);
      const dailyAnnualized = dailyStdDev * Math.sqrt(252); // 年化
      
      // 计算每周波动率 (使用最近12周数据)
      const weeklyReturns = [];
      for (let i = 0; i < Math.min(12, Math.floor(returns.length / 5)); i++) {
        const startIdx = returns.length - (i + 1) * 5;
        const endIdx = returns.length - i * 5;
        
        // 计算周收益率
        const weekReturn = returns.slice(Math.max(0, startIdx), endIdx)
          .reduce((acc, val) => (1 + acc) * (1 + val) - 1, 0);
        
        weeklyReturns.push(weekReturn);
      }
      
      const weeklyMean = weeklyReturns.reduce((sum, val) => sum + val, 0) / weeklyReturns.length;
      const weeklyVariance = weeklyReturns.reduce((sum, val) => sum + Math.pow(val - weeklyMean, 2), 0) / weeklyReturns.length;
      const weeklyStdDev = Math.sqrt(weeklyVariance);
      const weeklyAnnualized = weeklyStdDev * Math.sqrt(52); // 年化
      
      // 计算每月波动率 (使用最近12个月数据)
      const monthlyReturns = [];
      for (let i = 0; i < Math.min(12, Math.floor(returns.length / 21)); i++) {
        const startIdx = returns.length - (i + 1) * 21;
        const endIdx = returns.length - i * 21;
        
        // 计算月收益率
        const monthReturn = returns.slice(Math.max(0, startIdx), endIdx)
          .reduce((acc, val) => (1 + acc) * (1 + val) - 1, 0);
        
        monthlyReturns.push(monthReturn);
      }
      
      const monthlyMean = monthlyReturns.reduce((sum, val) => sum + val, 0) / monthlyReturns.length;
      const monthlyVariance = monthlyReturns.reduce((sum, val) => sum + Math.pow(val - monthlyMean, 2), 0) / monthlyReturns.length;
      const monthlyStdDev = Math.sqrt(monthlyVariance);
      const monthlyAnnualized = monthlyStdDev * Math.sqrt(12); // 年化
      
      return {
        daily: dailyAnnualized,
        weekly: weeklyAnnualized,
        monthly: monthlyAnnualized
      };
    } catch (error) {
      logger.error(`计算${symbol}历史波动率失败:`, error);
      return {
        daily: 0.2,
        weekly: 0.18,
        monthly: 0.15
      };
    }
  }
}

// 创建单例实例
export const volatilityPredictionService = new VolatilityPredictionService(); 