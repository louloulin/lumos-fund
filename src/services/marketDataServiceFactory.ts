'use server';

import { realTimeMarketDataService } from './realTimeMarketDataService';
import { liveMarketDataService } from './liveMarketDataService';
import { createLogger } from '@/lib/logger.server';

const logger = createLogger('marketDataServiceFactory');

/**
 * 市场数据模式
 */
export type MarketDataMode = 'simulation' | 'live';

/**
 * 市场数据服务工厂
 * 负责提供市场数据服务，并可在模拟和实时数据之间切换
 */
class MarketDataServiceFactory {
  private currentMode: MarketDataMode = 'simulation';
  private apiKey?: string;
  private baseUrl?: string;
  private isInitialized: boolean = false;
  
  /**
   * 初始化工厂服务
   */
  async initialize(mode: MarketDataMode = 'simulation', apiKey?: string, baseUrl?: string): Promise<boolean> {
    try {
      this.currentMode = mode;
      this.apiKey = apiKey;
      this.baseUrl = baseUrl;
      
      logger.info(`初始化市场数据服务工厂，模式: ${mode}`);
      
      // 初始化相应的服务
      let success = false;
      
      if (mode === 'simulation') {
        success = await realTimeMarketDataService.initialize();
      } else {
        // 为实时模式提供API密钥
        if (apiKey) {
          liveMarketDataService.apiKey = apiKey;
        }
        if (baseUrl) {
          liveMarketDataService.baseUrl = baseUrl;
        }
        success = await liveMarketDataService.initialize();
      }
      
      if (success) {
        this.isInitialized = true;
        logger.info(`市场数据服务工厂初始化成功，模式: ${mode}`);
      } else {
        logger.error(`市场数据服务工厂初始化失败，模式: ${mode}`);
      }
      
      return success;
    } catch (error) {
      logger.error('初始化市场数据服务工厂失败', error);
      return false;
    }
  }
  
  /**
   * 获取当前服务模式
   */
  getMode(): MarketDataMode {
    return this.currentMode;
  }
  
  /**
   * 切换服务模式
   */
  async switchMode(mode: MarketDataMode): Promise<boolean> {
    if (this.currentMode === mode) {
      logger.info(`已经处于${mode}模式`);
      return true;
    }
    
    logger.info(`切换到${mode}模式`);
    return await this.initialize(mode, this.apiKey, this.baseUrl);
  }
  
  /**
   * 获取市场数据服务
   */
  getService() {
    this.ensureInitialized();
    return this.currentMode === 'simulation'
      ? realTimeMarketDataService
      : liveMarketDataService;
  }
  
  /**
   * 确保服务已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('市场数据服务工厂尚未初始化');
    }
  }
}

// 创建单例实例
export const marketDataServiceFactory = new MarketDataServiceFactory(); 