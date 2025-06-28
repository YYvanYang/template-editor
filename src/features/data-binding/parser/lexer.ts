/**
 * 词法分析器
 * 将输入字符串转换为 Token 流
 */

import type { Position, SourceLocation } from '../types/binding.types';

/**
 * Token 类型
 */
export enum TokenType {
  // 字面量
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  UNDEFINED = 'UNDEFINED',
  
  // 标识符
  IDENTIFIER = 'IDENTIFIER',
  
  // 运算符
  PLUS = 'PLUS',                   // +
  MINUS = 'MINUS',                 // -
  MULTIPLY = 'MULTIPLY',           // *
  DIVIDE = 'DIVIDE',               // /
  MODULO = 'MODULO',               // %
  
  // 比较运算符
  EQUAL = 'EQUAL',                 // ==
  NOT_EQUAL = 'NOT_EQUAL',         // !=
  STRICT_EQUAL = 'STRICT_EQUAL',   // ===
  STRICT_NOT_EQUAL = 'STRICT_NOT_EQUAL', // !==
  LESS_THAN = 'LESS_THAN',         // <
  GREATER_THAN = 'GREATER_THAN',   // >
  LESS_EQUAL = 'LESS_EQUAL',       // <=
  GREATER_EQUAL = 'GREATER_EQUAL', // >=
  
  // 逻辑运算符
  AND = 'AND',                     // &&
  OR = 'OR',                       // ||
  NOT = 'NOT',                     // !
  
  // 其他运算符
  DOT = 'DOT',                     // .
  COMMA = 'COMMA',                 // ,
  COLON = 'COLON',                 // :
  QUESTION = 'QUESTION',           // ?
  IN = 'IN',                       // in
  TYPEOF = 'TYPEOF',               // typeof
  
  // 括号
  LEFT_PAREN = 'LEFT_PAREN',       // (
  RIGHT_PAREN = 'RIGHT_PAREN',     // )
  LEFT_BRACKET = 'LEFT_BRACKET',   // [
  RIGHT_BRACKET = 'RIGHT_BRACKET', // ]
  LEFT_BRACE = 'LEFT_BRACE',       // {
  RIGHT_BRACE = 'RIGHT_BRACE',     // }
  
  // 模板
  TEMPLATE_START = 'TEMPLATE_START', // {{
  TEMPLATE_END = 'TEMPLATE_END',     // }}
  
  // 指令
  HASH = 'HASH',                   // #
  SLASH = 'SLASH',                 // /
  
  // 其他
  EOF = 'EOF',
  TEXT = 'TEXT',
}

/**
 * Token 接口
 */
export interface Token {
  type: TokenType;
  value: string;
  loc: SourceLocation;
}

/**
 * 词法分析器类
 */
export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  
  constructor(input: string) {
    this.input = input;
  }
  
  /**
   * 执行词法分析
   */
  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.scanToken();
    }
    
    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }
  
  /**
   * 扫描单个 Token
   */
  private scanToken(): void {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    
    const char = this.advance();
    
    switch (char) {
      case ' ':
      case '\t':
      case '\r':
        // 忽略空白字符
        break;
      case '\n':
        this.line++;
        this.column = 1;
        break;
        
      // 单字符 Token
      case '+': this.addTokenWithLoc(TokenType.PLUS, char, start); break;
      case '-': this.addTokenWithLoc(TokenType.MINUS, char, start); break;
      case '*': this.addTokenWithLoc(TokenType.MULTIPLY, char, start); break;
      case '/': 
        if (this.peek() === '/') {
          // 注释，跳过到行尾
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addTokenWithLoc(TokenType.DIVIDE, char, start);
        }
        break;
      case '%': this.addTokenWithLoc(TokenType.MODULO, char, start); break;
      case '.': this.addTokenWithLoc(TokenType.DOT, char, start); break;
      case ',': this.addTokenWithLoc(TokenType.COMMA, char, start); break;
      case ':': this.addTokenWithLoc(TokenType.COLON, char, start); break;
      case '?': this.addTokenWithLoc(TokenType.QUESTION, char, start); break;
      case '(': this.addTokenWithLoc(TokenType.LEFT_PAREN, char, start); break;
      case ')': this.addTokenWithLoc(TokenType.RIGHT_PAREN, char, start); break;
      case '[': this.addTokenWithLoc(TokenType.LEFT_BRACKET, char, start); break;
      case ']': this.addTokenWithLoc(TokenType.RIGHT_BRACKET, char, start); break;
      case '#': this.addTokenWithLoc(TokenType.HASH, char, start); break;
      
      // 双字符 Token
      case '!':
        if (this.match('=')) {
          if (this.match('=')) {
            this.addTokenWithLoc(TokenType.STRICT_NOT_EQUAL, '!==', start);
          } else {
            this.addTokenWithLoc(TokenType.NOT_EQUAL, '!=', start);
          }
        } else {
          this.addTokenWithLoc(TokenType.NOT, char, start);
        }
        break;
        
      case '=':
        if (this.match('=')) {
          if (this.match('=')) {
            this.addTokenWithLoc(TokenType.STRICT_EQUAL, '===', start);
          } else {
            this.addTokenWithLoc(TokenType.EQUAL, '==', start);
          }
        } else {
          this.error(`Unexpected character: ${char}`);
        }
        break;
        
      case '<':
        if (this.match('=')) {
          this.addTokenWithLoc(TokenType.LESS_EQUAL, '<=', start);
        } else {
          this.addTokenWithLoc(TokenType.LESS_THAN, char, start);
        }
        break;
        
      case '>':
        if (this.match('=')) {
          this.addTokenWithLoc(TokenType.GREATER_EQUAL, '>=', start);
        } else {
          this.addTokenWithLoc(TokenType.GREATER_THAN, char, start);
        }
        break;
        
      case '&':
        if (this.match('&')) {
          this.addTokenWithLoc(TokenType.AND, '&&', start);
        } else {
          this.error(`Unexpected character: ${char}`);
        }
        break;
        
      case '|':
        if (this.match('|')) {
          this.addTokenWithLoc(TokenType.OR, '||', start);
        } else {
          this.error(`Unexpected character: ${char}`);
        }
        break;
        
      case '{':
        if (this.match('{')) {
          this.addTokenWithLoc(TokenType.TEMPLATE_START, '{{', start);
        } else {
          this.addTokenWithLoc(TokenType.LEFT_BRACE, char, start);
        }
        break;
        
      case '}':
        if (this.match('}')) {
          this.addTokenWithLoc(TokenType.TEMPLATE_END, '}}', start);
        } else {
          this.addTokenWithLoc(TokenType.RIGHT_BRACE, char, start);
        }
        break;
        
      // 字符串
      case '"':
      case "'":
        this.scanString(char, start);
        break;
        
      default:
        if (this.isDigit(char)) {
          this.scanNumber(start);
        } else if (this.isAlpha(char)) {
          this.scanIdentifier(start);
        } else {
          this.error(`Unexpected character: ${char}`);
        }
        break;
    }
  }
  
  /**
   * 扫描字符串
   */
  private scanString(quote: string, start: number): void {
    let value = '';
    
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      
      if (this.peek() === '\\') {
        this.advance(); // 跳过转义字符
        const escaped = this.advance();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case quote: value += quote; break;
          default: value += escaped;
        }
      } else {
        value += this.advance();
      }
    }
    
    if (this.isAtEnd()) {
      this.error('Unterminated string');
      return;
    }
    
    this.advance(); // 跳过结束引号
    this.addTokenWithLoc(TokenType.STRING, value, start);
  }
  
  /**
   * 扫描数字
   */
  private scanNumber(start: number): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }
    
    // 小数部分
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // 跳过小数点
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }
    
    const value = this.input.substring(start, this.position);
    this.addTokenWithLoc(TokenType.NUMBER, value, start);
  }
  
  /**
   * 扫描标识符
   */
  private scanIdentifier(start: number): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }
    
    const value = this.input.substring(start, this.position);
    
    // 检查是否是关键字
    let type = TokenType.IDENTIFIER;
    switch (value) {
      case 'true':
      case 'false':
        type = TokenType.BOOLEAN;
        break;
      case 'null':
        type = TokenType.NULL;
        break;
      case 'undefined':
        type = TokenType.UNDEFINED;
        break;
      case 'in':
        type = TokenType.IN;
        break;
      case 'typeof':
        type = TokenType.TYPEOF;
        break;
    }
    
    this.addTokenWithLoc(type, value, start);
  }
  
  /**
   * 辅助方法
   */
  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }
  
  private advance(): string {
    const char = this.input[this.position++];
    this.column++;
    return char;
  }
  
  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.input[this.position];
  }
  
  private peekNext(): string {
    if (this.position + 1 >= this.input.length) return '\0';
    return this.input[this.position + 1];
  }
  
  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.input[this.position] !== expected) return false;
    this.advance();
    return true;
  }
  
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }
  
  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_' || char === '$';
  }
  
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
  
  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      loc: {
        start: { line: this.line, column: this.column, offset: this.position },
        end: { line: this.line, column: this.column, offset: this.position },
      },
    });
  }
  
  private addTokenWithLoc(type: TokenType, value: string, start: number): void {
    const startPos: Position = {
      line: this.line,
      column: this.column - (this.position - start),
      offset: start,
    };
    
    const endPos: Position = {
      line: this.line,
      column: this.column,
      offset: this.position,
    };
    
    this.tokens.push({
      type,
      value,
      loc: {
        start: startPos,
        end: endPos,
        source: this.input.substring(start, this.position),
      },
    });
  }
  
  private error(message: string): void {
    throw new Error(`Lexer error at ${this.line}:${this.column}: ${message}`);
  }
}