/**
 * 表达式解析器
 * 将 Token 流转换为抽象语法树 (AST)
 */

import { Lexer, Token, TokenType } from './lexer';
import type {
  ExpressionNode,
  IdentifierNode,
  LiteralNode,
  MemberNode,
  CallNode,
  BinaryNode,
  UnaryNode,
  ConditionalNode,
  ArrayNode,
  ObjectNode,
  PropertyNode,
  TemplateNode,
  DirectiveNode,
  DirectiveType,
  BinaryOperator,
  UnaryOperator,
} from '../types/binding.types';

/**
 * 解析器类
 */
export class Parser {
  private tokens: Token[] = [];
  private current: number = 0;
  
  
  /**
   * 解析表达式
   */
  parseExpression(input: string): ExpressionNode {
    const lexer = new Lexer(input);
    this.tokens = lexer.tokenize();
    this.current = 0;
    
    const expr = this.expression();
    
    if (!this.isAtEnd()) {
      this.error('Unexpected token after expression');
    }
    
    return expr;
  }
  
  /**
   * 解析模板
   */
  parseTemplate(input: string): TemplateNode {
    const expressions: (string | ExpressionNode | DirectiveNode)[] = [];
    let position = 0;
    
    while (position < input.length) {
      const start = input.indexOf('{{', position);
      
      if (start === -1) {
        // 没有更多的模板表达式
        if (position < input.length) {
          expressions.push(input.substring(position));
        }
        break;
      }
      
      // 添加模板表达式之前的文本
      if (start > position) {
        expressions.push(input.substring(position, start));
      }
      
      // 查找结束标记
      const end = input.indexOf('}}', start + 2);
      if (end === -1) {
        this.error('Unclosed template expression');
      }
      
      // 解析表达式
      const exprText = input.substring(start + 2, end).trim();
      
      // 检查是否是指令
      if (exprText.startsWith('#')) {
        const { directive, nextPosition } = this.parseDirective(exprText, input, end + 2);
        expressions.push(directive);
        position = nextPosition;
      } else if (exprText.startsWith('/')) {
        // 这是一个结束标记，但不应该出现在这里
        this.error(`Unexpected closing tag: {{${exprText}}}`);
      } else if (exprText === 'else') {
        // else 标记也不应该出现在顶层
        this.error('Unexpected else tag');
      } else {
        const expr = this.parseExpression(exprText);
        expressions.push(expr);
        position = end + 2;
      }
    }
    
    return {
      type: 'template',
      expressions,
    };
  }
  
  /**
   * 解析指令
   */
  private parseDirective(expr: string, template: string, position: number): { directive: DirectiveNode; nextPosition: number } {
    const parts = expr.substring(1).split(/\s+/);
    const directiveType = parts[0] as DirectiveType;
    
    if (!['if', 'each', 'unless', 'with'].includes(directiveType)) {
      this.error(`Unknown directive: ${directiveType}`);
    }
    
    // Special handling for 'each' directive with 'as' syntax
    let expression: ExpressionNode;
    let key: string | undefined;
    let index: string | undefined;
    
    if (directiveType === 'each' && parts.includes('as')) {
      const asIndex = parts.indexOf('as');
      if (asIndex > 0) {
        // Parse the collection expression
        expression = this.parseExpression(parts.slice(1, asIndex).join(' '));
        
        // Get the variable names after 'as'
        const varsAfterAs = parts.slice(asIndex + 1).join(' ');
        const varParts = varsAfterAs.split(',').map(v => v.trim());
        key = varParts[0];
        index = varParts[1];
      } else {
        expression = this.parseExpression(parts.slice(1).join(' '));
      }
    } else {
      expression = this.parseExpression(parts.slice(1).join(' '));
    }
    
    // 查找指令内容
    const endTag = `{{/${directiveType}}}`;
    const endPos = template.indexOf(endTag, position);
    
    if (endPos === -1) {
      this.error(`Unclosed directive: ${directiveType}`);
    }
    
    // 处理 else 分支（只对 if/unless）
    let content = template.substring(position, endPos);
    let elseContent: string | null = null;
    
    if (directiveType === 'if' || directiveType === 'unless') {
      const elsePos = content.indexOf('{{else}}');
      if (elsePos !== -1) {
        elseContent = content.substring(elsePos + 8);
        content = content.substring(0, elsePos);
      }
    }
    
    const children = this.parseTemplate(content);
    
    const directive: DirectiveNode = {
      type: directiveType,
      expression,
      children,
    };
    
    if (elseContent !== null) {
      directive.else = this.parseTemplate(elseContent);
    }
    
    // Set key and index if they were parsed
    if (directiveType === 'each' && key) {
      directive.key = key;
      if (index) {
        directive.index = index;
      }
    }
    
    return {
      directive: directive as any,
      nextPosition: endPos + endTag.length,
    };
  }
  
  
  /**
   * 表达式解析（最低优先级）
   */
  private expression(): ExpressionNode {
    return this.conditional();
  }
  
  /**
   * 条件表达式 (? :)
   */
  private conditional(): ExpressionNode {
    let expr = this.logicalOr();
    
    if (this.match(TokenType.QUESTION)) {
      const consequent = this.expression();
      this.consume(TokenType.COLON, 'Expected : after consequent');
      const alternate = this.expression();
      
      expr = {
        type: 'conditional',
        test: expr,
        consequent,
        alternate,
      } as ConditionalNode;
    }
    
    return expr;
  }
  
  /**
   * 逻辑或 (||)
   */
  private logicalOr(): ExpressionNode {
    let expr = this.logicalAnd();
    
    while (this.match(TokenType.OR)) {
      const operator = '||' as BinaryOperator;
      const right = this.logicalAnd();
      expr = {
        type: 'binary',
        operator,
        left: expr,
        right,
      } as BinaryNode;
    }
    
    return expr;
  }
  
  /**
   * 逻辑与 (&&)
   */
  private logicalAnd(): ExpressionNode {
    let expr = this.equality();
    
    while (this.match(TokenType.AND)) {
      const operator = '&&' as BinaryOperator;
      const right = this.equality();
      expr = {
        type: 'binary',
        operator,
        left: expr,
        right,
      } as BinaryNode;
    }
    
    return expr;
  }
  
  /**
   * 相等性 (==, !=, ===, !==)
   */
  private equality(): ExpressionNode {
    let expr = this.relational();
    
    while (true) {
      if (this.match(TokenType.EQUAL)) {
        const right = this.relational();
        expr = {
          type: 'binary',
          operator: '==',
          left: expr,
          right,
        } as BinaryNode;
      } else if (this.match(TokenType.NOT_EQUAL)) {
        const right = this.relational();
        expr = {
          type: 'binary',
          operator: '!=',
          left: expr,
          right,
        } as BinaryNode;
      } else if (this.match(TokenType.STRICT_EQUAL)) {
        const right = this.relational();
        expr = {
          type: 'binary',
          operator: '===',
          left: expr,
          right,
        } as BinaryNode;
      } else if (this.match(TokenType.STRICT_NOT_EQUAL)) {
        const right = this.relational();
        expr = {
          type: 'binary',
          operator: '!==',
          left: expr,
          right,
        } as BinaryNode;
      } else {
        break;
      }
    }
    
    return expr;
  }
  
  /**
   * 关系运算 (<, >, <=, >=)
   */
  private relational(): ExpressionNode {
    let expr = this.additive();
    
    while (true) {
      if (this.match(TokenType.LESS_THAN)) {
        const right = this.additive();
        expr = {
          type: 'binary',
          operator: '<',
          left: expr,
          right,
        } as BinaryNode;
      } else if (this.match(TokenType.GREATER_THAN)) {
        const right = this.additive();
        expr = {
          type: 'binary',
          operator: '>',
          left: expr,
          right,
        } as BinaryNode;
      } else if (this.match(TokenType.LESS_EQUAL)) {
        const right = this.additive();
        expr = {
          type: 'binary',
          operator: '<=',
          left: expr,
          right,
        } as BinaryNode;
      } else if (this.match(TokenType.GREATER_EQUAL)) {
        const right = this.additive();
        expr = {
          type: 'binary',
          operator: '>=',
          left: expr,
          right,
        } as BinaryNode;
      } else if (this.match(TokenType.IN)) {
        const right = this.additive();
        expr = {
          type: 'binary',
          operator: 'in',
          left: expr,
          right,
        } as BinaryNode;
      } else {
        break;
      }
    }
    
    return expr;
  }
  
  /**
   * 加减法 (+, -)
   */
  private additive(): ExpressionNode {
    let expr = this.multiplicative();
    
    while (true) {
      if (this.match(TokenType.PLUS)) {
        const right = this.multiplicative();
        expr = {
          type: 'binary',
          operator: '+',
          left: expr,
          right,
        } as BinaryNode;
      } else if (this.match(TokenType.MINUS)) {
        const right = this.multiplicative();
        expr = {
          type: 'binary',
          operator: '-',
          left: expr,
          right,
        } as BinaryNode;
      } else {
        break;
      }
    }
    
    return expr;
  }
  
  /**
   * 乘除法 (*, /, %)
   */
  private multiplicative(): ExpressionNode {
    let expr = this.unary();
    
    while (true) {
      if (this.match(TokenType.MULTIPLY)) {
        const right = this.unary();
        expr = {
          type: 'binary',
          operator: '*',
          left: expr,
          right,
        } as BinaryNode;
      } else if (this.match(TokenType.DIVIDE)) {
        const right = this.unary();
        expr = {
          type: 'binary',
          operator: '/',
          left: expr,
          right,
        } as BinaryNode;
      } else if (this.match(TokenType.MODULO)) {
        const right = this.unary();
        expr = {
          type: 'binary',
          operator: '%',
          left: expr,
          right,
        } as BinaryNode;
      } else {
        break;
      }
    }
    
    return expr;
  }
  
  /**
   * 一元运算 (!, -, +, typeof)
   */
  private unary(): ExpressionNode {
    if (this.match(TokenType.NOT)) {
      const argument = this.unary();
      return {
        type: 'unary',
        operator: '!',
        argument,
      } as UnaryNode;
    }
    
    if (this.match(TokenType.MINUS)) {
      const argument = this.unary();
      return {
        type: 'unary',
        operator: '-',
        argument,
      } as UnaryNode;
    }
    
    if (this.match(TokenType.PLUS)) {
      const argument = this.unary();
      return {
        type: 'unary',
        operator: '+',
        argument,
      } as UnaryNode;
    }
    
    if (this.match(TokenType.TYPEOF)) {
      const argument = this.unary();
      return {
        type: 'unary',
        operator: 'typeof',
        argument,
      } as UnaryNode;
    }
    
    return this.postfix();
  }
  
  /**
   * 后缀表达式（成员访问、函数调用、索引访问）
   */
  private postfix(): ExpressionNode {
    let expr = this.primary();
    
    while (true) {
      if (this.match(TokenType.DOT)) {
        // Must consume the identifier token
        this.consume(TokenType.IDENTIFIER, 'Expected property name after .');
        const property = this.identifier();
        expr = {
          type: 'member',
          object: expr,
          property,
          computed: false,
        } as MemberNode;
      } else if (this.match(TokenType.LEFT_BRACKET)) {
        const index = this.expression();
        this.consume(TokenType.RIGHT_BRACKET, 'Expected ] after index');
        expr = {
          type: 'member',
          object: expr,
          property: index,
          computed: true,
        } as MemberNode;
      } else if (this.match(TokenType.LEFT_PAREN)) {
        const args: ExpressionNode[] = [];
        
        if (!this.check(TokenType.RIGHT_PAREN)) {
          do {
            args.push(this.expression());
          } while (this.match(TokenType.COMMA));
        }
        
        this.consume(TokenType.RIGHT_PAREN, 'Expected ) after arguments');
        
        expr = {
          type: 'call',
          callee: expr,
          arguments: args,
        } as CallNode;
      } else {
        break;
      }
    }
    
    return expr;
  }
  
  /**
   * 基础表达式（字面量、标识符、分组、数组、对象）
   */
  private primary(): ExpressionNode {
    // 字面量
    if (this.match(TokenType.NUMBER)) {
      return {
        type: 'literal',
        value: Number(this.previous().value),
        raw: this.previous().value,
      } as LiteralNode;
    }
    
    if (this.match(TokenType.STRING)) {
      return {
        type: 'literal',
        value: this.previous().value,
        raw: `"${this.previous().value}"`,
      } as LiteralNode;
    }
    
    if (this.match(TokenType.BOOLEAN)) {
      return {
        type: 'literal',
        value: this.previous().value === 'true',
        raw: this.previous().value,
      } as LiteralNode;
    }
    
    if (this.match(TokenType.NULL)) {
      return {
        type: 'literal',
        value: null,
        raw: 'null',
      } as LiteralNode;
    }
    
    if (this.match(TokenType.UNDEFINED)) {
      return {
        type: 'literal',
        value: undefined,
        raw: 'undefined',
      } as LiteralNode;
    }
    
    // 标识符
    if (this.match(TokenType.IDENTIFIER)) {
      return this.identifier();
    }
    
    // 分组表达式
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ) after expression');
      return expr;
    }
    
    // 数组字面量
    if (this.match(TokenType.LEFT_BRACKET)) {
      const elements: ExpressionNode[] = [];
      
      if (!this.check(TokenType.RIGHT_BRACKET)) {
        do {
          elements.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }
      
      this.consume(TokenType.RIGHT_BRACKET, 'Expected ] after array elements');
      
      return {
        type: 'array',
        elements,
      } as ArrayNode;
    }
    
    // 对象字面量
    if (this.match(TokenType.LEFT_BRACE)) {
      const properties: PropertyNode[] = [];
      
      if (!this.check(TokenType.RIGHT_BRACE)) {
        do {
          let key: IdentifierNode | LiteralNode;
          let computed = false;
          
          if (this.match(TokenType.LEFT_BRACKET)) {
            key = this.expression() as any;
            computed = true;
            this.consume(TokenType.RIGHT_BRACKET, 'Expected ] after computed property');
          } else if (this.match(TokenType.STRING)) {
            key = {
              type: 'literal',
              value: this.previous().value,
              raw: `"${this.previous().value}"`,
            } as LiteralNode;
          } else {
            // Must consume identifier first
            this.consume(TokenType.IDENTIFIER, 'Expected property key');
            key = this.identifier();
          }
          
          this.consume(TokenType.COLON, 'Expected : after property key');
          const value = this.expression();
          
          properties.push({
            key,
            value,
            computed,
            shorthand: false,
          });
        } while (this.match(TokenType.COMMA));
      }
      
      this.consume(TokenType.RIGHT_BRACE, 'Expected } after object properties');
      
      return {
        type: 'object',
        properties,
      } as ObjectNode;
    }
    
    this.error('Expected expression');
    throw new Error('Unreachable');
  }
  
  /**
   * 标识符
   */
  private identifier(): IdentifierNode {
    const name = this.previous().value;
    return {
      type: 'identifier',
      name,
    };
  }
  
  /**
   * 辅助方法
   */
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }
  
  private peek(): Token {
    return this.tokens[this.current];
  }
  
  private previous(): Token {
    return this.tokens[this.current - 1];
  }
  
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    this.error(message);
    throw new Error('Unreachable');
  }
  
  private error(message: string): void {
    const token = this.peek();
    throw new Error(`Parser error at ${token.loc.start.line}:${token.loc.start.column}: ${message}`);
  }
}