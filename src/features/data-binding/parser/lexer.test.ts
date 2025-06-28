import { describe, it, expect } from 'vitest';
import { Lexer, TokenType } from './lexer';

describe('Lexer', () => {
  describe('字面量', () => {
    it('应该正确解析数字', () => {
      const lexer = new Lexer('42 3.14 0.5');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.NUMBER, value: '42' });
      expect(tokens[1]).toMatchObject({ type: TokenType.NUMBER, value: '3.14' });
      expect(tokens[2]).toMatchObject({ type: TokenType.NUMBER, value: '0.5' });
    });

    it('应该正确解析字符串', () => {
      const lexer = new Lexer('"hello" \'world\'');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.STRING, value: 'hello' });
      expect(tokens[1]).toMatchObject({ type: TokenType.STRING, value: 'world' });
    });

    it('应该处理转义字符', () => {
      const lexer = new Lexer('"hello\\nworld" "quote\\"test"');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.STRING, value: 'hello\nworld' });
      expect(tokens[1]).toMatchObject({ type: TokenType.STRING, value: 'quote"test' });
    });

    it('应该正确解析布尔值', () => {
      const lexer = new Lexer('true false');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.BOOLEAN, value: 'true' });
      expect(tokens[1]).toMatchObject({ type: TokenType.BOOLEAN, value: 'false' });
    });

    it('应该正确解析 null 和 undefined', () => {
      const lexer = new Lexer('null undefined');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.NULL, value: 'null' });
      expect(tokens[1]).toMatchObject({ type: TokenType.UNDEFINED, value: 'undefined' });
    });
  });

  describe('标识符', () => {
    it('应该正确解析标识符', () => {
      const lexer = new Lexer('name $var _private camelCase');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'name' });
      expect(tokens[1]).toMatchObject({ type: TokenType.IDENTIFIER, value: '$var' });
      expect(tokens[2]).toMatchObject({ type: TokenType.IDENTIFIER, value: '_private' });
      expect(tokens[3]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'camelCase' });
    });
  });

  describe('运算符', () => {
    it('应该正确解析算术运算符', () => {
      const lexer = new Lexer('+ - * / %');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.PLUS });
      expect(tokens[1]).toMatchObject({ type: TokenType.MINUS });
      expect(tokens[2]).toMatchObject({ type: TokenType.MULTIPLY });
      expect(tokens[3]).toMatchObject({ type: TokenType.DIVIDE });
      expect(tokens[4]).toMatchObject({ type: TokenType.MODULO });
    });

    it('应该正确解析比较运算符', () => {
      const lexer = new Lexer('== != === !== < > <= >=');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.EQUAL });
      expect(tokens[1]).toMatchObject({ type: TokenType.NOT_EQUAL });
      expect(tokens[2]).toMatchObject({ type: TokenType.STRICT_EQUAL });
      expect(tokens[3]).toMatchObject({ type: TokenType.STRICT_NOT_EQUAL });
      expect(tokens[4]).toMatchObject({ type: TokenType.LESS_THAN });
      expect(tokens[5]).toMatchObject({ type: TokenType.GREATER_THAN });
      expect(tokens[6]).toMatchObject({ type: TokenType.LESS_EQUAL });
      expect(tokens[7]).toMatchObject({ type: TokenType.GREATER_EQUAL });
    });

    it('应该正确解析逻辑运算符', () => {
      const lexer = new Lexer('&& || !');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.AND });
      expect(tokens[1]).toMatchObject({ type: TokenType.OR });
      expect(tokens[2]).toMatchObject({ type: TokenType.NOT });
    });
  });

  describe('括号和分隔符', () => {
    it('应该正确解析括号', () => {
      const lexer = new Lexer('( ) [ ] { }');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.LEFT_PAREN });
      expect(tokens[1]).toMatchObject({ type: TokenType.RIGHT_PAREN });
      expect(tokens[2]).toMatchObject({ type: TokenType.LEFT_BRACKET });
      expect(tokens[3]).toMatchObject({ type: TokenType.RIGHT_BRACKET });
      expect(tokens[4]).toMatchObject({ type: TokenType.LEFT_BRACE });
      expect(tokens[5]).toMatchObject({ type: TokenType.RIGHT_BRACE });
    });

    it('应该正确解析分隔符', () => {
      const lexer = new Lexer('. , : ? #');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.DOT });
      expect(tokens[1]).toMatchObject({ type: TokenType.COMMA });
      expect(tokens[2]).toMatchObject({ type: TokenType.COLON });
      expect(tokens[3]).toMatchObject({ type: TokenType.QUESTION });
      expect(tokens[4]).toMatchObject({ type: TokenType.HASH });
    });
  });

  describe('模板标记', () => {
    it('应该正确解析模板标记', () => {
      const lexer = new Lexer('{{ }}');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.TEMPLATE_START });
      expect(tokens[1]).toMatchObject({ type: TokenType.TEMPLATE_END });
    });
  });

  describe('复杂表达式', () => {
    it('应该正确解析成员访问', () => {
      const lexer = new Lexer('user.name');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'user' });
      expect(tokens[1]).toMatchObject({ type: TokenType.DOT });
      expect(tokens[2]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'name' });
    });

    it('应该正确解析函数调用', () => {
      const lexer = new Lexer('formatDate(date, "YYYY-MM-DD")');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'formatDate' });
      expect(tokens[1]).toMatchObject({ type: TokenType.LEFT_PAREN });
      expect(tokens[2]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'date' });
      expect(tokens[3]).toMatchObject({ type: TokenType.COMMA });
      expect(tokens[4]).toMatchObject({ type: TokenType.STRING, value: 'YYYY-MM-DD' });
      expect(tokens[5]).toMatchObject({ type: TokenType.RIGHT_PAREN });
    });

    it('应该正确解析数组访问', () => {
      const lexer = new Lexer('items[0]');
      const tokens = lexer.tokenize();
      
      expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'items' });
      expect(tokens[1]).toMatchObject({ type: TokenType.LEFT_BRACKET });
      expect(tokens[2]).toMatchObject({ type: TokenType.NUMBER, value: '0' });
      expect(tokens[3]).toMatchObject({ type: TokenType.RIGHT_BRACKET });
    });

    it('应该正确解析条件表达式', () => {
      const lexer = new Lexer('age >= 18 ? "adult" : "minor"');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(8); // age >= 18 ? "adult" : "minor" EOF
      expect(tokens[3]).toMatchObject({ type: TokenType.QUESTION });
      expect(tokens[5]).toMatchObject({ type: TokenType.COLON });
    });
  });

  describe('空白字符处理', () => {
    it('应该忽略空白字符', () => {
      const lexer = new Lexer('a    +    b');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // a + b EOF
      expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'a' });
      expect(tokens[1]).toMatchObject({ type: TokenType.PLUS });
      expect(tokens[2]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'b' });
    });

    it('应该正确处理换行符', () => {
      const lexer = new Lexer('a\n+\nb');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // a + b EOF
    });
  });

  describe('注释处理', () => {
    it('应该忽略单行注释', () => {
      const lexer = new Lexer('a + b // this is a comment\n + c');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(6); // a + b + c EOF
      expect(tokens[4]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'c' });
    });
  });

  describe('错误处理', () => {
    it('应该抛出未终止字符串错误', () => {
      const lexer = new Lexer('"unterminated');
      expect(() => lexer.tokenize()).toThrow('Unterminated string');
    });

    it('应该抛出意外字符错误', () => {
      const lexer = new Lexer('a & b');
      expect(() => lexer.tokenize()).toThrow('Unexpected character: &');
    });
  });

  describe('位置信息', () => {
    it('应该正确记录 token 位置', () => {
      const lexer = new Lexer('a + b');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].loc).toMatchObject({
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 2, offset: 1 },
      });
      
      expect(tokens[1].loc).toMatchObject({
        start: { line: 1, column: 3, offset: 2 },
        end: { line: 1, column: 4, offset: 3 },
      });
    });

    it('应该正确处理多行位置', () => {
      const lexer = new Lexer('a\n+\nb');
      const tokens = lexer.tokenize();
      
      expect(tokens[1].loc).toMatchObject({
        start: { line: 2, column: 1, offset: 2 },
        end: { line: 2, column: 2, offset: 3 },
      });
      
      expect(tokens[2].loc).toMatchObject({
        start: { line: 3, column: 1, offset: 4 },
        end: { line: 3, column: 2, offset: 5 },
      });
    });
  });
});