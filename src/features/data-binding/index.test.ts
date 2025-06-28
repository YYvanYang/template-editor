import { describe, it, expect, beforeEach } from 'vitest';
import { 
  render, 
  evaluate, 
  createContext, 
  createRenderer,
  registerHelper,
  getHelpers,
  defaultCompiler,
} from './index';

describe('Data Binding API', () => {
  beforeEach(() => {
    // 清除缓存以确保测试隔离
    defaultCompiler.clearCache();
  });

  describe('render', () => {
    it('应该渲染简单模板', () => {
      const result = render('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('应该渲染复杂模板', () => {
      const template = `
        Order #{{orderId}}
        Customer: {{customer.name}}
        Total: {{formatCurrency(total)}}
      `;
      
      const data = {
        orderId: '12345',
        customer: { name: 'John Doe' },
        total: 99.99,
      };
      
      const helpers = {
        formatCurrency: (value: number) => `$${value.toFixed(2)}`,
      };
      
      const result = render(template, data, { helpers });
      expect(result).toContain('Order #12345');
      expect(result).toContain('Customer: John Doe');
      expect(result).toContain('Total: $99.99');
    });

    it('应该处理条件渲染', () => {
      const template = '{{#if premium}}Premium User{{else}}Regular User{{/if}}';
      
      expect(render(template, { premium: true })).toBe('Premium User');
      expect(render(template, { premium: false })).toBe('Regular User');
    });

    it('应该处理列表渲染', () => {
      const template = '{{#each items}}{{item}} {{/each}}';
      const result = render(template, { items: ['A', 'B', 'C'] });
      expect(result).toBe('A B C ');
    });

    it('应该抛出模板错误', () => {
      expect(() => render('{{invalid syntax}}', {})).toThrow('Template error');
    });
  });

  describe('evaluate', () => {
    it('应该求值表达式', () => {
      expect(evaluate('2 + 3')).toBe(5);
      expect(evaluate('name', { name: 'John' })).toBe('John');
      expect(evaluate('a > b', { a: 10, b: 5 })).toBe(true);
    });

    it('应该使用辅助函数', () => {
      const helpers = {
        double: (n: number) => n * 2,
      };
      
      expect(evaluate('double(5)', {}, { helpers })).toBe(10);
    });

    it('应该抛出表达式错误', () => {
      expect(() => evaluate('invalid expression', {})).toThrow('Expression error');
    });
  });

  describe('createContext', () => {
    it('应该创建基本上下文', () => {
      const context = createContext({ name: 'John' });
      expect(context.data).toEqual({ name: 'John' });
      expect(context.parent).toBeUndefined();
      expect(context.helpers).toBeUndefined();
    });

    it('应该创建带父上下文的上下文', () => {
      const parent = createContext({ global: 'value' });
      const child = createContext({ local: 'value' }, parent);
      
      expect(child.parent).toBe(parent);
    });

    it('应该创建带辅助函数的上下文', () => {
      const helpers = { format: (v: any) => String(v) };
      const context = createContext({}, undefined, helpers);
      
      expect(context.helpers).toBe(helpers);
    });
  });

  describe('全局辅助函数', () => {
    describe('formatDate', () => {
      it('应该格式化日期', () => {
        const date = new Date('2024-01-15T10:30:45');
        const result = render('{{formatDate(date, "YYYY-MM-DD")}}', { date });
        expect(result).toBe('2024-01-15');
      });

      it('应该使用默认格式', () => {
        const date = new Date('2024-01-15T10:30:45');
        const result = render('{{formatDate(date)}}', { date });
        expect(result).toBe('2024-01-15');
      });

      it('应该处理字符串日期', () => {
        const result = render('{{formatDate("2024-01-15", "YYYY-MM-DD")}}', {});
        expect(result).toBe('2024-01-15');
      });

      it('应该处理无效日期', () => {
        const result = render('{{formatDate("invalid")}}', {});
        expect(result).toBe('');
      });
    });

    describe('formatNumber', () => {
      it('应该格式化数字', () => {
        expect(render('{{formatNumber(3.14159, 2)}}', {})).toBe('3.14');
        expect(render('{{formatNumber(100)}}', {})).toBe('100.00');
      });

      it('应该处理非数字', () => {
        expect(render('{{formatNumber("abc")}}', {})).toBe('0');
      });
    });

    describe('formatCurrency', () => {
      it('应该格式化货币', () => {
        expect(render('{{formatCurrency(1234.56)}}', {})).toBe('¥1,234.56');
        expect(render('{{formatCurrency(1234.56, "$")}}', {})).toBe('$1,234.56');
      });

      it('应该处理大数字', () => {
        expect(render('{{formatCurrency(1234567.89)}}', {})).toBe('¥1,234,567.89');
      });
    });

    describe('truncate', () => {
      it('应该截断字符串', () => {
        const text = 'This is a very long text that needs to be truncated';
        expect(render('{{truncate(text, 20)}}', { text })).toBe('This is a very long ...');
        expect(render('{{truncate(text, 20, "---")}}', { text })).toBe('This is a very long ---');
      });

      it('应该处理短字符串', () => {
        expect(render('{{truncate("short", 10)}}', {})).toBe('short');
      });
    });

    describe('defaultValue', () => {
      it('应该提供默认值', () => {
        expect(render('{{defaultValue(value, "N/A")}}', { value: null })).toBe('N/A');
        expect(render('{{defaultValue(value, "N/A")}}', { value: undefined })).toBe('N/A');
        expect(render('{{defaultValue(value, "N/A")}}', { value: '' })).toBe('N/A');
        expect(render('{{defaultValue(value, "N/A")}}', { value: 'test' })).toBe('test');
      });
    });

    describe('数组辅助函数', () => {
      it('应该计算数组长度', () => {
        expect(render('{{length(items)}}', { items: [1, 2, 3] })).toBe('3');
        expect(render('{{length(items)}}', { items: [] })).toBe('0');
        expect(render('{{length(items)}}', { items: null })).toBe('0');
      });

      it('应该计算数组和', () => {
        expect(render('{{sum(numbers)}}', { numbers: [1, 2, 3, 4] })).toBe('10');
        expect(render('{{sum(items, "price")}}', { 
          items: [{ price: 10 }, { price: 20 }, { price: 30 }] 
        })).toBe('60');
      });

      it('应该计算平均值', () => {
        expect(render('{{avg(numbers)}}', { numbers: [2, 4, 6] })).toBe('4');
        expect(render('{{avg(items, "score")}}', { 
          items: [{ score: 80 }, { score: 90 }, { score: 100 }] 
        })).toBe('90');
      });

      it('应该获取第一个和最后一个元素', () => {
        const items = ['a', 'b', 'c'];
        expect(render('{{first(items)}}', { items })).toBe('a');
        expect(render('{{last(items)}}', { items })).toBe('c');
        expect(render('{{first(empty)}}', { empty: [] })).toBe('');
      });
    });

    describe('json', () => {
      it('应该序列化为 JSON', () => {
        const obj = { name: 'John', age: 30 };
        expect(render('{{json(obj)}}', { obj })).toBe('{"name":"John","age":30}');
        expect(render('{{json(obj, 2)}}', { obj })).toContain('  "name": "John"');
      });

      it('应该处理循环引用', () => {
        const obj: any = { name: 'John' };
        obj.self = obj;
        expect(render('{{json(obj)}}', { obj })).toBe('');
      });
    });
  });

  describe('registerHelper', () => {
    it('应该注册自定义辅助函数', () => {
      registerHelper('uppercase', (str: string) => str.toUpperCase());
      
      const helpers = getHelpers();
      expect(helpers.uppercase).toBeDefined();
      
      const result = render('{{uppercase("hello")}}', {});
      expect(result).toBe('HELLO');
    });

    it('应该覆盖现有辅助函数', () => {
      const originalLength = getHelpers().length;
      
      registerHelper('length', () => 'custom length');
      
      const result = render('{{length([1, 2, 3])}}', {});
      expect(result).toBe('custom length');
      
      // 恢复原始函数
      registerHelper('length', originalLength);
    });
  });

  describe('createRenderer', () => {
    it('应该创建带自定义辅助函数的渲染器', () => {
      const renderer = createRenderer({
        double: (n: number) => n * 2,
        triple: (n: number) => n * 3,
      });
      
      expect(renderer.render('{{double(5)}}', {})).toBe('10');
      expect(renderer.render('{{triple(5)}}', {})).toBe('15');
    });

    it('应该保留全局辅助函数', () => {
      const renderer = createRenderer();
      
      // 应该能使用全局辅助函数
      expect(renderer.render('{{formatNumber(3.14159, 2)}}', {})).toBe('3.14');
    });

    it('应该支持求值表达式', () => {
      const renderer = createRenderer({
        isEven: (n: number) => n % 2 === 0,
      });
      
      expect(renderer.evaluate('isEven(4)', {})).toBe(true);
      expect(renderer.evaluate('isEven(5)', {})).toBe(false);
    });
  });

  describe('复杂场景', () => {
    it('应该处理嵌套模板和辅助函数', () => {
      const template = '{{#each orders}}Order #{{item.orderId}}{{/each}}';
      
      const data = {
        orders: [
          {
            orderId: '001',
            date: new Date('2024-01-15'),
            items: [
              { name: 'Item A', price: 10, quantity: 2 },
              { name: 'Item B', price: 20, quantity: 1 },
            ],
          },
        ],
      };
      
      const result = render(template, data);
      expect(result).toContain('Order #001');
    });

    it('应该处理条件逻辑和计算', () => {
      const template = '{{#if score >= 90}}Grade: A{{/if}}';
      
      expect(render(template, { score: 95 })).toContain('Grade: A');
    });
  });
});