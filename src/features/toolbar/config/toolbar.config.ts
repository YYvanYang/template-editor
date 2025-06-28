/**
 * 工具栏配置
 */

import {
  MousePointer2,
  Hand,
  Type,
  Image,
  Square,
  Table,
  Barcode,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Clipboard,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Columns3,
  Rows3,
  ZoomIn,
  ZoomOut,
  Maximize,
  Percent,
  Settings,
  Download,
  Eye,
} from 'lucide-react';

import { ToolType, ToolGroup } from '../types/toolbar.types';

/**
 * 默认工具栏配置
 */
export const defaultToolGroups: ToolGroup[] = [
  {
    name: '选择工具',
    tools: [
      {
        type: ToolType.SELECT,
        icon: MousePointer2,
        label: '选择',
        tooltip: '选择工具 (V)',
        shortcut: 'V',
        active: true,
      },
      {
        type: ToolType.HAND,
        icon: Hand,
        label: '抓手',
        tooltip: '抓手工具 (H)',
        shortcut: 'H',
        separator: true,
      },
    ],
  },
  {
    name: '元素工具',
    tools: [
      {
        type: ToolType.TEXT,
        icon: Type,
        label: '文本',
        tooltip: '添加文本 (T)',
        shortcut: 'T',
      },
      {
        type: ToolType.IMAGE,
        icon: Image,
        label: '图片',
        tooltip: '添加图片 (I)',
        shortcut: 'I',
      },
      {
        type: ToolType.SHAPE,
        icon: Square,
        label: '形状',
        tooltip: '添加形状 (R)',
        shortcut: 'R',
      },
      {
        type: ToolType.TABLE,
        icon: Table,
        label: '表格',
        tooltip: '添加表格',
      },
      {
        type: ToolType.BARCODE,
        icon: Barcode,
        label: '条码',
        tooltip: '添加条码/二维码',
        separator: true,
      },
    ],
  },
  {
    name: '编辑工具',
    tools: [
      {
        type: ToolType.UNDO,
        icon: Undo2,
        label: '撤销',
        tooltip: '撤销 (Ctrl+Z)',
        shortcut: 'Ctrl+Z',
      },
      {
        type: ToolType.REDO,
        icon: Redo2,
        label: '重做',
        tooltip: '重做 (Ctrl+Y)',
        shortcut: 'Ctrl+Y',
        separator: true,
      },
      {
        type: ToolType.COPY,
        icon: Copy,
        label: '复制',
        tooltip: '复制 (Ctrl+C)',
        shortcut: 'Ctrl+C',
      },
      {
        type: ToolType.PASTE,
        icon: Clipboard,
        label: '粘贴',
        tooltip: '粘贴 (Ctrl+V)',
        shortcut: 'Ctrl+V',
      },
      {
        type: ToolType.DELETE,
        icon: Trash2,
        label: '删除',
        tooltip: '删除 (Delete)',
        shortcut: 'Delete',
        separator: true,
      },
    ],
  },
  {
    name: '对齐工具',
    tools: [
      {
        type: ToolType.ALIGN_LEFT,
        icon: AlignLeft,
        label: '左对齐',
        tooltip: '左对齐',
      },
      {
        type: ToolType.ALIGN_CENTER,
        icon: AlignCenter,
        label: '水平居中',
        tooltip: '水平居中',
      },
      {
        type: ToolType.ALIGN_RIGHT,
        icon: AlignRight,
        label: '右对齐',
        tooltip: '右对齐',
        separator: true,
      },
      {
        type: ToolType.ALIGN_TOP,
        icon: AlignStartVertical,
        label: '顶部对齐',
        tooltip: '顶部对齐',
      },
      {
        type: ToolType.ALIGN_MIDDLE,
        icon: AlignCenterVertical,
        label: '垂直居中',
        tooltip: '垂直居中',
      },
      {
        type: ToolType.ALIGN_BOTTOM,
        icon: AlignEndVertical,
        label: '底部对齐',
        tooltip: '底部对齐',
        separator: true,
      },
      {
        type: ToolType.DISTRIBUTE_H,
        icon: Columns3,
        label: '水平分布',
        tooltip: '水平分布',
      },
      {
        type: ToolType.DISTRIBUTE_V,
        icon: Rows3,
        label: '垂直分布',
        tooltip: '垂直分布',
        separator: true,
      },
    ],
  },
  {
    name: '缩放工具',
    tools: [
      {
        type: ToolType.ZOOM_IN,
        icon: ZoomIn,
        label: '放大',
        tooltip: '放大 (Ctrl++)',
        shortcut: 'Ctrl++',
      },
      {
        type: ToolType.ZOOM_OUT,
        icon: ZoomOut,
        label: '缩小',
        tooltip: '缩小 (Ctrl+-)',
        shortcut: 'Ctrl+-',
      },
      {
        type: ToolType.ZOOM_FIT,
        icon: Maximize,
        label: '适应窗口',
        tooltip: '适应窗口 (Ctrl+0)',
        shortcut: 'Ctrl+0',
      },
      {
        type: ToolType.ZOOM_100,
        icon: Percent,
        label: '100%',
        tooltip: '实际大小 (Ctrl+1)',
        shortcut: 'Ctrl+1',
        separator: true,
      },
    ],
  },
  {
    name: '其他工具',
    tools: [
      {
        type: ToolType.PREVIEW,
        icon: Eye,
        label: '预览',
        tooltip: '预览模板',
      },
      {
        type: ToolType.EXPORT,
        icon: Download,
        label: '导出',
        tooltip: '导出模板',
      },
      {
        type: ToolType.SETTINGS,
        icon: Settings,
        label: '设置',
        tooltip: '编辑器设置',
      },
    ],
  },
];

/**
 * 获取工具快捷键映射
 */
export const getShortcutMap = (): Map<string, ToolType> => {
  const map = new Map<string, ToolType>();
  
  defaultToolGroups.forEach(group => {
    group.tools.forEach(tool => {
      if (tool.shortcut) {
        map.set(tool.shortcut.toLowerCase(), tool.type);
      }
    });
  });
  
  return map;
};