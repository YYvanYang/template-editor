import { describe, it, expect } from 'vitest';
import {
  getPropertyValue,
  setPropertyValue,
  validatePropertyValue,
  isValidBinding,
  filterVisibleProperties,
  searchProperties,
  transformPropertyValue,
  formatPropertyValue,
  groupPropertiesByCategory,
  sortCategories,
} from './property.utils';
import type { PropertyDefinition } from '../types/property.types';
import { PropertyType } from '../types/property.types';

describe('property.utils', () => {
  describe('getPropertyValue', () => {
    it('应该获取简单属性值', () => {
      const element = { name: 'Test', value: 123 };
      expect(getPropertyValue(element, 'name')).toBe('Test');
      expect(getPropertyValue(element, 'value')).toBe(123);
    });

    it('应该获取嵌套属性值', () => {
      const element = {
        style: {
          backgroundColor: '#fff',
          border: {
            width: 2,
            color: '#000',
          },
        },
      };
      expect(getPropertyValue(element, 'style.backgroundColor')).toBe('#fff');
      expect(getPropertyValue(element, 'style.border.width')).toBe(2);
    });

    it('应该返回 undefined 对于不存在的属性', () => {
      const element = { name: 'Test' };
      expect(getPropertyValue(element, 'nonexistent')).toBeUndefined();
      expect(getPropertyValue(element, 'style.color')).toBeUndefined();
    });
  });

  describe('setPropertyValue', () => {
    it('应该设置简单属性值', () => {
      const element = { name: 'Test', value: 123 };
      const updated = setPropertyValue(element, 'name', 'Updated');
      expect(updated.name).toBe('Updated');
      expect(updated.value).toBe(123);
      // 确保不修改原对象
      expect(element.name).toBe('Test');
    });

    it('应该设置嵌套属性值', () => {
      const element = {
        style: {
          backgroundColor: '#fff',
        },
      };
      const updated = setPropertyValue(element, 'style.backgroundColor', '#000');
      expect(updated.style.backgroundColor).toBe('#000');
    });

    it('应该创建不存在的嵌套对象', () => {
      const element = { name: 'Test' };
      const updated = setPropertyValue(element, 'style.color', '#f00');
      expect(updated.style).toEqual({ color: '#f00' });
    });
  });

  describe('validatePropertyValue', () => {
    it('应该验证数字类型', () => {
      const property: PropertyDefinition = {
        key: 'width',
        label: '宽度',
        type: PropertyType.NUMBER,
        min: 0,
        max: 100,
      };
      
      expect(validatePropertyValue(property, 50, {} as any)).toBeNull();
      expect(validatePropertyValue(property, -1, {} as any)).toBe('最小值为 0');
      expect(validatePropertyValue(property, 101, {} as any)).toBe('最大值为 100');
      expect(validatePropertyValue(property, 'abc', {} as any)).toBe('请输入有效的数字');
    });

    it('应该验证颜色类型', () => {
      const property: PropertyDefinition = {
        key: 'color',
        label: '颜色',
        type: PropertyType.COLOR,
      };
      
      expect(validatePropertyValue(property, '#FF0000', {} as any)).toBeNull();
      expect(validatePropertyValue(property, '#000', {} as any)).toBe(
        '请输入有效的颜色值（如 #FF0000）'
      );
      expect(validatePropertyValue(property, 'red', {} as any)).toBe(
        '请输入有效的颜色值（如 #FF0000）'
      );
    });

    it('应该验证绑定表达式', () => {
      const property: PropertyDefinition = {
        key: 'binding',
        label: '数据绑定',
        type: PropertyType.BINDING,
      };
      
      expect(validatePropertyValue(property, '{{variable}}', {} as any)).toBeNull();
      expect(validatePropertyValue(property, 'variable', {} as any)).toBe(
        '请输入有效的绑定表达式（如 {{variable}}）'
      );
    });

    it('应该使用自定义验证函数', () => {
      const property: PropertyDefinition = {
        key: 'custom',
        label: '自定义',
        type: PropertyType.TEXT,
        validate: (value) => (value === 'valid' ? null : '无效的值'),
      };
      
      expect(validatePropertyValue(property, 'valid', {} as any)).toBeNull();
      expect(validatePropertyValue(property, 'invalid', {} as any)).toBe('无效的值');
    });
  });

  describe('isValidBinding', () => {
    it('应该验证绑定表达式', () => {
      expect(isValidBinding('{{variable}}')).toBe(true);
      expect(isValidBinding('{{user.name}}')).toBe(true);
      expect(isValidBinding('{{ variable }}')).toBe(true);
      expect(isValidBinding('variable')).toBe(false);
      expect(isValidBinding('{variable}')).toBe(false);
      expect(isValidBinding('{{variable')).toBe(false);
    });
  });

  describe('filterVisibleProperties', () => {
    it('应该过滤不可见的属性', () => {
      const properties: PropertyDefinition[] = [
        { key: 'always', label: 'Always Visible', type: PropertyType.TEXT },
        {
          key: 'conditional',
          label: 'Conditional',
          type: PropertyType.TEXT,
          visible: (element) => element.type === 'text',
        },
      ];
      
      const textElement = { type: 'text' } as any;
      const imageElement = { type: 'image' } as any;
      
      expect(filterVisibleProperties(properties, textElement, true)).toHaveLength(2);
      expect(filterVisibleProperties(properties, imageElement, true)).toHaveLength(1);
    });

    it('应该过滤高级属性', () => {
      const properties: PropertyDefinition[] = [
        { key: 'basic', label: 'Basic', type: PropertyType.TEXT, category: 'basic' },
        { key: 'advanced', label: 'Advanced', type: PropertyType.TEXT, category: 'advanced' },
      ];
      
      expect(filterVisibleProperties(properties, {} as any, true)).toHaveLength(2);
      expect(filterVisibleProperties(properties, {} as any, false)).toHaveLength(1);
    });
  });

  describe('searchProperties', () => {
    const properties: PropertyDefinition[] = [
      { key: 'name', label: '名称', type: PropertyType.TEXT },
      { key: 'width', label: '宽度', type: PropertyType.NUMBER },
      { key: 'color', label: '颜色', type: PropertyType.COLOR, description: '背景颜色' },
    ];

    it('应该按标签搜索', () => {
      const results = searchProperties(properties, '名称');
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('name');
    });

    it('应该按键名搜索', () => {
      const results = searchProperties(properties, 'width');
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('width');
    });

    it('应该按描述搜索', () => {
      const results = searchProperties(properties, '背景');
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('color');
    });

    it('应该不区分大小写', () => {
      const results = searchProperties(properties, 'WIDTH');
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('width');
    });

    it('空关键词应该返回所有属性', () => {
      expect(searchProperties(properties, '')).toEqual(properties);
    });
  });

  describe('transformPropertyValue', () => {
    it('应该转换数字类型', () => {
      const property: PropertyDefinition = {
        key: 'width',
        label: '宽度',
        type: PropertyType.NUMBER,
        defaultValue: 100,
      };
      
      expect(transformPropertyValue(property, '50')).toBe(50);
      expect(transformPropertyValue(property, '')).toBe(100);
      expect(transformPropertyValue(property, null)).toBe(100);
    });

    it('应该转换布尔类型', () => {
      const property: PropertyDefinition = {
        key: 'visible',
        label: '可见',
        type: PropertyType.CHECKBOX,
      };
      
      expect(transformPropertyValue(property, true)).toBe(true);
      expect(transformPropertyValue(property, 'true')).toBe(true);
      expect(transformPropertyValue(property, 0)).toBe(false);
    });

    it('应该使用自定义转换函数', () => {
      const property: PropertyDefinition = {
        key: 'custom',
        label: '自定义',
        type: PropertyType.TEXT,
        transform: (value) => value.toUpperCase(),
      };
      
      expect(transformPropertyValue(property, 'hello')).toBe('HELLO');
    });
  });

  describe('formatPropertyValue', () => {
    it('应该格式化颜色值', () => {
      const property: PropertyDefinition = {
        key: 'color',
        label: '颜色',
        type: PropertyType.COLOR,
      };
      
      expect(formatPropertyValue(property, '#ff0000')).toBe('#FF0000');
    });

    it('应该格式化尺寸值', () => {
      const property: PropertyDefinition = {
        key: 'size',
        label: '尺寸',
        type: PropertyType.SIZE,
      };
      
      expect(formatPropertyValue(property, { width: 100, height: 50 })).toBe('100 × 50');
    });

    it('应该格式化位置值', () => {
      const property: PropertyDefinition = {
        key: 'position',
        label: '位置',
        type: PropertyType.POSITION,
      };
      
      expect(formatPropertyValue(property, { x: 10, y: 20 })).toBe('X: 10, Y: 20');
    });

    it('应该处理空值', () => {
      const property: PropertyDefinition = {
        key: 'text',
        label: '文本',
        type: PropertyType.TEXT,
      };
      
      expect(formatPropertyValue(property, null)).toBe('');
      expect(formatPropertyValue(property, undefined)).toBe('');
    });
  });

  describe('groupPropertiesByCategory', () => {
    it('应该按分类分组属性', () => {
      const properties: PropertyDefinition[] = [
        { key: 'name', label: '名称', type: PropertyType.TEXT, category: 'basic' },
        { key: 'width', label: '宽度', type: PropertyType.NUMBER, category: 'layout' },
        { key: 'height', label: '高度', type: PropertyType.NUMBER, category: 'layout' },
        { key: 'color', label: '颜色', type: PropertyType.COLOR }, // 默认为 basic
      ];
      
      const grouped = groupPropertiesByCategory(properties);
      
      expect(grouped.size).toBe(2);
      expect(grouped.get('basic')).toHaveLength(2);
      expect(grouped.get('layout')).toHaveLength(2);
    });
  });

  describe('sortCategories', () => {
    it('应该按预定义顺序排序分类', () => {
      const categories = ['advanced', 'style', 'basic', 'custom'];
      const sorted = sortCategories(categories);
      
      expect(sorted[0]).toBe('basic');
      expect(sorted[1]).toBe('style');
      expect(sorted[2]).toBe('advanced');
      expect(sorted[3]).toBe('custom'); // 自定义分类排在最后
    });
  });
});