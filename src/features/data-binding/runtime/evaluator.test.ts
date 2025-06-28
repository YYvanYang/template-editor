import { describe, it, expect } from 'vitest';
import { Parser } from '../parser/parser';
import { Evaluator } from './evaluator';
import type { BindingContext } from '../types/binding.types';

describe('Evaluator', () => {
  const parser = new Parser();
  const evaluator = new Evaluator();

  const evaluate = (expression: string, data: Record<string, any> = {}, helpers?: Record<string, Function>) => {
    const ast = parser.parseExpression(expression);
    const context: BindingContext = { data, helpers };
    return evaluator.evaluate(ast, context);
  };

  const evaluateTemplate = (template: string, data: Record<string, any> = {}, helpers?: Record<string, Function>) => {
    const ast = parser.parseTemplate(template);
    const context: BindingContext = { data, helpers };
    return evaluator.evaluate(ast, context);
  };

  describe('字面量求值', () => {
    it('应该求值数字字面量', () => {
      expect(evaluate('42')).toBe(42);
      expect(evaluate('3.14')).toBe(3.14);
    });

    it('应该求值字符串字面量', () => {
      expect(evaluate('"hello"')).toBe('hello');
      expect(evaluate("'world'")).toBe('world');
    });

    it('应该求值布尔字面量', () => {
      expect(evaluate('true')).toBe(true);
      expect(evaluate('false')).toBe(false);
    });

    it('应该求值 null 和 undefined', () => {
      expect(evaluate('null')).toBe(null);
      expect(evaluate('undefined')).toBe(undefined);
    });
  });

  describe('标识符求值', () => {
    it('应该从上下文获取值', () => {
      expect(evaluate('name', { name: 'John' })).toBe('John');
      expect(evaluate('age', { age: 30 })).toBe(30);
    });

    it('应该返回 undefined 对于未定义的标识符', () => {
      expect(evaluate('unknown', {})).toBe(undefined);
    });

    it('应该从辅助函数中查找', () => {
      const helpers = { PI: 3.14159 };
      expect(evaluate('PI', {}, helpers)).toBe(3.14159);
    });

    it('应该支持父上下文查找', () => {
      const parentContext: BindingContext = { data: { global: 'value' } };
      const context: BindingContext = { data: { local: 'value' }, parent: parentContext };
      const ast = parser.parseExpression('global');
      expect(evaluator.evaluate(ast, context)).toBe('value');
    });
  });

  describe('成员访问求值', () => {
    it('应该求值点号访问', () => {
      const data = { user: { name: 'John', age: 30 } };
      expect(evaluate('user.name', data)).toBe('John');
      expect(evaluate('user.age', data)).toBe(30);
    });

    it('应该求值嵌套访问', () => {
      const data = { 
        company: { 
          address: { 
            city: 'Beijing',
            country: 'China' 
          } 
        } 
      };
      expect(evaluate('company.address.city', data)).toBe('Beijing');
      expect(evaluate('company.address.country', data)).toBe('China');
    });

    it('应该求值计算访问', () => {
      const data = { 
        items: ['apple', 'banana', 'orange'],
        obj: { key1: 'value1', key2: 'value2' }
      };
      expect(evaluate('items[0]', data)).toBe('apple');
      expect(evaluate('items[1]', data)).toBe('banana');
      expect(evaluate('obj["key1"]', data)).toBe('value1');
    });

    it('应该求值动态访问', () => {
      const data = { 
        obj: { name: 'John' },
        key: 'name'
      };
      expect(evaluate('obj[key]', data)).toBe('John');
    });

    it('应该安全处理 null 和 undefined', () => {
      expect(evaluate('null.property', {})).toBe(undefined);
      expect(evaluate('undefined.property', {})).toBe(undefined);
      expect(evaluate('unknown.property', {})).toBe(undefined);
    });
  });

  describe('函数调用求值', () => {
    it('应该调用无参数函数', () => {
      const data = {
        getName: () => 'John',
      };
      expect(evaluate('getName()', data)).toBe('John');
    });

    it('应该调用带参数函数', () => {
      const data = {
        add: (a: number, b: number) => a + b,
      };
      expect(evaluate('add(2, 3)', data)).toBe(5);
    });

    it('应该调用辅助函数', () => {
      const helpers = {
        toUpper: (str: string) => str.toUpperCase(),
      };
      expect(evaluate('toUpper("hello")', {}, helpers)).toBe('HELLO');
    });

    it('应该正确绑定 this', () => {
      const data = {
        name: 'John',
        greet: function(this: any) { return `Hello, ${this.name}`; },
      };
      expect(evaluate('greet()', data)).toBe('Hello, John');
    });

    it('应该处理链式调用', () => {
      const data = {
        str: 'hello world',
      };
      expect(evaluate('str.toUpperCase()', data)).toBe('HELLO WORLD');
    });

    it('应该在非函数调用时抛出错误', () => {
      expect(() => evaluate('notAFunction()', { notAFunction: 'string' }))
        .toThrow('is not a function');
    });
  });

  describe('二元运算求值', () => {
    it('应该求值算术运算', () => {
      expect(evaluate('2 + 3')).toBe(5);
      expect(evaluate('10 - 4')).toBe(6);
      expect(evaluate('3 * 4')).toBe(12);
      expect(evaluate('15 / 3')).toBe(5);
      expect(evaluate('10 % 3')).toBe(1);
    });

    it('应该求值比较运算', () => {
      expect(evaluate('5 > 3')).toBe(true);
      expect(evaluate('3 < 5')).toBe(true);
      expect(evaluate('5 >= 5')).toBe(true);
      expect(evaluate('3 <= 5')).toBe(true);
      expect(evaluate('5 == "5"')).toBe(true);
      expect(evaluate('5 === "5"')).toBe(false);
      expect(evaluate('5 != 3')).toBe(true);
      expect(evaluate('5 !== "5"')).toBe(true);
    });

    it('应该求值逻辑运算', () => {
      expect(evaluate('true && true')).toBe(true);
      expect(evaluate('true && false')).toBe(false);
      expect(evaluate('true || false')).toBe(true);
      expect(evaluate('false || false')).toBe(false);
    });

    it('应该正确处理短路求值', () => {
      const data = {
        a: null,
        b: { value: 'test' },
      };
      expect(evaluate('a && a.value', data)).toBe(null);
      expect(evaluate('b && b.value', data)).toBe('test');
      expect(evaluate('a || b', data)).toEqual({ value: 'test' });
    });

    it('应该求值 in 运算符', () => {
      const data = { obj: { name: 'John' } };
      expect(evaluate('"name" in obj', data)).toBe(true);
      expect(evaluate('"age" in obj', data)).toBe(false);
    });

    it('应该使用变量进行运算', () => {
      const data = { a: 10, b: 5 };
      expect(evaluate('a + b', data)).toBe(15);
      expect(evaluate('a * b', data)).toBe(50);
      expect(evaluate('a > b', data)).toBe(true);
    });
  });

  describe('一元运算求值', () => {
    it('应该求值逻辑非', () => {
      expect(evaluate('!true')).toBe(false);
      expect(evaluate('!false')).toBe(true);
      expect(evaluate('!0')).toBe(true);
      expect(evaluate('!1')).toBe(false);
    });

    it('应该求值负号', () => {
      expect(evaluate('-5')).toBe(-5);
      expect(evaluate('-(-10)')).toBe(10);
    });

    it('应该求值正号', () => {
      expect(evaluate('+5')).toBe(5);
      expect(evaluate('+"5"')).toBe(5);
    });

    it('应该求值 typeof', () => {
      expect(evaluate('typeof 42')).toBe('number');
      expect(evaluate('typeof "hello"')).toBe('string');
      expect(evaluate('typeof true')).toBe('boolean');
      expect(evaluate('typeof undefined')).toBe('undefined');
      expect(evaluate('typeof null')).toBe('object');
    });
  });

  describe('条件表达式求值', () => {
    it('应该求值三元运算符', () => {
      expect(evaluate('true ? "yes" : "no"')).toBe('yes');
      expect(evaluate('false ? "yes" : "no"')).toBe('no');
    });

    it('应该使用变量条件', () => {
      const data = { age: 20 };
      expect(evaluate('age >= 18 ? "adult" : "minor"', data)).toBe('adult');
      
      data.age = 15;
      expect(evaluate('age >= 18 ? "adult" : "minor"', data)).toBe('minor');
    });

    it('应该支持嵌套条件', () => {
      const data = { score: 85 };
      const expr = 'score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "D"';
      expect(evaluate(expr, data)).toBe('B');
    });
  });

  describe('数组和对象求值', () => {
    it('应该求值数组字面量', () => {
      expect(evaluate('[1, 2, 3]')).toEqual([1, 2, 3]);
      expect(evaluate('[]')).toEqual([]);
    });

    it('应该求值带变量的数组', () => {
      const data = { a: 1, b: 2 };
      expect(evaluate('[a, b, a + b]', data)).toEqual([1, 2, 3]);
    });

    it('应该求值对象字面量', () => {
      expect(evaluate('{ name: "John", age: 30 }')).toEqual({ name: 'John', age: 30 });
      expect(evaluate('{}')).toEqual({});
    });

    it('应该求值带变量的对象', () => {
      const data = { name: 'John', age: 30 };
      expect(evaluate('{ user: name, years: age }', data)).toEqual({ user: 'John', years: 30 });
    });

    it('应该求值计算属性名', () => {
      const data = { key: 'dynamicKey', value: 'test' };
      expect(evaluate('{ [key]: value }', data)).toEqual({ dynamicKey: 'test' });
    });
  });

  describe('模板求值', () => {
    it('应该求值纯文本', () => {
      expect(evaluateTemplate('Hello World')).toBe('Hello World');
    });

    it('应该求值简单插值', () => {
      expect(evaluateTemplate('Hello {{name}}', { name: 'John' })).toBe('Hello John');
    });

    it('应该求值多个插值', () => {
      const data = { first: 'John', last: 'Doe' };
      expect(evaluateTemplate('{{first}} {{last}}', data)).toBe('John Doe');
    });

    it('应该求值复杂表达式', () => {
      const data = { price: 100, quantity: 2 };
      expect(evaluateTemplate('Total: {{price * quantity}}', data)).toBe('Total: 200');
    });

    it('应该将非字符串值转换为字符串', () => {
      expect(evaluateTemplate('Number: {{value}}', { value: 42 })).toBe('Number: 42');
      expect(evaluateTemplate('Boolean: {{value}}', { value: true })).toBe('Boolean: true');
      expect(evaluateTemplate('Null: {{value}}', { value: null })).toBe('Null: ');
      expect(evaluateTemplate('Undefined: {{value}}', { value: undefined })).toBe('Undefined: ');
    });

    it('应该处理对象和数组的字符串化', () => {
      expect(evaluateTemplate('Object: {{obj}}', { obj: { a: 1 } })).toBe('Object: {"a":1}');
      expect(evaluateTemplate('Array: {{arr}}', { arr: [1, 2, 3] })).toBe('Array: [1,2,3]');
    });
  });

  describe('复杂场景', () => {
    it('应该处理复杂的嵌套数据', () => {
      const data = {
        users: [
          { name: 'John', age: 30, active: true },
          { name: 'Jane', age: 25, active: false },
          { name: 'Bob', age: 35, active: true },
        ],
        getStatus: (active: boolean) => active ? 'Active' : 'Inactive',
      };

      expect(evaluate('users[0].name', data)).toBe('John');
      expect(evaluate('users[1].age', data)).toBe(25);
      expect(evaluate('getStatus(users[2].active)', data)).toBe('Active');
    });

    it('应该处理方法链和属性访问的组合', () => {
      const data = {
        text: '  hello world  ',
        numbers: [1, 2, 3, 4, 5],
      };

      expect(evaluate('text.trim().toUpperCase()', data)).toBe('HELLO WORLD');
      expect(evaluate('numbers.length', data)).toBe(5);
    });
  });
});