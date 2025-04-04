import TestAgentClient from './client';

export const metadata = {
  title: 'AI代理测试 | LumosFund',
  description: '测试LumosFund的AI投资代理能力，验证不同投资风格的分析效果',
};

export default function TestAgentsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">AI代理测试中心</h1>
      <p className="text-gray-500 mb-8">
        使用此页面测试LumosFund的AI投资代理，比较不同投资风格的分析效果
      </p>
      
      <TestAgentClient />
    </div>
  );
} 