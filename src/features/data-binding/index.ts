/**
 * 数据绑定系统入口
 */

export * from './types/binding.types';
export { Compiler, defaultCompiler } from './compiler/compiler';
export { Parser } from './parser/parser';
export { Evaluator } from './runtime/evaluator';
export { Lexer, Token, TokenType } from './parser/lexer';

import { defaultCompiler } from './compiler/compiler';
import type { BindingContext, CompileOptions } from './types/binding.types';

/**
 * 渲染模板
 * @param template 模板字符串
 * @param data 数据对象
 * @param options 编译选项
 * @returns 渲染结果
 */
export function render(
  template: string,
  data: Record<string, any>,
  options?: CompileOptions & { helpers?: Record<string, Function> }
): string {
  const { helpers, ...compileOptions } = options || {};
  
  const context: BindingContext = {
    data,
    helpers: { ...globalHelpers, ...helpers },
  };
  
  const result = defaultCompiler.compile(template, compileOptions);
  
  if (result.errors.length > 0) {
    const error = result.errors[0];
    throw new Error(`Template error: ${error.message}`);
  }
  
  return result.render(context);
}

/**
 * 求值表达式
 * @param expression 表达式字符串
 * @param data 数据对象
 * @param options 选项
 * @returns 求值结果
 */
export function evaluate(
  expression: string,
  data: Record<string, any>,
  options?: { helpers?: Record<string, Function> }
): any {
  const context: BindingContext = {
    data,
    helpers: { ...globalHelpers, ...options?.helpers },
  };
  
  const result = defaultCompiler.compileExpression(expression);
  
  if (result.errors.length > 0) {
    const error = result.errors[0];
    throw new Error(`Expression error: ${error.message}`);
  }
  
  return result.evaluate(context);
}

/**
 * 创建绑定上下文
 * @param data 数据对象
 * @param parent 父上下文
 * @param helpers 辅助函数
 * @returns 绑定上下文
 */
export function createContext(
  data: Record<string, any>,
  parent?: BindingContext,
  helpers?: Record<string, Function>
): BindingContext {
  return {
    data,
    parent,
    helpers,
  };
}

/**
 * 注册全局辅助函数
 */
const globalHelpers: Record<string, Function> = {
  // 格式化日期
  formatDate: (date: Date | string, format: string = 'YYYY-MM-DD') => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return '';
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },
  
  // 格式化数字
  formatNumber: (value: number, decimals: number = 2) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0';
    }
    return value.toFixed(decimals);
  },
  
  // 格式化货币
  formatCurrency: (value: number, symbol: string = '¥') => {
    if (typeof value !== 'number' || isNaN(value)) {
      return `${symbol}0.00`;
    }
    return `${symbol}${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  },
  
  // 字符串截断
  truncate: (str: string, length: number = 50, suffix: string = '...') => {
    if (typeof str !== 'string') {
      return '';
    }
    if (str.length <= length) {
      return str;
    }
    return str.substring(0, length) + suffix;
  },
  
  // 默认值
  defaultValue: (value: any, defaultVal: any) => {
    return value == null || value === '' ? defaultVal : value;
  },
  
  // 数组长度
  length: (arr: any[]) => {
    return Array.isArray(arr) ? arr.length : 0;
  },
  
  // 数组求和
  sum: (arr: any[], key?: string) => {
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((total, item) => {
      const value = key ? item[key] : item;
      return total + (typeof value === 'number' ? value : 0);
    }, 0);
  },
  
  // 数组平均值
  avg: (arr: any[], key?: string) => {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const total = globalHelpers.sum(arr, key);
    return total / arr.length;
  },
  
  // 获取数组第一个元素
  first: (arr: any[]) => {
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
  },
  
  // 获取数组最后一个元素
  last: (arr: any[]) => {
    return Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : undefined;
  },
  
  // JSON 序列化
  json: (value: any, indent?: number) => {
    try {
      return JSON.stringify(value, null, indent);
    } catch (e) {
      return '';
    }
  },
};

/**
 * 注册辅助函数
 * @param name 函数名
 * @param fn 函数实现
 */
export function registerHelper(name: string, fn: Function): void {
  globalHelpers[name] = fn;
}

/**
 * 获取所有辅助函数
 */
export function getHelpers(): Record<string, Function> {
  return { ...globalHelpers };
}

/**
 * 创建带有默认辅助函数的渲染器
 */
export function createRenderer(customHelpers?: Record<string, Function>) {
  const helpers = { ...globalHelpers, ...customHelpers };
  
  return {
    render: (template: string, data: Record<string, any>, options?: CompileOptions) => {
      return render(template, data, { ...options, helpers });
    },
    
    evaluate: (expression: string, data: Record<string, any>) => {
      return evaluate(expression, data, { helpers });
    },
  };
}