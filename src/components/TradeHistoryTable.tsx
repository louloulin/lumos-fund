'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DownloadIcon, ArrowUpDown, Calendar, Filter, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Transaction } from '@/types/trading';

interface TradeHistoryTableProps {
  transactions: Transaction[];
}

export function TradeHistoryTable({ transactions = [] }: TradeHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Transaction>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string | null>(null);

  // 处理排序
  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 处理过滤
  const filteredTransactions = transactions.filter(transaction => {
    // 按类型过滤
    if (filterType && transaction.type !== filterType) {
      return false;
    }

    // 按搜索关键词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        transaction.id.toLowerCase().includes(query) ||
        transaction.type.toLowerCase().includes(query) ||
        (transaction.ticker && transaction.ticker.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // 处理排序
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortField === 'timestamp') {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }

    if (a[sortField] === undefined || b[sortField] === undefined) {
      return 0;
    }

    if (a[sortField] < b[sortField]) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (a[sortField] > b[sortField]) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // 获取交易类型标签
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'buy':
        return '买入';
      case 'sell':
        return '卖出';
      case 'deposit':
        return '入金';
      case 'withdrawal':
        return '出金';
      case 'dividend':
        return '股息';
      default:
        return type;
    }
  };

  // 获取交易类型样式
  const getTransactionTypeStyle = (type: string) => {
    switch (type) {
      case 'buy':
        return 'bg-blue-100 text-blue-800';
      case 'sell':
        return 'bg-violet-100 text-violet-800';
      case 'deposit':
        return 'bg-green-100 text-green-800';
      case 'withdrawal':
        return 'bg-orange-100 text-orange-800';
      case 'dividend':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 过滤器按钮
  const FilterButton = ({ type, label }: { type: string | null, label: string }) => (
    <Button
      variant={filterType === type ? "default" : "outline"}
      size="sm"
      onClick={() => setFilterType(filterType === type ? null : type)}
      className="h-8"
    >
      {label}
    </Button>
  );

  // 导出交易历史
  const exportTransactions = () => {
    // 在实际产品中实现导出功能
    console.log('Exporting transactions:', sortedTransactions);
    
    // 简单的CSV导出示例
    const headers = ['ID', '类型', '股票', '数量', '价格', '金额', '日期'];
    
    const csvContent = [
      headers.join(','),
      ...sortedTransactions.map(t => [
        t.id,
        getTransactionTypeLabel(t.type),
        t.ticker || '',
        t.shares || '',
        t.price || '',
        t.amount || '',
        new Date(t.timestamp).toLocaleString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `交易历史_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle>交易历史</CardTitle>
            <CardDescription>所有历史交易记录</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="sm:ml-auto h-8 gap-1"
            onClick={exportTransactions}
          >
            <DownloadIcon className="h-4 w-4" />
            <span>导出</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <div className="flex gap-2 overflow-auto pb-2 sm:pb-0">
              <FilterButton type={null} label="全部" />
              <FilterButton type="buy" label="买入" />
              <FilterButton type="sell" label="卖出" />
              <FilterButton type="deposit" label="入金" />
              <FilterButton type="withdrawal" label="出金" />
              <FilterButton type="dividend" label="股息" />
            </div>
            <div className="relative max-w-sm">
              <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索交易..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left whitespace-nowrap px-4 py-3 font-medium text-sm">
                      <button 
                        className="flex items-center gap-1"
                        onClick={() => handleSort('type')}
                      >
                        类型
                        {sortField === 'type' && (
                          <ArrowUpDown size={14} className="text-muted-foreground" />
                        )}
                      </button>
                    </th>
                    <th className="text-left whitespace-nowrap px-4 py-3 font-medium text-sm">
                      <button
                        className="flex items-center gap-1"
                        onClick={() => handleSort('ticker')}
                      >
                        股票代码
                        {sortField === 'ticker' && (
                          <ArrowUpDown size={14} className="text-muted-foreground" />
                        )}
                      </button>
                    </th>
                    <th className="text-right whitespace-nowrap px-4 py-3 font-medium text-sm">
                      数量/金额
                    </th>
                    <th className="text-right whitespace-nowrap px-4 py-3 font-medium text-sm">
                      <button
                        className="flex items-center gap-1 ml-auto"
                        onClick={() => handleSort('price')}
                      >
                        价格
                        {sortField === 'price' && (
                          <ArrowUpDown size={14} className="text-muted-foreground" />
                        )}
                      </button>
                    </th>
                    <th className="text-right whitespace-nowrap px-4 py-3 font-medium text-sm">
                      <button
                        className="flex items-center gap-1 ml-auto"
                        onClick={() => handleSort('timestamp')}
                      >
                        日期
                        {sortField === 'timestamp' && (
                          <ArrowUpDown size={14} className="text-muted-foreground" />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        没有找到符合条件的交易记录
                      </td>
                    </tr>
                  ) : (
                    sortedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-t hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${getTransactionTypeStyle(transaction.type)}`}>
                            {getTransactionTypeLabel(transaction.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {transaction.ticker || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {transaction.shares ? (
                            `${transaction.shares} 股`
                          ) : transaction.amount ? (
                            formatCurrency(transaction.amount)
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {transaction.price ? formatCurrency(transaction.price) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(transaction.timestamp)}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <p>显示 {sortedTransactions.length} 条记录（共 {transactions.length} 条）</p>
            <div className="flex items-center">
              <RefreshCw className="h-3 w-3 mr-1" />
              <span>最后更新: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 