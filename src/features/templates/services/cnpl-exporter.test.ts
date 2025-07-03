import { describe, it, expect } from 'vitest';
import { CNPLExporter } from './cnpl-exporter';
import { Template, PaperSize, PaperOrientation, TEMPLATE_VERSION } from '../types/template.types';
import { 
  TextElement, 
  ImageElement, 
  BarcodeElement, 
  QRCodeElement,
  TableElement,
  ShapeElement,
  TableRow,
  TableColumn
} from '@/types/unified.types';

describe('CNPLExporter', () => {
  const createTemplate = (elements: any[]): Template => ({
    metadata: {
      id: 'template-1',
      name: 'Test Template',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: TEMPLATE_VERSION,
    },
    pageSettings: {
      size: PaperSize.A4,
      width: 210,
      height: 297,
      orientation: PaperOrientation.PORTRAIT,
      margins: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
      },
    },
    content: {
      elements,
    },
  });
  
  it('应该导出基本的 CNPL 结构', () => {
    const template = createTemplate([]);
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<layout>');
    expect(result).toContain('</layout>');
    expect(result).toContain('<page width="210" height="297">');
    expect(result).toContain('</page>');
  });
  
  it('应该导出文本元素', () => {
    const template = createTemplate([
      {
        id: 'text-1',
        type: 'text',
        name: 'Text Element',
        locked: false,
        visible: true,
        position: { x: 10, y: 20 },
        size: { width: 100, height: 30 },
        rotation: 45,
        zIndex: 1,
        content: 'Hello World',
        style: {
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#FF0000',
          textAlign: 'center',
          fontWeight: 'bold',
          fontStyle: 'italic',
        },
      } as TextElement,
    ]);
    
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('<text');
    expect(result).toContain('left="10"');
    expect(result).toContain('top="20"');
    expect(result).toContain('width="100"');
    expect(result).toContain('height="30"');
    expect(result).toContain('rotate="45"');
    expect(result).toContain('font.size="16"');
    expect(result).toContain('font.family="Arial"');
    expect(result).toContain('font.color="#FF0000"');
    expect(result).toContain('text.align="center"');
    expect(result).toContain('font.bold="true"');
    expect(result).toContain('font.italic="true"');
    expect(result).toContain('>Hello World</text>');
  });
  
  it('应该转义 XML 特殊字符', () => {
    const template = createTemplate([
      {
        id: 'text-1',
        type: 'text',
        name: 'Text Element',
        locked: false,
        visible: true,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 20 },
        rotation: 0,
        zIndex: 1,
        content: 'Test & <special> "chars" \'here\'',
      } as TextElement,
    ]);
    
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('Test &amp; &lt;special&gt; &quot;chars&quot; &apos;here&apos;');
  });
  
  it('应该导出图片元素', () => {
    const template = createTemplate([
      {
        id: 'image-1',
        type: 'image',
        name: 'Image Element',
        locked: false,
        visible: true,
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        rotation: 90,
        zIndex: 1,
        src: 'https://example.com/image.png',
        fit: 'contain',
      } as ImageElement,
    ]);
    
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('<image');
    expect(result).toContain('src="https://example.com/image.png"');
    expect(result).toContain('rotate="90"');
    expect(result).toContain('/>');
  });
  
  it('应该导出形状元素（矩形）', () => {
    const template = createTemplate([
      {
        id: 'shape-1',
        type: 'shape',
        name: 'Rectangle',
        locked: false,
        visible: true,
        position: { x: 10, y: 10 },
        size: { width: 50, height: 50 },
        rotation: 0,
        zIndex: 1,
        shape: 'rectangle',
        style: {
          fill: '#FF0000',
          stroke: '#000000',
          strokeWidth: 2,
        },
      } as ShapeElement,
    ]);
    
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('<rect');
    expect(result).toContain('fill.color="#FF0000"');
    expect(result).toContain('line.color="#000000"');
    expect(result).toContain('line.width="2"');
  });
  
  it('应该导出形状元素（线条）', () => {
    const template = createTemplate([
      {
        id: 'shape-2',
        type: 'shape',
        name: 'Line',
        locked: false,
        visible: true,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 0 },
        rotation: 0,
        zIndex: 1,
        shape: 'line',
        style: {
          stroke: '#000000',
          strokeWidth: 1,
        },
      } as ShapeElement,
    ]);
    
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('<line');
    expect(result).toContain('line.color="#000000"');
    expect(result).toContain('line.width="1"');
  });
  
  it('应该导出表格元素', () => {
    const template = createTemplate([
      {
        id: 'table-1',
        type: 'table',
        name: 'Table Element',
        locked: false,
        visible: true,
        position: { x: 10, y: 10 },
        size: { width: 200, height: 100 },
        rotation: 0,
        zIndex: 1,
        columns: [
          { id: 'col1', key: 'header1', title: 'Header 1', width: 100, align: 'left' },
          { id: 'col2', key: 'header2', title: 'Header 2', width: 100, align: 'center' }
        ] as TableColumn[],
        rows: [
          {
            id: 'row1',
            cells: {
              header1: 'Header 1',
              header2: 'Header 2'
            }
          },
          {
            id: 'row2', 
            cells: {
              header1: 'Cell 1',
              header2: 'Cell 2'
            }
          }
        ] as TableRow[],
      } as TableElement,
    ]);
    
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('<table');
    expect(result).toContain('<tr>');
    expect(result).toContain('<th text.align="left">Header 1</th>');
    expect(result).toContain('<th text.align="center">Header 2</th>');
    expect(result).toContain('<td text.align="left">Cell 1</td>');
    expect(result).toContain('<td text.align="center">Cell 2</td>');
    expect(result).toContain('</table>');
  });
  
  it('应该导出条码元素', () => {
    const template = createTemplate([
      {
        id: 'barcode-1',
        type: 'barcode',
        name: 'Barcode Element',
        locked: false,
        visible: true,
        position: { x: 10, y: 10 },
        size: { width: 100, height: 50 },
        rotation: 0,
        zIndex: 1,
        format: 'CODE128',
        value: '1234567890',
        showText: true,
      } as BarcodeElement,
    ]);
    
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('<barcode');
    expect(result).toContain('type="CODE128"');
    expect(result).toContain('text.visible="true"');
    expect(result).toContain('>1234567890</barcode>');
  });
  
  it('应该处理多个元素', () => {
    const template = createTemplate([
      {
        id: 'text-1',
        type: 'text',
        name: 'Text 1',
        locked: false,
        visible: true,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 20 },
        rotation: 0,
        zIndex: 1,
        content: 'Text 1',
      } as TextElement,
      {
        id: 'text-2',
        type: 'text',
        name: 'Text 2',
        locked: false,
        visible: true,
        position: { x: 0, y: 30 },
        size: { width: 100, height: 20 },
        rotation: 0,
        zIndex: 2,
        content: 'Text 2',
      } as TextElement,
    ]);
    
    const result = CNPLExporter.export(template);
    const textCount = (result.match(/<text/g) || []).length;
    
    expect(textCount).toBe(2);
    expect(result).toContain('Text 1');
    expect(result).toContain('Text 2');
  });

  it('应该导出二维码元素', () => {
    const template = createTemplate([
      {
        id: 'qrcode-1',
        type: 'qrcode',
        name: 'QRCode Element',
        locked: false,
        visible: true,
        position: { x: 10, y: 10 },
        size: { width: 50, height: 50 },
        rotation: 0,
        zIndex: 1,
        value: 'https://example.com',
        errorCorrection: 'M',
      } as QRCodeElement,
    ]);
    
    const result = CNPLExporter.export(template);
    
    // QRCode 在 CNPL 中使用 barcode 标签，type="QRCode"
    expect(result).toContain('<barcode');
    expect(result).toContain('type="QRCode"');
    expect(result).toContain('error.level="M"');
    expect(result).toContain('>https://example.com</barcode>');
  });
});