// 画布状态
export interface CanvasState {
  zoom: number
  offset: { x: number; y: number }
  gridEnabled: boolean
  snapEnabled: boolean
  // 对齐系统配置
  alignmentEnabled: boolean
  alignmentThreshold: number
  showAlignmentGuides: boolean
  magneticSnap: boolean
  magneticCurve: 'linear' | 'quadratic' | 'cubic' | 'exponential'
  showMeasurements: boolean
  showPerformanceMonitor: boolean
}

// 基础元素接口
export interface BaseElement {
  id: string
  type: ElementType
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  locked: boolean
  visible: boolean
  zIndex: number
}

// 元素类型
export type ElementType = 'text' | 'image' | 'shape' | 'table' | 'barcode' | 'qrcode'

// 文本元素
export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  style: TextStyle
}

// 图片元素
export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  fit: 'contain' | 'cover' | 'fill' | 'none'
}

// 形状元素
export interface ShapeElement extends BaseElement {
  type: 'shape'
  shape: 'rectangle' | 'circle' | 'line'
  style: ShapeStyle
}

// 表格元素
export interface TableElement extends BaseElement {
  type: 'table'
  columns: TableColumn[]
  rows: TableRow[]
  style: TableStyle
}

// 条形码元素
export interface BarcodeElement extends BaseElement {
  type: 'barcode'
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC'
  value: string
  showText: boolean
}

// 二维码元素
export interface QRCodeElement extends BaseElement {
  type: 'qrcode'
  value: string
  errorCorrection: 'L' | 'M' | 'Q' | 'H'
}

// 所有元素类型的联合
export type TemplateElement = 
  | TextElement 
  | ImageElement 
  | ShapeElement 
  | TableElement 
  | BarcodeElement 
  | QRCodeElement

// 样式定义
export interface TextStyle {
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline' | 'line-through'
  color?: string
  backgroundColor?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  lineHeight?: number
  letterSpacing?: number
}

export interface ShapeStyle {
  fill?: string
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  opacity?: number
}

export interface TableStyle {
  borderWidth?: number
  borderColor?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  cellPadding?: number
}

export interface TableColumn {
  id: string
  key: string
  title: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

export interface TableRow {
  id: string
  cells: Record<string, any>
}

// 编辑器快照（用于历史记录）
export interface EditorSnapshot {
  elements: Map<string, TemplateElement>
  selectedIds: Set<string>
}

// 模板元数据
export interface TemplateMetadata {
  id: string
  name: string
  size: { width: number; height: number }
  unit: 'mm' | 'px'
}

// 编辑器状态
export interface EditorState {
  canvas: CanvasState
  elements: Map<string, TemplateElement>
  selectedIds: Set<string>
  history: {
    past: EditorSnapshot[]
    future: EditorSnapshot[]
  }
  template: TemplateMetadata
}

// 元素更新类型
export type ElementUpdate = Partial<Omit<TemplateElement, 'id' | 'type'>>