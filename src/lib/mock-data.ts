import { Transaction } from '@/types/trading';

// 模拟交易历史数据
export const MOCK_TRANSACTIONS: Transaction[] = [
  { 
    id: 'tx1', 
    type: 'buy', 
    ticker: 'AAPL', 
    shares: 10, 
    price: 183.58, 
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: 'tx2', 
    type: 'sell', 
    ticker: 'MSFT', 
    shares: 5, 
    price: 426.89, 
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: 'tx3', 
    type: 'deposit', 
    amount: 10000, 
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: 'tx4', 
    type: 'buy', 
    ticker: 'NVDA', 
    shares: 3, 
    price: 894.32, 
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: 'tx5', 
    type: 'sell', 
    ticker: 'GOOGL', 
    shares: 8, 
    price: 151.24, 
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: 'tx6', 
    type: 'dividend', 
    ticker: 'MSFT', 
    amount: 42.50, 
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: 'tx7', 
    type: 'withdrawal', 
    amount: 2500, 
    timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() 
  }
]; 