/**
 * CNPL 导出器使用示例
 */

import { CNPLExporter } from './cnpl-exporter';
import { Template, PaperSize, PaperOrientation } from '../types/template.types';
import { 
  TextElement, 
  ImageElement, 
  BarcodeElement, 
  QRCodeElement,
  TableElement,
  ShapeElement
} from '@/types/unified.types';

// 创建一个快递面单模板
const expressTemplate: Template = {
  metadata: {
    id: 'express-template-001',
    name: '快递电子面单模板',
    description: '标准快递电子面单，包含寄件人、收件人信息和条码',
    category: '快递物流',
    tags: ['快递', '电子面单', '物流'],
    author: 'Template Editor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0'
  },
  pageSettings: {
    size: PaperSize.EXPRESS_100_180,
    width: 100,
    height: 180,
    orientation: PaperOrientation.PORTRAIT,
    margins: {
      top: 5,
      right: 5,
      bottom: 5,
      left: 5
    }
  },
  content: {
    elements: [
      // 标题
      {
        id: 'title',
        type: 'text',
        name: '快递公司名称',
        locked: false,
        visible: true,
        position: { x: 10, y: 10 },
        size: { width: 80, height: 10 },
        rotation: 0,
        zIndex: 1,
        content: '{{companyName}}',
        style: {
          fontSize: 18,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#000000'
        }
      } as TextElement,

      // 分割线
      {
        id: 'divider1',
        type: 'shape',
        name: '分割线',
        locked: false,
        visible: true,
        position: { x: 5, y: 25 },
        size: { width: 90, height: 1 },
        rotation: 0,
        zIndex: 2,
        shape: 'line',
        style: {
          stroke: '#000000',
          strokeWidth: 1
        }
      } as ShapeElement,

      // 寄件人信息
      {
        id: 'sender-info',
        type: 'text',
        name: '寄件人信息',
        locked: false,
        visible: true,
        position: { x: 10, y: 30 },
        size: { width: 80, height: 30 },
        rotation: 0,
        zIndex: 3,
        content: '寄：{{sender.name}} {{sender.phone}}\\n{{sender.address}}',
        style: {
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#000000',
          lineHeight: 1.5
        }
      } as TextElement,

      // 收件人信息
      {
        id: 'receiver-info',
        type: 'text',
        name: '收件人信息',
        locked: false,
        visible: true,
        position: { x: 10, y: 65 },
        size: { width: 80, height: 30 },
        rotation: 0,
        zIndex: 4,
        content: '收：{{receiver.name}} {{receiver.phone}}\\n{{receiver.address}}',
        style: {
          fontSize: 12,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#000000',
          lineHeight: 1.5
        }
      } as TextElement,

      // 条形码
      {
        id: 'barcode',
        type: 'barcode',
        name: '快递单号条码',
        locked: false,
        visible: true,
        position: { x: 10, y: 100 },
        size: { width: 80, height: 30 },
        rotation: 0,
        zIndex: 5,
        format: 'CODE128',
        value: '{{trackingNumber}}',
        showText: true,
        style: {
          textAlign: 'center',
          fontSize: 10
        }
      } as BarcodeElement,

      // 二维码
      {
        id: 'qrcode',
        type: 'qrcode',
        name: '物流追踪二维码',
        locked: false,
        visible: true,
        position: { x: 35, y: 135 },
        size: { width: 30, height: 30 },
        rotation: 0,
        zIndex: 6,
        value: '{{trackingUrl}}',
        errorCorrection: 'M'
      } as QRCodeElement,

      // 底部信息
      {
        id: 'footer',
        type: 'text',
        name: '底部信息',
        locked: false,
        visible: true,
        position: { x: 10, y: 170 },
        size: { width: 80, height: 5 },
        rotation: 0,
        zIndex: 7,
        content: '已验视 | 签收时请当面验收',
        style: {
          fontSize: 8,
          fontFamily: 'Arial',
          textAlign: 'center',
          color: '#666666'
        }
      } as TextElement
    ],
    variables: [
      {
        name: 'companyName',
        type: 'string',
        defaultValue: '顺丰速运',
        required: true,
        description: '快递公司名称'
      },
      {
        name: 'sender',
        type: 'object',
        required: true,
        description: '寄件人信息'
      },
      {
        name: 'receiver',
        type: 'object',
        required: true,
        description: '收件人信息'
      },
      {
        name: 'trackingNumber',
        type: 'string',
        required: true,
        description: '快递单号'
      },
      {
        name: 'trackingUrl',
        type: 'string',
        required: true,
        description: '物流追踪链接'
      }
    ]
  }
};

// 导出为 CNPL 格式
const cnplOutput = CNPLExporter.export(expressTemplate);

console.log('导出的 CNPL 内容：');
console.log(cnplOutput);

// 导出结果示例：
/*
<?xml version="1.0" encoding="UTF-8"?>
<layout>
  <page width="100" height="180">
    <text left="10" top="10" width="80" height="10" font.size="18" font.family="Arial" font.bold="true" text.align="center" font.color="#000000">{{companyName}}</text>
    <line left="5" top="25" width="90" height="1" line.width="1" line.color="#000000" />
    <text left="10" top="30" width="80" height="30" font.size="12" font.family="Arial" font.color="#000000">寄：{{sender.name}} {{sender.phone}}\n{{sender.address}}</text>
    <text left="10" top="65" width="80" height="30" font.size="12" font.family="Arial" font.bold="true" font.color="#000000">收：{{receiver.name}} {{receiver.phone}}\n{{receiver.address}}</text>
    <barcode left="10" top="100" width="80" height="30" type="CODE128" text.visible="true">{{trackingNumber}}</barcode>
    <barcode left="35" top="135" width="30" height="30" type="QRCode" error.level="M">{{trackingUrl}}</barcode>
    <text left="10" top="170" width="80" height="5" font.size="8" font.family="Arial" text.align="center" font.color="#666666">已验视 | 签收时请当面验收</text>
  </page>
</layout>
*/

// 导出函数也可以用于批量导出
export function exportTemplates(templates: Template[]): Record<string, string> {
  const exports: Record<string, string> = {};
  
  for (const template of templates) {
    exports[template.metadata.id] = CNPLExporter.export(template);
  }
  
  return exports;
}

// 验证导出的 CNPL 是否符合规范
export function validateCNPL(cnpl: string): boolean {
  try {
    // 基本的 XML 格式验证
    const parser = new DOMParser();
    const doc = parser.parseFromString(cnpl, 'text/xml');
    
    // 检查是否有解析错误
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('CNPL 解析错误：', parserError.textContent);
      return false;
    }
    
    // 检查必需的根元素
    const layout = doc.querySelector('layout');
    if (!layout) {
      console.error('缺少 layout 根元素');
      return false;
    }
    
    // 检查 page 元素
    const page = layout.querySelector('page');
    if (!page) {
      console.error('缺少 page 元素');
      return false;
    }
    
    // 检查 page 属性
    if (!page.getAttribute('width') || !page.getAttribute('height')) {
      console.error('page 元素缺少 width 或 height 属性');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('CNPL 验证失败：', error);
    return false;
  }
}