import type { TemplateElement } from '@/types/unified.types';

/**
 * 属性编辑器类型
 */
export enum PropertyType {
  TEXT = 'text',
  NUMBER = 'number',
  COLOR = 'color',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RANGE = 'range',
  TEXTAREA = 'textarea',
  BINDING = 'binding',
  FONT_FAMILY = 'fontFamily',
  FONT_SIZE = 'fontSize',
  ALIGNMENT = 'alignment',
  BORDER_STYLE = 'borderStyle',
  SIZE = 'size',
  POSITION = 'position',
}

/**
 * 属性定义
 */
export interface PropertyDefinition {
  key: string;
  label: string;
  type: PropertyType;
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
  category?: string;
  visible?: (element: TemplateElement) => boolean;
  validate?: (value: any, element: TemplateElement) => string | null;
  transform?: (value: any) => any;
}

/**
 * 属性分类
 */
export interface PropertyCategory {
  name: string;
  label: string;
  icon?: string;
  expanded?: boolean;
  order?: number;
}

/**
 * 属性面板配置
 */
export interface PropertyPanelConfig {
  categories: PropertyCategory[];
  properties: PropertyDefinition[];
}

/**
 * 属性变更事件
 */
export interface PropertyChangeEvent {
  key: string;
  value: any;
  oldValue: any;
  element: TemplateElement;
}

/**
 * 属性编辑器组件属性
 */
export interface PropertyEditorProps {
  element: TemplateElement;
  property: PropertyDefinition;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

/**
 * 属性面板组件属性
 */
export interface PropertyPanelProps {
  element: TemplateElement | null;
  onPropertyChange: (key: string, value: any) => void;
  disabled?: boolean;
}

/**
 * 预设的属性分类
 */
export const PROPERTY_CATEGORIES = {
  BASIC: { name: 'basic', label: '基础属性', order: 1 },
  STYLE: { name: 'style', label: '样式', order: 2 },
  TEXT: { name: 'text', label: '文本', order: 3 },
  LAYOUT: { name: 'layout', label: '布局', order: 4 },
  DATA: { name: 'data', label: '数据', order: 5 },
  ADVANCED: { name: 'advanced', label: '高级', order: 6 },
} as const;

/**
 * 通用属性定义
 */
export const COMMON_PROPERTIES: PropertyDefinition[] = [
  // 基础属性
  {
    key: 'name',
    label: '名称',
    type: PropertyType.TEXT,
    category: 'basic',
    placeholder: '输入元素名称',
  },
  {
    key: 'locked',
    label: '锁定',
    type: PropertyType.CHECKBOX,
    category: 'basic',
    defaultValue: false,
  },
  {
    key: 'visible',
    label: '可见',
    type: PropertyType.CHECKBOX,
    category: 'basic',
    defaultValue: true,
  },
  
  // 位置和大小
  {
    key: 'position',
    label: '位置',
    type: PropertyType.POSITION,
    category: 'layout',
  },
  {
    key: 'size',
    label: '尺寸',
    type: PropertyType.SIZE,
    category: 'layout',
  },
  {
    key: 'rotation',
    label: '旋转角度',
    type: PropertyType.RANGE,
    category: 'layout',
    min: -180,
    max: 180,
    step: 1,
    defaultValue: 0,
  },
  
  // 样式属性
  {
    key: 'style.backgroundColor',
    label: '背景色',
    type: PropertyType.COLOR,
    category: 'style',
  },
  {
    key: 'style.borderColor',
    label: '边框色',
    type: PropertyType.COLOR,
    category: 'style',
  },
  {
    key: 'style.borderWidth',
    label: '边框宽度',
    type: PropertyType.NUMBER,
    category: 'style',
    min: 0,
    max: 10,
    step: 1,
    defaultValue: 0,
  },
  {
    key: 'style.borderStyle',
    label: '边框样式',
    type: PropertyType.BORDER_STYLE,
    category: 'style',
    defaultValue: 'solid',
  },
  {
    key: 'style.opacity',
    label: '透明度',
    type: PropertyType.RANGE,
    category: 'style',
    min: 0,
    max: 1,
    step: 0.1,
    defaultValue: 1,
  },
];