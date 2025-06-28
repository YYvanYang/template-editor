/**
 * 数据绑定系统类型定义
 */

/**
 * 表达式类型
 */
export type ExpressionType = 
  | 'identifier'      // 标识符: variable
  | 'member'         // 成员访问: object.property
  | 'index'          // 索引访问: array[0]
  | 'call'           // 函数调用: function(args)
  | 'literal'        // 字面量: "string", 123, true
  | 'template'       // 模板字符串: {{expression}}
  | 'conditional'    // 条件表达式: condition ? true : false
  | 'binary'         // 二元运算: a + b, a > b
  | 'unary'          // 一元运算: !value, -value
  | 'array'          // 数组字面量: [1, 2, 3]
  | 'object';        // 对象字面量: {key: value}

/**
 * AST 节点基础接口
 */
export interface ASTNode {
  type: ExpressionType;
  loc?: SourceLocation;
}

/**
 * 源码位置信息
 */
export interface SourceLocation {
  start: Position;
  end: Position;
  source?: string;
}

/**
 * 位置信息
 */
export interface Position {
  line: number;
  column: number;
  offset: number;
}

/**
 * 标识符节点
 */
export interface IdentifierNode extends ASTNode {
  type: 'identifier';
  name: string;
}

/**
 * 成员访问节点
 */
export interface MemberNode extends ASTNode {
  type: 'member';
  object: ExpressionNode;
  property: ExpressionNode;
  computed: boolean; // true for obj[prop], false for obj.prop
}

/**
 * 索引访问节点
 */
export interface IndexNode extends ASTNode {
  type: 'index';
  object: ExpressionNode;
  index: ExpressionNode;
}

/**
 * 函数调用节点
 */
export interface CallNode extends ASTNode {
  type: 'call';
  callee: ExpressionNode;
  arguments: ExpressionNode[];
}

/**
 * 字面量节点
 */
export interface LiteralNode extends ASTNode {
  type: 'literal';
  value: string | number | boolean | null;
  raw: string;
}

/**
 * 模板节点
 */
export interface TemplateNode extends ASTNode {
  type: 'template';
  expressions: (string | ExpressionNode)[];
}

/**
 * 条件表达式节点
 */
export interface ConditionalNode extends ASTNode {
  type: 'conditional';
  test: ExpressionNode;
  consequent: ExpressionNode;
  alternate: ExpressionNode;
}

/**
 * 二元运算节点
 */
export interface BinaryNode extends ASTNode {
  type: 'binary';
  operator: BinaryOperator;
  left: ExpressionNode;
  right: ExpressionNode;
}

/**
 * 一元运算节点
 */
export interface UnaryNode extends ASTNode {
  type: 'unary';
  operator: UnaryOperator;
  argument: ExpressionNode;
}

/**
 * 数组字面量节点
 */
export interface ArrayNode extends ASTNode {
  type: 'array';
  elements: (ExpressionNode | null)[];
}

/**
 * 对象字面量节点
 */
export interface ObjectNode extends ASTNode {
  type: 'object';
  properties: PropertyNode[];
}

/**
 * 对象属性节点
 */
export interface PropertyNode {
  key: IdentifierNode | LiteralNode;
  value: ExpressionNode;
  computed: boolean;
  shorthand: boolean;
}

/**
 * 表达式节点联合类型
 */
export type ExpressionNode =
  | IdentifierNode
  | MemberNode
  | IndexNode
  | CallNode
  | LiteralNode
  | TemplateNode
  | ConditionalNode
  | BinaryNode
  | UnaryNode
  | ArrayNode
  | ObjectNode;

/**
 * 二元运算符
 */
export type BinaryOperator =
  // 算术运算符
  | '+' | '-' | '*' | '/' | '%'
  // 比较运算符
  | '==' | '!=' | '===' | '!==' | '<' | '>' | '<=' | '>='
  // 逻辑运算符
  | '&&' | '||'
  // 其他
  | 'in';

/**
 * 一元运算符
 */
export type UnaryOperator =
  | '!' | '-' | '+' | 'typeof';

/**
 * 绑定上下文
 */
export interface BindingContext {
  data: Record<string, any>;
  parent?: BindingContext;
  helpers?: Record<string, Function>;
}

/**
 * 绑定指令类型
 */
export type DirectiveType =
  | 'bind'      // 数据绑定: {{expression}}
  | 'if'        // 条件渲染: {{#if condition}}
  | 'each'      // 列表渲染: {{#each items}}
  | 'unless'    // 条件渲染(否定): {{#unless condition}}
  | 'with';     // 上下文切换: {{#with object}}

/**
 * 指令节点
 */
export interface DirectiveNode {
  type: DirectiveType;
  expression: ExpressionNode;
  children?: TemplateNode;
  else?: TemplateNode;
  key?: string; // for 'each' directive
  index?: string; // for 'each' directive
}

/**
 * 编译选项
 */
export interface CompileOptions {
  /**
   * 是否缓存编译结果
   */
  cache?: boolean;
  /**
   * 是否在严格模式下编译
   */
  strict?: boolean;
  /**
   * 自定义分隔符
   */
  delimiters?: [string, string];
  /**
   * 是否保留空白字符
   */
  preserveWhitespace?: boolean;
}

/**
 * 编译结果
 */
export interface CompileResult {
  /**
   * 抽象语法树
   */
  ast: TemplateNode;
  /**
   * 渲染函数
   */
  render: (context: BindingContext) => any;
  /**
   * 静态依赖
   */
  dependencies: string[];
  /**
   * 错误信息
   */
  errors: CompileError[];
}

/**
 * 编译错误
 */
export interface CompileError {
  message: string;
  loc?: SourceLocation;
  type: 'syntax' | 'reference' | 'type';
}

/**
 * 绑定配置
 */
export interface BindingConfig {
  /**
   * 默认分隔符
   */
  delimiters: [string, string];
  /**
   * 全局辅助函数
   */
  helpers: Record<string, Function>;
  /**
   * 是否启用缓存
   */
  cache: boolean;
  /**
   * 缓存大小限制
   */
  cacheSize: number;
}

/**
 * 默认绑定配置
 */
export const DEFAULT_BINDING_CONFIG: BindingConfig = {
  delimiters: ['{{', '}}'],
  helpers: {},
  cache: true,
  cacheSize: 1000,
};