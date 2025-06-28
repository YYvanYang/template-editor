import { describe, it, expect } from 'vitest';
import { Parser } from './parser';
import type { ExpressionNode, TemplateNode } from '../types/binding.types';

describe('Parser', () => {
  const parser = new Parser();

  describe('parseExpression', () => {
    describe('字面量', () => {
      it('应该解析数字字面量', () => {
        const ast = parser.parseExpression('42');
        expect(ast).toMatchObject({
          type: 'literal',
          value: 42,
          raw: '42',
        });
      });

      it('应该解析字符串字面量', () => {
        const ast = parser.parseExpression('"hello"');
        expect(ast).toMatchObject({
          type: 'literal',
          value: 'hello',
          raw: '"hello"',
        });
      });

      it('应该解析布尔字面量', () => {
        const ast = parser.parseExpression('true');
        expect(ast).toMatchObject({
          type: 'literal',
          value: true,
          raw: 'true',
        });
      });

      it('应该解析 null 字面量', () => {
        const ast = parser.parseExpression('null');
        expect(ast).toMatchObject({
          type: 'literal',
          value: null,
          raw: 'null',
        });
      });
    });

    describe('标识符', () => {
      it('应该解析标识符', () => {
        const ast = parser.parseExpression('name');
        expect(ast).toMatchObject({
          type: 'identifier',
          name: 'name',
        });
      });
    });

    describe('成员访问', () => {
      it('应该解析点号成员访问', () => {
        const ast = parser.parseExpression('user.name');
        expect(ast).toMatchObject({
          type: 'member',
          object: { type: 'identifier', name: 'user' },
          property: { type: 'identifier', name: 'name' },
          computed: false,
        });
      });

      it('应该解析嵌套成员访问', () => {
        const ast = parser.parseExpression('user.address.city');
        expect(ast).toMatchObject({
          type: 'member',
          object: {
            type: 'member',
            object: { type: 'identifier', name: 'user' },
            property: { type: 'identifier', name: 'address' },
            computed: false,
          },
          property: { type: 'identifier', name: 'city' },
          computed: false,
        });
      });

      it('应该解析计算成员访问', () => {
        const ast = parser.parseExpression('items[0]');
        expect(ast).toMatchObject({
          type: 'member',
          object: { type: 'identifier', name: 'items' },
          property: { type: 'literal', value: 0 },
          computed: true,
        });
      });

      it('应该解析动态成员访问', () => {
        const ast = parser.parseExpression('obj[key]');
        expect(ast).toMatchObject({
          type: 'member',
          object: { type: 'identifier', name: 'obj' },
          property: { type: 'identifier', name: 'key' },
          computed: true,
        });
      });
    });

    describe('函数调用', () => {
      it('应该解析无参数函数调用', () => {
        const ast = parser.parseExpression('getName()');
        expect(ast).toMatchObject({
          type: 'call',
          callee: { type: 'identifier', name: 'getName' },
          arguments: [],
        });
      });

      it('应该解析带参数函数调用', () => {
        const ast = parser.parseExpression('add(1, 2)');
        expect(ast).toMatchObject({
          type: 'call',
          callee: { type: 'identifier', name: 'add' },
          arguments: [
            { type: 'literal', value: 1 },
            { type: 'literal', value: 2 },
          ],
        });
      });

      it('应该解析链式调用', () => {
        const ast = parser.parseExpression('str.toUpperCase().trim()');
        expect(ast).toMatchObject({
          type: 'call',
          callee: {
            type: 'member',
            object: {
              type: 'call',
              callee: {
                type: 'member',
                object: { type: 'identifier', name: 'str' },
                property: { type: 'identifier', name: 'toUpperCase' },
              },
              arguments: [],
            },
            property: { type: 'identifier', name: 'trim' },
          },
          arguments: [],
        });
      });
    });

    describe('二元运算', () => {
      it('应该解析算术运算', () => {
        const ast = parser.parseExpression('a + b * c');
        expect(ast).toMatchObject({
          type: 'binary',
          operator: '+',
          left: { type: 'identifier', name: 'a' },
          right: {
            type: 'binary',
            operator: '*',
            left: { type: 'identifier', name: 'b' },
            right: { type: 'identifier', name: 'c' },
          },
        });
      });

      it('应该解析比较运算', () => {
        const ast = parser.parseExpression('age >= 18');
        expect(ast).toMatchObject({
          type: 'binary',
          operator: '>=',
          left: { type: 'identifier', name: 'age' },
          right: { type: 'literal', value: 18 },
        });
      });

      it('应该解析逻辑运算', () => {
        const ast = parser.parseExpression('a && b || c');
        expect(ast).toMatchObject({
          type: 'binary',
          operator: '||',
          left: {
            type: 'binary',
            operator: '&&',
            left: { type: 'identifier', name: 'a' },
            right: { type: 'identifier', name: 'b' },
          },
          right: { type: 'identifier', name: 'c' },
        });
      });

      it('应该正确处理运算符优先级', () => {
        const ast = parser.parseExpression('a + b * c - d / e');
        // 应该解析为: (a + (b * c)) - (d / e)
        expect(ast).toMatchObject({
          type: 'binary',
          operator: '-',
          left: {
            type: 'binary',
            operator: '+',
            left: { type: 'identifier', name: 'a' },
            right: {
              type: 'binary',
              operator: '*',
              left: { type: 'identifier', name: 'b' },
              right: { type: 'identifier', name: 'c' },
            },
          },
          right: {
            type: 'binary',
            operator: '/',
            left: { type: 'identifier', name: 'd' },
            right: { type: 'identifier', name: 'e' },
          },
        });
      });
    });

    describe('一元运算', () => {
      it('应该解析逻辑非', () => {
        const ast = parser.parseExpression('!active');
        expect(ast).toMatchObject({
          type: 'unary',
          operator: '!',
          argument: { type: 'identifier', name: 'active' },
        });
      });

      it('应该解析负号', () => {
        const ast = parser.parseExpression('-value');
        expect(ast).toMatchObject({
          type: 'unary',
          operator: '-',
          argument: { type: 'identifier', name: 'value' },
        });
      });

      it('应该解析连续一元运算', () => {
        const ast = parser.parseExpression('!!value');
        expect(ast).toMatchObject({
          type: 'unary',
          operator: '!',
          argument: {
            type: 'unary',
            operator: '!',
            argument: { type: 'identifier', name: 'value' },
          },
        });
      });
    });

    describe('条件表达式', () => {
      it('应该解析三元运算符', () => {
        const ast = parser.parseExpression('age >= 18 ? "adult" : "minor"');
        expect(ast).toMatchObject({
          type: 'conditional',
          test: {
            type: 'binary',
            operator: '>=',
            left: { type: 'identifier', name: 'age' },
            right: { type: 'literal', value: 18 },
          },
          consequent: { type: 'literal', value: 'adult' },
          alternate: { type: 'literal', value: 'minor' },
        });
      });

      it('应该解析嵌套条件表达式', () => {
        const ast = parser.parseExpression('a ? b : c ? d : e');
        expect(ast).toMatchObject({
          type: 'conditional',
          test: { type: 'identifier', name: 'a' },
          consequent: { type: 'identifier', name: 'b' },
          alternate: {
            type: 'conditional',
            test: { type: 'identifier', name: 'c' },
            consequent: { type: 'identifier', name: 'd' },
            alternate: { type: 'identifier', name: 'e' },
          },
        });
      });
    });

    describe('数组和对象', () => {
      it('应该解析数组字面量', () => {
        const ast = parser.parseExpression('[1, 2, 3]');
        expect(ast).toMatchObject({
          type: 'array',
          elements: [
            { type: 'literal', value: 1 },
            { type: 'literal', value: 2 },
            { type: 'literal', value: 3 },
          ],
        });
      });

      it('应该解析空数组', () => {
        const ast = parser.parseExpression('[]');
        expect(ast).toMatchObject({
          type: 'array',
          elements: [],
        });
      });

      it('应该解析对象字面量', () => {
        const ast = parser.parseExpression('{ name: "John", age: 30 }');
        expect(ast).toMatchObject({
          type: 'object',
          properties: [
            {
              key: { type: 'identifier', name: 'name' },
              value: { type: 'literal', value: 'John' },
              computed: false,
              shorthand: false,
            },
            {
              key: { type: 'identifier', name: 'age' },
              value: { type: 'literal', value: 30 },
              computed: false,
              shorthand: false,
            },
          ],
        });
      });

      it('应该解析带字符串键的对象', () => {
        const ast = parser.parseExpression('{ "first-name": "John" }');
        expect(ast).toMatchObject({
          type: 'object',
          properties: [
            {
              key: { type: 'literal', value: 'first-name' },
              value: { type: 'literal', value: 'John' },
              computed: false,
              shorthand: false,
            },
          ],
        });
      });

      it('应该解析计算属性名', () => {
        const ast = parser.parseExpression('{ [key]: value }');
        expect(ast).toMatchObject({
          type: 'object',
          properties: [
            {
              key: { type: 'identifier', name: 'key' },
              value: { type: 'identifier', name: 'value' },
              computed: true,
              shorthand: false,
            },
          ],
        });
      });
    });

    describe('分组表达式', () => {
      it('应该正确处理括号', () => {
        const ast = parser.parseExpression('(a + b) * c');
        expect(ast).toMatchObject({
          type: 'binary',
          operator: '*',
          left: {
            type: 'binary',
            operator: '+',
            left: { type: 'identifier', name: 'a' },
            right: { type: 'identifier', name: 'b' },
          },
          right: { type: 'identifier', name: 'c' },
        });
      });
    });

    describe('复杂表达式', () => {
      it('应该解析复杂的混合表达式', () => {
        const ast = parser.parseExpression(
          'user.address.city.toUpperCase().trim()'
        );
        expect(ast).toMatchObject({
          type: 'call',
          callee: {
            type: 'member',
            object: {
              type: 'call',
              callee: {
                type: 'member',
                object: {
                  type: 'member',
                  object: {
                    type: 'member',
                    object: { type: 'identifier', name: 'user' },
                    property: { type: 'identifier', name: 'address' },
                  },
                  property: { type: 'identifier', name: 'city' },
                },
                property: { type: 'identifier', name: 'toUpperCase' },
              },
              arguments: [],
            },
            property: { type: 'identifier', name: 'trim' },
          },
          arguments: [],
        });
      });
    });
  });

  describe('parseTemplate', () => {
    it('应该解析纯文本模板', () => {
      const ast = parser.parseTemplate('Hello World');
      expect(ast).toMatchObject({
        type: 'template',
        expressions: ['Hello World'],
      });
    });

    it('应该解析简单插值', () => {
      const ast = parser.parseTemplate('Hello {{name}}');
      expect(ast).toMatchObject({
        type: 'template',
        expressions: [
          'Hello ',
          { type: 'identifier', name: 'name' },
        ],
      });
    });

    it('应该解析多个插值', () => {
      const ast = parser.parseTemplate('{{greeting}}, {{name}}!');
      expect(ast).toMatchObject({
        type: 'template',
        expressions: [
          { type: 'identifier', name: 'greeting' },
          ', ',
          { type: 'identifier', name: 'name' },
          '!',
        ],
      });
    });

    it('应该解析复杂表达式插值', () => {
      const ast = parser.parseTemplate('Price: {{formatCurrency(price * quantity)}}');
      expect(ast).toMatchObject({
        type: 'template',
        expressions: [
          'Price: ',
          {
            type: 'call',
            callee: { type: 'identifier', name: 'formatCurrency' },
            arguments: [
              {
                type: 'binary',
                operator: '*',
                left: { type: 'identifier', name: 'price' },
                right: { type: 'identifier', name: 'quantity' },
              },
            ],
          },
        ],
      });
    });
  });

  describe('错误处理', () => {
    it('应该在意外 token 时抛出错误', () => {
      expect(() => parser.parseExpression('a +')).toThrow('Expected expression');
    });

    it('应该在缺少闭合括号时抛出错误', () => {
      expect(() => parser.parseExpression('(a + b')).toThrow('Expected ) after expression');
    });

    it('应该在缺少数组闭合括号时抛出错误', () => {
      expect(() => parser.parseExpression('[1, 2')).toThrow('Expected ] after array elements');
    });

    it('应该在缺少对象闭合括号时抛出错误', () => {
      expect(() => parser.parseExpression('{ a: 1')).toThrow('Expected } after object properties');
    });

    it('应该在缺少冒号时抛出错误', () => {
      expect(() => parser.parseExpression('a ? b')).toThrow('Expected : after consequent');
    });
  });
});