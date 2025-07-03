import type { IBarcodeElement } from '../types/barcode.types';
import { BarcodeType, is2DBarcode } from '../types/barcode.types';

/**
 * 条形码生成结果
 */
export interface BarcodeGenerationResult {
  imageData: ImageData;
  width: number;
  height: number;
  timestamp: number;
}

/**
 * 条形码生成选项
 */
export interface BarcodeRenderOptions {
  barcodeType: BarcodeType;
  width: number;
  height: number;
  rotation?: number;
  displayValue?: boolean;
  fontSize?: number;
  font?: string;
  textAlign?: 'left' | 'center' | 'right';
  textPosition?: 'top' | 'bottom';
  textMargin?: number;
  background?: string;
  lineColor?: string;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  barWidth?: number;
  barHeight?: number;
  errorCorrection?: number;
  scale?: number;
}

/**
 * 缓存键生成器
 */
function generateCacheKey(value: string, options: BarcodeRenderOptions): string {
  const optionsStr = JSON.stringify({
    ...options,
    value,
  });
  return `${value}_${optionsStr}`;
}

/**
 * 条形码渲染器类
 * 使用 Web Worker 进行异步条形码生成，支持缓存和错误处理
 */
export class BarcodeRenderer {
  private worker: Worker | null = null;
  private cache: Map<string, BarcodeGenerationResult> = new Map();
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();
  private requestId = 0;
  private workerReady = false;
  private workerReadyPromise: Promise<void>;
  private workerReadyResolve!: () => void;
  private maxCacheSize = 100;
  private cacheTimeout = 5 * 60 * 1000; // 5 分钟
  private fallbackCanvas: HTMLCanvasElement | null = null;

  constructor() {
    this.workerReadyPromise = new Promise((resolve) => {
      this.workerReadyResolve = resolve;
    });
    this.initWorker();
    this.setupCacheCleanup();
  }

  /**
   * 初始化 Web Worker
   */
  private initWorker(): void {
    try {
      this.worker = new Worker('/barcode.worker.js');
      
      this.worker.addEventListener('message', (event) => {
        const { id, type, result, error } = event.data;
        
        if (type === 'ready') {
          this.workerReady = true;
          this.workerReadyResolve();
          return;
        }

        const pending = this.pendingRequests.get(id);
        if (!pending) return;

        this.pendingRequests.delete(id);

        if (error) {
          pending.reject(new Error(error.message || 'Worker error'));
        } else {
          pending.resolve(result);
        }
      });

      this.worker.addEventListener('error', (error) => {
        console.error('Barcode worker error:', error);
        this.handleWorkerError();
      });
    } catch (error) {
      console.error('Failed to initialize barcode worker:', error);
      this.workerReady = false;
    }
  }

  /**
   * 处理 Worker 错误
   */
  private handleWorkerError(): void {
    // 拒绝所有待处理的请求
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Worker crashed'));
    });
    this.pendingRequests.clear();
    
    // 尝试重新初始化 Worker
    this.worker?.terminate();
    this.worker = null;
    this.workerReady = false;
    
    // 延迟重试
    setTimeout(() => {
      this.initWorker();
    }, 1000);
  }

  /**
   * 设置缓存清理
   */
  private setupCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      this.cache.forEach((value, key) => {
        if (now - value.timestamp > this.cacheTimeout) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.cache.delete(key));
      
      // 如果缓存过大，删除最旧的条目
      if (this.cache.size > this.maxCacheSize) {
        const entries = Array.from(this.cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
        toRemove.forEach(([key]) => this.cache.delete(key));
      }
    }, 60000); // 每分钟检查一次
  }

  /**
   * 生成条形码
   */
  public async generate(
    value: string,
    options: BarcodeRenderOptions
  ): Promise<BarcodeGenerationResult> {
    // 检查缓存
    const cacheKey = generateCacheKey(value, options);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 如果 Worker 可用，使用 Worker
    if (this.worker && this.workerReady) {
      try {
        const result = await this.generateWithWorker(value, options);
        
        // 缓存结果
        this.cache.set(cacheKey, result);
        
        return result;
      } catch (error) {
        console.warn('Worker generation failed, falling back:', error);
        // 降级到主线程
        return this.generateFallback(value, options);
      }
    } else {
      // 降级到主线程
      return this.generateFallback(value, options);
    }
  }

  /**
   * 使用 Worker 生成条形码
   */
  private async generateWithWorker(
    value: string,
    options: BarcodeRenderOptions
  ): Promise<BarcodeGenerationResult> {
    await this.workerReadyPromise;

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pendingRequests.set(id, { resolve, reject });

      this.worker!.postMessage({
        id,
        type: 'generate',
        data: {
          value,
          options,
          canvasWidth: options.width,
          canvasHeight: options.height,
        },
      });

      // 设置超时
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Generation timeout'));
        }
      }, 10000); // 10 秒超时
    });
  }

  /**
   * 降级方案：在主线程生成条形码
   */
  private async generateFallback(
    value: string,
    options: BarcodeRenderOptions
  ): Promise<BarcodeGenerationResult> {
    // 动态导入库以避免阻塞初始加载
    const [{ default: JsBarcode }, { default: QRCode }] = await Promise.all([
      import('jsbarcode'),
      import('qrcode'),
    ]);

    if (!this.fallbackCanvas) {
      this.fallbackCanvas = document.createElement('canvas');
    }

    const canvas = this.fallbackCanvas;
    canvas.width = options.width;
    canvas.height = options.height;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (is2DBarcode(options.barcodeType)) {
      if (options.barcodeType === BarcodeType.QRCODE) {
        await QRCode.toCanvas(canvas, value, {
          errorCorrectionLevel: ['L', 'M', 'Q', 'H'][options.errorCorrection || 1],
          margin: options.margin || 1,
          color: {
            dark: options.lineColor || '#000000',
            light: options.background || '#FFFFFF',
          },
          width: canvas.width,
        });
      } else {
        throw new Error(`${options.barcodeType} is not yet supported`);
      }
    } else {
      // 生成 1D 条形码
      JsBarcode(canvas, value, {
        format: this.getJsBarcodeFormat(options.barcodeType),
        width: options.barWidth || 2,
        height: options.barHeight || 100,
        displayValue: options.displayValue !== false,
        fontSize: options.fontSize || 12,
        font: options.font || 'Arial',
        textAlign: options.textAlign || 'center',
        textPosition: options.textPosition || 'bottom',
        textMargin: options.textMargin || 2,
        background: options.background || '#FFFFFF',
        lineColor: options.lineColor || '#000000',
        margin: options.margin || 10,
      });
    }

    // 应用旋转
    if (options.rotation) {
      await this.rotateCanvas(canvas, options.rotation);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const result: BarcodeGenerationResult = {
      imageData,
      width: canvas.width,
      height: canvas.height,
      timestamp: Date.now(),
    };

    // 缓存结果
    const cacheKey = generateCacheKey(value, options);
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * 旋转画布
   */
  private async rotateCanvas(canvas: HTMLCanvasElement, angle: number): Promise<void> {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    
    // 计算旋转后的尺寸
    const newWidth = canvas.width * cos + canvas.height * sin;
    const newHeight = canvas.width * sin + canvas.height * cos;
    
    // 创建临时画布
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);
    
    // 调整原画布尺寸
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(rad);
    ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
    ctx.restore();
  }

  /**
   * 获取 JsBarcode 格式
   */
  private getJsBarcodeFormat(type: BarcodeType): string {
    const formatMap: Record<string, string> = {
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

    return formatMap[type] || 'CODE128';
  }

  /**
   * 验证条形码值
   */
  public async validate(type: BarcodeType, value: string): Promise<{ valid: boolean; error?: string }> {
    if (this.worker && this.workerReady) {
      return new Promise((resolve, reject) => {
        const id = this.requestId++;
        this.pendingRequests.set(id, { resolve, reject });

        this.worker!.postMessage({
          id,
          type: 'validate',
          data: { type, value },
        });
      });
    } else {
      // 降级验证
      return this.validateFallback(type, value);
    }
  }

  /**
   * 降级验证
   */
  private validateFallback(type: BarcodeType, value: string): { valid: boolean; error?: string } {
    if (!value || value.trim() === '') {
      return { valid: false, error: 'Value cannot be empty' };
    }

    // 根据条形码类型进行特定验证
    switch (type) {
      case BarcodeType.EAN8:
        if (!/^\d{7,8}$/.test(value)) {
          return { valid: false, error: 'EAN8 requires 7-8 digits' };
        }
        break;
      case BarcodeType.EAN13:
        if (!/^\d{12,13}$/.test(value)) {
          return { valid: false, error: 'EAN13 requires 12-13 digits' };
        }
        break;
      case BarcodeType.UPCA:
        if (!/^\d{11,12}$/.test(value)) {
          return { valid: false, error: 'UPC-A requires 11-12 digits' };
        }
        break;
      case BarcodeType.UPCE:
        if (!/^\d{6,8}$/.test(value)) {
          return { valid: false, error: 'UPC-E requires 6-8 digits' };
        }
        break;
      case BarcodeType.ITF14:
        if (!/^\d{13,14}$/.test(value)) {
          return { valid: false, error: 'ITF14 requires 13-14 digits' };
        }
        break;
      case BarcodeType.CODE11:
        if (!/^[\d\-]+$/.test(value)) {
          return { valid: false, error: 'CODE11 requires digits and hyphens only' };
        }
        break;
      case BarcodeType.CODE39:
        if (!/^[0-9A-Z\-\.\s\$\/\+\%]+$/.test(value)) {
          return { valid: false, error: 'CODE39 requires uppercase letters, digits, and special characters' };
        }
        break;
      case BarcodeType.POSTNET:
        if (!/^\d{5}$|^\d{9}$|^\d{11}$/.test(value)) {
          return { valid: false, error: 'POSTNET requires 5, 9, or 11 digits' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * 获取支持的条形码类型
   */
  public async getSupportedTypes(): Promise<{ types: string[]; formats: Record<string, string[]> }> {
    if (this.worker && this.workerReady) {
      return new Promise((resolve, reject) => {
        const id = this.requestId++;
        this.pendingRequests.set(id, { resolve, reject });

        this.worker!.postMessage({
          id,
          type: 'getSupportedTypes',
        });
      });
    } else {
      // 降级方案
      return {
        types: Object.values(BarcodeType),
        formats: {
          '1D': Object.values(BarcodeType).filter(type => !is2DBarcode(type as BarcodeType)),
          '2D': [BarcodeType.QRCODE],
        },
      };
    }
  }

  /**
   * 从元素生成条形码
   */
  public async generateFromElement(
    element: IBarcodeElement,
    value: string
  ): Promise<BarcodeGenerationResult> {
    const options: BarcodeRenderOptions = {
      barcodeType: element.barcodeType,
      width: element.size.width,
      height: element.size.height,
      rotation: element.style?.rotation,
      displayValue: !element.style?.hideText,
      fontSize: element.style?.fontSize,
      font: element.style?.fontFamily,
      background: element.style?.backgroundColor,
      lineColor: element.style?.lineColor,
      margin: element.style?.margin,
      textMargin: element.style?.textMargin,
      barWidth: element.bounds.width,
      barHeight: element.bounds.height,
      errorCorrection: element.errorCorrection,
    };

    return this.generate(value, options);
  }

  /**
   * 预热缓存
   */
  public async preheat(
    values: string[],
    options: BarcodeRenderOptions
  ): Promise<void> {
    const promises = values.map(value => this.generate(value, options).catch(() => null));
    await Promise.all(promises);
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 销毁渲染器
   */
  public destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.cache.clear();
    this.pendingRequests.clear();
    if (this.fallbackCanvas) {
      this.fallbackCanvas = null;
    }
  }
}

// 单例实例
let rendererInstance: BarcodeRenderer | null = null;

/**
 * 获取条形码渲染器实例
 */
export function getBarcodeRenderer(): BarcodeRenderer {
  if (!rendererInstance) {
    rendererInstance = new BarcodeRenderer();
  }
  return rendererInstance;
}

/**
 * 销毁条形码渲染器实例
 */
export function destroyBarcodeRenderer(): void {
  if (rendererInstance) {
    rendererInstance.destroy();
    rendererInstance = null;
  }
}