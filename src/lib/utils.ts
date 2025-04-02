import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 组合多个类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化货币显示
 * @param value 货币金额
 * @param currency 货币符号，默认为 CNY
 * @param locale 地区设置，默认为 zh-CN
 */
export function formatCurrency(value: number, currency: string = 'CNY', locale: string = 'zh-CN') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * 格式化日期显示
 * @param dateString 日期字符串或Date对象
 * @param locale 地区设置，默认为 zh-CN
 */
export function formatDate(dateString: string | Date, locale: string = 'zh-CN') {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * 数字格式化
 * @param value 要格式化的数字
 * @param digits 小数位数，默认为2
 */
export function formatNumber(value: number, digits: number = 2) {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * 格式化百分比
 * @param value 小数形式的百分比值（如0.1234表示12.34%）
 * @param digits 小数位数，默认为2
 */
export function formatPercent(value: number, digits: number = 2) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
