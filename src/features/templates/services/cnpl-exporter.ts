/**
 * CNPL (Cainiao Print Language) 导出器
 * 根据菜鸟云打印标记语言规范导出模板
 */

import { Template } from '../types/template.types';
import { ElementType, BaseElement } from '@/features/elements/types';
import { TextElement } from '@/features/elements/types/text.types';
import { ImageElement } from '@/features/elements/types/image.types';
import { ShapeElement } from '@/features/elements/types/shape.types';
import { TableElement } from '@/features/elements/table/TableElement';
import { BarcodeElement } from '@/features/elements/barcode/BarcodeElement';

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
  private static exportElements(elements: BaseElement[], indent: number): string {
    return elements
      .map(element => this.exportElement(element, indent))
      .join('\n');
  }
  
  /**
   * 导出单个元素
   */
  private static exportElement(element: BaseElement, indent: number): string {
    const indentStr = ' '.repeat(indent);
    
    switch (element.type) {
      case ElementType.TEXT:
        return this.exportTextElement(element as TextElement, indentStr);
      
      case ElementType.IMAGE:
        return this.exportImageElement(element as ImageElement, indentStr);
      
      case ElementType.SHAPE:
        return this.exportShapeElement(element as ShapeElement, indentStr);
      
      case ElementType.TABLE:
        return this.exportTableElement(element as TableElement, indentStr);
      
      case ElementType.BARCODE:
        return this.exportBarcodeElement(element as BarcodeElement, indentStr);
      
      default:
        console.warn(`Unsupported element type: ${element.type}`);
        return '';
    }
  }
  
  /**
   * 导出文本元素
   */
  private static exportTextElement(element: TextElement, indent: string): string {
    const style = element.style || {};
    const attrs = [
      `left="${element.x}"`,
      `top="${element.y}"`,
      `width="${element.width}"`,
      `height="${element.height}"`,
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
      `left="${element.x}"`,
      `top="${element.y}"`,
      `width="${element.width}"`,
      `height="${element.height}"`,
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
      `left="${element.x}"`,
      `top="${element.y}"`,
      `width="${element.width}"`,
      `height="${element.height}"`,
    ];
    
    if (element.rotation) {
      attrs.push(`rotate="${element.rotation}"`);
    }
    
    const style = element.style || {};
    if (style.strokeWidth) {
      attrs.push(`line.width="${style.strokeWidth}"`);
    }
    
    if (style.stroke) {
      attrs.push(`line.color="${style.stroke}"`);
    }
    
    // CNPL 使用 rect 和 line 标签
    if (element.shapeType === 'line') {
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
      `left="${element.x}"`,
      `top="${element.y}"`,
      `width="${element.width}"`,
      `height="${element.height}"`,
    ];
    
    const rows = element.rows || [];
    const rowsContent = rows.map((row, rowIndex) => {
      const cells = row.cells.map((cell, cellIndex) => {
        const cellAttrs = [];
        if (cell.colspan > 1) cellAttrs.push(`colspan="${cell.colspan}"`);
        if (cell.rowspan > 1) cellAttrs.push(`rowspan="${cell.rowspan}"`);
        if (cell.style?.textAlign) cellAttrs.push(`text.align="${cell.style.textAlign}"`);
        
        const cellType = rowIndex === 0 ? 'th' : 'td';
        const content = this.escapeXML(cell.content || '');
        
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
      `left="${element.x}"`,
      `top="${element.y}"`,
      `width="${element.width}"`,
      `height="${element.height}"`,
      `type="${element.barcodeType}"`,
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