/**
 * 统一类型定义系统
 * 参考 Figma、Adobe XD 和 Sketch 的节点系统设计
 * 确保类型安全和一致性
 */

// ============================================================================
// 基础几何类型
// ============================================================================

/**
 * 2D 坐标点
 */
export interface Point {
  x: number
  y: number
}

/**
 * 尺寸
 */
export interface Size {
  width: number
  height: number
}

/**
 * 矩形边界
 */
export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 边距
 */
export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

// ============================================================================
// 样式系统
// ============================================================================

/**
 * 颜色支持多种格式
 */
export type Color = string // hex, rgb, rgba, hsl, hsla

/**
 * 字体粗细
 */
export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'

/**
 * 字体样式
 */
export type FontStyle = 'normal' | 'italic' | 'oblique'

/**
 * 文本对齐
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify'

/**
 * 垂直对齐
 */
export type VerticalAlign = 'top' | 'middle' | 'bottom'

/**
 * 边框样式
 */
export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'none'

/**
 * 图片适应模式
 */
export type ImageFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'

// ============================================================================
// 元素基础接口
// ============================================================================

/**
 * 所有元素的基础接口
 * 参考 Figma 的 SceneNode 设计
 */
export interface BaseElement {
  /** 唯一标识符 */
  id: string
  /** 元素类型 */
  type: ElementType
  /** 显示名称 */
  name: string
  /** 是否锁定 */
  locked: boolean
  /** 是否可见 */
  visible: boolean
  /** 位置 */
  position: Point
  /** 尺寸 */
  size: Size
  /** 旋转角度（度） */
  rotation: number
  /** 层级索引 */
  zIndex: number
  /** 样式对象 */
  style?: ElementStyle
  /** 元数据（用于扩展） */
  metadata?: Record<string, unknown>
}

/**
 * 元素类型枚举
 */
export type ElementType = 'text' | 'image' | 'shape' | 'barcode' | 'qrcode' | 'table' | 'group'

/**
 * 通用元素样式
 */
export interface ElementStyle {
  /** 不透明度 0-1 */
  opacity?: number
  /** 混合模式 */
  blendMode?: string
  /** 阴影 */
  shadow?: Shadow
  /** 滤镜 */
  filter?: Filter
}

/**
 * 阴影定义
 */
export interface Shadow {
  color: Color
  blur: number
  offsetX: number
  offsetY: number
}

/**
 * 滤镜定义
 */
export interface Filter {
  blur?: number
  brightness?: number
  contrast?: number
  grayscale?: number
  hueRotate?: number
  invert?: number
  saturate?: number
  sepia?: number
}

// ============================================================================
// 具体元素类型
// ============================================================================

/**
 * 文本元素
 */
export interface TextElement extends BaseElement {
  type: 'text'
  /** 文本内容 */
  content: string
  /** 文本样式 */
  style?: TextStyle
}

/**
 * 文本样式
 */
export interface TextStyle extends ElementStyle {
  fontFamily?: string
  fontSize?: number
  fontWeight?: FontWeight
  fontStyle?: FontStyle
  textAlign?: TextAlign
  verticalAlign?: VerticalAlign
  color?: Color
  lineHeight?: number
  letterSpacing?: number
  textDecoration?: string
  textTransform?: string
}

/**
 * 图片元素
 */
export interface ImageElement extends BaseElement {
  type: 'image'
  /** 图片源 */
  src: string
  /** 适应模式 */
  fit: ImageFit
  /** 图片样式 */
  style?: ImageStyle
}

/**
 * 图片样式
 */
export interface ImageStyle extends ElementStyle {
  borderRadius?: number
  objectPosition?: string
}

/**
 * 形状元素
 */
export interface ShapeElement extends BaseElement {
  type: 'shape'
  /** 形状类型 */
  shape: ShapeType
  /** 形状样式 */
  style?: ShapeStyle
}

/**
 * 形状类型
 */
export type ShapeType = 'rectangle' | 'circle' | 'ellipse' | 'line' | 'polygon' | 'star'

/**
 * 形状样式
 */
export interface ShapeStyle extends ElementStyle {
  fill?: Color
  stroke?: Color
  strokeWidth?: number
  strokeDasharray?: string
  cornerRadius?: number
}

/**
 * 条形码元素
 */
export interface BarcodeElement extends BaseElement {
  type: 'barcode'
  /** 条码格式 */
  format: BarcodeFormat
  /** 条码值 */
  value: string
  /** 是否显示文本 */
  showText: boolean
  /** 条形码样式 */
  style?: BarcodeStyle
}

/**
 * 条形码格式
 */
export type BarcodeFormat = 
  | 'CODE128'
  | 'CODE39'
  | 'EAN13'
  | 'EAN8'
  | 'UPC'
  | 'ITF14'
  | 'MSI'
  | 'pharmacode'
  | 'codabar'

/**
 * 条形码样式
 */
export interface BarcodeStyle extends ElementStyle {
  background?: Color
  foreground?: Color
  fontSize?: number
  textAlign?: TextAlign
  textPosition?: 'top' | 'bottom'
  textMargin?: number
  margin?: number
  displayValue?: boolean
}

/**
 * 二维码元素
 */
export interface QRCodeElement extends BaseElement {
  type: 'qrcode'
  /** 二维码内容 */
  value: string
  /** 纠错级别 */
  errorCorrection: 'L' | 'M' | 'Q' | 'H'
  /** 二维码样式 */
  style?: QRCodeStyle
}

/**
 * 二维码样式
 */
export interface QRCodeStyle extends ElementStyle {
  foreground?: Color
  background?: Color
  margin?: number
  logo?: string
  logoSize?: number
  dotScale?: number
}

/**
 * 表格元素
 */
export interface TableElement extends BaseElement {
  type: 'table'
  /** 列定义 */
  columns: TableColumn[]
  /** 行数据 */
  rows: TableRow[]
  /** 表格样式 */
  style?: TableStyle
}

/**
 * 表格列定义
 */
export interface TableColumn {
  id: string
  key: string
  title: string
  width: number
  align?: TextAlign
  resizable?: boolean
  sortable?: boolean
}

/**
 * 表格行数据
 */
export interface TableRow {
  id: string
  cells: Record<string, TableCell | string | number>
  height?: number
}

/**
 * 表格单元格
 */
export interface TableCell {
  value: string | number
  colspan?: number
  rowspan?: number
  style?: TableCellStyle
}

/**
 * 表格样式
 */
export interface TableStyle extends ElementStyle {
  borderWidth?: number
  borderColor?: Color
  borderStyle?: BorderStyle
  cellPadding?: number
  cellSpacing?: number
  headerBackground?: Color
  headerColor?: Color
  rowBackground?: Color
  alternateRowBackground?: Color
  hoverBackground?: Color
}

/**
 * 单元格样式
 */
export interface TableCellStyle {
  background?: Color
  color?: Color
  fontWeight?: FontWeight
  fontSize?: number
  align?: TextAlign
  verticalAlign?: VerticalAlign
  borderWidth?: number
  borderColor?: Color
  borderStyle?: BorderStyle
  padding?: Padding | number
}

/**
 * 组元素（容器）
 */
export interface GroupElement extends BaseElement {
  type: 'group'
  /** 子元素ID列表 */
  children: string[]
}

// ============================================================================
// 联合类型
// ============================================================================

/**
 * 所有元素类型的联合
 */
export type TemplateElement = 
  | TextElement 
  | ImageElement 
  | ShapeElement 
  | BarcodeElement 
  | QRCodeElement 
  | TableElement
  | GroupElement

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 提取特定类型的元素
 */
export type ExtractElement<T extends ElementType> = Extract<TemplateElement, { type: T }>

/**
 * 元素类型映射
 */
export interface ElementTypeMap {
  'text': TextElement
  'image': ImageElement
  'shape': ShapeElement
  'barcode': BarcodeElement
  'qrcode': QRCodeElement
  'table': TableElement
  'group': GroupElement
}

// ============================================================================
// 类型守卫
// ============================================================================

export function isTextElement(element: TemplateElement): element is TextElement {
  return element.type === 'text'
}

export function isImageElement(element: TemplateElement): element is ImageElement {
  return element.type === 'image'
}

export function isShapeElement(element: TemplateElement): element is ShapeElement {
  return element.type === 'shape'
}

export function isBarcodeElement(element: TemplateElement): element is BarcodeElement {
  return element.type === 'barcode'
}

export function isQRCodeElement(element: TemplateElement): element is QRCodeElement {
  return element.type === 'qrcode'
}

export function isTableElement(element: TemplateElement): element is TableElement {
  return element.type === 'table'
}

export function isGroupElement(element: TemplateElement): element is GroupElement {
  return element.type === 'group'
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 获取元素的边界框
 */
export function getElementBounds(element: BaseElement): Bounds {
  return {
    x: element.position.x,
    y: element.position.y,
    width: element.size.width,
    height: element.size.height
  }
}

/**
 * 检查两个边界框是否相交
 */
export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  )
}

/**
 * 计算多个元素的边界框
 */
export function getElementsBounds(elements: BaseElement[]): Bounds | null {
  if (elements.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const element of elements) {
    const bounds = getElementBounds(element)
    minX = Math.min(minX, bounds.x)
    minY = Math.min(minY, bounds.y)
    maxX = Math.max(maxX, bounds.x + bounds.width)
    maxY = Math.max(maxY, bounds.y + bounds.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * 深拷贝元素
 */
export function cloneElement<T extends TemplateElement>(element: T): T {
  return JSON.parse(JSON.stringify(element))
}

/**
 * 生成唯一ID
 */
export function generateId(prefix: string = 'element'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}