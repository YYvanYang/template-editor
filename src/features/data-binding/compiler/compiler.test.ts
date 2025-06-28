import { describe, it, expect, beforeEach } from 'vitest';
import { Compiler } from './compiler';
import type { BindingContext } from '../types/binding.types';

describe('Compiler', () => {
  let compiler: Compiler;

  beforeEach(() => {
    compiler = new Compiler();
  });

  describe('compile', () => {
    it('应该编译简单模板', () => {
      const result = compiler.compile('Hello {{name}}');
      
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(result.dependencies).toEqual(['name']);
      
      const context: BindingContext = { data: { name: 'World' } };
      expect(result.render(context)).toBe('Hello World');
    });

    it('应该编译复杂模板', () => {
      const template = 'User: {{user.name}}, Age: {{user.age}}, Status: {{getStatus(user.active)}}';
      const result = compiler.compile(template);
      
      expect(result.errors).toHaveLength(0);
      expect(result.dependencies).toContain('user');
      expect(result.dependencies).toContain('getStatus');
      
      const context: BindingContext = {
        data: {
          user: { name: 'John', age: 30, active: true },
          getStatus: (active: boolean) => active ? 'Active' : 'Inactive',
        },
      };
      expect(result.render(context)).toBe('User: John, Age: 30, Status: Active');
    });

    it('应该处理编译错误', () => {
      const result = compiler.compile('{{invalid expression}}');
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('syntax');
      expect(result.render({ data: {} })).toBe('');
    });

    it('应该缓存编译结果', () => {
      const template = '{{name}}';
      
      // 第一次编译
      const result1 = compiler.compile(template);
      
      // 第二次编译（应该从缓存返回）
      const result2 = compiler.compile(template);
      
      // 应该是同一个对象
      expect(result1).toBe(result2);
    });

    it('应该支持禁用缓存', () => {
      const template = '{{name}}';
      
      const result1 = compiler.compile(template, { cache: false });
      const result2 = compiler.compile(template, { cache: false });
      
      // 应该是不同的对象
      expect(result1).not.toBe(result2);
    });

    it('应该提取正确的依赖', () => {
      const cases = [
        { template: '{{a}}', deps: ['a'] },
        { template: '{{a.b}}', deps: ['a'] },
        { template: '{{a[b]}}', deps: ['a', 'b'] },
        { template: '{{fn(a, b)}}', deps: ['fn', 'a', 'b'] },
        { template: '{{a + b}}', deps: ['a', 'b'] },
        { template: '{{a ? b : c}}', deps: ['a', 'b', 'c'] },
        { template: '{{[a, b]}}', deps: ['a', 'b'] },
        { template: '{{obj[key]}}', deps: ['obj', 'key'] },
      ];
      
      cases.forEach(({ template, deps }) => {
        const result = compiler.compile(template);
        expect(result.dependencies).toEqual(expect.arrayContaining(deps));
      });
    });
  });

  describe('compileExpression', () => {
    it('应该编译表达式', () => {
      const result = compiler.compileExpression('a + b');
      
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(result.dependencies).toEqual(['a', 'b']);
      
      const context: BindingContext = { data: { a: 2, b: 3 } };
      expect(result.evaluate(context)).toBe(5);
    });

    it('应该处理表达式错误', () => {
      const result = compiler.compileExpression('invalid expression');
      
      expect(result.errors).toHaveLength(1);
      expect(result.evaluate({ data: {} })).toBe(undefined);
    });

    it('应该求值复杂表达式', () => {
      const expr = 'user.name.toUpperCase() + " - " + user.age';
      const result = compiler.compileExpression(expr);
      
      const context: BindingContext = {
        data: {
          user: { name: 'John', age: 30 },
        },
      };
      
      expect(result.evaluate(context)).toBe('JOHN - 30');
    });
  });

  describe('缓存管理', () => {
    it('应该正确管理缓存大小', () => {
      const smallCompiler = new Compiler(2); // 缓存大小限制为 2
      
      // 编译三个不同的模板
      smallCompiler.compile('{{a}}');
      smallCompiler.compile('{{b}}');
      const result3 = smallCompiler.compile('{{c}}');
      
      // 第一个应该被驱逐
      const result1Again = smallCompiler.compile('{{a}}');
      const result3Again = smallCompiler.compile('{{c}}');
      
      // result3 应该还在缓存中
      expect(result3).toBe(result3Again);
      // result1 应该是新编译的
      expect(result1Again).toBeDefined();
    });

    it('应该能清除缓存', () => {
      const template = '{{name}}';
      
      const result1 = compiler.compile(template);
      compiler.clearCache();
      const result2 = compiler.compile(template);
      
      // 清除缓存后应该是不同的对象
      expect(result1).not.toBe(result2);
    });
  });

  describe('模板指令', () => {
    it('应该编译 if 指令', () => {
      const template = '{{#if show}}Visible{{/if}}';
      const result = compiler.compile(template);
      
      expect(result.render({ data: { show: true } })).toBe('Visible');
      expect(result.render({ data: { show: false } })).toBe('');
    });

    it('应该编译 if-else 指令', () => {
      const template = '{{#if active}}Active{{else}}Inactive{{/if}}';
      const result = compiler.compile(template);
      
      expect(result.render({ data: { active: true } })).toBe('Active');
      expect(result.render({ data: { active: false } })).toBe('Inactive');
    });

    it('应该编译 unless 指令', () => {
      const template = '{{#unless hidden}}Show this{{/unless}}';
      const result = compiler.compile(template);
      
      expect(result.render({ data: { hidden: false } })).toBe('Show this');
      expect(result.render({ data: { hidden: true } })).toBe('');
    });

    it('应该编译 each 指令', () => {
      const template = '{{#each items}}{{item}}{{/each}}';
      const result = compiler.compile(template);
      
      const context: BindingContext = {
        data: { items: ['a', 'b', 'c'] },
      };
      expect(result.render(context)).toBe('abc');
    });

    it('应该编译带索引的 each 指令', () => {
      const template = '{{#each items as value, idx}}{{idx}}:{{value}} {{/each}}';
      const result = compiler.compile(template);
      
      const context: BindingContext = {
        data: { items: ['a', 'b', 'c'] },
      };
      expect(result.render(context)).toBe('0:a 1:b 2:c ');
    });

    it('应该编译 with 指令', () => {
      const template = '{{#with user}}Name: {{name}}, Age: {{age}}{{/with}}';
      const result = compiler.compile(template);
      
      const context: BindingContext = {
        data: { user: { name: 'John', age: 30 } },
      };
      expect(result.render(context)).toBe('Name: John, Age: 30');
    });

    it('应该处理嵌套指令', () => {
      const template = '{{#each users}}{{#if item.active}}{{item.name}} {{/if}}{{/each}}';
      const result = compiler.compile(template);
      
      const context: BindingContext = {
        data: {
          users: [
            { name: 'John', active: true },
            { name: 'Jane', active: false },
            { name: 'Bob', active: true },
          ],
        },
      };
      expect(result.render(context)).toBe('John Bob ');
    });
  });

  describe('运行时错误处理', () => {
    it('应该捕获运行时错误', () => {
      const result = compiler.compile('{{fn()}}');
      const context: BindingContext = { data: { fn: 'not a function' } };
      
      expect(() => result.render(context)).toThrow('Runtime error');
    });

    it('应该提供有用的错误信息', () => {
      const result = compiler.compile('{{obj.method()}}');
      const context: BindingContext = { data: { obj: null } };
      
      expect(() => result.render(context)).toThrow('Runtime error');
    });
  });
});