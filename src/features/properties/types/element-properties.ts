import { PropertyDefinition, PropertyType } from './property.types';
import { BarcodeType, QRErrorCorrection } from '@/features/elements/types/barcode.types';

/**
 * 文本元素属性定义
 */
export const TEXT_PROPERTIES: PropertyDefinition[] = [
  {
    key: 'content',
    label: '文本内容',
    type: PropertyType.TEXTAREA,
    category: 'text',
    placeholder: '输入文本内容',
  },
  {
    key: 'style.fontFamily',
    label: '字体',
    type: PropertyType.FONT_FAMILY,
    category: 'text',
    defaultValue: '宋体',
  },
  {
    key: 'style.fontSize',
    label: '字号',
    type: PropertyType.FONT_SIZE,
    category: 'text',
    defaultValue: 12,
  },
  {
    key: 'style.fontWeight',
    label: '字重',
    type: PropertyType.SELECT,
    category: 'text',
    options: [
      { label: '正常', value: 'normal' },
      { label: '粗体', value: 'bold' },
    ],
    defaultValue: 'normal',
  },
  {
    key: 'style.fontStyle',
    label: '字体样式',
    type: PropertyType.SELECT,
    category: 'text',
    options: [
      { label: '正常', value: 'normal' },
      { label: '斜体', value: 'italic' },
    ],
    defaultValue: 'normal',
  },
  {
    key: 'style.textDecoration',
    label: '文本装饰',
    type: PropertyType.SELECT,
    category: 'text',
    options: [
      { label: '无', value: 'none' },
      { label: '下划线', value: 'underline' },
      { label: '删除线', value: 'line-through' },
    ],
    defaultValue: 'none',
  },
  {
    key: 'style.color',
    label: '文字颜色',
    type: PropertyType.COLOR,
    category: 'text',
    defaultValue: '#000000',
  },
  {
    key: 'style.textAlign',
    label: '对齐方式',
    type: PropertyType.ALIGNMENT,
    category: 'text',
    defaultValue: 'left',
  },
  {
    key: 'style.lineHeight',
    label: '行高',
    type: PropertyType.NUMBER,
    category: 'text',
    min: 0.5,
    max: 3,
    step: 0.1,
    defaultValue: 1.2,
  },
  {
    key: 'binding',
    label: '数据绑定',
    type: PropertyType.BINDING,
    category: 'data',
    placeholder: '{{variable}}',
  },
];

/**
 * 图片元素属性定义
 */
export const IMAGE_PROPERTIES: PropertyDefinition[] = [
  {
    key: 'src',
    label: '图片地址',
    type: PropertyType.TEXT,
    category: 'basic',
    placeholder: '输入图片URL或上传图片',
  },
  {
    key: 'alt',
    label: '替代文本',
    type: PropertyType.TEXT,
    category: 'basic',
    placeholder: '图片描述',
  },
  {
    key: 'fit',
    label: '适应方式',
    type: PropertyType.SELECT,
    category: 'style',
    options: [
      { label: '填充', value: 'fill' },
      { label: '适应', value: 'contain' },
      { label: '覆盖', value: 'cover' },
      { label: '无', value: 'none' },
      { label: '缩小', value: 'scale-down' },
    ],
    defaultValue: 'contain',
  },
  {
    key: 'binding',
    label: '数据绑定',
    type: PropertyType.BINDING,
    category: 'data',
    placeholder: '{{imageUrl}}',
  },
];

/**
 * 形状元素属性定义
 */
export const SHAPE_PROPERTIES: PropertyDefinition[] = [
  {
    key: 'shapeType',
    label: '形状类型',
    type: PropertyType.SELECT,
    category: 'basic',
    options: [
      { label: '矩形', value: 'rectangle' },
      { label: '圆形', value: 'circle' },
      { label: '椭圆', value: 'ellipse' },
      { label: '三角形', value: 'triangle' },
      { label: '星形', value: 'star' },
    ],
  },
  {
    key: 'style.fill',
    label: '填充色',
    type: PropertyType.COLOR,
    category: 'style',
    defaultValue: '#ffffff',
  },
  {
    key: 'style.strokeColor',
    label: '描边色',
    type: PropertyType.COLOR,
    category: 'style',
    defaultValue: '#000000',
  },
  {
    key: 'style.strokeWidth',
    label: '描边宽度',
    type: PropertyType.NUMBER,
    category: 'style',
    min: 0,
    max: 20,
    step: 1,
    defaultValue: 1,
  },
  {
    key: 'style.strokeStyle',
    label: '描边样式',
    type: PropertyType.SELECT,
    category: 'style',
    options: [
      { label: '实线', value: 'solid' },
      { label: '虚线', value: 'dashed' },
      { label: '点线', value: 'dotted' },
    ],
    defaultValue: 'solid',
  },
];

/**
 * 条码元素属性定义
 */
export const BARCODE_PROPERTIES: PropertyDefinition[] = [
  {
    key: 'barcodeType',
    label: '条码类型',
    type: PropertyType.SELECT,
    category: 'basic',
    options: [
      { label: 'Code 128', value: BarcodeType.CODE128 },
      { label: 'Code 39', value: BarcodeType.CODE39 },
      { label: 'EAN-13', value: BarcodeType.EAN13 },
      { label: 'EAN-8', value: BarcodeType.EAN8 },
      { label: 'UPC-A', value: BarcodeType.UPC },
      { label: 'QR Code', value: BarcodeType.QRCODE },
      { label: 'Data Matrix', value: BarcodeType.DATAMATRIX },
      { label: 'PDF417', value: BarcodeType.PDF417 },
    ],
    defaultValue: BarcodeType.CODE128,
  },
  {
    key: 'value',
    label: '条码值',
    type: PropertyType.TEXT,
    category: 'basic',
    placeholder: '输入条码内容',
  },
  {
    key: 'binding',
    label: '数据绑定',
    type: PropertyType.BINDING,
    category: 'data',
    placeholder: '{{barcode}}',
  },
  {
    key: 'style.hideText',
    label: '隐藏文本',
    type: PropertyType.CHECKBOX,
    category: 'style',
    defaultValue: false,
    visible: (element) => element.barcodeType !== BarcodeType.QRCODE,
  },
  {
    key: 'style.fontSize',
    label: '文本大小',
    type: PropertyType.NUMBER,
    category: 'style',
    min: 8,
    max: 20,
    step: 1,
    defaultValue: 12,
    visible: (element) => element.barcodeType !== BarcodeType.QRCODE && !element.style?.hideText,
  },
  {
    key: 'errorCorrection',
    label: '纠错级别',
    type: PropertyType.SELECT,
    category: 'advanced',
    options: [
      { label: '低 (L)', value: QRErrorCorrection.L },
      { label: '中 (M)', value: QRErrorCorrection.M },
      { label: '较高 (Q)', value: QRErrorCorrection.Q },
      { label: '高 (H)', value: QRErrorCorrection.H },
    ],
    defaultValue: QRErrorCorrection.M,
    visible: (element) => element.barcodeType === BarcodeType.QRCODE,
  },
  {
    key: 'style.margin',
    label: '边距',
    type: PropertyType.NUMBER,
    category: 'style',
    min: 0,
    max: 20,
    step: 1,
    defaultValue: 10,
  },
  {
    key: 'style.lineColor',
    label: '条码颜色',
    type: PropertyType.COLOR,
    category: 'style',
    defaultValue: '#000000',
  },
];

/**
 * 表格元素属性定义
 */
export const TABLE_PROPERTIES: PropertyDefinition[] = [
  {
    key: 'rows',
    label: '行数',
    type: PropertyType.NUMBER,
    category: 'basic',
    min: 1,
    max: 100,
    step: 1,
    defaultValue: 3,
  },
  {
    key: 'columns',
    label: '列数',
    type: PropertyType.NUMBER,
    category: 'basic',
    min: 1,
    max: 20,
    step: 1,
    defaultValue: 3,
  },
  {
    key: 'cellPadding',
    label: '单元格内边距',
    type: PropertyType.NUMBER,
    category: 'style',
    min: 0,
    max: 20,
    step: 1,
    defaultValue: 5,
  },
  {
    key: 'style.borderColor',
    label: '边框颜色',
    type: PropertyType.COLOR,
    category: 'style',
    defaultValue: '#000000',
  },
  {
    key: 'style.borderWidth',
    label: '边框宽度',
    type: PropertyType.NUMBER,
    category: 'style',
    min: 0,
    max: 5,
    step: 1,
    defaultValue: 1,
  },
  {
    key: 'style.fontSize',
    label: '字体大小',
    type: PropertyType.NUMBER,
    category: 'text',
    min: 8,
    max: 24,
    step: 1,
    defaultValue: 12,
  },
  {
    key: 'style.fontFamily',
    label: '字体',
    type: PropertyType.FONT_FAMILY,
    category: 'text',
    defaultValue: '宋体',
  },
  {
    key: 'dataBinding',
    label: '数据绑定',
    type: PropertyType.BINDING,
    category: 'data',
    placeholder: '{{#each items}}...{{/each}}',
    description: '使用 {{#each}} 循环渲染表格行',
  },
];

/**
 * 根据元素类型获取属性定义
 */
export function getPropertiesForElement(elementType: string): PropertyDefinition[] {
  switch (elementType) {
    case 'text':
      return TEXT_PROPERTIES;
    case 'image':
      return IMAGE_PROPERTIES;
    case 'shape':
      return SHAPE_PROPERTIES;
    case 'barcode':
      return BARCODE_PROPERTIES;
    case 'table':
      return TABLE_PROPERTIES;
    default:
      return [];
  }
}