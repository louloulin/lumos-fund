import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 交易代理 - LumosFund',
  description: '管理和监控您的AI交易代理系统',
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {children}
    </div>
  );
} 