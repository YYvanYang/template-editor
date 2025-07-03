import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  QRCodeGenerator, 
  generateQRCode, 
  generateQRCodeBatch,
  warmupQRCodeGenerator 
} from './qrcode-generator';
import { QRCodeErrorCorrection, QRCodeDotStyle, QRCodeCornerStyle } from '../types/qrcode.types';

describe('QRCode Performance Tests', () => {
  let generator: QRCodeGenerator;
  
  beforeAll(async () => {
    generator = new QRCodeGenerator();
    await warmupQRCodeGenerator();
  });
  
  afterAll(() => {
    generator.destroy();
  });
  
  describe('单个二维码生成性能', () => {
    it('简单二维码应在 50ms 内生成', async () => {
      const start = performance.now();
      
      await generateQRCode({
        value: 'https://example.com',
        size: 300,
        errorCorrectionLevel: QRCodeErrorCorrection.M,
      });
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
    
    it('复杂样式二维码应在 100ms 内生成', async () => {
      const start = performance.now();
      
      await generateQRCode({
        value: 'https://example.com',
        size: 500,
        errorCorrectionLevel: QRCodeErrorCorrection.H,
        style: {
          dotsGradient: {
            type: 'linear',
            colorStops: [
              { offset: 0, color: '#667EEA' },
              { offset: 1, color: '#764BA2' },
            ],
          },
          dotsStyle: QRCodeDotStyle.DOTS,
          cornersSquareStyle: QRCodeCornerStyle.EXTRA_ROUNDED,
        },
      });
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
    
    it('带 Logo 的二维码应在 150ms 内生成', async () => {
      const start = performance.now();
      
      await generateQRCode({
        value: 'https://example.com',
        size: 400,
        errorCorrectionLevel: QRCodeErrorCorrection.Q,
        style: {
          logo: {
            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            width: 0.3,
            height: 0.3,
          },
        },
      });
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(150);
    });
  });
  
  describe('批量生成性能', () => {
    it('10 个二维码应在 200ms 内生成', async () => {
      const options = Array(10).fill(null).map((_, i) => ({
        value: `https://example.com/item/${i}`,
        size: 200,
        errorCorrectionLevel: QRCodeErrorCorrection.M,
      }));
      
      const start = performance.now();
      await generateQRCodeBatch(options);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(200);
    });
    
    it('50 个二维码应在 1000ms 内生成', async () => {
      const options = Array(50).fill(null).map((_, i) => ({
        value: `https://example.com/item/${i}`,
        size: 150,
        errorCorrectionLevel: QRCodeErrorCorrection.L,
      }));
      
      const start = performance.now();
      await generateQRCodeBatch(options);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(1000);
    });
  });
  
  describe('缓存性能', () => {
    it('缓存命中应在 5ms 内返回', async () => {
      const options = {
        value: 'cached-qrcode',
        size: 300,
        errorCorrectionLevel: QRCodeErrorCorrection.M,
      };
      
      // 首次生成
      await generateQRCode(options);
      
      // 缓存命中
      const start = performance.now();
      await generateQRCode(options);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(5);
    });
    
    it('100 次缓存命中应在 50ms 内完成', async () => {
      const options = {
        value: 'performance-test',
        size: 200,
        errorCorrectionLevel: QRCodeErrorCorrection.M,
      };
      
      // 预热缓存
      await generateQRCode(options);
      
      // 测试缓存性能
      const start = performance.now();
      const promises = Array(100).fill(null).map(() => generateQRCode(options));
      await Promise.all(promises);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });
  });
  
  describe('内存使用', () => {
    it('生成器应正确清理缓存', async () => {
      // 生成多个不同的二维码
      const promises = Array(150).fill(null).map((_, i) => 
        generateQRCode({
          value: `memory-test-${i}`,
          size: 200,
          errorCorrectionLevel: QRCodeErrorCorrection.M,
        })
      );
      
      await Promise.all(promises);
      
      // 清理缓存
      generator.clearCache();
      
      // 验证缓存已清空（通过生成时间判断）
      const start = performance.now();
      await generateQRCode({
        value: 'memory-test-0',
        size: 200,
        errorCorrectionLevel: QRCodeErrorCorrection.M,
      });
      const duration = performance.now() - start;
      
      // 应该需要重新生成，而不是从缓存读取
      expect(duration).toBeGreaterThan(10);
    });
  });
  
  describe('并发性能', () => {
    it('100 个并发请求应正确处理', async () => {
      const options = Array(100).fill(null).map((_, i) => ({
        value: `concurrent-${i}`,
        size: 150,
        errorCorrectionLevel: QRCodeErrorCorrection.L,
      }));
      
      const start = performance.now();
      const results = await Promise.all(
        options.map(opt => generateQRCode(opt))
      );
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(100);
      expect(results.every(r => r.startsWith('data:image/'))).toBe(true);
      expect(duration).toBeLessThan(2000);
    });
  });
});