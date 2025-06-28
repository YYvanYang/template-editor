/**
 * 对齐辅助线相关类型定义
 */

/**
 * 辅助线方向
 */
export type GuideOrientation = 'horizontal' | 'vertical';

/**
 * 辅助线类型
 */
export type GuideType = 'manual' | 'auto' | 'center' | 'edge';

/**
 * 辅助线定义
 */
export interface GuideLine {
  /** 唯一标识 */
  id: string;
  /** 方向 */
  orientation: GuideOrientation;
  /** 位置（实际坐标值） */
  position: number;
  /** 类型 */
  type: GuideType;
  /** 是否可见 */
  visible?: boolean;
  /** 是否锁定（不可删除） */
  locked?: boolean;
  /** 显示标签 */
  label?: string;
}

/**
 * 对齐点
 */
export interface AlignmentPoint {
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
  /** 所属元素ID */
  elementId: string;
  /** 点类型 */
  type: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'corner';
}

/**
 * 对齐结果
 */
export interface AlignmentResult {
  /** 是否对齐到了辅助线 */
  aligned: boolean;
  /** 对齐后的X坐标 */
  x: number;
  /** 对齐后的Y坐标 */
  y: number;
  /** 对齐到的垂直辅助线 */
  verticalGuide?: GuideLine;
  /** 对齐到的水平辅助线 */
  horizontalGuide?: GuideLine;
  /** X方向的偏移量 */
  deltaX: number;
  /** Y方向的偏移量 */
  deltaY: number;
}

/**
 * 对齐配置
 */
export interface AlignmentConfig {
  /** 是否启用对齐 */
  enabled: boolean;
  /** 对齐阈值（像素） */
  threshold: number;
  /** 是否显示辅助线 */
  showGuides: boolean;
  /** 是否对齐到网格 */
  snapToGrid: boolean;
  /** 网格大小 */
  gridSize: number;
  /** 是否对齐到其他元素 */
  snapToElements: boolean;
  /** 是否显示中心辅助线 */
  showCenterGuides: boolean;
  /** 是否显示边缘辅助线 */
  showEdgeGuides: boolean;
  /** 辅助线颜色 */
  guideColor?: string;
  /** 辅助线宽度 */
  guideWidth?: number;
  /** 辅助线样式 */
  guideStyle?: 'solid' | 'dashed' | 'dotted';
}

/**
 * 默认对齐配置
 */
export const DEFAULT_ALIGNMENT_CONFIG: AlignmentConfig = {
  enabled: true,
  threshold: 8,
  showGuides: true,
  snapToGrid: false,
  gridSize: 10,
  snapToElements: true,
  showCenterGuides: true,
  showEdgeGuides: true,
  guideColor: '#00bcd4',
  guideWidth: 1,
  guideStyle: 'solid',
};

/**
 * 元素边界框
 */
export interface ElementBounds {
  /** 元素ID */
  id: string;
  /** 左边界 */
  left: number;
  /** 上边界 */
  top: number;
  /** 右边界 */
  right: number;
  /** 下边界 */
  bottom: number;
  /** 中心X坐标 */
  centerX: number;
  /** 中心Y坐标 */
  centerY: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 动态辅助线（拖拽时显示）
 */
export interface DynamicGuide {
  /** 方向 */
  orientation: GuideOrientation;
  /** 位置 */
  position: number;
  /** 起始点 */
  start: number;
  /** 结束点 */
  end: number;
  /** 类型 */
  type: 'element' | 'canvas';
  /** 相关元素ID列表 */
  relatedElements?: string[];
}