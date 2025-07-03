// 导出所有二维码相关模块
export { QRCodeElement } from './QRCodeElement';
export { QRCodeElementRenderer, QRCodePreview } from './QRCodeElementRenderer';
export { 
  generateQRCode, 
  generateQRCodeBatch,
  getQRCodeGenerator,
  warmupQRCodeGenerator,
  QRCodeGenerator 
} from './qrcode-generator';
export { 
  useQRCodeGenerator,
  useQRCodeBatch,
  useQRCodePreview 
} from './use-qrcode-generator';

// 导出类型
export type {
  IQRCodeElement,
  QRCodeStyle,
  QRCodeLogo,
  QRCodeGradient,
  QRCodeGenerationOptions,
  QRCodeErrorCorrection,
  QRCodeDotStyle,
  QRCodeCornerStyle,
  QRCodePreset,
} from '../types/qrcode.types';

export {
  QRCODE_DEFAULTS,
  getPresetStyle,
  generateQRCodeCacheKey,
  validateQRCodeData,
} from '../types/qrcode.types';