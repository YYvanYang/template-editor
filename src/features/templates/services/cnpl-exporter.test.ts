import { describe, it, expect } from 'vitest';
import { CNPLExporter } from './cnpl-exporter';
import { Template, PaperSize, PaperOrientation, TEMPLATE_VERSION } from '../types/template.types';
import { ElementType } from '@/features/elements/types';
import { BarcodeType } from '@/features/elements/barcode/BarcodeElement';

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
        type: ElementType.TEXT,
        x: 10,
        y: 20,
        width: 100,
        height: 30,
        rotation: 45,
        content: 'Hello World',
        style: {
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#FF0000',
          textAlign: 'center',
          fontWeight: 'bold',
          fontStyle: 'italic',
        },
      },
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
        type: ElementType.TEXT,
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        content: 'Test & <special> "chars" \'here\'',
      },
    ]);
    
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('Test &amp; &lt;special&gt; &quot;chars&quot; &apos;here&apos;');
  });
  
  it('应该导出图片元素', () => {
    const template = createTemplate([
      {
        id: 'image-1',
        type: ElementType.IMAGE,
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 90,
        src: 'https://example.com/image.png',
      },
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
        type: ElementType.SHAPE,
        shapeType: 'rectangle',
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        style: {
          fill: '#FF0000',
          stroke: '#000000',
          strokeWidth: 2,
        },
      },
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
        type: ElementType.SHAPE,
        shapeType: 'line',
        x: 0,
        y: 0,
        width: 100,
        height: 0,
        style: {
          stroke: '#000000',
          strokeWidth: 1,
        },
      },
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
        type: ElementType.TABLE,
        x: 10,
        y: 10,
        width: 200,
        height: 100,
        rows: [
          {
            cells: [
              { content: 'Header 1', colspan: 1, rowspan: 1 },
              { content: 'Header 2', colspan: 2, rowspan: 1, style: { textAlign: 'center' } },
            ],
          },
          {
            cells: [
              { content: 'Cell 1', colspan: 1, rowspan: 1 },
              { content: 'Cell 2', colspan: 1, rowspan: 1 },
              { content: 'Cell 3', colspan: 1, rowspan: 1 },
            ],
          },
        ],
      },
    ]);
    
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('<table');
    expect(result).toContain('<tr>');
    expect(result).toContain('<th>Header 1</th>');
    expect(result).toContain('<th colspan="2" text.align="center">Header 2</th>');
    expect(result).toContain('<td>Cell 1</td>');
    expect(result).toContain('</table>');
  });
  
  it('应该导出条码元素', () => {
    const template = createTemplate([
      {
        id: 'barcode-1',
        type: ElementType.BARCODE,
        x: 10,
        y: 10,
        width: 100,
        height: 50,
        rotation: 0,
        barcodeType: BarcodeType.CODE128,
        value: '1234567890',
        showText: true,
      },
    ]);
    
    const result = CNPLExporter.export(template);
    
    expect(result).toContain('<barcode');
    expect(result).toContain('type="code128"');
    expect(result).toContain('text.visible="true"');
    expect(result).toContain('>1234567890</barcode>');
  });
  
  it('应该处理多个元素', () => {
    const template = createTemplate([
      {
        id: 'text-1',
        type: ElementType.TEXT,
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        content: 'Text 1',
      },
      {
        id: 'text-2',
        type: ElementType.TEXT,
        x: 0,
        y: 30,
        width: 100,
        height: 20,
        content: 'Text 2',
      },
    ]);
    
    const result = CNPLExporter.export(template);
    const textCount = (result.match(/<text/g) || []).length;
    
    expect(textCount).toBe(2);
    expect(result).toContain('Text 1');
    expect(result).toContain('Text 2');
  });
});