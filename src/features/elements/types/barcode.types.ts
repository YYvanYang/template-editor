import type { BaseElementData } from './base.types';

/**
 * 条码类型枚举（基于CNPL规范）
 */
export enum BarcodeType {
  // 一维条码
  CODE128 = 'code128',
  CODE128A = 'code128a',
  CODE128B = 'code128b',
  CODE128C = 'code128c',
  EAN128 = 'ean128',
  GS128LINEAR = 'gs128linear',
  CODE39 = 'code39',
  CODE93 = 'code93',
  CODE11 = 'code11',
  EAN8 = 'ean8',
  EAN13 = 'ean13',
  UPCA = 'upca',
  UPCE = 'upce',
  ITF14 = 'itf14',
  C25INTER = 'c25inter',
  POSTNET = 'postnet',
  RM4SCC = 'rm4scc',
  CODABAR = 'codabar',
  
  // 二维码
  QRCODE = 'qrcode',
  PDF417 = 'pdf417',
  DATAMATRIX = 'datamatrix',
  AZTEC = 'aztec',
  HIBCAZTEC = 'hibcaztec',
  MAXICODE = 'maxicode',
  GS1DATAMATRIX = 'gs1datamatrix',
}

/**
 * 比例模式
 */
export enum RatioMode {
  KEEP_RATIO = 'keepRatio',      // 保持比例
  IGNORE_RATIO = 'ignoreRatio',  // 忽略比例（填充区域）
}

/**
 * QR码纠错级别
 */
export enum QRErrorCorrection {
  L = 0, // 低（约7%纠错能力）
  M = 1, // 中（约15%纠错能力）
  Q = 2, // 四分（约25%纠错能力）
  H = 3, // 高（约30%纠错能力）
}

/**
 * 条码样式
 */
export interface BarcodeStyle {
  rotation?: number;      // 旋转角度
  hideText?: boolean;     // 是否隐藏文本
  fontSize?: number;      // 文本字号
  fontFamily?: string;    // 文本字体
  fontColor?: string;     // 文本颜色
  backgroundColor?: string; // 背景色
  lineColor?: string;     // 条码颜色
  lineWidth?: number;     // 线条宽度（一维码）
  margin?: number;        // 边距
  textMargin?: number;    // 文本与条码间距
}

/**
 * 条码元素接口
 */
export interface IBarcodeElement extends BaseElementData {
  type: 'barcode';
  barcodeType: BarcodeType;
  value: string;              // 条码数据
  ratioMode?: RatioMode;      // 比例模式
  style?: BarcodeStyle;       // 样式
  
  // 特定类型参数
  mode?: string;              // aztec和pdf417的ecc level
  primary?: string;           // maxicode的primary
  errorCorrection?: QRErrorCorrection; // qrcode的纠错级别
  symbolSize?: number;        // datamatrix和aztec的符号尺寸
  
  // 条码配置
  displayValue?: boolean;     // 是否显示文本（对应hideText的反向）
  format?: string;            // 条码格式（用于JsBarcode）
  encoding?: string;          // 编码
  width?: number;             // 条码单元宽度
  height?: number;            // 条码高度
  
  // 数据绑定
  binding?: string;           // 数据绑定表达式
}

/**
 * 条码生成选项
 */
export interface BarcodeGenerationOptions {
  format: string;             // 条码格式
  value: string;              // 条码值
  width?: number;             // 条码宽度
  height?: number;            // 条码高度
  displayValue?: boolean;     // 是否显示文本
  text?: string;              // 覆盖显示的文本
  fontSize?: number;          // 字体大小
  font?: string;              // 字体
  textAlign?: 'left' | 'center' | 'right'; // 文本对齐
  textPosition?: 'top' | 'bottom';         // 文本位置
  textMargin?: number;        // 文本边距
  background?: string;        // 背景色
  lineColor?: string;         // 线条颜色
  margin?: number;            // 边距
  marginTop?: number;         // 上边距
  marginBottom?: number;      // 下边距
  marginLeft?: number;        // 左边距
  marginRight?: number;       // 右边距
  valid?: (valid: boolean) => void; // 验证回调
}

/**
 * 二维码生成选项
 */
export interface QRCodeGenerationOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  width?: number;
  scale?: number;
}

/**
 * 条码类型映射到JsBarcode格式
 */
export const BARCODE_FORMAT_MAP: Record<string, string> = {
  [BarcodeType.CODE128]: 'CODE128',
  [BarcodeType.CODE128A]: 'CODE128A',
  [BarcodeType.CODE128B]: 'CODE128B',
  [BarcodeType.CODE128C]: 'CODE128C',
  [BarcodeType.EAN128]: 'EAN128',
  [BarcodeType.CODE39]: 'CODE39',
  [BarcodeType.CODE93]: 'CODE93',
  [BarcodeType.CODE11]: 'CODE11',
  [BarcodeType.EAN8]: 'EAN8',
  [BarcodeType.EAN13]: 'EAN13',
  [BarcodeType.UPCA]: 'UPC',
  [BarcodeType.UPCE]: 'UPC_E',
  [BarcodeType.ITF14]: 'ITF14',
  [BarcodeType.C25INTER]: 'ITF',
  [BarcodeType.CODABAR]: 'codabar',
  [BarcodeType.POSTNET]: 'postnet',
  [BarcodeType.RM4SCC]: 'rm4scc',
};

/**
 * 判断是否为二维码类型
 */
export function is2DBarcode(type: BarcodeType): boolean {
  return [
    BarcodeType.QRCODE,
    BarcodeType.PDF417,
    BarcodeType.DATAMATRIX,
    BarcodeType.AZTEC,
    BarcodeType.HIBCAZTEC,
    BarcodeType.MAXICODE,
    BarcodeType.GS1DATAMATRIX,
  ].includes(type);
}

/**
 * 判断是否为一维条码类型
 */
export function is1DBarcode(type: BarcodeType): boolean {
  return !is2DBarcode(type);
}

/**
 * 获取条码格式的默认选项
 */
export function getDefaultBarcodeOptions(type: BarcodeType): Partial<BarcodeGenerationOptions> {
  const baseOptions: Partial<BarcodeGenerationOptions> = {
    displayValue: true,
    fontSize: 12,
    textAlign: 'center',
    margin: 10,
  };
  
  // 特定类型的默认选项
  switch (type) {
    case BarcodeType.EAN8:
    case BarcodeType.EAN13:
      return { ...baseOptions, fontSize: 10, height: 50 };
    case BarcodeType.UPCA:
    case BarcodeType.UPCE:
      return { ...baseOptions, fontSize: 10, height: 50 };
    case BarcodeType.ITF14:
      return { ...baseOptions, height: 50, fontSize: 14 };
    case BarcodeType.CODE128:
    case BarcodeType.CODE128A:
    case BarcodeType.CODE128B:
    case BarcodeType.CODE128C:
      return { ...baseOptions, height: 60 };
    default:
      return baseOptions;
  }
}

/**
 * 条码元素默认值
 */
export const BARCODE_DEFAULTS = {
  width: 200,
  height: 100,
  barcodeType: BarcodeType.CODE128,
  value: '123456789',
  ratioMode: RatioMode.KEEP_RATIO,
  style: {
    hideText: false,
    fontSize: 12,
    fontFamily: '宋体',
    fontColor: '#000000',
    backgroundColor: '#FFFFFF',
    lineColor: '#000000',
    margin: 10,
    textMargin: 2,
  },
} as const;