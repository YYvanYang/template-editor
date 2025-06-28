/**
 * 模板编译器
 * 将模板编译成可执行的渲染函数
 */

import { Parser } from '../parser/parser';
import { Evaluator } from '../runtime/evaluator';
import type {
  TemplateNode,
  BindingContext,
  CompileOptions,
  CompileResult,
  CompileError,
  ExpressionNode,
} from '../types/binding.types';

/**
 * 编译缓存
 */
class CompileCache {
  private cache = new Map<string, CompileResult>();
  private maxSize: number;
  
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }
  
  get(key: string): CompileResult | undefined {
    return this.cache.get(key);
  }
  
  set(key: string, value: CompileResult): void {
    if (this.cache.size >= this.maxSize) {
      // 简单的 LRU 策略：删除第一个元素
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

/**
 * 编译器类
 */
export class Compiler {
  private parser: Parser;
  private evaluator: Evaluator;
  private cache: CompileCache;
  
  constructor(cacheSize: number = 1000) {
    this.parser = new Parser();
    this.evaluator = new Evaluator();
    this.cache = new CompileCache(cacheSize);
  }
  
  /**
   * 编译模板
   */
  compile(template: string, options: CompileOptions = {}): CompileResult {
    const cacheKey = this.getCacheKey(template, options);
    
    // 检查缓存
    if (options.cache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const errors: CompileError[] = [];
    let ast: TemplateNode | null = null;
    
    try {
      // 解析模板
      ast = this.parser.parseTemplate(template);
      
      // 提取依赖
      const dependencies = this.extractDependencies(ast);
      
      // 创建渲染函数
      const render = (context: BindingContext) => {
        try {
          return this.evaluator.evaluate(ast!, context);
        } catch (e) {
          throw new Error(`Runtime error: ${e.message}`);
        }
      };
      
      const result: CompileResult = {
        ast,
        render,
        dependencies,
        errors,
      };
      
      // 缓存结果
      if (options.cache !== false) {
        this.cache.set(cacheKey, result);
      }
      
      return result;
    } catch (e) {
      errors.push({
        message: e.message,
        type: 'syntax',
      });
      
      return {
        ast: ast || { type: 'template', expressions: [] },
        render: () => '',
        dependencies: [],
        errors,
      };
    }
  }
  
  /**
   * 编译表达式
   */
  compileExpression(expression: string, options: CompileOptions = {}): {
    ast: ExpressionNode | null;
    evaluate: (context: BindingContext) => any;
    dependencies: string[];
    errors: CompileError[];
  } {
    const errors: CompileError[] = [];
    let ast: ExpressionNode | null = null;
    
    try {
      // 解析表达式
      ast = this.parser.parseExpression(expression);
      
      // 提取依赖
      const dependencies = this.extractExpressionDependencies(ast);
      
      // 创建求值函数
      const evaluate = (context: BindingContext) => {
        try {
          return this.evaluator.evaluate(ast!, context);
        } catch (e) {
          throw new Error(`Runtime error: ${e.message}`);
        }
      };
      
      return {
        ast,
        evaluate,
        dependencies,
        errors,
      };
    } catch (e) {
      errors.push({
        message: e.message,
        type: 'syntax',
      });
      
      return {
        ast: null,
        evaluate: () => undefined,
        dependencies: [],
        errors,
      };
    }
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * 生成缓存键
   */
  private getCacheKey(template: string, options: CompileOptions): string {
    return `${template}__${JSON.stringify(options)}`;
  }
  
  /**
   * 提取依赖
   */
  private extractDependencies(node: TemplateNode): string[] {
    const dependencies = new Set<string>();
    
    for (const expr of node.expressions) {
      if (typeof expr !== 'string') {
        this.extractExpressionDependencies(expr as ExpressionNode, dependencies);
      }
    }
    
    return Array.from(dependencies);
  }
  
  /**
   * 提取表达式依赖
   */
  private extractExpressionDependencies(
    node: ExpressionNode,
    dependencies: Set<string> = new Set()
  ): string[] {
    switch (node.type) {
      case 'identifier':
        dependencies.add(node.name);
        break;
        
      case 'member':
        // 只收集顶级标识符
        if (node.object.type === 'identifier') {
          dependencies.add(node.object.name);
        } else {
          this.extractExpressionDependencies(node.object, dependencies);
        }
        if (node.computed) {
          this.extractExpressionDependencies(node.property, dependencies);
        }
        break;
        
      case 'call':
        this.extractExpressionDependencies(node.callee, dependencies);
        node.arguments.forEach(arg => 
          this.extractExpressionDependencies(arg, dependencies)
        );
        break;
        
      case 'binary':
        this.extractExpressionDependencies(node.left, dependencies);
        this.extractExpressionDependencies(node.right, dependencies);
        break;
        
      case 'unary':
        this.extractExpressionDependencies(node.argument, dependencies);
        break;
        
      case 'conditional':
        this.extractExpressionDependencies(node.test, dependencies);
        this.extractExpressionDependencies(node.consequent, dependencies);
        this.extractExpressionDependencies(node.alternate, dependencies);
        break;
        
      case 'array':
        node.elements.forEach(element => {
          if (element) {
            this.extractExpressionDependencies(element, dependencies);
          }
        });
        break;
        
      case 'object':
        node.properties.forEach(prop => {
          if (prop.computed) {
            this.extractExpressionDependencies(prop.key as ExpressionNode, dependencies);
          }
          this.extractExpressionDependencies(prop.value, dependencies);
        });
        break;
        
      case 'template':
        for (const expr of node.expressions) {
          if (typeof expr !== 'string' && expr.type !== undefined) {
            this.extractExpressionDependencies(expr as ExpressionNode, dependencies);
          }
        }
        break;
    }
    
    return Array.from(dependencies);
  }
}

/**
 * 默认编译器实例
 */
export const defaultCompiler = new Compiler();