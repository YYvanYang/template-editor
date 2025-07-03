/**
 * CNPL (Cainiao Print Language) 导出器
 * 根据菜鸟云打印标记语言规范导出模板
 */

import { Template } from '../types/template.types';
import { 
  TemplateElement, 
  TextElement, 
  ImageElement, 
  ShapeElement, 
  TableElement, 
  BarcodeElement,
  QRCodeElement,
  isTextElement,
  isImageElement,
  isShapeElement,
  isTableElement,
  isBarcodeElement,
  isQRCodeElement,
  TableRow,
  TableCell,
  TableColumn,
  TextStyle,
  ShapeStyle
} from '@/types/unified.types';

export class CNPLExporter {
  /**
   * 导出模板为 CNPL 格式
   */
  static export(template: Template): string {
    const { pageSettings, content } = template;
    
    // 构建 CNPL 文档
    const cnpl = `<?xml version="1.0" encoding="UTF-8"?>
<layout>
  <page width="${pageSettings.width}" height="${pageSettings.height}">
${this.exportElements(content.elements, 4)}
  </page>
</layout>`;
    
    return cnpl;
  }
  
  /**
   * 导出元素列表
   */
  private static exportElements(elements: TemplateElement[], indent: number): string {
    return elements
      .map(element => this.exportElement(element, indent))
      .join('\n');
  }
  
  /**
   * 导出单个元素
   */
  private static exportElement(element: TemplateElement, indent: number): string {
    const indentStr = ' '.repeat(indent);
    
    if (isTextElement(element)) {
      return this.exportTextElement(element, indentStr);
    }
    
    if (isImageElement(element)) {
      return this.exportImageElement(element, indentStr);
    }
    
    if (isShapeElement(element)) {
      return this.exportShapeElement(element, indentStr);
    }
    
    if (isTableElement(element)) {
      return this.exportTableElement(element, indentStr);
    }
    
    if (isBarcodeElement(element)) {
      return this.exportBarcodeElement(element, indentStr);
    }
    
    if (isQRCodeElement(element)) {
      return this.exportQRCodeElement(element, indentStr);
    }
    
    console.warn(`Unsupported element type: ${element.type}`);
    return '';
  }
  
  /**
   * 导出文本元素
   */
  private static exportTextElement(element: TextElement, indent: string): string {
    const style = element.style as TextStyle || {};
    const attrs = [
      `left="${element.position.x}"`,
      `top="${element.position.y}"`,
      `width="${element.size.width}"`,
      `height="${element.size.height}"`,
    ];
    
    if (element.rotation) {
      attrs.push(`rotate="${element.rotation}"`);
    }
    
    if (style.fontSize) {
      attrs.push(`font.size="${style.fontSize}"`);
    }
    
    if (style.fontFamily) {
      attrs.push(`font.family="${style.fontFamily}"`);
    }
    
    if (style.color) {
      attrs.push(`font.color="${style.color}"`);
    }
    
    if (style.textAlign) {
      attrs.push(`text.align="${style.textAlign}"`);
    }
    
    if (style.fontWeight === 'bold') {
      attrs.push(`font.bold="true"`);
    }
    
    if (style.fontStyle === 'italic') {
      attrs.push(`font.italic="true"`);
    }
    
    const content = this.escapeXML(element.content || '');
    
    return `${indent}<text ${attrs.join(' ')}>${content}</text>`;
  }
  
  /**
   * 导出图片元素
   */
  private static exportImageElement(element: ImageElement, indent: string): string {
    const attrs = [
      `left="${element.position.x}"`,
      `top="${element.position.y}"`,
      `width="${element.size.width}"`,
      `height="${element.size.height}"`,
      `src="${element.src || ''}"`,
    ];
    
    if (element.rotation) {
      attrs.push(`rotate="${element.rotation}"`);
    }
    
    return `${indent}<image ${attrs.join(' ')} />`;
  }
  
  /**
   * 导出形状元素
   */
  private static exportShapeElement(element: ShapeElement, indent: string): string {
    const attrs = [
      `left="${element.position.x}"`,
      `top="${element.position.y}"`,
      `width="${element.size.width}"`,
      `height="${element.size.height}"`,
    ];
    
    if (element.rotation) {
      attrs.push(`rotate="${element.rotation}"`);
    }
    
    const style = element.style as ShapeStyle || {};
    if (style.strokeWidth) {
      attrs.push(`line.width="${style.strokeWidth}"`);
    }
    
    if (style.stroke) {
      attrs.push(`line.color="${style.stroke}"`);
    }
    
    // CNPL 使用 rect 和 line 标签
    if (element.shape === 'line') {
      return `${indent}<line ${attrs.join(' ')} />`;
    } else {
      if (style.fill && style.fill !== 'transparent') {
        attrs.push(`fill.color="${style.fill}"`);
      }
      return `${indent}<rect ${attrs.join(' ')} />`;
    }
  }
  
  /**
   * 导出表格元素
   */
  private static exportTableElement(element: TableElement, indent: string): string {
    const attrs = [
      `left="${element.position.x}"`,
      `top="${element.position.y}"`,
      `width="${element.size.width}"`,
      `height="${element.size.height}"`,
    ];
    
    const rows = element.rows || [];
    const columns = element.columns || [];
    
    const rowsContent = rows.map((row: TableRow, rowIndex: number) => {
      const cells = columns.map((col: TableColumn) => {
        const cellData = row.cells[col.key];
        let cellContent = '';
        
        // 处理不同类型的单元格数据
        if (typeof cellData === 'string' || typeof cellData === 'number') {
          cellContent = String(cellData);
        } else if (cellData && typeof cellData === 'object') {
          const cell = cellData as TableCell;
          cellContent = String(cell.value || '');
        }
        
        const cellAttrs = [];
        
        if (col.align) cellAttrs.push(`text.align="${col.align}"`);
        
        const cellType = rowIndex === 0 ? 'th' : 'td';
        const content = this.escapeXML(cellContent);
        
        return `      <${cellType}${cellAttrs.length ? ' ' + cellAttrs.join(' ') : ''}>${content}</${cellType}>`;
      }).join('\n');
      
      return `    <tr>\n${cells}\n    </tr>`;
    }).join('\n');
    
    return `${indent}<table ${attrs.join(' ')}>\n${rowsContent}\n${indent}</table>`;
  }
  
  /**
   * 导出条码元素
   */
  private static exportBarcodeElement(element: BarcodeElement, indent: string): string {
    const attrs = [
      `left="${element.position.x}"`,
      `top="${element.position.y}"`,
      `width="${element.size.width}"`,
      `height="${element.size.height}"`,
      `type="${element.format || 'CODE128'}"`,
    ];
    
    if (element.rotation) {
      attrs.push(`rotate="${element.rotation}"`);
    }
    
    if (element.showText !== undefined) {
      attrs.push(`text.visible="${element.showText}"`);
    }
    
    const content = this.escapeXML(element.value || '');
    
    return `${indent}<barcode ${attrs.join(' ')}>${content}</barcode>`;
  }
  
  /**
   * 导出二维码元素
   */
  private static exportQRCodeElement(element: QRCodeElement, indent: string): string {
    const attrs = [
      `left="${element.position.x}"`,
      `top="${element.position.y}"`,
      `width="${element.size.width}"`,
      `height="${element.size.height}"`,
      `type="QRCode"`,
    ];
    
    if (element.rotation) {
      attrs.push(`rotate="${element.rotation}"`);
    }
    
    if (element.errorCorrection) {
      attrs.push(`error.level="${element.errorCorrection}"`);
    }
    
    const content = this.escapeXML(element.value || '');
    
    return `${indent}<barcode ${attrs.join(' ')}>${content}</barcode>`;
  }
  
  /**
   * 转义 XML 特殊字符
   */
  private static escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}