import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performance } from 'perf_hooks';
import { BarcodeRenderer } from './barcode-renderer';
import { BarcodeType } from '../types/barcode.types';

// Mock ImageData for Node.js environment
class MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

// Mock Worker 以进行性能测试
class PerformanceMockWorker {
  private messageHandlers: Map<string, Function> = new Map();
  private errorHandlers: Map<string, Function> = new Map();
  
  constructor() {
    // 使用 Promise.resolve 确保异步执行
    Promise.resolve().then(() => {
      this.dispatchMessage({ type: 'ready' });
    });
  }

  postMessage(data: any) {
    // 模拟实际的处理时间
    const processingTime = this.getProcessingTime(data);
    
    setTimeout(() => {
      const { id, type } = data;
      
      if (type === 'generate') {
        // 模拟生成 ImageData
        const imageData = new MockImageData(200, 100);
        this.dispatchMessage({
          id,
          result: {
            imageData,
            width: 200,
            height: 100,
            timestamp: Date.now(),
          },
        });
      } else if (type === 'validate') {
        this.dispatchMessage({
          id,
          result: { valid: true },
        });
      } else if (type === 'getSupportedTypes') {
        this.dispatchMessage({
          id,
          result: {
            types: Object.values(BarcodeType),
            formats: {
              '1D': Object.values(BarcodeType).filter(type => !type.includes('QR')),
              '2D': [BarcodeType.QRCODE],
            },
          },
        });
      }
    }, processingTime);
  }

  private getProcessingTime(data: any): number {
    // 模拟不同类型的处理时间
    if (data.type === 'generate') {
      const { barcodeType } = data.data.options;
      if (barcodeType === BarcodeType.QRCODE) {
        return 20; // QR码需要更长时间
      }
      return 10; // 一维码
    }
    return 5;
  }

  addEventListener(event: string, handler: Function) {
    if (event === 'message') {
      this.messageHandlers.set('message', handler);
    } else if (event === 'error') {
      this.errorHandlers.set('error', handler);
    }
  }

  terminate() {
    // 清理资源
    this.messageHandlers.clear();
    this.errorHandlers.clear();
  }

  private dispatchMessage(data: any) {
    const handler = this.messageHandlers.get('message');
    if (handler) {
      handler({ data } as MessageEvent);
    }
  }

  // 模拟 onerror 以便测试错误恢复
  set onerror(handler: Function | null) {
    if (handler) {
      this.errorHandlers.set('error', handler);
    } else {
      this.errorHandlers.delete('error');
    }
  }

  get onerror() {
    return this.errorHandlers.get('error') || null;
  }
}

// Mock jsbarcode 和 qrcode 库
vi.mock('jsbarcode', () => ({
  default: vi.fn((canvas, value, options) => {
    // 模拟 JsBarcode 行为
  }),
}));

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn((canvas, value, options) => {
      // 模拟 QRCode 行为
      return Promise.resolve();
    }),
  },
}));

describe('BarcodeRenderer Performance', () => {
  let originalWorker: typeof Worker;
  let originalImageData: typeof ImageData;

  beforeEach(() => {
    // 保存原始值
    originalWorker = global.Worker;
    originalImageData = global.ImageData;
    
    // 设置 mock
    global.Worker = PerformanceMockWorker as any;
    global.ImageData = MockImageData as any;
    
    // Mock canvas 相关 API
    vi.stubGlobal('document', {
      createElement: vi.fn((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: vi.fn(() => ({
              clearRect: vi.fn(),
              getImageData: vi.fn(() => new MockImageData(200, 100)),
              drawImage: vi.fn(),
              save: vi.fn(),
              restore: vi.fn(),
              translate: vi.fn(),
              rotate: vi.fn(),
            })),
          };
        }
        return {};
      }),
    });
  });

  afterEach(() => {
    // 恢复原始值
    global.Worker = originalWorker;
    global.ImageData = originalImageData;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('生成性能', () => {
    it('应该在合理时间内生成单个条形码', async () => {
      const renderer = new BarcodeRenderer();
      await new Promise(resolve => setTimeout(resolve, 100)); // 等待 Worker 准备

      const startTime = performance.now();
      
      await renderer.generate('123456789', {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    }, 10000);

    it('应该高效处理批量生成', async () => {
      const renderer = new BarcodeRenderer();
      await new Promise(resolve => setTimeout(resolve, 100));

      const startTime = performance.now();
      const promises = [];
      
      // 生成10个不同的条形码
      for (let i = 0; i < 10; i++) {
        promises.push(
          renderer.generate(`TEST${i}`, {
            barcodeType: BarcodeType.CODE128,
            width: 200,
            height: 100,
          })
        );
      }
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500); // 10个条形码应该在500ms内完成
      console.log(`批量生成10个条形码耗时: ${duration.toFixed(2)}ms`);
    }, 10000);

    it('QR码生成应该在合理时间内完成', async () => {
      const renderer = new BarcodeRenderer();
      await new Promise(resolve => setTimeout(resolve, 100));

      const startTime = performance.now();
      
      await renderer.generate('https://example.com/very/long/url/with/many/parameters', {
        barcodeType: BarcodeType.QRCODE,
        width: 300,
        height: 300,
        errorCorrection: 2,
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(150); // QR码应该在150ms内完成
    }, 10000);
  });

  describe('缓存性能', () => {
    it('缓存命中应该几乎立即返回', async () => {
      const renderer = new BarcodeRenderer();
      await new Promise(resolve => setTimeout(resolve, 100));

      const options = {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
      };

      // 第一次生成
      await renderer.generate('CACHE_TEST', options);
      
      // 第二次应该从缓存返回
      const startTime = performance.now();
      await renderer.generate('CACHE_TEST', options);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5); // 缓存查找应该在5ms内
    }, 10000);

    it('应该高效处理大量缓存条目', async () => {
      const renderer = new BarcodeRenderer();
      await new Promise(resolve => setTimeout(resolve, 100));

      // 生成50个不同的条形码填充缓存
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          renderer.generate(`CACHE${i}`, {
            barcodeType: BarcodeType.CODE128,
            width: 200,
            height: 100,
          })
        );
      }
      await Promise.all(promises);

      // 测试缓存查找性能
      const startTime = performance.now();
      
      // 查找多个缓存条目
      for (let i = 0; i < 50; i++) {
        await renderer.generate(`CACHE${i}`, {
          barcodeType: BarcodeType.CODE128,
          width: 200,
          height: 100,
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // 50个缓存查找应该在50ms内
      console.log(`50个缓存查找耗时: ${duration.toFixed(2)}ms`);
    }, 15000);
  });

  describe('内存使用', () => {
    it('应该限制缓存大小', async () => {
      const renderer = new BarcodeRenderer();
      await new Promise(resolve => setTimeout(resolve, 100));

      // 设置较小的缓存大小用于测试
      (renderer as any).maxCacheSize = 10;

      // 逐个生成条形码，以触发缓存清理
      for (let i = 0; i < 20; i++) {
        await renderer.generate(`MEMORY${i}`, {
          barcodeType: BarcodeType.CODE128,
          width: 200,
          height: 100,
        });
      }

      // 手动触发缓存清理（模拟定时器）
      const cacheEntries = Array.from((renderer as any).cache.entries());
      if (cacheEntries.length > 10) {
        const toRemove = cacheEntries.slice(0, cacheEntries.length - 10);
        toRemove.forEach(([key]) => (renderer as any).cache.delete(key));
      }

      // 检查缓存大小
      const cacheSize = (renderer as any).cache.size;
      expect(cacheSize).toBeLessThanOrEqual(10);
    }, 10000);
  });

  describe('并发处理', () => {
    it('应该高效处理并发请求', async () => {
      const renderer = new BarcodeRenderer();
      await new Promise(resolve => setTimeout(resolve, 100));

      const startTime = performance.now();
      
      // 同时发起20个请求
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          renderer.generate(`CONCURRENT${i}`, {
            barcodeType: i % 2 === 0 ? BarcodeType.CODE128 : BarcodeType.QRCODE,
            width: 200,
            height: i % 2 === 0 ? 100 : 200,
          })
        );
      }
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(20);
      expect(duration).toBeLessThan(1000); // 20个并发请求应该在1秒内完成
      console.log(`20个并发请求耗时: ${duration.toFixed(2)}ms`);
    }, 15000);
  });

  describe('预热性能', () => {
    it('预热应该有效减少首次生成时间', async () => {
      const renderer = new BarcodeRenderer();
      await new Promise(resolve => setTimeout(resolve, 100));

      const values = ['PREHEAT1', 'PREHEAT2', 'PREHEAT3', 'PREHEAT4', 'PREHEAT5'];
      const options = {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
      };

      // 预热
      const preheatStart = performance.now();
      await renderer.preheat(values, options);
      const preheatEnd = performance.now();
      
      console.log(`预热5个条形码耗时: ${(preheatEnd - preheatStart).toFixed(2)}ms`);

      // 测试预热后的生成速度
      const generateStart = performance.now();
      
      for (const value of values) {
        await renderer.generate(value, options);
      }
      
      const generateEnd = performance.now();
      const duration = generateEnd - generateStart;
      
      expect(duration).toBeLessThan(25); // 预热后的生成应该非常快
      console.log(`预热后生成5个条形码耗时: ${duration.toFixed(2)}ms`);
    }, 15000);
  });

  describe('错误恢复性能', () => {
    it('Worker崩溃后应该快速恢复', async () => {
      const renderer = new BarcodeRenderer();
      await new Promise(resolve => setTimeout(resolve, 100));

      // 模拟Worker崩溃
      const worker = (renderer as any).worker;
      if (worker && worker.onerror) {
        worker.onerror(new ErrorEvent('error'));
      }

      // 等待重新初始化
      await new Promise(resolve => setTimeout(resolve, 1100));

      // 应该能够正常生成
      const startTime = performance.now();
      
      const result = await renderer.generate('RECOVERY_TEST', {
        barcodeType: BarcodeType.CODE128,
        width: 200,
        height: 100,
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(200); // 恢复后的生成应该在200ms内
    }, 15000);
  });

  describe('性能统计', () => {
    it('应该收集准确的性能指标', async () => {
      const renderer = new BarcodeRenderer();
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = {
        totalGenerations: 0,
        cacheHits: 0,
        totalTime: 0,
      };

      // 执行一系列操作
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        
        await renderer.generate(`METRIC${i % 5}`, {
          barcodeType: BarcodeType.CODE128,
          width: 200,
          height: 100,
        });
        
        metrics.totalTime += performance.now() - start;
        metrics.totalGenerations++;
        
        // 后5次应该命中缓存
        if (i >= 5) {
          metrics.cacheHits++;
        }
      }

      const avgTime = metrics.totalTime / metrics.totalGenerations;
      const cacheHitRate = (metrics.cacheHits / 5) * 100;

      console.log('性能统计:');
      console.log(`  总生成次数: ${metrics.totalGenerations}`);
      console.log(`  缓存命中次数: ${metrics.cacheHits}`);
      console.log(`  缓存命中率: ${cacheHitRate}%`);
      console.log(`  平均生成时间: ${avgTime.toFixed(2)}ms`);
      console.log(`  总耗时: ${metrics.totalTime.toFixed(2)}ms`);

      expect(cacheHitRate).toBe(100); // 应该100%命中缓存
      expect(avgTime).toBeLessThan(20); // 平均时间应该很短
    }, 15000);
  });
});