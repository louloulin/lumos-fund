'use server';

import fs from 'fs/promises';
import path from 'path';
import { MarketDataMode, marketDataServiceFactory } from '@/services/marketDataServiceFactory';

// 设置文件路径
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'market-data-settings.json');

// 确保数据目录存在
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 市场数据设置接口
interface MarketDataSettings {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  customBaseUrl?: string;
  dataMode: MarketDataMode;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  requestLimit?: number;
  fallbackToSimulation?: boolean;
}

/**
 * 保存市场数据设置
 */
export async function saveMarketDataSettings(settings: MarketDataSettings): Promise<{ success: boolean; message: string }> {
  try {
    // 确保数据目录存在
    await ensureDataDir();
    
    // 保存设置到文件
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    
    // 应用设置到服务
    if (settings.dataMode === 'live') {
      await marketDataServiceFactory.initialize('live', settings.apiKey, settings.baseUrl || settings.customBaseUrl);
    } else {
      await marketDataServiceFactory.initialize('simulation');
    }
    
    return { 
      success: true, 
      message: '市场数据设置已成功保存' 
    };
  } catch (error) {
    console.error('保存市场数据设置失败:', error);
    return { 
      success: false, 
      message: `保存市场数据设置失败: ${error instanceof Error ? error.message : '未知错误'}` 
    };
  }
}

/**
 * 获取市场数据设置
 */
export async function getMarketDataSettings(): Promise<MarketDataSettings | null> {
  try {
    // 确保数据目录存在
    await ensureDataDir();
    
    // 检查设置文件是否存在
    try {
      await fs.access(SETTINGS_FILE);
    } catch (error) {
      // 如果文件不存在，返回默认设置
      return {
        provider: 'finnhub',
        apiKey: '',
        dataMode: 'simulation',
        cacheEnabled: true,
        cacheTTL: 30,
        requestLimit: 60,
        fallbackToSimulation: true
      };
    }
    
    // 读取设置文件
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data) as MarketDataSettings;
  } catch (error) {
    console.error('获取市场数据设置失败:', error);
    return null;
  }
}

/**
 * 测试API连接
 */
export async function testAPIConnection(
  provider: string, 
  apiKey: string, 
  baseUrl: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 不同提供商的测试端点
    let testEndpoint = '';
    
    switch (provider) {
      case 'finnhub':
        testEndpoint = `${baseUrl}/stock/symbol?exchange=US&token=${apiKey}`;
        break;
      case 'alpha_vantage':
        testEndpoint = `${baseUrl}?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=${apiKey}`;
        break;
      case 'tiingo':
        testEndpoint = `${baseUrl}/tiingo/daily/AAPL/prices?token=${apiKey}`;
        break;
      case 'polygon':
        testEndpoint = `${baseUrl}/v2/aggs/ticker/AAPL/range/1/day/2023-01-01/2023-01-02?apiKey=${apiKey}`;
        break;
      case 'iex':
        testEndpoint = `${baseUrl}/stable/stock/market/batch?symbols=aapl&types=quote&token=${apiKey}`;
        break;
      case 'marketstack':
        testEndpoint = `${baseUrl}/eod?access_key=${apiKey}&symbols=AAPL`;
        break;
      case 'custom':
        // 对于自定义API，使用提供的基础URL并假设有一个简单的测试端点
        testEndpoint = `${baseUrl}/test?apiKey=${apiKey}`;
        break;
      default:
        return { 
          success: false, 
          message: '未知的API提供商' 
        };
    }
    
    // 发送测试请求
    const response = await fetch(testEndpoint);
    
    if (response.ok) {
      return { 
        success: true, 
        message: 'API连接成功！服务器返回了有效响应。' 
      };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `API连接失败: ${response.status} ${response.statusText}. ${errorText}` 
      };
    }
  } catch (error) {
    console.error('测试API连接失败:', error);
    return { 
      success: false, 
      message: `无法连接到API: ${error instanceof Error ? error.message : '未知错误'}` 
    };
  }
}

/**
 * 获取当前市场数据模式
 */
export async function getCurrentMarketDataMode(): Promise<MarketDataMode> {
  try {
    // 初始化服务（如果尚未初始化）
    await initializeMarketDataService();
    
    return marketDataServiceFactory.getMode();
  } catch (error) {
    console.error('获取市场数据模式失败:', error);
    return 'simulation'; // 默认返回模拟模式
  }
}

/**
 * 初始化市场数据服务
 */
export async function initializeMarketDataService(): Promise<boolean> {
  try {
    // 获取保存的设置
    const settings = await getMarketDataSettings();
    
    if (!settings) {
      // 如果没有设置，使用默认的模拟模式
      return await marketDataServiceFactory.initialize('simulation');
    }
    
    // 根据设置初始化服务
    if (settings.dataMode === 'live' && settings.apiKey) {
      const baseUrl = settings.baseUrl || settings.customBaseUrl;
      return await marketDataServiceFactory.initialize('live', settings.apiKey, baseUrl);
    } else {
      return await marketDataServiceFactory.initialize('simulation');
    }
  } catch (error) {
    console.error('初始化市场数据服务失败:', error);
    // 出错时使用模拟模式
    return await marketDataServiceFactory.initialize('simulation');
  }
}

// 在应用启动时初始化市场数据服务
initializeMarketDataService().catch(console.error); 