/**
 * 模板类型定义
 */

import { TemplateElement } from '@/types/unified.types';

/**
 * 模板版本号
 */
export const TEMPLATE_VERSION = '1.0.0';

/**
 * 纸张方向
 */
export enum PaperOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

/**
 * 预定义纸张尺寸
 */
export enum PaperSize {
  A4 = 'A4',
  A5 = 'A5',
  CUSTOM = 'custom',
  // 快递面单常用尺寸
  EXPRESS_100_180 = 'express_100x180',
  EXPRESS_100_150 = 'express_100x150',
  EXPRESS_76_130 = 'express_76x130',
}

/**
 * 纸张尺寸定义（单位：毫米）
 */
export const PAPER_SIZES: Record<PaperSize, { width: number; height: number }> = {
  [PaperSize.A4]: { width: 210, height: 297 },
  [PaperSize.A5]: { width: 148, height: 210 },
  [PaperSize.CUSTOM]: { width: 100, height: 150 }, // 默认自定义尺寸
  [PaperSize.EXPRESS_100_180]: { width: 100, height: 180 },
  [PaperSize.EXPRESS_100_150]: { width: 100, height: 150 },
  [PaperSize.EXPRESS_76_130]: { width: 76, height: 130 },
};

/**
 * 模板元数据
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  author?: string;
  createdAt: string;
  updatedAt: string;
  version: string;
}

/**
 * 页面设置
 */
export interface PageSettings {
  size: PaperSize;
  width: number; // 毫米
  height: number; // 毫米
  orientation: PaperOrientation;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  background?: string; // 背景颜色或图片URL
}

/**
 * 打印设置
 */
export interface PrintSettings {
  copies?: number;
  collate?: boolean;
  duplex?: boolean;
  color?: boolean;
  quality?: 'draft' | 'normal' | 'high';
  scale?: number; // 缩放比例
}

/**
 * 数据源定义
 */
export interface DataSource {
  id: string;
  name: string;
  type: 'static' | 'api' | 'database' | 'file';
  config?: Record<string, any>;
  schema?: Record<string, any>; // 数据结构定义
}

/**
 * 模板变量定义
 */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  defaultValue?: any;
  required?: boolean;
  description?: string;
}

/**
 * 模板内容
 */
export interface TemplateContent {
  elements: TemplateElement[];
  variables?: TemplateVariable[];
  dataSources?: DataSource[];
}

/**
 * 完整的模板定义
 */
export interface Template {
  metadata: TemplateMetadata;
  pageSettings: PageSettings;
  printSettings?: PrintSettings;
  content: TemplateContent;
}

/**
 * 模板导出格式
 */
export enum ExportFormat {
  JSON = 'json',
  CNPL = 'cnpl', // 菜鸟打印标记语言
  PDF = 'pdf',
  IMAGE = 'image',
}

/**
 * 模板导入导出选项
 */
export interface TemplateIOOptions {
  format?: ExportFormat;
  includeAssets?: boolean; // 是否包含图片等资源
  compress?: boolean; // 是否压缩
  encryption?: boolean; // 是否加密
}

/**
 * 模板验证结果
 */
export interface TemplateValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

/**
 * 模板版本信息
 */
export interface TemplateVersionInfo {
  version: string;
  compatibleVersions: string[];
  migrations?: Array<{
    from: string;
    to: string;
    migrate: (template: any) => any;
  }>;
}