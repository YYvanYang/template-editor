import type { BaseElementData } from './base.types';

/**
 * 表格列定义（基于CNPL规范）
 */
export interface TableColumn {
  /** 列唯一标识 */
  id: string;
  /** 列标题（对应th的value） */
  title: string;
  /** 数据字段名（用于数据绑定） */
  field?: string;
  /** 列宽度（支持固定值mm或百分比） */
  width: string | number;
  /** 内容对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 垂直对齐方式 */
  valign?: 'top' | 'middle' | 'bottom';
  /** 格式化模板（支持数据绑定语法） */
  formatter?: string;
  /** 列样式 */
  style?: TableCellStyle;
}

/**
 * 表格单元格定义（基于CNPL规范）
 */
export interface TableCell {
  /** 单元格内容（支持文本或数据绑定表达式） */
  content: string;
  /** 跨列数 */
  colspan?: number;
  /** 跨行数 */
  rowspan?: number;
  /** 单元格宽度 */
  width?: string | number;
  /** 单元格高度 */
  height?: string | number;
  /** 单元格样式 */
  style?: TableCellStyle;
}

/**
 * 表格行定义（基于CNPL规范）
 */
export interface TableRow {
  /** 行类型 */
  type: 'header' | 'data';
  /** 单元格列表 */
  cells: TableCell[];
  /** 行高度 */
  height?: number;
  /** 行样式 */
  style?: TableRowStyle;
}

/**
 * 表格边框样式（基于CNPL规范）
 */
export interface TableBorderStyle {
  /** 边框宽度（支持四边分别设置） */
  width: number | string;
  /** 边框样式 */
  style: 'solid' | 'dashed' | 'dotted' | 'none';
}

/**
 * 单元格样式
 */
export interface TableCellStyle {
  /** 内边距 */
  padding?: number | string;
  /** 背景色 */
  backgroundColor?: string;
  /** 文字颜色 */
  color?: string;
  /** 字体大小 */
  fontSize?: number;
  /** 字体粗细 */
  fontWeight?: 'normal' | 'bold';
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 垂直对齐 */
  valign?: 'top' | 'middle' | 'bottom';
}

/**
 * 行样式
 */
export interface TableRowStyle {
  /** 背景色 */
  backgroundColor?: string;
  /** 高度 */
  height?: number;
}

/**
 * 表格样式定义（基于CNPL规范）
 */
export interface TableStyle {
  /** 外边框宽度 */
  borderWidth?: number | string;
  /** 外边框样式 */
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  /** 表头边框宽度 */
  headerBorderWidth?: number | string;
  /** 表头边框样式 */
  headerBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  /** 单元格边框宽度 */
  cellBorderWidth?: number | string;
  /** 单元格边框样式 */
  cellBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  /** 边框颜色 */
  borderColor?: string;
  /** 字体家族 */
  fontFamily?: string;
  /** 字体大小 */
  fontSize?: number;
  /** 文字颜色 */
  color?: string;
}

/**
 * 表格数据源定义
 */
export interface TableDataSource {
  /** 数据源类型 */
  type: 'static' | 'dynamic';
  /** 静态行数据 */
  staticRows?: TableRow[];
  /** 动态数据绑定表达式（用于生成行） */
  binding?: string;
  /** 行模板（定义如何渲染每一行） */
  rowTemplate?: TableRow;
}

/**
 * 表格元素定义（基于CNPL规范）
 */
export interface TableElement extends BaseElementData {
  type: 'table';
  /** 列定义（可选，通过th定义） */
  columns?: TableColumn[];
  /** 表格行（包括表头和数据行） */
  rows: TableRow[];
  /** 数据源（用于动态生成行） */
  dataSource?: TableDataSource;
  /** 表格样式 */
  tableStyle?: TableStyle;
  /** 是否允许分页（对应CNPL的splitable） */
  splitable?: boolean;
}

/**
 * 表格渲染上下文
 */
export interface TableRenderContext {
  /** 当前行索引 */
  rowIndex: number;
  /** 当前列索引 */
  columnIndex: number;
  /** 当前行数据 */
  rowData: any;
  /** 当前单元格值 */
  value: any;
  /** 表格元素 */
  table: TableElement;
  /** 列定义 */
  column: TableColumn;
}

/**
 * 表格事件
 */
export interface TableEvents {
  /** 单元格点击 */
  onCellClick?: (context: TableRenderContext) => void;
  /** 行选择变化 */
  onSelectionChange?: (selectedRows: TableRow[]) => void;
  /** 列宽调整 */
  onColumnResize?: (columnId: string, newWidth: number) => void;
}

/**
 * 表格渲染选项
 */
export interface TableRenderOptions {
  /** 是否启用虚拟滚动 */
  virtualScroll?: boolean;
  /** 缓冲区大小 */
  bufferSize?: number;
  /** 是否启用列宽自动计算 */
  autoColumnWidth?: boolean;
  /** 最小列宽 */
  minColumnWidth?: number;
  /** 最大列宽 */
  maxColumnWidth?: number;
}

/**
 * 表格单元格渲染器
 */
export type TableCellRenderer = (context: TableRenderContext) => string | React.ReactNode;

/**
 * 表格默认值（基于CNPL规范）
 */
export const TABLE_DEFAULTS = {
  borderWidth: '1pt',
  borderStyle: 'solid' as const,
  borderColor: '#000000',
  cellBorderWidth: '1pt',
  cellBorderStyle: 'solid' as const,
  fontSize: 8, // CNPL默认8pt
  fontFamily: '宋体',
  color: '#000000',
  padding: 2, // 默认2mm内边距
} as const;