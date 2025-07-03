import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import type { 
  BarcodeGenerationOptions, 
  QRCodeGenerationOptions,
  IBarcodeElement 
} from '../types/barcode.types';
import { 
  BarcodeType, 
  BARCODE_FORMAT_MAP, 
  is2DBarcode,
  getDefaultBarcodeOptions 
} from '../types/barcode.types';

/**
 * 生成一维条码
 * @param canvas Canvas元素
 * @param value 条码值
 * @param options 生成选项
 */
export function generate1DBarcode(
  canvas: HTMLCanvasElement,
  value: string,
  options: BarcodeGenerationOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      JsBarcode(canvas, value, {
        ...options,
        valid: (valid) => {
          if (!valid) {
            reject(new Error(`Invalid barcode value: ${value}`));
          }
        },
      });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 生成二维码
 * @param canvas Canvas元素
 * @param value 二维码内容
 * @param options 生成选项
 */
export function generateQRCode(
  canvas: HTMLCanvasElement,
  value: string,
  options: QRCodeGenerationOptions
): Promise<void> {
  return QRCode.toCanvas(canvas, value, options);
}

/**
 * 根据条码元素生成条码
 * @param element 条码元素
 * @param canvas Canvas元素
 * @param value 实际值（可能是经过数据绑定处理的）
 */
export async function generateBarcode(
  element: IBarcodeElement,
  canvas: HTMLCanvasElement,
  value: string
): Promise<void> {
  const { barcodeType, style, ratioMode } = element;
  
  // 清空画布
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 设置画布尺寸
  if (ratioMode === 'ignoreRatio') {
    canvas.width = element.size.width;
    canvas.height = element.size.height;
  }
  
  if (is2DBarcode(barcodeType)) {
    // 生成二维码
    await generateQRCode(canvas, value, {
      errorCorrectionLevel: element.errorCorrection !== undefined 
        ? (['L', 'M', 'Q', 'H'][element.errorCorrection] as 'L' | 'M' | 'Q' | 'H')
        : 'M',
      margin: style?.margin || 1,
      color: {
        dark: style?.lineColor || '#000000',
        light: style?.backgroundColor || '#FFFFFF',
      },
      width: canvas.width,
    });
  } else {
    // 生成一维条码
    const format = BARCODE_FORMAT_MAP[barcodeType];
    if (!format) {
      throw new Error(`Unsupported barcode type: ${barcodeType}`);
    }
    
    const defaultOptions = getDefaultBarcodeOptions(barcodeType);
    const options: BarcodeGenerationOptions = {
      ...defaultOptions,
      format,
      value,
      width: element.size?.width || 2,
      height: element.size?.height || canvas.height * 0.7,
      displayValue: !style?.hideText,
      fontSize: style?.fontSize || defaultOptions.fontSize,
      font: style?.fontFamily || '宋体',
      background: style?.backgroundColor || '#FFFFFF',
      lineColor: style?.lineColor || '#000000',
      margin: style?.margin || defaultOptions.margin,
      textMargin: style?.textMargin || 2,
    };
    
    await generate1DBarcode(canvas, value, options);
  }
  
  // 应用旋转
  if (style?.rotation) {
    rotateCanvas(canvas, style.rotation);
  }
}

/**
 * 旋转画布内容
 * @param canvas Canvas元素
 * @param angle 旋转角度（度）
 */
function rotateCanvas(canvas: HTMLCanvasElement, angle: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 创建临时画布
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  // 复制原画布内容
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.drawImage(canvas, 0, 0);
  
  // 计算旋转后的尺寸
  const rad = (angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const newWidth = canvas.width * cos + canvas.height * sin;
  const newHeight = canvas.width * sin + canvas.height * cos;
  
  // 调整画布尺寸
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  // 旋转并绘制
  ctx.save();
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(rad);
  ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
  ctx.restore();
}

/**
 * 创建条码预览（返回Data URL）
 * @param element 条码元素
 * @param value 实际值
 */
export async function createBarcodePreview(
  element: IBarcodeElement,
  value: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = element.size.width;
  canvas.height = element.size.height;
  
  await generateBarcode(element, canvas, value);
  
  return canvas.toDataURL('image/png');
}

/**
 * 验证条码类型是否被支持
 * @param type 条码类型
 */
export function isBarcodeTypeSupported(type: BarcodeType): boolean {
  if (is2DBarcode(type)) {
    // 目前只支持QRCode
    return type === BarcodeType.QRCODE;
  } else {
    // 检查是否在映射表中
    return BARCODE_FORMAT_MAP.hasOwnProperty(type);
  }
}

/**
 * 获取支持的条码类型列表
 */
export function getSupportedBarcodeTypes(): BarcodeType[] {
  const supported: BarcodeType[] = [];
  
  // 添加支持的一维码
  for (const type in BarcodeType) {
    const barcodeType = BarcodeType[type as keyof typeof BarcodeType];
    if (!is2DBarcode(barcodeType) && BARCODE_FORMAT_MAP.hasOwnProperty(barcodeType)) {
      supported.push(barcodeType);
    }
  }
  
  // 添加QRCode
  supported.push(BarcodeType.QRCODE);
  
  return supported;
}