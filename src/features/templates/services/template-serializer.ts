/**
 * 模板序列化服务
 */

import { Template, TEMPLATE_VERSION, TemplateValidationResult } from '../types/template.types';
import { TemplateElement, BaseElement } from '@/types/unified.types';
import { nanoid } from 'nanoid';

/**
 * 模板序列化器
 */
export class TemplateSerializer {
  /**
   * 序列化模板为JSON字符串
   */
  static serialize(template: Template): string {
    try {
      // 深拷贝模板对象以避免修改原始数据
      const templateCopy = this.deepClone(template);
      
      // 添加序列化元数据
      const serializedData = {
        __type: 'template',
        __version: TEMPLATE_VERSION,
        __serializedAt: new Date().toISOString(),
        ...templateCopy,
      };
      
      return JSON.stringify(serializedData, null, 2);
    } catch (error) {
      throw new Error(`Failed to serialize template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * 从 JSON 字符串反序列化模板
   */
  static deserialize(json: string): Template {
    try {
      const data = JSON.parse(json);
      
      // 验证基本结构
      if (data.__type !== 'template') {
        throw new Error('Invalid template format: missing or invalid __type');
      }
      
      // 检查版本兼容性
      if (!this.isVersionCompatible(data.__version)) {
        throw new Error(`Incompatible template version: ${data.__version}`);
      }
      
      // 移除元数据字段
      const { __type, __version, __serializedAt, ...templateData } = data;
      
      // 验证模板结构
      const validation = this.validateTemplate(templateData);
      if (!validation.valid) {
        const errors = validation.errors?.map(e => e.message).join(', ');
        throw new Error(`Invalid template structure: ${errors}`);
      }
      
      // 还原元素类型
      if (templateData.content?.elements) {
        templateData.content.elements = this.restoreElements(templateData.content.elements);
      }
      
      return templateData as Template;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw error;
    }
  }
  
  /**
   * 验证模板结构
   */
  static validateTemplate(template: any): TemplateValidationResult {
    const errors: TemplateValidationResult['errors'] = [];
    
    // 验证必需字段
    if (!template.metadata) {
      errors.push({ field: 'metadata', message: 'Metadata is required', severity: 'error' });
    } else {
      if (!template.metadata.id) {
        errors.push({ field: 'metadata.id', message: 'Template ID is required', severity: 'error' });
      }
      if (!template.metadata.name) {
        errors.push({ field: 'metadata.name', message: 'Template name is required', severity: 'error' });
      }
      if (!template.metadata.version) {
        errors.push({ field: 'metadata.version', message: 'Template version is required', severity: 'error' });
      }
    }
    
    if (!template.pageSettings) {
      errors.push({ field: 'pageSettings', message: 'Page settings are required', severity: 'error' });
    } else {
      if (!template.pageSettings.width || template.pageSettings.width <= 0) {
        errors.push({ field: 'pageSettings.width', message: 'Invalid page width', severity: 'error' });
      }
      if (!template.pageSettings.height || template.pageSettings.height <= 0) {
        errors.push({ field: 'pageSettings.height', message: 'Invalid page height', severity: 'error' });
      }
    }
    
    if (!template.content) {
      errors.push({ field: 'content', message: 'Content is required', severity: 'error' });
    } else {
      if (!Array.isArray(template.content.elements)) {
        errors.push({ field: 'content.elements', message: 'Elements must be an array', severity: 'error' });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
  
  /**
   * 检查版本兼容性
   */
  private static isVersionCompatible(version: string): boolean {
    if (!version) return false;
    
    // 简单的版本检查，只检查主版本号
    const [major] = version.split('.');
    const [currentMajor] = TEMPLATE_VERSION.split('.');
    
    return major === currentMajor;
  }
  
  /**
   * 深拷贝对象
   */
  private static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any;
    }
    
    if (obj instanceof Object) {
      const clonedObj = {} as any;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
    
    return obj;
  }
  
  /**
   * 还原元素对象
   */
  private static restoreElements(elements: any[]): TemplateElement[] {
    return elements.map(element => {
      // 确保每个元素都有必需的属性
      if (!element.id) {
        element.id = nanoid();
      }
      
      // 还原日期对象
      if (element.createdAt) {
        element.createdAt = new Date(element.createdAt);
      }
      if (element.updatedAt) {
        element.updatedAt = new Date(element.updatedAt);
      }
      
      return element;
    });
  }
  
  /**
   * 压缩模板数据
   */
  static compress(template: Template): string {
    const serialized = this.serialize(template);
    // 简单的 base64 编码，实际上可以使用更高效的压缩算法
    return btoa(encodeURIComponent(serialized));
  }
  
  /**
   * 解压模板数据
   */
  static decompress(compressed: string): Template {
    try {
      const decompressed = decodeURIComponent(atob(compressed));
      return this.deserialize(decompressed);
    } catch (error) {
      throw new Error('Failed to decompress template data');
    }
  }
}