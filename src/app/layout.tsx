import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LumosFund - AI驱动的量化投资平台',
  description: '通过AI代理网络，实现高效的量化交易策略',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="absolute top-4 right-4 z-10">
              <ThemeToggle />
            </div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
