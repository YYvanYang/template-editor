/**
 * 表达式求值器
 * 执行 AST 并返回结果
 */

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
  TemplateNode,
  DirectiveNode,
  BindingContext,
} from '../types/binding.types';

/**
 * 求值器类
 */
export class Evaluator {
  /**
   * 求值表达式
   */
  evaluate(node: ExpressionNode, context: BindingContext): any {
    switch (node.type) {
      case 'literal':
        return this.evaluateLiteral(node as LiteralNode);
        
      case 'identifier':
        return this.evaluateIdentifier(node as IdentifierNode, context);
        
      case 'member':
        return this.evaluateMember(node as MemberNode, context);
        
      case 'call':
        return this.evaluateCall(node as CallNode, context);
        
      case 'binary':
        return this.evaluateBinary(node as BinaryNode, context);
        
      case 'unary':
        return this.evaluateUnary(node as UnaryNode, context);
        
      case 'conditional':
        return this.evaluateConditional(node as ConditionalNode, context);
        
      case 'array':
        return this.evaluateArray(node as ArrayNode, context);
        
      case 'object':
        return this.evaluateObject(node as ObjectNode, context);
        
      case 'template':
        return this.evaluateTemplate(node as TemplateNode, context);
        
      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
    }
  }
  
  /**
   * 求值字面量
   */
  private evaluateLiteral(node: LiteralNode): any {
    return node.value;
  }
  
  /**
   * 求值标识符
   */
  private evaluateIdentifier(node: IdentifierNode, context: BindingContext): any {
    const { name } = node;
    
    // 在当前上下文中查找
    if (context.data.hasOwnProperty(name)) {
      return context.data[name];
    }
    
    // 在辅助函数中查找
    if (context.helpers && context.helpers.hasOwnProperty(name)) {
      return context.helpers[name];
    }
    
    // 在父上下文中查找
    if (context.parent) {
      return this.evaluateIdentifier(node, context.parent);
    }
    
    // 返回 undefined 而不是抛出错误，与 JavaScript 行为一致
    return undefined;
  }
  
  /**
   * 求值成员访问
   */
  private evaluateMember(node: MemberNode, context: BindingContext): any {
    const object = this.evaluate(node.object, context);
    
    if (object == null) {
      return undefined;
    }
    
    const property = node.computed
      ? this.evaluate(node.property, context)
      : (node.property as IdentifierNode).name;
    
    try {
      return object[property];
    } catch (e) {
      return undefined;
    }
  }
  
  /**
   * 求值函数调用
   */
  private evaluateCall(node: CallNode, context: BindingContext): any {
    const callee = this.evaluate(node.callee, context);
    
    if (typeof callee !== 'function') {
      throw new Error(`${node.callee} is not a function`);
    }
    
    const args = node.arguments.map(arg => this.evaluate(arg, context));
    
    try {
      // 如果是成员函数调用，需要正确绑定 this
      if (node.callee.type === 'member') {
        const object = this.evaluate((node.callee as MemberNode).object, context);
        return callee.apply(object, args);
      } else {
        // 否则绑定上下文作为 this
        return callee.apply(context.data, args);
      }
    } catch (e) {
      throw new Error(`Error calling function: ${e.message}`);
    }
  }
  
  /**
   * 求值二元运算
   */
  private evaluateBinary(node: BinaryNode, context: BindingContext): any {
    const left = this.evaluate(node.left, context);
    const right = this.evaluate(node.right, context);
    
    switch (node.operator) {
      // 算术运算
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '%': return left % right;
      
      // 比较运算
      case '==': return left == right;
      case '!=': return left != right;
      case '===': return left === right;
      case '!==': return left !== right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      
      // 逻辑运算
      case '&&': return left && right;
      case '||': return left || right;
      
      // 其他
      case 'in': return left in right;
      
      default:
        throw new Error(`Unknown binary operator: ${node.operator}`);
    }
  }
  
  /**
   * 求值一元运算
   */
  private evaluateUnary(node: UnaryNode, context: BindingContext): any {
    const argument = this.evaluate(node.argument, context);
    
    switch (node.operator) {
      case '!': return !argument;
      case '-': return -argument;
      case '+': return +argument;
      case 'typeof': return typeof argument;
      
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }
  
  /**
   * 求值条件表达式
   */
  private evaluateConditional(node: ConditionalNode, context: BindingContext): any {
    const test = this.evaluate(node.test, context);
    
    if (test) {
      return this.evaluate(node.consequent, context);
    } else {
      return this.evaluate(node.alternate, context);
    }
  }
  
  /**
   * 求值数组字面量
   */
  private evaluateArray(node: ArrayNode, context: BindingContext): any[] {
    return node.elements.map(element => 
      element ? this.evaluate(element, context) : undefined
    );
  }
  
  /**
   * 求值对象字面量
   */
  private evaluateObject(node: ObjectNode, context: BindingContext): any {
    const result: Record<string, any> = {};
    
    for (const property of node.properties) {
      const key = property.computed
        ? this.evaluate(property.key, context)
        : (property.key as IdentifierNode).name || (property.key as LiteralNode).value;
      
      const value = this.evaluate(property.value, context);
      result[key] = value;
    }
    
    return result;
  }
  
  /**
   * 求值模板
   */
  private evaluateTemplate(node: TemplateNode, context: BindingContext): string {
    const parts: string[] = [];
    
    for (const expr of node.expressions) {
      if (typeof expr === 'string') {
        parts.push(expr);
      } else if ((expr as any).type && ['if', 'unless', 'each', 'with'].includes((expr as any).type)) {
        // 这是一个指令节点
        const directive = expr as any as DirectiveNode;
        const result = this.evaluateDirective(directive, context);
        parts.push(result);
      } else {
        // 普通表达式
        const value = this.evaluate(expr as ExpressionNode, context);
        parts.push(this.toString(value));
      }
    }
    
    return parts.join('');
  }
  
  /**
   * 求值指令
   */
  private evaluateDirective(node: DirectiveNode, context: BindingContext): string {
    switch (node.type) {
      case 'if':
        return this.evaluateIf(node, context);
        
      case 'unless':
        return this.evaluateUnless(node, context);
        
      case 'each':
        return this.evaluateEach(node, context);
        
      case 'with':
        return this.evaluateWith(node, context);
        
      default:
        throw new Error(`Unknown directive: ${node.type}`);
    }
  }
  
  /**
   * 求值 if 指令
   */
  private evaluateIf(node: DirectiveNode, context: BindingContext): string {
    const condition = this.evaluate(node.expression, context);
    
    if (condition) {
      return node.children ? this.evaluateTemplate(node.children, context) : '';
    } else if (node.else) {
      return this.evaluateTemplate(node.else, context);
    }
    
    return '';
  }
  
  /**
   * 求值 unless 指令
   */
  private evaluateUnless(node: DirectiveNode, context: BindingContext): string {
    const condition = this.evaluate(node.expression, context);
    
    if (!condition) {
      return node.children ? this.evaluateTemplate(node.children, context) : '';
    } else if (node.else) {
      return this.evaluateTemplate(node.else, context);
    }
    
    return '';
  }
  
  /**
   * 求值 each 指令
   */
  private evaluateEach(node: DirectiveNode, context: BindingContext): string {
    const collection = this.evaluate(node.expression, context);
    
    if (!Array.isArray(collection)) {
      return '';
    }
    
    const results: string[] = [];
    const itemKey = node.key || 'item';
    const indexKey = node.index || 'index';
    
    collection.forEach((item, index) => {
      // 创建新的上下文
      const loopContext: BindingContext = {
        data: {
          ...context.data,
          [itemKey]: item,
          [indexKey]: index,
        },
        parent: context,
        helpers: context.helpers,
      };
      
      if (node.children) {
        results.push(this.evaluateTemplate(node.children, loopContext));
      }
    });
    
    return results.join('');
  }
  
  /**
   * 求值 with 指令
   */
  private evaluateWith(node: DirectiveNode, context: BindingContext): string {
    const data = this.evaluate(node.expression, context);
    
    if (data == null) {
      return '';
    }
    
    // 创建新的上下文
    const newContext: BindingContext = {
      data: typeof data === 'object' ? data : { value: data },
      parent: context,
      helpers: context.helpers,
    };
    
    return node.children ? this.evaluateTemplate(node.children, newContext) : '';
  }
  
  /**
   * 转换为字符串
   */
  private toString(value: any): string {
    if (value == null) {
      return '';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[object Object]';
      }
    }
    
    return String(value);
  }
}