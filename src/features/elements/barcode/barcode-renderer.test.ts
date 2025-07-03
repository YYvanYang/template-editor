import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  BarcodeRenderer, 
  getBarcodeRenderer, 
  destroyBarcodeRenderer,
  type BarcodeRenderOptions 
} from './barcode-renderer';
import { BarcodeType } from '../types/barcode.types';

// Mock Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  
  constructor(public url: string) {
    // 模拟 Worker 准备就绪
    setTimeout(() => {
      this.dispatchMessage({ type: 'ready' });
    }, 0);
  }

  postMessage(data: any) {
    // 模拟异步处理
    setTimeout(() => {
      const { id, type } = data;
      
      switch (type) {
        case 'generate':
          // 模拟成功生成
          const imageData = new ImageData(100, 50);
          this.dispatchMessage({
            id,
            result: {
              imageData,
              width: 100,
              height: 50,
            },
          });
          break;
          
        case 'validate':
          this.dispatchMessage({
            id,
            result: { valid: true },
          });
          break;
          
        case 'getSupportedTypes':
          this.dispatchMessage({
            id,
            result: {
              types: ['code128', 'qrcode'],
              formats: {
                '1D': ['code128'],
                '2D': ['qrcode'],
              },
            },
          });
          break;
      }
    }, 10);
  }

  addEventListener(event: string, handler: Function) {
    if (event === 'message') {
      this.onmessage = handler as any;
    } else if (event === 'error') {
      this.onerror = handler as any;
    }
  }

  terminate() {
    // Mock terminate
  }

  private dispatchMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }
}

// Mock canvas
const mockCanvas = {
  width: 100,
  height: 50,
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    getImageData: vi.fn(() => new ImageData(100, 50)),
    putImageData: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
  })),
};

// Mock imports
vi.mock('jsbarcode', () => ({
  default: vi.fn((canvas, value, options) => {
    // 模拟条形码生成
    if (options.valid) {
      options.valid(true);
    }
  }),
}));

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn(() => Promise.resolve()),
  },
}));

describe('BarcodeRenderer', () => {
  let originalWorker: typeof Worker;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    // 清理之前的实例
    destroyBarcodeRenderer();
    
    // Mock Worker
    originalWorker = global.Worker;
    global.Worker = MockWorker as any;
    
    // Mock createElement for canvas
    originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return originalCreateElement.call(document, tagName);
    });
  });

  afterEach(() => {
    global.Worker = originalWorker;
    document.createElement = originalCreateElement;
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create a singleton instance', () => {
      const instance1 = getBarcodeRenderer();
      const instance2 = getBarcodeRenderer();
      expect(instance1).toBe(instance2);
    });

    it('should initialize worker on creation', async () => {
      const renderer = new BarcodeRenderer();
      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(renderer).toBeDefined();
    });
  });

  describe('generate', () => {
    it('should generate barcode with worker', async () => {
      const renderer = getBarcodeRenderer();
      const options: BarcodeRenderOptions = {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
        displayValue: true,
      };

      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));

      const result = await renderer.generate('123456', options);
      
      expect(result).toBeDefined();
      expect(result.imageData).toBeInstanceOf(ImageData);
      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should use cache for repeated generations', async () => {
      const renderer = getBarcodeRenderer();
      const options: BarcodeRenderOptions = {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
      };

      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));

      const result1 = await renderer.generate('123456', options);
      const result2 = await renderer.generate('123456', options);
      
      // 应该返回相同的对象（从缓存）
      expect(result1).toBe(result2);
    });

    it('should fall back to main thread when worker fails', async () => {
      const renderer = new BarcodeRenderer();
      
      // 模拟 Worker 失败
      global.Worker = class FailingWorker {
        constructor() {
          throw new Error('Worker failed to load');
        }
      } as any;

      const options: BarcodeRenderOptions = {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
      };

      const result = await renderer.generate('123456', options);
      
      expect(result).toBeDefined();
      expect(result.imageData).toBeInstanceOf(ImageData);
    });

    it('should handle QR code generation', async () => {
      const renderer = getBarcodeRenderer();
      const options: BarcodeRenderOptions = {
        barcodeType: BarcodeType.QRCODE,
        width: 200,
        height: 200,
        errorCorrection: 2,
      };

      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));

      const result = await renderer.generate('https://example.com', options);
      
      expect(result).toBeDefined();
      expect(result.imageData).toBeInstanceOf(ImageData);
    });

    it('should apply rotation if specified', async () => {
      const renderer = getBarcodeRenderer();
      const options: BarcodeRenderOptions = {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
        rotation: 90,
      };

      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));

      const result = await renderer.generate('123456', options);
      
      expect(result).toBeDefined();
      // 注意：由于 Mock，尺寸可能不会真正改变
      expect(result.imageData).toBeInstanceOf(ImageData);
    });
  });

  describe('validate', () => {
    it('should validate barcode values', async () => {
      const renderer = getBarcodeRenderer();
      
      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));

      const result = await renderer.validate(BarcodeType.EAN13, '1234567890123');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid values', async () => {
      const renderer = new BarcodeRenderer();
      
      // 使用降级验证（不依赖 Worker）
      const result = await renderer.validate(BarcodeType.EAN13, '123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('EAN13 requires 12-13 digits');
    });

    it('should reject empty values', async () => {
      const renderer = new BarcodeRenderer();
      
      const result = await renderer.validate(BarcodeType.CODE128, '');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Value cannot be empty');
    });
  });

  describe('getSupportedTypes', () => {
    it('should return supported barcode types', async () => {
      const renderer = getBarcodeRenderer();
      
      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));

      const result = await renderer.getSupportedTypes();
      
      expect(result.types).toBeInstanceOf(Array);
      expect(result.formats['1D']).toBeInstanceOf(Array);
      expect(result.formats['2D']).toBeInstanceOf(Array);
    });
  });

  describe('generateFromElement', () => {
    it('should generate barcode from element data', async () => {
      const renderer = getBarcodeRenderer();
      
      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));

      const element = {
        id: 'test',
        type: 'barcode' as const,
        name: 'Test Barcode',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        rotation: 0,
        visible: true,
        locked: false,
        barcodeType: BarcodeType.CODE128,
        value: '123456',
        style: {
          hideText: false,
          fontSize: 12,
          backgroundColor: '#FFFFFF',
          lineColor: '#000000',
        },
      };

      const result = await renderer.generateFromElement(element, '123456');
      
      expect(result).toBeDefined();
      expect(result.imageData).toBeInstanceOf(ImageData);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const renderer = getBarcodeRenderer();
      const options: BarcodeRenderOptions = {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
      };

      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));

      // 生成并缓存
      await renderer.generate('123456', options);
      
      // 清除缓存
      renderer.clearCache();
      
      // 再次生成应该是新的结果
      const result = await renderer.generate('123456', options);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should preheat cache', async () => {
      const renderer = getBarcodeRenderer();
      const options: BarcodeRenderOptions = {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
      };

      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));

      await renderer.preheat(['123', '456', '789'], options);
      
      // 预热后的值应该能立即获取
      const result = await renderer.generate('123', options);
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle worker crash', async () => {
      const renderer = new BarcodeRenderer();
      
      // 等待 Worker 准备就绪
      await new Promise(resolve => setTimeout(resolve, 50));

      // 模拟 Worker 崩溃
      const mockWorkerInstance = (renderer as any).worker as MockWorker;
      if (mockWorkerInstance.onerror) {
        mockWorkerInstance.onerror(new ErrorEvent('error'));
      }

      // 应该能够降级到主线程
      const options: BarcodeRenderOptions = {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
      };

      const result = await renderer.generate('123456', options);
      expect(result).toBeDefined();
    });

    it('should handle generation timeout', async () => {
      const renderer = new BarcodeRenderer();
      
      // Mock 一个永不响应的 Worker
      const slowWorker = new MockWorker('/test');
      slowWorker.postMessage = vi.fn(); // 不响应
      (renderer as any).worker = slowWorker;
      (renderer as any).workerReady = true;

      const options: BarcodeRenderOptions = {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
      };

      // 应该超时并降级
      await expect(renderer.generate('123456', options)).rejects.toThrow();
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const renderer = new BarcodeRenderer();
      const terminateSpy = vi.fn();
      
      if ((renderer as any).worker) {
        (renderer as any).worker.terminate = terminateSpy;
      }

      renderer.destroy();
      
      expect(terminateSpy).toHaveBeenCalled();
    });

    it('should destroy singleton instance', () => {
      const renderer = getBarcodeRenderer();
      destroyBarcodeRenderer();
      
      const newRenderer = getBarcodeRenderer();
      expect(newRenderer).not.toBe(renderer);
    });
  });
});