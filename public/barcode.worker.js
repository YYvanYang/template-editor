// barcode.worker.js - Web Worker for barcode generation
// 使用 importScripts 加载必要的库

importScripts(
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
);

// 错误码定义
const ERROR_CODES = {
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_VALUE: 'INVALID_VALUE',
  GENERATION_FAILED: 'GENERATION_FAILED',
  CANVAS_ERROR: 'CANVAS_ERROR',
};

// 条形码格式映射
const BARCODE_FORMAT_MAP = {
  'code128': 'CODE128',
  'code128a': 'CODE128A',
  'code128b': 'CODE128B',
  'code128c': 'CODE128C',
  'ean128': 'EAN128',
  'code39': 'CODE39',
  'code93': 'CODE93',
  'code11': 'CODE11',
  'ean8': 'EAN8',
  'ean13': 'EAN13',
  'upca': 'UPC',
  'upce': 'UPC_E',
  'itf14': 'ITF14',
  'c25inter': 'ITF',
  'codabar': 'codabar',
  'postnet': 'postnet',
  'rm4scc': 'rm4scc',
};

// 2D 条形码类型
const BARCODE_2D_TYPES = [
  'qrcode',
  'pdf417',
  'datamatrix',
  'aztec',
  'hibcaztec',
  'maxicode',
  'gs1datamatrix',
];

// 判断是否为 2D 条形码
function is2DBarcode(type) {
  return BARCODE_2D_TYPES.includes(type);
}

// 验证条形码值
function validateBarcodeValue(type, value) {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Value cannot be empty' };
  }

  // 根据条形码类型进行特定验证
  switch (type) {
    case 'ean8':
      if (!/^\d{7,8}$/.test(value)) {
        return { valid: false, error: 'EAN8 requires 7-8 digits' };
      }
      break;
    case 'ean13':
      if (!/^\d{12,13}$/.test(value)) {
        return { valid: false, error: 'EAN13 requires 12-13 digits' };
      }
      break;
    case 'upca':
      if (!/^\d{11,12}$/.test(value)) {
        return { valid: false, error: 'UPC-A requires 11-12 digits' };
      }
      break;
    case 'upce':
      if (!/^\d{6,8}$/.test(value)) {
        return { valid: false, error: 'UPC-E requires 6-8 digits' };
      }
      break;
    case 'itf14':
      if (!/^\d{13,14}$/.test(value)) {
        return { valid: false, error: 'ITF14 requires 13-14 digits' };
      }
      break;
    case 'code11':
      if (!/^[\d\-]+$/.test(value)) {
        return { valid: false, error: 'CODE11 requires digits and hyphens only' };
      }
      break;
    case 'code39':
      if (!/^[0-9A-Z\-\.\s\$\/\+\%]+$/.test(value)) {
        return { valid: false, error: 'CODE39 requires uppercase letters, digits, and special characters' };
      }
      break;
    case 'postnet':
      if (!/^\d{5}$|^\d{9}$|^\d{11}$/.test(value)) {
        return { valid: false, error: 'POSTNET requires 5, 9, or 11 digits' };
      }
      break;
  }

  return { valid: true };
}

// 生成 1D 条形码
async function generate1DBarcode(canvas, value, options) {
  return new Promise((resolve, reject) => {
    try {
      const format = BARCODE_FORMAT_MAP[options.barcodeType];
      if (!format) {
        reject(new Error(`Unsupported barcode type: ${options.barcodeType}`));
        return;
      }

      // 验证值
      const validation = validateBarcodeValue(options.barcodeType, value);
      if (!validation.valid) {
        reject(new Error(validation.error));
        return;
      }

      // JsBarcode 配置
      const config = {
        format: format,
        value: value,
        width: options.barWidth || 2,
        height: options.barHeight || 100,
        displayValue: options.displayValue !== false,
        text: options.text || value,
        fontSize: options.fontSize || 12,
        font: options.font || 'Arial',
        textAlign: options.textAlign || 'center',
        textPosition: options.textPosition || 'bottom',
        textMargin: options.textMargin || 2,
        background: options.background || '#FFFFFF',
        lineColor: options.lineColor || '#000000',
        margin: options.margin || 10,
        marginTop: options.marginTop,
        marginBottom: options.marginBottom,
        marginLeft: options.marginLeft,
        marginRight: options.marginRight,
        valid: function(valid) {
          if (!valid) {
            reject(new Error(`Invalid barcode value for ${format}: ${value}`));
          }
        }
      };

      // 生成条形码
      JsBarcode(canvas, value, config);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// 生成 QR 码
async function generateQRCode(canvas, value, options) {
  const errorCorrectionMap = {
    0: 'L',
    1: 'M',
    2: 'Q',
    3: 'H'
  };

  const qrOptions = {
    errorCorrectionLevel: errorCorrectionMap[options.errorCorrection] || 'M',
    margin: options.margin || 1,
    color: {
      dark: options.lineColor || '#000000',
      light: options.background || '#FFFFFF',
    },
    width: canvas.width,
    scale: options.scale || 4,
  };

  return QRCode.toCanvas(canvas, value, qrOptions);
}

// 生成其他 2D 条形码（占位符，需要额外的库）
async function generateOther2DBarcode(canvas, value, options) {
  // 目前只支持 QR 码，其他 2D 码类型返回错误
  throw new Error(`${options.barcodeType} is not yet supported. Only QR Code is currently available.`);
}

// 主消息处理器
self.addEventListener('message', async (event) => {
  const { id, type, data } = event.data;

  try {
    switch (type) {
      case 'generate':
        await handleGenerate(id, data);
        break;
      case 'validate':
        await handleValidate(id, data);
        break;
      case 'getSupportedTypes':
        await handleGetSupportedTypes(id);
        break;
      default:
        self.postMessage({
          id,
          error: {
            code: ERROR_CODES.INVALID_TYPE,
            message: `Unknown message type: ${type}`,
          },
        });
    }
  } catch (error) {
    self.postMessage({
      id,
      error: {
        code: ERROR_CODES.GENERATION_FAILED,
        message: error.message,
        stack: error.stack,
      },
    });
  }
});

// 处理条形码生成
async function handleGenerate(id, data) {
  const { value, options, canvasWidth, canvasHeight } = data;

  try {
    // 创建离屏画布
    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 根据类型生成条形码
    if (is2DBarcode(options.barcodeType)) {
      if (options.barcodeType === 'qrcode') {
        await generateQRCode(canvas, value, options);
      } else {
        await generateOther2DBarcode(canvas, value, options);
      }
    } else {
      await generate1DBarcode(canvas, value, options);
    }

    // 应用旋转（如果需要）
    if (options.rotation) {
      const rotatedCanvas = await rotateCanvas(canvas, options.rotation);
      canvas.width = rotatedCanvas.width;
      canvas.height = rotatedCanvas.height;
      const rotatedCtx = canvas.getContext('2d');
      rotatedCtx.drawImage(rotatedCanvas, 0, 0);
    }

    // 转换为 ImageData
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 发送结果
    self.postMessage({
      id,
      result: {
        imageData,
        width: canvas.width,
        height: canvas.height,
      },
    }, [imageData.data.buffer]);
  } catch (error) {
    self.postMessage({
      id,
      error: {
        code: ERROR_CODES.GENERATION_FAILED,
        message: error.message,
      },
    });
  }
}

// 处理条形码验证
async function handleValidate(id, data) {
  const { type, value } = data;
  const validation = validateBarcodeValue(type, value);

  self.postMessage({
    id,
    result: validation,
  });
}

// 处理获取支持的类型
async function handleGetSupportedTypes(id) {
  const supported1D = Object.keys(BARCODE_FORMAT_MAP);
  const supported2D = ['qrcode']; // 目前只支持 QR 码

  self.postMessage({
    id,
    result: {
      types: [...supported1D, ...supported2D],
      formats: {
        '1D': supported1D,
        '2D': supported2D,
      },
    },
  });
}

// 旋转画布
async function rotateCanvas(canvas, angle) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  
  // 计算旋转后的尺寸
  const newWidth = canvas.width * cos + canvas.height * sin;
  const newHeight = canvas.width * sin + canvas.height * cos;
  
  // 创建新画布
  const rotatedCanvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = rotatedCanvas.getContext('2d');
  
  // 设置旋转中心并旋转
  ctx.save();
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(rad);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  ctx.restore();
  
  return rotatedCanvas;
}

// Worker 初始化完成
self.postMessage({ type: 'ready' });