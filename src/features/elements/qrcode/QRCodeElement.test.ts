import { describe, it, expect, beforeEach } from 'vitest';
import { QRCodeElement } from './QRCodeElement';
import { QRCodeErrorCorrection, QRCodeDotStyle } from '../types/qrcode.types';

describe('QRCodeElement', () => {
  let element: QRCodeElement;
  
  beforeEach(() => {
    element = new QRCodeElement();
  });
  
  describe('构造函数', () => {
    it('应该使用默认值创建实例', () => {
      expect(element.type).toBe('qrcode');
      expect(element.value).toBe('https://example.com');
      expect(element.errorCorrection).toBe('M');
      expect(element.bounds.width).toBe(200);
      expect(element.bounds.height).toBe(200);
      expect(element.style).toMatchObject({
        size: 200,
        margin: 16,
        dotsColor: '#000000',
        backgroundColor: '#FFFFFF',
      });
    });
    
    it('应该接受自定义参数', () => {
      const custom = new QRCodeElement({
        value: 'custom value',
        errorCorrection: QRCodeErrorCorrection.H,
        bounds: {
          x: 0,
          y: 0,
          width: 300,
          height: 300,
        },
        style: {
          dotsColor: '#FF0000',
        },
      });
      
      expect(custom.value).toBe('custom value');
      expect(custom.errorCorrection).toBe('H');
      expect(custom.bounds.width).toBe(300);
      expect(custom.bounds.height).toBe(300);
      expect(custom.style?.dotsColor).toBe('#FF0000');
    });
  });
  
  describe('validate', () => {
    it('应该验证有效的二维码', () => {
      const result = element.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('应该验证空值', () => {
      element.value = '';
      element.binding = undefined;
      const result = element.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('二维码内容不能为空');
    });
    
    it('应该允许空值但有数据绑定', () => {
      element.value = '';
      element.binding = '{{data.value}}';
      const result = element.validate();
      expect(result.valid).toBe(true);
    });
    
    it('应该验证数据长度', () => {
      element.value = 'a'.repeat(4001);
      const result = element.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('二维码内容长度不能超过4000个字符');
    });
    
    it('应该验证纠错级别', () => {
      element.errorCorrection = 'X' as any;
      const result = element.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('无效的纠错级别');
    });
    
    it('应该验证宽高相等', () => {
      element.bounds.width = 200;
      element.bounds.height = 300;
      const result = element.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('二维码宽高必须相等');
    });
  });
  
  describe('updateValue', () => {
    it('应该更新值并更新时间戳', () => {
      const oldTime = element.updatedAt;
      element.updateValue('new value');
      
      expect(element.value).toBe('new value');
      expect(element.updatedAt.getTime()).toBeGreaterThan(oldTime.getTime());
    });
  });
  
  describe('updateErrorCorrection', () => {
    it('应该更新纠错级别', () => {
      element.updateErrorCorrection(QRCodeErrorCorrection.H);
      expect(element.errorCorrection).toBe('H');
    });
  });
  
  describe('updateStyle', () => {
    it('应该合并样式更新', () => {
      element.updateStyle({
        dotsColor: '#FF0000',
        dotsStyle: QRCodeDotStyle.DOTS,
      });
      
      expect(element.style?.dotsColor).toBe('#FF0000');
      expect(element.style?.dotsStyle).toBe('dots');
      expect(element.style?.backgroundColor).toBe('#FFFFFF'); // 保留原有属性
    });
  });
  
  describe('setLogo', () => {
    it('应该设置 Logo', () => {
      const logo = {
        src: '/logo.png',
        width: 0.3,
        height: 0.3,
      };
      
      element.setLogo(logo);
      expect(element.style?.logo).toEqual(logo);
    });
    
    it('应该移除 Logo', () => {
      element.setLogo({ src: '/logo.png' });
      element.setLogo(null);
      expect(element.style?.logo).toBeUndefined();
    });
  });
  
  describe('getDisplayValue', () => {
    it('应该返回默认值', () => {
      expect(element.getDisplayValue()).toBe('https://example.com');
    });
    
    it('应该解析简单数据绑定', () => {
      element.binding = '{{name}}';
      const data = { name: 'John' };
      expect(element.getDisplayValue(data)).toBe('John');
    });
    
    it('应该解析嵌套数据绑定', () => {
      element.binding = '{{user.profile.email}}';
      const data = {
        user: {
          profile: {
            email: 'john@example.com',
          },
        },
      };
      expect(element.getDisplayValue(data)).toBe('john@example.com');
    });
    
    it('应该在绑定失败时返回默认值', () => {
      element.binding = '{{missing.property}}';
      const data = { other: 'value' };
      expect(element.getDisplayValue(data)).toBe('https://example.com');
    });
  });
  
  describe('clone', () => {
    it('应该创建独立副本', () => {
      element.value = 'original';
      element.bounds.x = 100;
      element.bounds.y = 200;
      
      const clone = element.clone();
      
      expect(clone.id).not.toBe(element.id);
      expect(clone.value).toBe('original');
      expect(clone.bounds.x).toBe(100);
      expect(clone.bounds.y).toBe(200);
      
      // 修改克隆不影响原始
      clone.value = 'modified';
      expect(element.value).toBe('original');
    });
  });
  
  describe('toJSON/fromJSON', () => {
    it('应该正确序列化和反序列化', () => {
      element.value = 'test value';
      element.errorCorrection = QRCodeErrorCorrection.H;
      element.style = {
        dotsColor: '#FF0000',
        dotsStyle: QRCodeDotStyle.DOTS,
      };
      
      const json = element.toJSON();
      const restored = QRCodeElement.fromJSON(json);
      
      expect(restored.id).toBe(element.id);
      expect(restored.value).toBe('test value');
      expect(restored.errorCorrection).toBe('H');
      expect(restored.style).toEqual(element.style);
    });
  });
  
  describe('getBounds', () => {
    it('应该返回未旋转元素的边界', () => {
      element.bounds.x = 100;
      element.bounds.y = 100;
      element.bounds.width = 200;
      element.bounds.height = 200;
      element.rotation = 0;
      
      const bounds = element.getBounds();
      expect(bounds).toEqual({
        left: 100,
        top: 100,
        right: 300,
        bottom: 300,
      });
    });
    
    it('应该计算旋转元素的边界', () => {
      element.bounds.x = 100;
      element.bounds.y = 100;
      element.bounds.width = 100;
      element.bounds.height = 100;
      element.rotation = 45;
      
      const bounds = element.getBounds();
      
      // 45度旋转后，正方形的边界会扩大
      const expectedSize = 100 * Math.sqrt(2);
      const expectedOffset = (expectedSize - 100) / 2;
      
      expect(bounds.left).toBeCloseTo(100 - expectedOffset, 5);
      expect(bounds.top).toBeCloseTo(100 - expectedOffset, 5);
      expect(bounds.right).toBeCloseTo(200 + expectedOffset, 5);
      expect(bounds.bottom).toBeCloseTo(200 + expectedOffset, 5);
    });
  });
});