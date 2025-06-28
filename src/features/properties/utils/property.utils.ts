import type { BaseElementData } from '@/features/elements/types/base.types';
import { PropertyDefinition, PropertyCategory, PROPERTY_CATEGORIES } from '../types/property.types';
import { COMMON_PROPERTIES } from '../types/property.types';
import { getPropertiesForElement } from '../types/element-properties';

/**
 * 获取元素的所有属性定义
 */
export function getElementProperties(element: BaseElementData): PropertyDefinition[] {
  const elementProperties = getPropertiesForElement(element.type);
  return [...COMMON_PROPERTIES, ...elementProperties];
}

/**
 * 按分类分组属性
 */
export function groupPropertiesByCategory(
  properties: PropertyDefinition[]
): Map<string, PropertyDefinition[]> {
  const grouped = new Map<string, PropertyDefinition[]>();
  
  properties.forEach((property) => {
    const category = property.category || 'basic';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(property);
  });
  
  return grouped;
}

/**
 * 获取属性的值（支持嵌套属性）
 */
export function getPropertyValue(element: BaseElementData, key: string): any {
  const keys = key.split('.');
  let value: any = element;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * 设置属性的值（支持嵌套属性）
 */
export function setPropertyValue(
  element: BaseElementData,
  key: string,
  value: any
): BaseElementData {
  const keys = key.split('.');
  const result = { ...element };
  let current: any = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!current[k] || typeof current[k] !== 'object') {
      current[k] = {};
    } else {
      current[k] = { ...current[k] };
    }
    current = current[k];
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
}

/**
 * 验证属性值
 */
export function validatePropertyValue(
  property: PropertyDefinition,
  value: any,
  element: BaseElementData
): string | null {
  // 自定义验证
  if (property.validate) {
    return property.validate(value, element);
  }
  
  // 通用验证
  switch (property.type) {
    case 'number':
    case 'range':
      if (value !== undefined && value !== null && value !== '') {
        const num = Number(value);
        if (isNaN(num)) {
          return '请输入有效的数字';
        }
        if (property.min !== undefined && num < property.min) {
          return `最小值为 ${property.min}`;
        }
        if (property.max !== undefined && num > property.max) {
          return `最大值为 ${property.max}`;
        }
      }
      break;
      
    case 'color':
      if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return '请输入有效的颜色值（如 #FF0000）';
      }
      break;
      
    case 'binding':
      if (value && !isValidBinding(value)) {
        return '请输入有效的绑定表达式（如 {{variable}}）';
      }
      break;
  }
  
  return null;
}

/**
 * 检查是否为有效的绑定表达式
 */
export function isValidBinding(value: string): boolean {
  // 简单的绑定表达式验证
  return /^{{.+}}$/.test(value.trim());
}

/**
 * 过滤可见的属性
 */
export function filterVisibleProperties(
  properties: PropertyDefinition[],
  element: BaseElementData,
  showAdvanced: boolean
): PropertyDefinition[] {
  return properties.filter((property) => {
    // 检查可见性函数
    if (property.visible && !property.visible(element)) {
      return false;
    }
    
    // 检查是否为高级属性
    if (!showAdvanced && property.category === 'advanced') {
      return false;
    }
    
    return true;
  });
}

/**
 * 搜索属性
 */
export function searchProperties(
  properties: PropertyDefinition[],
  keyword: string
): PropertyDefinition[] {
  if (!keyword) {
    return properties;
  }
  
  const lowerKeyword = keyword.toLowerCase();
  return properties.filter((property) => {
    return (
      property.label.toLowerCase().includes(lowerKeyword) ||
      property.key.toLowerCase().includes(lowerKeyword) ||
      property.description?.toLowerCase().includes(lowerKeyword)
    );
  });
}

/**
 * 获取分类信息
 */
export function getCategoryInfo(categoryName: string): PropertyCategory {
  const predefined = Object.values(PROPERTY_CATEGORIES).find(
    (cat) => cat.name === categoryName
  );
  
  return (
    predefined || {
      name: categoryName,
      label: categoryName,
      order: 999,
    }
  );
}

/**
 * 排序分类
 */
export function sortCategories(categories: string[]): string[] {
  return categories.sort((a, b) => {
    const catA = getCategoryInfo(a);
    const catB = getCategoryInfo(b);
    return (catA.order || 999) - (catB.order || 999);
  });
}

/**
 * 转换属性值（应用 transform 函数）
 */
export function transformPropertyValue(
  property: PropertyDefinition,
  value: any
): any {
  if (property.transform) {
    return property.transform(value);
  }
  
  // 默认转换
  switch (property.type) {
    case 'number':
    case 'range':
      return value === '' || value === null || value === undefined
        ? property.defaultValue ?? 0
        : Number(value);
        
    case 'checkbox':
      return Boolean(value);
      
    default:
      return value;
  }
}

/**
 * 格式化属性值用于显示
 */
export function formatPropertyValue(
  property: PropertyDefinition,
  value: any
): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  switch (property.type) {
    case 'color':
      return value.toString().toUpperCase();
      
    case 'size':
      return `${value.width} × ${value.height}`;
      
    case 'position':
      return `X: ${value.x}, Y: ${value.y}`;
      
    default:
      return value.toString();
  }
}