import React from 'react';

export const metadata = {
  title: 'AI交易回测系统 | LumosFund',
  description: '利用AI代理进行交易策略回测，评估多种投资策略的绩效表现',
};

export default function BacktestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-full h-full">
      {children}
    </section>
  );
} 