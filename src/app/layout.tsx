import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'LumosFund - AI驱动的量化交易平台',
  description: '基于人工智能的量化交易与投资分析平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-background text-foreground antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
