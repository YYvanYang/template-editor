/**
 * 模板导入导出服务
 */

import { Template, ExportFormat, TemplateIOOptions } from '../types/template.types';
import { TemplateSerializer } from './template-serializer';
import { CNPLExporter } from './cnpl-exporter';

/**
 * 模板导入导出管理器
 */
export class TemplateIO {
  /**
   * 导出模板
   */
  static async exportTemplate(
    template: Template,
    options: TemplateIOOptions = {}
  ): Promise<Blob | string> {
    const { format = ExportFormat.JSON, compress = false } = options;
    
    switch (format) {
      case ExportFormat.JSON:
        return this.exportAsJSON(template, compress);
      
      case ExportFormat.CNPL:
        return this.exportAsCNPL(template);
      
      case ExportFormat.PDF:
        throw new Error('PDF export not implemented yet');
      
      case ExportFormat.IMAGE:
        throw new Error('Image export not implemented yet');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  /**
   * 导入模板
   */
  static async importTemplate(
    data: File | Blob | string,
    options: TemplateIOOptions = {}
  ): Promise<Template> {
    let content: string;
    
    // 处理不同的输入类型
    if (data instanceof File || data instanceof Blob) {
      content = await this.readFileAsText(data);
    } else {
      content = data;
    }
    
    // 尝试检测格式
    const format = options.format || this.detectFormat(content);
    
    switch (format) {
      case ExportFormat.JSON:
        return this.importFromJSON(content, options.compress);
      
      case ExportFormat.CNPL:
        return this.importFromCNPL(content);
      
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }
  }
  
  /**
   * 导出为 JSON
   */
  private static exportAsJSON(template: Template, compress: boolean): Blob {
    const data = compress
      ? TemplateSerializer.compress(template)
      : TemplateSerializer.serialize(template);
    
    return new Blob([data], { type: 'application/json' });
  }
  
  /**
   * 导出为 CNPL
   */
  private static exportAsCNPL(template: Template): string {
    return CNPLExporter.export(template);
  }
  
  /**
   * 从 JSON 导入
   */
  private static importFromJSON(content: string, compressed?: boolean): Template {
    if (compressed) {
      return TemplateSerializer.decompress(content);
    }
    return TemplateSerializer.deserialize(content);
  }
  
  /**
   * 从 CNPL 导入
   */
  private static importFromCNPL(content: string): Template {
    // TODO: 实现 CNPL 导入
    throw new Error('CNPL import not implemented yet');
  }
  
  /**
   * 读取文件为文本
   */
  private static readFileAsText(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  /**
   * 检测文件格式
   */
  private static detectFormat(content: string): ExportFormat {
    // 尝试解析为 JSON
    try {
      const data = JSON.parse(content);
      if (data.__type === 'template') {
        return ExportFormat.JSON;
      }
    } catch {
      // 不是 JSON
    }
    
    // 检查是否是 CNPL 格式
    if (content.includes('<layout') || content.includes('<page')) {
      return ExportFormat.CNPL;
    }
    
    // 检查是否是压缩的 JSON
    try {
      TemplateSerializer.decompress(content);
      return ExportFormat.JSON;
    } catch {
      // 不是压缩的 JSON
    }
    
    throw new Error('Unable to detect file format');
  }
  
  /**
   * 下载模板文件
   */
  static downloadTemplate(
    template: Template,
    filename: string,
    options: TemplateIOOptions = {}
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await this.exportTemplate(template, options);
        const url = data instanceof Blob
          ? URL.createObjectURL(data)
          : `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        if (data instanceof Blob) {
          URL.revokeObjectURL(url);
        }
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * 从文件选择器导入模板
   */
  static async importFromFile(): Promise<Template> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.cnpl';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }
        
        try {
          const template = await this.importTemplate(file);
          resolve(template);
        } catch (error) {
          reject(error);
        }
      };
      
      input.click();
    });
  }
}