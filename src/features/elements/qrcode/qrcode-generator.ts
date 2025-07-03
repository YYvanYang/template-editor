import QRCode from 'qrcode';
import type { 
  QRCodeGenerationOptions, 
  QRCodeStyle,
  QRCodeErrorCorrection,
  QRCodeDotStyle,
  QRCodeCornerStyle,
} from '../types/qrcode.types';

// Worker 相关类型
interface GenerateRequest {
  id: string;
  options: QRCodeGenerationOptions;
}

interface GenerateResult {
  id: string;
  success: boolean;
  data?: string;
  error?: string;
  cacheKey?: string;
}

// 缓存接口
interface CacheEntry {
  data: string;
  timestamp: number;
}

/**
 * 二维码生成器类
 */
export class QRCodeGenerator {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();
  private cache = new Map<string, CacheEntry>();
  private readonly maxCacheSize = 100;
  private readonly cacheExpiration = 1000 * 60 * 60; // 1小时
  
  constructor() {
    this.initWorker();
  }
  
  /**
   * 初始化 Web Worker
   */
  private initWorker(): void {
    try {
      // 使用 Vite 的 Worker 导入语法
      this.worker = new Worker(
        new URL('./qrcode.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
      this.worker.addEventListener('error', this.handleWorkerError.bind(this));
    } catch (error) {
      console.warn('Web Worker 初始化失败，将使用主线程生成', error);
    }
  }
  
  /**
   * 处理 Worker 消息
   */
  private handleWorkerMessage(event: MessageEvent<GenerateResult>): void {
    const { id, success, data, error, cacheKey } = event.data;
    const pending = this.pendingRequests.get(id);
    
    if (!pending) return;
    
    this.pendingRequests.delete(id);
    
    if (success && data && cacheKey) {
      // 更新本地缓存
      this.setCache(cacheKey, data);
      pending.resolve(data);
    } else {
      pending.reject(new Error(error || '生成失败'));
    }
  }
  
  /**
   * 处理 Worker 错误
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('Worker 错误:', error);
    
    // 拒绝所有待处理的请求
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Worker 错误'));
    });
    this.pendingRequests.clear();
    
    // 尝试重新初始化 Worker
    this.worker = null;
    setTimeout(() => this.initWorker(), 1000);
  }
  
  /**
   * 生成二维码
   */
  async generate(options: QRCodeGenerationOptions): Promise<string> {
    const cacheKey = this.generateCacheKey(options);
    
    // 检查缓存
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    // 如果 Worker 可用，使用 Worker 生成
    if (this.worker) {
      return this.generateWithWorker(options, cacheKey);
    }
    
    // 否则在主线程生成
    return this.generateInMainThread(options, cacheKey);
  }
  
  /**
   * 使用 Worker 生成二维码
   */
  private generateWithWorker(options: QRCodeGenerationOptions, cacheKey: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = this.generateRequestId();
      
      this.pendingRequests.set(id, { resolve, reject });
      
      this.worker!.postMessage({
        type: 'generate',
        id,
        options,
      });
      
      // 设置超时
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('生成超时'));
        }
      }, 10000);
    });
  }
  
  /**
   * 在主线程生成二维码
   */
  private async generateInMainThread(
    options: QRCodeGenerationOptions,
    cacheKey: string
  ): Promise<string> {
    try {
      const { style } = options;
      
      // 如果有高级样式，使用 Canvas 生成
      if (this.hasAdvancedStyles(style)) {
        return this.generateWithCanvas(options, cacheKey);
      }
      
      // 否则使用 qrcode 库的基础功能
      const qrOptions: QRCode.QRCodeToDataURLOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        type: 'image/png',
        quality: options.quality || 0.92,
        margin: style?.margin !== undefined ? Math.floor(style.margin / 10) : 1,
        color: {
          dark: style?.dotsColor || '#000000',
          light: style?.backgroundColor || '#FFFFFF',
        },
        width: options.size || 300,
      };
      
      const dataUrl = await QRCode.toDataURL(options.value, qrOptions);
      
      // 缓存结果
      this.setCache(cacheKey, dataUrl);
      
      return dataUrl;
    } catch (error) {
      throw new Error(`生成二维码失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 检查是否有高级样式
   */
  private hasAdvancedStyles(style?: QRCodeStyle): boolean {
    if (!style) return false;
    
    return Boolean(
      style.dotsStyle && style.dotsStyle !== 'square' ||
      style.dotsGradient ||
      style.cornersSquareStyle ||
      style.cornersSquareGradient ||
      style.cornersDotStyle ||
      style.cornersDotGradient ||
      style.logo
    );
  }
  
  /**
   * 使用 Canvas 生成带高级样式的二维码
   */
  private async generateWithCanvas(
    options: QRCodeGenerationOptions,
    cacheKey: string
  ): Promise<string> {
    const {
      value,
      errorCorrectionLevel = 'M',
      size = 300,
      style = {},
    } = options;
    
    // 先生成基础二维码数据
    const modules = await this.getQRCodeModules(value, errorCorrectionLevel);
    const moduleCount = modules.length;
    
    // 创建 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建 Canvas 上下文');
    }
    
    // 绘制背景
    ctx.fillStyle = style.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // 计算模块大小和边距
    const margin = style.margin || 0;
    const moduleSize = (size - margin * 2) / moduleCount;
    
    // 绘制数据模块
    this.drawModules(ctx, modules, moduleSize, margin, style);
    
    // 绘制定位图案
    this.drawPositionPatterns(ctx, moduleSize, margin, moduleCount, style);
    
    // 绘制 Logo
    if (style.logo) {
      await this.drawLogo(ctx, size, style.logo);
    }
    
    // 转换为 DataURL
    const dataUrl = canvas.toDataURL('image/png', options.quality || 0.92);
    
    // 缓存结果
    this.setCache(cacheKey, dataUrl);
    
    return dataUrl;
  }
  
  /**
   * 获取二维码模块数据
   */
  private async getQRCodeModules(text: string, errorCorrection: string): Promise<boolean[][]> {
    // 使用 qrcode 库生成 SVG，然后解析模块数据
    const svg = await QRCode.toString(text, {
      errorCorrectionLevel: errorCorrection as QRCode.QRCodeErrorCorrectionLevel,
      type: 'svg',
      margin: 0,
    });
    
    // 解析 SVG 获取模块数据
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const rects = doc.querySelectorAll('rect');
    
    // 计算模块数量
    const viewBox = doc.querySelector('svg')?.getAttribute('viewBox');
    if (!viewBox) throw new Error('无法解析二维码');
    
    const [, , width] = viewBox.split(' ').map(Number);
    const moduleCount = Math.sqrt(rects.length - 1); // 减去背景矩形
    
    // 构建模块矩阵
    const modules: boolean[][] = Array(moduleCount).fill(null).map(() => 
      Array(moduleCount).fill(false)
    );
    
    // 跳过第一个矩形（背景）
    Array.from(rects).slice(1).forEach(rect => {
      const x = parseInt(rect.getAttribute('x') || '0');
      const y = parseInt(rect.getAttribute('y') || '0');
      if (x < moduleCount && y < moduleCount) {
        modules[y][x] = true;
      }
    });
    
    return modules;
  }
  
  /**
   * 绘制数据模块
   */
  private drawModules(
    ctx: CanvasRenderingContext2D,
    modules: boolean[][],
    moduleSize: number,
    margin: number,
    style: QRCodeStyle
  ): void {
    const dotStyle = style.dotsStyle || 'square';
    
    // 设置填充样式
    if (style.dotsGradient) {
      ctx.fillStyle = this.createCanvasGradient(ctx, style.dotsGradient, modules.length * moduleSize);
    } else {
      ctx.fillStyle = style.dotsColor || '#000000';
    }
    
    // 绘制每个模块
    modules.forEach((row, rowIndex) => {
      row.forEach((isBlack, colIndex) => {
        if (isBlack && !this.isPositionPattern(rowIndex, colIndex, modules.length)) {
          const x = margin + colIndex * moduleSize;
          const y = margin + rowIndex * moduleSize;
          this.drawDot(ctx, x, y, moduleSize, dotStyle as QRCodeDotStyle);
        }
      });
    });
  }
  
  /**
   * 检查是否是定位图案区域
   */
  private isPositionPattern(row: number, col: number, moduleCount: number): boolean {
    // 左上角
    if (row < 7 && col < 7) return true;
    // 右上角
    if (row < 7 && col >= moduleCount - 7) return true;
    // 左下角
    if (row >= moduleCount - 7 && col < 7) return true;
    return false;
  }
  
  /**
   * 绘制单个点
   */
  private drawDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    style: QRCodeDotStyle
  ): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    ctx.beginPath();
    
    switch (style) {
      case 'dots':
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        break;
        
      case 'rounded':
        ctx.roundRect(x, y, size, size, size * 0.25);
        break;
        
      case 'classy':
      case 'classy-rounded':
        ctx.roundRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8, size * 0.35);
        break;
        
      case 'extra-rounded':
        ctx.roundRect(x, y, size, size, size * 0.45);
        break;
        
      case 'square':
      default:
        ctx.rect(x, y, size, size);
        break;
    }
    
    ctx.fill();
  }
  
  /**
   * 绘制定位图案
   */
  private drawPositionPatterns(
    ctx: CanvasRenderingContext2D,
    moduleSize: number,
    margin: number,
    moduleCount: number,
    style: QRCodeStyle
  ): void {
    const positions = [
      { x: 0, y: 0 },
      { x: moduleCount - 7, y: 0 },
      { x: 0, y: moduleCount - 7 },
    ];
    
    positions.forEach(pos => {
      this.drawPositionPattern(ctx, pos.x, pos.y, moduleSize, margin, style);
    });
  }
  
  /**
   * 绘制单个定位图案
   */
  private drawPositionPattern(
    ctx: CanvasRenderingContext2D,
    moduleX: number,
    moduleY: number,
    moduleSize: number,
    margin: number,
    style: QRCodeStyle
  ): void {
    const x = margin + moduleX * moduleSize;
    const y = margin + moduleY * moduleSize;
    const size = 7 * moduleSize;
    
    // 外框
    ctx.fillStyle = style.cornersSquareColor || style.dotsColor || '#000000';
    if (style.cornersSquareGradient) {
      ctx.fillStyle = this.createCanvasGradient(ctx, style.cornersSquareGradient, size);
    }
    
    if (style.cornersSquareStyle === 'dots') {
      this.drawRoundedSquare(ctx, x, y, size, size, size / 2);
    } else if (style.cornersSquareStyle === 'extra-rounded') {
      this.drawRoundedSquare(ctx, x, y, size, size, size * 0.45);
    } else {
      ctx.fillRect(x, y, size, size);
    }
    
    // 白色中间
    ctx.fillStyle = style.backgroundColor || '#FFFFFF';
    ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
    
    // 内部方块
    ctx.fillStyle = style.cornersDotColor || style.dotsColor || '#000000';
    if (style.cornersDotGradient) {
      ctx.fillStyle = this.createCanvasGradient(ctx, style.cornersDotGradient, 3 * moduleSize);
    }
    
    const innerX = x + 2 * moduleSize;
    const innerY = y + 2 * moduleSize;
    const innerSize = 3 * moduleSize;
    
    if (style.cornersDotStyle === 'dots') {
      this.drawRoundedSquare(ctx, innerX, innerY, innerSize, innerSize, innerSize / 2);
    } else if (style.cornersDotStyle === 'extra-rounded') {
      this.drawRoundedSquare(ctx, innerX, innerY, innerSize, innerSize, innerSize * 0.45);
    } else {
      ctx.fillRect(innerX, innerY, innerSize, innerSize);
    }
  }
  
  /**
   * 绘制圆角矩形
   */
  private drawRoundedSquare(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }
  
  /**
   * 创建 Canvas 渐变
   */
  private createCanvasGradient(
    ctx: CanvasRenderingContext2D,
    gradient: QRCodeStyle['dotsGradient'],
    size: number
  ): CanvasGradient {
    if (!gradient) {
      return ctx.createLinearGradient(0, 0, size, size);
    }
    
    let canvasGradient: CanvasGradient;
    
    if (gradient.type === 'linear') {
      const startX = (gradient.startX || 0) * size;
      const startY = (gradient.startY || 0) * size;
      const endX = (gradient.endX || 1) * size;
      const endY = (gradient.endY || 1) * size;
      canvasGradient = ctx.createLinearGradient(startX, startY, endX, endY);
    } else {
      const centerX = (gradient.centerX || 0.5) * size;
      const centerY = (gradient.centerY || 0.5) * size;
      const radius = (gradient.radius || 0.5) * size;
      canvasGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    }
    
    gradient.colorStops.forEach(stop => {
      canvasGradient.addColorStop(stop.offset, stop.color);
    });
    
    return canvasGradient;
  }
  
  /**
   * 绘制 Logo
   */
  private async drawLogo(
    ctx: CanvasRenderingContext2D,
    canvasSize: number,
    logo: QRCodeStyle['logo']
  ): Promise<void> {
    if (!logo) return;
    
    const img = new Image();
    img.crossOrigin = logo.crossOrigin || 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const logoWidth = canvasSize * (logo.width || 0.2);
        const logoHeight = canvasSize * (logo.height || 0.2);
        const logoX = (canvasSize - logoWidth) / 2;
        const logoY = (canvasSize - logoHeight) / 2;
        const logoMargin = logo.margin || 5;
        
        // 绘制 Logo 背景
        if (logo.backgroundColor) {
          ctx.fillStyle = logo.backgroundColor;
          const bgSize = Math.max(logoWidth, logoHeight) + logoMargin * 2;
          const bgX = (canvasSize - bgSize) / 2;
          const bgY = (canvasSize - bgSize) / 2;
          
          if (logo.borderRadius) {
            ctx.beginPath();
            ctx.roundRect(bgX, bgY, bgSize, bgSize, logo.borderRadius);
            ctx.fill();
          } else {
            ctx.fillRect(bgX, bgY, bgSize, bgSize);
          }
        }
        
        // 绘制 Logo
        ctx.drawImage(img, logoX, logoY, logoWidth, logoHeight);
        resolve();
      };
      
      img.onerror = () => {
        console.warn('Logo 加载失败:', logo.src);
        resolve(); // Logo 加载失败不影响二维码生成
      };
      
      img.src = logo.src;
    });
  }
  
  /**
   * 生成缓存键
   */
  private generateCacheKey(options: QRCodeGenerationOptions): string {
    const { value, errorCorrectionLevel, size, margin, style = {} } = options;
    const styleStr = JSON.stringify(style, Object.keys(style).sort());
    return `qr_${value}_${errorCorrectionLevel}_${size}_${margin}_${styleStr}`;
  }
  
  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 获取缓存
   */
  private getCache(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // 检查是否过期
    if (Date.now() - entry.timestamp > this.cacheExpiration) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * 设置缓存
   */
  private setCache(key: string, data: string): void {
    // 清理过期缓存
    if (this.cache.size >= this.maxCacheSize) {
      const keysToDelete: string[] = [];
      const now = Date.now();
      
      this.cache.forEach((entry, k) => {
        if (now - entry.timestamp > this.cacheExpiration) {
          keysToDelete.push(k);
        }
      });
      
      keysToDelete.forEach(k => this.cache.delete(k));
      
      // 如果还是超过限制，删除最旧的
      if (this.cache.size >= this.maxCacheSize) {
        const oldest = Array.from(this.cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        
        if (oldest) {
          this.cache.delete(oldest[0]);
        }
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
    
    if (this.worker) {
      this.worker.postMessage({ type: 'clearCache' });
    }
  }
  
  /**
   * 销毁生成器
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.pendingRequests.clear();
    this.cache.clear();
  }
}

// 单例实例
let instance: QRCodeGenerator | null = null;

/**
 * 获取二维码生成器实例
 */
export function getQRCodeGenerator(): QRCodeGenerator {
  if (!instance) {
    instance = new QRCodeGenerator();
  }
  return instance;
}

/**
 * 生成二维码的便捷函数
 */
export async function generateQRCode(options: QRCodeGenerationOptions): Promise<string> {
  const generator = getQRCodeGenerator();
  return generator.generate(options);
}

/**
 * 批量生成二维码
 */
export async function generateQRCodeBatch(
  optionsList: QRCodeGenerationOptions[]
): Promise<string[]> {
  const generator = getQRCodeGenerator();
  return Promise.all(optionsList.map(options => generator.generate(options)));
}

/**
 * 预热二维码生成器
 */
export async function warmupQRCodeGenerator(): Promise<void> {
  const generator = getQRCodeGenerator();
  
  // 生成一个简单的二维码来预热
  try {
    await generator.generate({
      value: 'warmup',
      size: 100,
      errorCorrectionLevel: 'L' as QRCodeErrorCorrection,
    });
  } catch (error) {
    console.warn('二维码生成器预热失败:', error);
  }
}