/// <reference lib="webworker" />

import type { QRCodeGenerationOptions, QRCodeStyle, QRCodeDotStyle, QRCodeCornerStyle } from '../types/qrcode.types';

declare const self: DedicatedWorkerGlobalScope;

// QR Code 生成器接口
interface QRCodeGenerator {
  generate(text: string, options: QRCodeGenerationOptions): ImageData | string;
}

// 消息类型
interface GenerateMessage {
  type: 'generate';
  id: string;
  options: QRCodeGenerationOptions;
}

interface ClearCacheMessage {
  type: 'clearCache';
}

type WorkerMessage = GenerateMessage | ClearCacheMessage;

// 结果类型
interface SuccessResult {
  id: string;
  success: true;
  data: string; // Base64 编码的图片
  cacheKey: string;
}

interface ErrorResult {
  id: string;
  success: false;
  error: string;
}

type WorkerResult = SuccessResult | ErrorResult;

// 缓存
const cache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

// 生成缓存键
function generateCacheKey(options: QRCodeGenerationOptions): string {
  const { value, errorCorrectionLevel = 'M', size = 200, margin = 16, style = {} } = options;
  const styleStr = JSON.stringify(style, Object.keys(style).sort());
  return `${value}_${errorCorrectionLevel}_${size}_${margin}_${styleStr}`;
}

// 简化的二维码生成器（实际项目中应使用专业库如 qrcode.js）
class SimpleQRCodeGenerator implements QRCodeGenerator {
  generate(text: string, options: QRCodeGenerationOptions): string {
    const {
      errorCorrectionLevel = 'M',
      size = 200,
      margin = 16,
      style = {},
    } = options;
    
    // 创建 Canvas
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法创建 Canvas 上下文');
    }
    
    // 背景
    ctx.fillStyle = style.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // 计算二维码模块
    const moduleCount = this.getModuleCount(errorCorrectionLevel);
    const moduleSize = (size - margin * 2) / moduleCount;
    
    // 生成二维码数据（简化版，实际应使用 Reed-Solomon 纠错算法）
    const modules = this.generateModules(text, moduleCount, errorCorrectionLevel);
    
    // 绘制二维码
    this.drawModules(ctx, modules, moduleSize, margin, style);
    
    // 绘制定位图案
    this.drawPositionPatterns(ctx, moduleSize, margin, moduleCount, style);
    
    // 绘制 Logo（如果有）
    if (style.logo) {
      this.drawLogo(ctx, size, style.logo);
    }
    
    // 转换为 Base64
    return canvas.convertToBlob({ type: 'image/png', quality: 0.92 })
      .then(blob => {
        const reader = new FileReaderSync();
        return reader.readAsDataURL(blob);
      });
  }
  
  private getModuleCount(errorCorrection: string): number {
    // 简化的模块数量计算
    const counts: Record<string, number> = {
      'L': 21,
      'M': 25,
      'Q': 29,
      'H': 33,
    };
    return counts[errorCorrection] || 25;
  }
  
  private generateModules(text: string, moduleCount: number, errorCorrection: string): boolean[][] {
    // 简化的二维码数据生成（实际应使用完整的二维码算法）
    const modules: boolean[][] = Array(moduleCount).fill(null).map(() => 
      Array(moduleCount).fill(false)
    );
    
    // 模拟数据模块（实际应根据文本和纠错级别生成）
    const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let rand = seed;
    
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        // 跳过定位图案区域
        if (this.isPositionPattern(row, col, moduleCount)) {
          continue;
        }
        
        // 生成伪随机数据
        rand = (rand * 9301 + 49297) % 233280;
        modules[row][col] = rand / 233280 > 0.5;
      }
    }
    
    return modules;
  }
  
  private isPositionPattern(row: number, col: number, moduleCount: number): boolean {
    // 检查是否在定位图案区域
    const inTopLeft = row < 9 && col < 9;
    const inTopRight = row < 9 && col >= moduleCount - 8;
    const inBottomLeft = row >= moduleCount - 8 && col < 9;
    
    return inTopLeft || inTopRight || inBottomLeft;
  }
  
  private drawModules(
    ctx: OffscreenCanvasRenderingContext2D,
    modules: boolean[][],
    moduleSize: number,
    margin: number,
    style: QRCodeStyle
  ): void {
    const color = style.dotsColor || '#000000';
    const dotStyle = style.dotsStyle || 'square';
    
    // 设置渐变（如果有）
    if (style.dotsGradient) {
      ctx.fillStyle = this.createGradient(ctx, style.dotsGradient, modules.length * moduleSize);
    } else {
      ctx.fillStyle = color;
    }
    
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
  
  private drawDot(
    ctx: OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    style: QRCodeDotStyle
  ): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    switch (style) {
      case 'dots':
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'rounded':
        const radius = size * 0.25;
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, radius);
        ctx.fill();
        break;
        
      case 'classy':
      case 'classy-rounded':
        const classyRadius = size * 0.35;
        ctx.beginPath();
        ctx.roundRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8, classyRadius);
        ctx.fill();
        break;
        
      case 'extra-rounded':
        const extraRadius = size * 0.45;
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, extraRadius);
        ctx.fill();
        break;
        
      case 'square':
      default:
        ctx.fillRect(x, y, size, size);
        break;
    }
  }
  
  private drawPositionPatterns(
    ctx: OffscreenCanvasRenderingContext2D,
    moduleSize: number,
    margin: number,
    moduleCount: number,
    style: QRCodeStyle
  ): void {
    const positions = [
      { x: 0, y: 0 },                                    // 左上
      { x: moduleCount - 7, y: 0 },                     // 右上
      { x: 0, y: moduleCount - 7 },                     // 左下
    ];
    
    positions.forEach(pos => {
      this.drawPositionPattern(ctx, pos.x, pos.y, moduleSize, margin, style);
    });
  }
  
  private drawPositionPattern(
    ctx: OffscreenCanvasRenderingContext2D,
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
    ctx.fillRect(x, y, size, size);
    
    // 白色中间
    ctx.fillStyle = style.backgroundColor || '#FFFFFF';
    ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
    
    // 内部方块
    ctx.fillStyle = style.cornersDotColor || style.dotsColor || '#000000';
    ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
  }
  
  private createGradient(
    ctx: OffscreenCanvasRenderingContext2D,
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
  
  private drawLogo(
    ctx: OffscreenCanvasRenderingContext2D,
    canvasSize: number,
    logo: QRCodeStyle['logo']
  ): void {
    if (!logo) return;
    
    // Logo 大小计算
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
    
    // 注意：在 Worker 中无法直接绘制图片，需要传递 ImageData
    // 这里只是占位，实际实现需要在主线程处理图片
  }
}

// 处理消息
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  
  try {
    switch (message.type) {
      case 'generate': {
        const { id, options } = message;
        const cacheKey = generateCacheKey(options);
        
        // 检查缓存
        if (cache.has(cacheKey)) {
          const result: SuccessResult = {
            id,
            success: true,
            data: cache.get(cacheKey)!,
            cacheKey,
          };
          self.postMessage(result);
          return;
        }
        
        // 生成二维码
        const generator = new SimpleQRCodeGenerator();
        const data = await generator.generate(options.value, options);
        
        // 缓存管理
        if (cache.size >= MAX_CACHE_SIZE) {
          const firstKey = cache.keys().next().value;
          if (firstKey) cache.delete(firstKey);
        }
        cache.set(cacheKey, data);
        
        const result: SuccessResult = {
          id,
          success: true,
          data,
          cacheKey,
        };
        self.postMessage(result);
        break;
      }
      
      case 'clearCache': {
        cache.clear();
        break;
      }
    }
  } catch (error) {
    if (message.type === 'generate') {
      const result: ErrorResult = {
        id: message.id,
        success: false,
        error: error instanceof Error ? error.message : '生成二维码失败',
      };
      self.postMessage(result);
    }
  }
});

// 导出类型供外部使用
export type { WorkerMessage, WorkerResult };