import { describe, it, expect } from 'vitest';
import { BarcodeElement } from './BarcodeElement';
import { BarcodeType, RatioMode, QRErrorCorrection } from '../types/barcode.types';

describe('BarcodeElement', () => {
  describe('构造函数', () => {
    it('应该使用默认值创建条码元素', () => {
      const element = new BarcodeElement({});
      
      expect(element.type).toBe('barcode');
      expect(element.data.barcodeType).toBe(BarcodeType.CODE128);
      expect(element.data.value).toBe('123456789');
      expect(element.data.ratioMode).toBe(RatioMode.KEEP_RATIO);
      expect(element.data.size).toEqual({ width: 200, height: 100 });
      expect(element.data.style?.hideText).toBe(false);
    });
    
    it('应该使用提供的数据创建条码元素', () => {
      const element = new BarcodeElement({
        barcodeType: BarcodeType.QRCODE,
        value: 'https://example.com',
        size: { width: 150, height: 150 },
        style: { hideText: true },
        errorCorrection: QRErrorCorrection.H,
      });
      
      expect(element.data.barcodeType).toBe(BarcodeType.QRCODE);
      expect(element.data.value).toBe('https://example.com');
      expect(element.data.size).toEqual({ width: 150, height: 150 });
      expect(element.data.style?.hideText).toBe(true);
      expect(element.data.errorCorrection).toBe(QRErrorCorrection.H);
    });
  });
  
  describe('setValue', () => {
    it('应该更新条码值', () => {
      const element = new BarcodeElement({});
      element.setValue('ABC123');
      
      expect(element.data.value).toBe('ABC123');
    });
  });
  
  describe('setBarcodeType', () => {
    it('应该更新条码类型', () => {
      const element = new BarcodeElement({});
      element.setBarcodeType(BarcodeType.EAN13);
      
      expect(element.data.barcodeType).toBe(BarcodeType.EAN13);
    });
    
    it('设置为二维码时应该调整为正方形', () => {
      const element = new BarcodeElement({
        size: { width: 200, height: 100 },
      });
      element.setBarcodeType(BarcodeType.QRCODE);
      
      expect(element.data.size).toEqual({ width: 100, height: 100 });
    });
  });
  
  describe('setRatioMode', () => {
    it('应该更新比例模式', () => {
      const element = new BarcodeElement({});
      element.setRatioMode(RatioMode.IGNORE_RATIO);
      
      expect(element.data.ratioMode).toBe(RatioMode.IGNORE_RATIO);
    });
  });
  
  describe('setStyle', () => {
    it('应该更新样式', () => {
      const element = new BarcodeElement({});
      element.setStyle({
        fontSize: 14,
        fontColor: '#FF0000',
        hideText: true,
      });
      
      expect(element.data.style?.fontSize).toBe(14);
      expect(element.data.style?.fontColor).toBe('#FF0000');
      expect(element.data.style?.hideText).toBe(true);
      expect(element.data.displayValue).toBe(false);
    });
    
    it('应该保留未更新的样式属性', () => {
      const element = new BarcodeElement({
        style: { margin: 20, fontSize: 12 },
      });
      element.setStyle({ fontSize: 16 });
      
      expect(element.data.style?.margin).toBe(20);
      expect(element.data.style?.fontSize).toBe(16);
    });
  });
  
  describe('setBinding', () => {
    it('应该设置数据绑定', () => {
      const element = new BarcodeElement({});
      element.setBinding('{{order.trackingNumber}}');
      
      expect(element.data.binding).toBe('{{order.trackingNumber}}');
    });
    
    it('应该清除数据绑定', () => {
      const element = new BarcodeElement({
        binding: '{{product.sku}}',
      });
      element.setBinding(undefined);
      
      expect(element.data.binding).toBeUndefined();
    });
  });
  
  describe('setErrorCorrection', () => {
    it('应该为QR码设置纠错级别', () => {
      const element = new BarcodeElement({
        barcodeType: BarcodeType.QRCODE,
      });
      element.setErrorCorrection(QRErrorCorrection.H);
      
      expect(element.data.errorCorrection).toBe(QRErrorCorrection.H);
    });
    
    it('非QR码类型不应该设置纠错级别', () => {
      const element = new BarcodeElement({
        barcodeType: BarcodeType.CODE128,
      });
      element.setErrorCorrection(QRErrorCorrection.H);
      
      expect(element.data.errorCorrection).toBeUndefined();
    });
  });
  
  describe('is2D', () => {
    it('应该正确识别二维码', () => {
      const qrElement = new BarcodeElement({
        barcodeType: BarcodeType.QRCODE,
      });
      expect(qrElement.is2D()).toBe(true);
      
      const pdf417Element = new BarcodeElement({
        barcodeType: BarcodeType.PDF417,
      });
      expect(pdf417Element.is2D()).toBe(true);
    });
    
    it('应该正确识别一维码', () => {
      const code128Element = new BarcodeElement({
        barcodeType: BarcodeType.CODE128,
      });
      expect(code128Element.is2D()).toBe(false);
      
      const ean13Element = new BarcodeElement({
        barcodeType: BarcodeType.EAN13,
      });
      expect(ean13Element.is2D()).toBe(false);
    });
  });
  
  describe('getDisplayValue', () => {
    it('没有绑定时应该返回静态值', () => {
      const element = new BarcodeElement({
        value: 'STATIC123',
      });
      expect(element.getDisplayValue()).toBe('STATIC123');
    });
    
    it('有绑定时应该返回绑定表达式', () => {
      const element = new BarcodeElement({
        value: 'STATIC123',
        binding: '{{order.id}}',
      });
      expect(element.getDisplayValue()).toBe('{{order.id}}');
    });
  });
  
  describe('validateValue', () => {
    it('应该验证空值', () => {
      const element = new BarcodeElement({});
      expect(element.validateValue('')).toBe(false);
      expect(element.validateValue('   ')).toBe(false);
    });
    
    it('应该验证EAN8格式', () => {
      const element = new BarcodeElement({
        barcodeType: BarcodeType.EAN8,
      });
      expect(element.validateValue('1234567')).toBe(true);
      expect(element.validateValue('12345678')).toBe(true);
      expect(element.validateValue('123456')).toBe(false);
      expect(element.validateValue('123456789')).toBe(false);
      expect(element.validateValue('ABCDEFG')).toBe(false);
    });
    
    it('应该验证EAN13格式', () => {
      const element = new BarcodeElement({
        barcodeType: BarcodeType.EAN13,
      });
      expect(element.validateValue('123456789012')).toBe(true);
      expect(element.validateValue('1234567890123')).toBe(true);
      expect(element.validateValue('12345678901')).toBe(false);
      expect(element.validateValue('12345678901234')).toBe(false);
    });
    
    it('应该验证CODE39格式', () => {
      const element = new BarcodeElement({
        barcodeType: BarcodeType.CODE39,
      });
      expect(element.validateValue('ABC123')).toBe(true);
      expect(element.validateValue('TEST-CODE')).toBe(true);
      expect(element.validateValue('HELLO WORLD')).toBe(true);
      expect(element.validateValue('abc123')).toBe(false); // 小写不支持
      expect(element.validateValue('TEST@CODE')).toBe(false); // @不支持
    });
  });
  
  describe('validate', () => {
    it('应该验证有效的条码元素', () => {
      const element = new BarcodeElement({
        value: '123456789',
        size: { width: 100, height: 50 },
      });
      const errors = element.validate();
      
      expect(errors).toEqual([]);
    });
    
    it('应该验证无效的尺寸', () => {
      const element = new BarcodeElement({
        size: { width: 0, height: 50 },
      });
      const errors = element.validate();
      
      expect(errors).toContain('条码尺寸必须大于0');
    });
    
    it('应该验证空值', () => {
      const element = new BarcodeElement({
        value: '',
      });
      const errors = element.validate();
      
      expect(errors).toContain('条码值不能为空');
    });
    
    it('应该验证无效的条码值格式', () => {
      const element = new BarcodeElement({
        barcodeType: BarcodeType.EAN13,
        value: '123',
      });
      const errors = element.validate();
      
      expect(errors).toContain('条码值 "123" 不符合 ean13 格式要求');
    });
    
    it('有数据绑定时不应该验证值', () => {
      const element = new BarcodeElement({
        value: '',
        binding: '{{product.sku}}',
      });
      const errors = element.validate();
      
      expect(errors).toEqual([]);
    });
    
    it('应该验证QR码纠错级别', () => {
      const element = new BarcodeElement({
        barcodeType: BarcodeType.QRCODE,
        value: 'test',
        errorCorrection: 5,
      });
      const errors = element.validate();
      
      expect(errors).toContain('二维码纠错级别必须在0-3之间');
    });
  });
  
  describe('clone', () => {
    it('应该创建条码元素的副本', () => {
      const original = new BarcodeElement({
        id: 'barcode-1',
        value: 'ORIGINAL',
        position: { x: 10, y: 20 },
        barcodeType: BarcodeType.QRCODE,
        style: { fontSize: 16 },
      });
      
      const cloned = original.clone();
      
      expect(cloned.id).not.toBe(original.id);
      expect(cloned.data.value).toBe('ORIGINAL');
      expect(cloned.data.barcodeType).toBe(BarcodeType.QRCODE);
      expect(cloned.data.style?.fontSize).toBe(16);
      expect(cloned.data.position).toEqual({ x: 20, y: 30 });
    });
  });
  
  describe('toJSON/fromJSON', () => {
    it('应该正确序列化和反序列化', () => {
      const original = new BarcodeElement({
        barcodeType: BarcodeType.CODE128,
        value: 'TEST123',
        style: { hideText: true, fontSize: 14 },
        binding: '{{order.number}}',
      });
      
      const json = original.toJSON();
      const restored = BarcodeElement.fromJSON(json);
      
      expect(restored.data).toEqual(original.data);
    });
  });
});