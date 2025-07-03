// 条形码元素类
export { BarcodeElement, BarcodeType } from './BarcodeElement';

// 条形码渲染器
export { 
  BarcodeRenderer,
  getBarcodeRenderer,
  destroyBarcodeRenderer,
  type BarcodeGenerationResult,
  type BarcodeRenderOptions,
} from './barcode-renderer';

// React Hooks
export {
  useBarcodeRenderer,
  useBatchBarcodeRenderer,
  useBarcodePreview,
  type UseBarcodeRendererOptions,
  type UseBarcodeRendererReturn,
} from './use-barcode-renderer';

// React 组件
export {
  BarcodeElementRenderer,
  BarcodeElementPreview,
  type BarcodeElementRendererProps,
} from './BarcodeElementRenderer';

// 条形码生成工具（保留以兼容旧代码）
export {
  generate1DBarcode,
  generateQRCode,
  generateBarcode,
  createBarcodePreview,
  isBarcodeTypeSupported,
  getSupportedBarcodeTypes,
} from './barcode-generator';