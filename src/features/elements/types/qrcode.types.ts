import type { BaseElementData } from './base.types';

/**
 * 二维码纠错级别
 */
export enum QRCodeErrorCorrection {
  L = 'L', // 低（约7%纠错能力）
  M = 'M', // 中（约15%纠错能力）
  Q = 'Q', // 四分（约25%纠错能力）
  H = 'H', // 高（约30%纠错能力）
}

/**
 * 二维码点样式
 */
export enum QRCodeDotStyle {
  SQUARE = 'square',      // 方形（默认）
  DOTS = 'dots',          // 圆点
  ROUNDED = 'rounded',    // 圆角方形
  CLASSY = 'classy',      // 圆角优雅
  CLASSY_ROUNDED = 'classy-rounded', // 优雅圆角
  EXTRA_ROUNDED = 'extra-rounded',   // 超圆角
}

/**
 * 二维码角样式
 */
export enum QRCodeCornerStyle {
  SQUARE = 'square',      // 方形（默认）
  DOTS = 'dots',          // 圆点
  EXTRA_ROUNDED = 'extra-rounded', // 超圆角
}

/**
 * 二维码 Logo 配置
 */
export interface QRCodeLogo {
  src: string;           // Logo 图片地址
  width?: number;        // Logo 宽度（相对于二维码尺寸的比例，0-1）
  height?: number;       // Logo 高度（相对于二维码尺寸的比例，0-1）
  margin?: number;       // Logo 边距
  backgroundColor?: string; // Logo 背景色
  borderRadius?: number; // Logo 圆角
  crossOrigin?: string;  // 跨域设置
}

/**
 * 二维码渐变色配置
 */
export interface QRCodeGradient {
  type: 'linear' | 'radial';
  colorStops: Array<{
    offset: number;     // 0-1
    color: string;
  }>;
  // 线性渐变
  startX?: number;      // 0-1
  startY?: number;      // 0-1
  endX?: number;        // 0-1
  endY?: number;        // 0-1
  // 径向渐变
  centerX?: number;     // 0-1
  centerY?: number;     // 0-1
  radius?: number;      // 0-1
}

/**
 * 二维码样式配置
 */
export interface QRCodeStyle {
  // 基础样式
  size?: number;                    // 二维码尺寸
  margin?: number;                  // 边距
  backgroundColor?: string;         // 背景色
  
  // 数据点样式
  dotsColor?: string;               // 数据点颜色
  dotsGradient?: QRCodeGradient;   // 数据点渐变
  dotsStyle?: QRCodeDotStyle;      // 数据点样式
  
  // 定位角样式
  cornersSquareColor?: string;          // 外框颜色
  cornersSquareGradient?: QRCodeGradient; // 外框渐变
  cornersSquareStyle?: QRCodeCornerStyle; // 外框样式
  
  cornersDotColor?: string;             // 内点颜色
  cornersDotGradient?: QRCodeGradient;  // 内点渐变
  cornersDotStyle?: QRCodeCornerStyle;  // 内点样式
  
  // Logo 配置
  logo?: QRCodeLogo;
}

/**
 * 二维码元素接口
 */
export interface IQRCodeElement extends BaseElementData {
  type: 'qrcode';
  value: string;                        // 二维码数据
  errorCorrection?: QRCodeErrorCorrection; // 纠错级别
  style?: QRCodeStyle;                  // 样式配置
  
  // 数据绑定
  binding?: string;                     // 数据绑定表达式
}

/**
 * 二维码生成选项
 */
export interface QRCodeGenerationOptions {
  value: string;
  errorCorrectionLevel?: QRCodeErrorCorrection;
  size?: number;
  margin?: number;
  style?: QRCodeStyle;
  type?: 'canvas' | 'svg';
  quality?: number;  // 用于导出图片时的质量 (0-1)
}

/**
 * 二维码预设样式
 */
export enum QRCodePreset {
  DEFAULT = 'default',
  WECHAT = 'wechat',       // 微信风格
  ALIPAY = 'alipay',       // 支付宝风格
  MODERN = 'modern',       // 现代风格
  CLASSIC = 'classic',     // 经典风格
  COLORFUL = 'colorful',   // 彩色风格
}

/**
 * 获取预设样式配置
 */
export function getPresetStyle(preset: QRCodePreset): QRCodeStyle {
  switch (preset) {
    case QRCodePreset.WECHAT:
      return {
        dotsColor: '#4CAF50',
        dotsStyle: QRCodeDotStyle.SQUARE,
        cornersSquareColor: '#4CAF50',
        cornersDotColor: '#4CAF50',
        margin: 16,
      };
      
    case QRCodePreset.ALIPAY:
      return {
        dotsColor: '#1677FF',
        dotsStyle: QRCodeDotStyle.ROUNDED,
        cornersSquareColor: '#1677FF',
        cornersDotColor: '#1677FF',
        cornersSquareStyle: QRCodeCornerStyle.EXTRA_ROUNDED,
        cornersDotStyle: QRCodeCornerStyle.DOTS,
        margin: 20,
      };
      
    case QRCodePreset.MODERN:
      return {
        dotsGradient: {
          type: 'linear',
          colorStops: [
            { offset: 0, color: '#667EEA' },
            { offset: 1, color: '#764BA2' },
          ],
          startX: 0,
          startY: 0,
          endX: 1,
          endY: 1,
        },
        dotsStyle: QRCodeDotStyle.CLASSY_ROUNDED,
        cornersSquareStyle: QRCodeCornerStyle.EXTRA_ROUNDED,
        cornersDotStyle: QRCodeCornerStyle.DOTS,
        margin: 24,
      };
      
    case QRCodePreset.CLASSIC:
      return {
        dotsColor: '#000000',
        dotsStyle: QRCodeDotStyle.SQUARE,
        cornersSquareColor: '#000000',
        cornersDotColor: '#000000',
        backgroundColor: '#FFFFFF',
        margin: 16,
      };
      
    case QRCodePreset.COLORFUL:
      return {
        dotsGradient: {
          type: 'radial',
          colorStops: [
            { offset: 0, color: '#FF6B6B' },
            { offset: 0.5, color: '#4ECDC4' },
            { offset: 1, color: '#45B7D1' },
          ],
          centerX: 0.5,
          centerY: 0.5,
          radius: 1,
        },
        dotsStyle: QRCodeDotStyle.DOTS,
        cornersSquareStyle: QRCodeCornerStyle.EXTRA_ROUNDED,
        cornersDotStyle: QRCodeCornerStyle.DOTS,
        margin: 20,
      };
      
    default:
      return {
        dotsColor: '#000000',
        backgroundColor: '#FFFFFF',
        margin: 16,
      };
  }
}

/**
 * 二维码元素默认值
 */
export const QRCODE_DEFAULTS = {
  width: 200,
  height: 200,
  value: 'https://example.com',
  errorCorrection: QRCodeErrorCorrection.M,
  style: {
    size: 200,
    margin: 16,
    dotsColor: '#000000',
    backgroundColor: '#FFFFFF',
    dotsStyle: QRCodeDotStyle.SQUARE,
  },
} as const;

/**
 * 二维码缓存键生成
 */
export function generateQRCodeCacheKey(options: QRCodeGenerationOptions): string {
  const {
    value,
    errorCorrectionLevel = QRCodeErrorCorrection.M,
    size = 200,
    margin = 16,
    style = {},
  } = options;
  
  // 创建一个稳定的缓存键
  const styleKey = JSON.stringify(style, Object.keys(style).sort());
  return `qr_${value}_${errorCorrectionLevel}_${size}_${margin}_${styleKey}`;
}

/**
 * 二维码数据验证
 */
export function validateQRCodeData(data: string): { valid: boolean; error?: string } {
  if (!data) {
    return { valid: false, error: '二维码数据不能为空' };
  }
  
  // 检查数据长度（QR码最大支持约4000个字符）
  if (data.length > 4000) {
    return { valid: false, error: '二维码数据长度不能超过4000个字符' };
  }
  
  return { valid: true };
}