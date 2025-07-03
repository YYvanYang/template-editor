import { generateId } from '@/types/unified.types'
import type { 
  TextElement, 
  ShapeElement, 
  ImageElement, 
  BarcodeElement, 
  TableElement,
  QRCodeElement,
  TableRow,
  TableColumn
} from '@/types/unified.types'

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
    position: { x: position.x, y: position.y },
    size: { width: 200, height: 50 },
    rotation: 0,
    zIndex: 0,
    content: 'Double-click to edit',
    style: {
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
    position: { x: position.x, y: position.y },
    size: { width: 100, height: 100 },
    rotation: 0,
    zIndex: 0,
    shape: 'rectangle',
    style: {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      strokeDasharray: ''
    }
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
    position: { x: position.x, y: position.y },
    size: { width: 200, height: 150 },
    rotation: 0,
    zIndex: 0,
    src: '',
    fit: 'contain',
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
    position: { x: position.x, y: position.y },
    size: { width: 200, height: 80 },
    rotation: 0,
    zIndex: 0,
    format: 'CODE128',
    value: '123456789',
    showText: true,
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
    key: `col${i}`,
    title: `Column ${i + 1}`,
    width: 100,
    align: 'left' as const,
  }))

  // 创建行数据
  const tableRows: TableRow[] = Array.from({ length: rows }, (_, rowIndex) => {
    const cells: Record<string, any> = {}
    columns.forEach((col, colIndex) => {
      cells[col.key] = rowIndex === 0 ? `Header ${colIndex + 1}` : `Cell ${rowIndex}-${colIndex + 1}`
    })

    return {
      id: `row-${rowIndex}`,
      cells,
    }
  })

  return {
    id: generateId('table'),
    type: 'table',
    name: 'Table',
    locked: false,
    visible: true,
    position: { x: position.x, y: position.y },
    size: { width: cols * 100, height: rows * 50 },
    rotation: 0,
    zIndex: 0,
    columns,
    rows: tableRows,
    style: {
      borderWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      cellPadding: 8,
      cellSpacing: 0,
      headerBackground: '#f5f5f5',
      headerColor: '#000000',
      rowBackground: '#ffffff',
      alternateRowBackground: '#fafafa',
    }
  }
}

/**
 * 创建二维码元素
 */
export function createQRCodeElement(position: { x: number; y: number }): QRCodeElement {
  return {
    id: generateId('qrcode'),
    type: 'qrcode',
    name: 'QR Code',
    locked: false,
    visible: true,
    position: { x: position.x, y: position.y },
    size: { width: 100, height: 100 },
    rotation: 0,
    zIndex: 0,
    value: 'https://example.com',
    errorCorrection: 'M',
  }
}