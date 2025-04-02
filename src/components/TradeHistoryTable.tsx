'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

// 定义交易类型样式
const transactionTypeStyles: Record<string, { bg: string; text: string }> = {
  buy: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
  sell: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300' },
  deposit: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
  withdrawal: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-700 dark:text-amber-300' },
  dividend: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-300' },
};

// 交易记录类型定义
interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'dividend';
  ticker?: string;
  shares?: number;
  price?: number;
  amount?: number;
  timestamp: string;
}

interface TradeHistoryTableProps {
  transactions: Transaction[];
  className?: string;
}

export function TradeHistoryTable({ transactions, className = '' }: TradeHistoryTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 过滤和排序交易记录
  const filteredTransactions = transactions
    .filter(transaction => {
      // 根据类型过滤
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }
      
      // 根据搜索查询过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          transaction.ticker?.toLowerCase().includes(query) ||
          transaction.id.toLowerCase().includes(query)
        ) {
          return true;
        }
        return false;
      }
      
      return true;
    })
    // 按时间降序排序
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 items-center">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="所有交易类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有交易类型</SelectItem>
              <SelectItem value="buy">买入</SelectItem>
              <SelectItem value="sell">卖出</SelectItem>
              <SelectItem value="deposit">入金</SelectItem>
              <SelectItem value="withdrawal">出金</SelectItem>
              <SelectItem value="dividend">股息</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder="搜索股票代码"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          
          {(typeFilter !== 'all' || searchQuery) && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setTypeFilter('all');
                setSearchQuery('');
              }}
              size="sm"
            >
              清除筛选
            </Button>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          显示 {filteredTransactions.length} 项交易记录
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>股票</TableHead>
              <TableHead className="text-right">价格</TableHead>
              <TableHead className="text-right">数量</TableHead>
              <TableHead className="text-right">金额</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  未找到交易记录
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => {
                const typeStyle = transactionTypeStyles[transaction.type] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                
                // 计算交易金额
                let amount = transaction.amount;
                if (transaction.type === 'buy' || transaction.type === 'sell') {
                  amount = (transaction.shares || 0) * (transaction.price || 0);
                  if (transaction.type === 'buy') {
                    amount = -amount; // 买入为负
                  }
                } else if (transaction.type === 'withdrawal') {
                  amount = -(transaction.amount || 0); // 出金为负
                }
                
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                    <TableCell>
                      <Badge className={`${typeStyle.bg} ${typeStyle.text} border-none font-medium`}>
                        {transaction.type === 'buy' && '买入'}
                        {transaction.type === 'sell' && '卖出'}
                        {transaction.type === 'deposit' && '入金'}
                        {transaction.type === 'withdrawal' && '出金'}
                        {transaction.type === 'dividend' && '股息'}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.ticker || '-'}</TableCell>
                    <TableCell className="text-right">{transaction.price ? formatCurrency(transaction.price) : '-'}</TableCell>
                    <TableCell className="text-right">{transaction.shares || '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${amount && amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {amount ? formatCurrency(amount) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 