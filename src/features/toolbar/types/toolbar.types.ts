/**
 * 工具栏相关类型定义
 */

import { LucideIcon } from 'lucide-react';

/**
 * 工具按钮类型
 */
export enum ToolType {
  // 选择工具
  SELECT = 'select',
  HAND = 'hand',
  
  // 元素工具
  TEXT = 'text',
  IMAGE = 'image',
  SHAPE = 'shape',
  TABLE = 'table',
  BARCODE = 'barcode',
  
  // 编辑工具
  UNDO = 'undo',
  REDO = 'redo',
  DELETE = 'delete',
  COPY = 'copy',
  PASTE = 'paste',
  
  // 对齐工具
  ALIGN_LEFT = 'align-left',
  ALIGN_CENTER = 'align-center',
  ALIGN_RIGHT = 'align-right',
  ALIGN_TOP = 'align-top',
  ALIGN_MIDDLE = 'align-middle',
  ALIGN_BOTTOM = 'align-bottom',
  
  // 分布工具
  DISTRIBUTE_H = 'distribute-h',
  DISTRIBUTE_V = 'distribute-v',
  
  // 缩放工具
  ZOOM_IN = 'zoom-in',
  ZOOM_OUT = 'zoom-out',
  ZOOM_FIT = 'zoom-fit',
  ZOOM_100 = 'zoom-100',
  
  // 其他
  SETTINGS = 'settings',
  EXPORT = 'export',
  PREVIEW = 'preview',
}

/**
 * 工具按钮配置
 */
export interface ToolConfig {
  type: ToolType;
  icon: LucideIcon;
  label: string;
  tooltip?: string;
  shortcut?: string;
  disabled?: boolean;
  active?: boolean;
  separator?: boolean; // 是否在此工具后添加分隔符
  onClick?: () => void;
}

/**
 * 工具组配置
 */
export interface ToolGroup {
  name: string;
  tools: ToolConfig[];
}

/**
 * 工具栏位置
 */
export type ToolbarPosition = 'top' | 'left' | 'right' | 'bottom';

/**
 * 工具栏配置
 */
export interface ToolbarConfig {
  position: ToolbarPosition;
  groups: ToolGroup[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * 工具栏事件
 */
export interface ToolbarEvents {
  onToolClick?: (tool: ToolType) => void;
  onToolChange?: (tool: ToolType) => void;
}