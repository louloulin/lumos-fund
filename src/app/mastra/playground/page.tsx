import { MastraPlayground } from '@/components/mastra/MastraPlayground';

export const metadata = {
  title: 'Mastra测试平台 | LumosFund',
  description: '测试Mastra AI代理和工作流',
};

export default function MastraPlaygroundPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mastra AI代理测试平台</h1>
        <p className="text-gray-600">
          测试和执行Mastra AI代理与工作流，开发和调试AI交易代理的工具。
        </p>
      </div>
      
      <MastraPlayground />
    </div>
  );
} 