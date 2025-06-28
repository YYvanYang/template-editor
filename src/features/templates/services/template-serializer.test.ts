import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateSerializer } from './template-serializer';
import { Template, PaperSize, PaperOrientation, TEMPLATE_VERSION } from '../types/template.types';
import { ElementType } from '@/features/elements/types';

describe('TemplateSerializer', () => {
  let mockTemplate: Template;
  
  beforeEach(() => {
    mockTemplate = {
      metadata: {
        id: 'template-1',
        name: 'Test Template',
        description: 'A test template',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: TEMPLATE_VERSION,
      },
      pageSettings: {
        size: PaperSize.A4,
        width: 210,
        height: 297,
        orientation: PaperOrientation.PORTRAIT,
        margins: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
        },
      },
      content: {
        elements: [
          {
            id: 'element-1',
            type: ElementType.TEXT,
            x: 10,
            y: 10,
            width: 100,
            height: 20,
            rotation: 0,
            locked: false,
            visible: true,
            content: 'Hello World',
            style: {
              fontSize: 14,
              fontFamily: 'Arial',
              color: '#000000',
            },
          },
        ],
      },
    };
  });
  
  describe('serialize', () => {
    it('应该将模板序列化为JSON字符串', () => {
      const serialized = TemplateSerializer.serialize(mockTemplate);
      
      expect(typeof serialized).toBe('string');
      const parsed = JSON.parse(serialized);
      expect(parsed.__type).toBe('template');
      expect(parsed.__version).toBe(TEMPLATE_VERSION);
      expect(parsed.__serializedAt).toBeDefined();
      expect(parsed.metadata).toEqual(mockTemplate.metadata);
    });
    
    it('应该保持原始数据不变', () => {
      const originalId = mockTemplate.metadata.id;
      TemplateSerializer.serialize(mockTemplate);
      
      expect(mockTemplate.metadata.id).toBe(originalId);
    });
    
    it('应该处理嵌套对象', () => {
      const serialized = TemplateSerializer.serialize(mockTemplate);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.pageSettings.margins).toEqual(mockTemplate.pageSettings.margins);
      expect(parsed.content.elements[0].style).toEqual(mockTemplate.content.elements[0].style);
    });
    
    it('应该处理空元素数组', () => {
      mockTemplate.content.elements = [];
      const serialized = TemplateSerializer.serialize(mockTemplate);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.content.elements).toEqual([]);
    });
  });
  
  describe('deserialize', () => {
    it('应该从 JSON 字符串反序列化模板', () => {
      const serialized = TemplateSerializer.serialize(mockTemplate);
      const deserialized = TemplateSerializer.deserialize(serialized);
      
      expect(deserialized.metadata).toEqual(mockTemplate.metadata);
      expect(deserialized.pageSettings).toEqual(mockTemplate.pageSettings);
      expect(deserialized.content.elements.length).toBe(1);
    });
    
    it('应该拒绝无效的 JSON', () => {
      expect(() => TemplateSerializer.deserialize('invalid json')).toThrow('Invalid JSON format');
    });
    
    it('应该拒绝没有 __type 的数据', () => {
      const invalidData = JSON.stringify({ metadata: {} });
      expect(() => TemplateSerializer.deserialize(invalidData)).toThrow('Invalid template format');
    });
    
    it('应该拒绝不兼容的版本', () => {
      const data = {
        __type: 'template',
        __version: '2.0.0',
        metadata: mockTemplate.metadata,
        pageSettings: mockTemplate.pageSettings,
        content: mockTemplate.content,
      };
      const serialized = JSON.stringify(data);
      
      expect(() => TemplateSerializer.deserialize(serialized)).toThrow('Incompatible template version');
    });
    
    it('应该为缺少 ID 的元素生成新 ID', () => {
      const templateWithoutId = { ...mockTemplate };
      templateWithoutId.content.elements[0] = { ...templateWithoutId.content.elements[0], id: undefined as any };
      
      const serialized = JSON.stringify({
        __type: 'template',
        __version: TEMPLATE_VERSION,
        ...templateWithoutId,
      });
      
      const deserialized = TemplateSerializer.deserialize(serialized);
      expect(deserialized.content.elements[0].id).toBeDefined();
      expect(typeof deserialized.content.elements[0].id).toBe('string');
    });
  });
  
  describe('validateTemplate', () => {
    it('应该验证有效的模板', () => {
      const result = TemplateSerializer.validateTemplate(mockTemplate);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
    
    it('应该检测缺少的元数据', () => {
      const invalidTemplate = { ...mockTemplate, metadata: undefined };
      const result = TemplateSerializer.validateTemplate(invalidTemplate);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.field === 'metadata')).toBe(true);
    });
    
    it('应该检测无效的页面设置', () => {
      const invalidTemplate = { ...mockTemplate };
      invalidTemplate.pageSettings.width = -10;
      const result = TemplateSerializer.validateTemplate(invalidTemplate);
      
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.field === 'pageSettings.width')).toBe(true);
    });
    
    it('应该检测无效的元素数组', () => {
      const invalidTemplate = { ...mockTemplate };
      invalidTemplate.content.elements = 'not an array' as any;
      const result = TemplateSerializer.validateTemplate(invalidTemplate);
      
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.field === 'content.elements')).toBe(true);
    });
  });
  
  describe('compress/decompress', () => {
    it('应该压缩和解压模板', () => {
      const compressed = TemplateSerializer.compress(mockTemplate);
      
      expect(typeof compressed).toBe('string');
      expect(compressed.length).toBeGreaterThan(0);
      
      const decompressed = TemplateSerializer.decompress(compressed);
      expect(decompressed.metadata).toEqual(mockTemplate.metadata);
    });
    
    it('应该处理无效的压缩数据', () => {
      expect(() => TemplateSerializer.decompress('invalid data')).toThrow('Failed to decompress');
    });
  });
});