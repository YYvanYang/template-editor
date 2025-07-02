import type { 
  TextElement, 
  ShapeElement, 
  ImageElement, 
  BarcodeElement, 
  TableElement,
  TableRow,
  TableCell,
  TableColumn
} from '@/types/template.types'

/**
 * 生成唯一ID
 */
let idCounter = 0
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`
}

/**
 * 创建文本元素
 */
export function createTextElement(position: { x: number; y: number }): TextElement {
  return {
    id: generateId('text'),
    type: 'text',
    name: 'Text',
    locked: false,
    visible: true,
    x: position.x,
    y: position.y,
    width: 200,
    height: 50,
    rotation: 0,
    opacity: 1,
    content: 'Double-click to edit',
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    verticalAlign: 'top',
    color: '#000000',
    lineHeight: 1.2,
  }
}

/**
 * 创建矩形元素
 */
export function createRectangleElement(position: { x: number; y: number }): ShapeElement {
  return {
    id: generateId('rect'),
    type: 'shape',
    name: 'Rectangle',
    locked: false,
    visible: true,
    x: position.x,
    y: position.y,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    shapeType: 'rectangle',
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 1,
    strokeDasharray: [],
    cornerRadius: 0,
  }
}

/**
 * 创建图片元素
 */
export function createImageElement(position: { x: number; y: number }): ImageElement {
  return {
    id: generateId('image'),
    type: 'image',
    name: 'Image',
    locked: false,
    visible: true,
    x: position.x,
    y: position.y,
    width: 200,
    height: 150,
    rotation: 0,
    opacity: 1,
    src: '',
    fit: 'contain',
    crossOrigin: 'anonymous',
  }
}

/**
 * 创建条形码元素
 */
export function createBarcodeElement(position: { x: number; y: number }): BarcodeElement {
  return {
    id: generateId('barcode'),
    type: 'barcode',
    name: 'Barcode',
    locked: false,
    visible: true,
    x: position.x,
    y: position.y,
    width: 200,
    height: 80,
    rotation: 0,
    opacity: 1,
    format: 'CODE128',
    value: '123456789',
    showText: true,
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 2,
    fontSize: 12,
    background: '#ffffff',
    lineColor: '#000000',
    margin: 10,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
  }
}

/**
 * 创建表格元素
 */
export function createTableElement(
  position: { x: number; y: number },
  rows: number = 3,
  cols: number = 3
): TableElement {
  // 创建列定义
  const columns: TableColumn[] = Array.from({ length: cols }, (_, i) => ({
    id: `col-${i}`,
    width: 100,
    minWidth: 50,
    align: 'left' as const,
  }))

  // 创建行数据
  const tableRows: TableRow[] = Array.from({ length: rows }, (_, rowIndex) => {
    const cells: TableCell[] = Array.from({ length: cols }, (_, colIndex) => {
      const isHeader = rowIndex === 0
      return {
        id: `cell-${rowIndex}-${colIndex}`,
        columnId: `col-${colIndex}`,
        type: isHeader ? 'th' : 'td',
        content: isHeader ? `Header ${colIndex + 1}` : `Cell ${rowIndex}-${colIndex + 1}`,
        rowSpan: 1,
        colSpan: 1,
        style: {
          textAlign: 'left',
          verticalAlign: 'middle',
          fontWeight: isHeader ? 'bold' : 'normal',
          backgroundColor: isHeader ? '#f0f0f0' : '#ffffff',
          color: '#000000',
          fontSize: 14,
          padding: 8,
        },
      }
    })

    return {
      id: `row-${rowIndex}`,
      height: 50,
      cells,
    }
  })

  return {
    id: generateId('table'),
    type: 'table',
    name: 'Table',
    locked: false,
    visible: true,
    x: position.x,
    y: position.y,
    width: cols * 100,
    height: rows * 50,
    rotation: 0,
    opacity: 1,
    rows: tableRows,
    columns,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    cellPadding: 8,
    cellSpacing: 0,
    showHeader: true,
    headerBackground: '#f0f0f0',
    alternateRowBackground: false,
    alternateRowColor: '#f9f9f9',
  }
}