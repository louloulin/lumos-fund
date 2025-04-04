import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StrategyRecommendation from '@/components/strategy/StrategyRecommendation';
import * as strategyActions from '@/actions/strategy';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock server actions
jest.mock('@/actions/strategy', () => ({
  getInvestmentStrategy: jest.fn(),
  saveStrategyPreferences: jest.fn(),
  getStrategyHistory: jest.fn()
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn()
  }))
}));

describe('策略推荐组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认mock返回值
    (strategyActions.getInvestmentStrategy as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        agentResponse: "# 策略推荐\n\n价值投资和动量策略的组合适合您的风险偏好和投资期限。",
        strategyData: {
          ticker: 'AAPL',
          recommendation: {
            primaryStrategy: 'value',
            secondaryStrategy: 'momentum',
            allocation: { value: 60, momentum: 40 },
            parameters: {
              primaryParams: { peRatio: 20 },
              riskManagement: { stopLoss: 0.1 }
            },
            tradingRules: {
              entrySignals: ['PE低于20'],
              exitSignals: ['PE高于30']
            }
          },
          confidence: 75
        }
      }
    });
  });
  
  it('应该正确渲染表单和初始状态', () => {
    render(<StrategyRecommendation />);
    
    // 验证表单元素存在
    expect(screen.getByLabelText(/股票代码/i)).toBeInTheDocument();
    expect(screen.getByText(/风险承受能力/i)).toBeInTheDocument();
    expect(screen.getByText(/投资期限/i)).toBeInTheDocument();
    expect(screen.getByText(/市场状况/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /生成策略推荐/i })).toBeInTheDocument();
    
    // 验证初始状态下不显示结果
    expect(screen.queryByText(/策略推荐结果/i)).not.toBeInTheDocument();
  });
  
  it('应该能提交表单并显示策略推荐结果', async () => {
    render(<StrategyRecommendation />);
    
    // 填写表单
    const tickerInput = screen.getByLabelText(/股票代码/i);
    fireEvent.change(tickerInput, { target: { value: 'AAPL' } });
    
    // 选择风险承受能力
    const riskSelect = screen.getByLabelText(/风险承受能力/i);
    fireEvent.change(riskSelect, { target: { value: 'moderate' } });
    
    // 选择投资期限
    const horizonSelect = screen.getByLabelText(/投资期限/i);
    fireEvent.change(horizonSelect, { target: { value: 'medium' } });
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /生成策略推荐/i });
    fireEvent.click(submitButton);
    
    // 验证请求参数
    await waitFor(() => {
      expect(strategyActions.getInvestmentStrategy).toHaveBeenCalledWith({
        ticker: 'AAPL',
        riskTolerance: 'moderate',
        investmentHorizon: 'medium',
        marketCondition: expect.any(String),
        userId: expect.any(String)
      });
    });
    
    // 验证显示结果
    await waitFor(() => {
      expect(screen.getByText(/策略推荐结果/i)).toBeInTheDocument();
      expect(screen.getByText(/价值投资/i)).toBeInTheDocument();
      expect(screen.getByText(/动量策略/i)).toBeInTheDocument();
    });
  });
  
  it('应该能处理请求失败', async () => {
    // 模拟请求失败
    (strategyActions.getInvestmentStrategy as jest.Mock).mockResolvedValue({
      success: false,
      error: '获取策略推荐失败'
    });
    
    render(<StrategyRecommendation />);
    
    // 填写必要字段
    const tickerInput = screen.getByLabelText(/股票代码/i);
    fireEvent.change(tickerInput, { target: { value: 'AAPL' } });
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /生成策略推荐/i });
    fireEvent.click(submitButton);
    
    // 验证错误提示
    await waitFor(() => {
      expect(screen.getByText(/获取策略推荐失败/i)).toBeInTheDocument();
    });
  });
  
  it('应该禁用空表单提交', () => {
    render(<StrategyRecommendation />);
    
    // 提交按钮默认应该被禁用
    const submitButton = screen.getByRole('button', { name: /生成策略推荐/i });
    expect(submitButton).toBeDisabled();
    
    // 填写股票代码后应该启用
    const tickerInput = screen.getByLabelText(/股票代码/i);
    fireEvent.change(tickerInput, { target: { value: 'AAPL' } });
    
    expect(submitButton).not.toBeDisabled();
  });
  
  it('应该保存用户历史查询', async () => {
    // 模拟用户ID
    const mockUserId = 'test-user-123';
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(mockUserId);
    
    render(<StrategyRecommendation />);
    
    // 填写表单
    const tickerInput = screen.getByLabelText(/股票代码/i);
    fireEvent.change(tickerInput, { target: { value: 'AAPL' } });
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /生成策略推荐/i });
    fireEvent.click(submitButton);
    
    // 验证 API 调用包含用户 ID
    await waitFor(() => {
      expect(strategyActions.getInvestmentStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId
        })
      );
    });
  });
}); 