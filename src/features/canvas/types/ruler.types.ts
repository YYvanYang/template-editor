/**
 * 标尺相关类型定义
 */

/**
 * 标尺方向
 */
export type RulerOrientation = 'horizontal' | 'vertical';

/**
 * 标尺刻度信息
 */
export interface RulerTick {
  /** 刻度位置（像素） */
  position: number;
  /** 刻度标签 */
  label?: string;
  /** 是否为主刻度 */
  isMajor: boolean;
}

/**
 * 标尺配置
 */
export interface RulerConfig {
  /** 标尺方向 */
  orientation: RulerOrientation;
  /** 标尺长度（像素） */
  length: number;
  /** 标尺厚度（像素） */
  thickness?: number;
  /** 单位（mm, cm, px等） */
  unit?: 'mm' | 'cm' | 'px';
  /** 缩放比例 */
  scale?: number;
  /** 偏移量 */
  offset?: number;
  /** 背景色 */
  backgroundColor?: string;
  /** 文字颜色 */
  textColor?: string;
  /** 刻度线颜色 */
  tickColor?: string;
  /** 字体大小 */
  fontSize?: number;
}

/**
 * 标尺组件属性
 */
export interface RulerProps extends RulerConfig {
  /** 画布尺寸 */
  canvasSize: {
    width: number;
    height: number;
  };
  /** 视口变换（缩放和平移） */
  viewport: {
    scale: number;
    x: number;
    y: number;
  };
  /** 鼠标位置（可选，用于显示当前位置指示器） */
  mousePosition?: {
    x: number;
    y: number;
  };
  /** 点击标尺时的回调 */
  onClick?: (position: number) => void;
}

/**
 * 计算标尺刻度的工具函数参数
 */
export interface CalculateTicksParams {
  /** 标尺长度 */
  length: number;
  /** 缩放比例 */
  scale: number;
  /** 偏移量 */
  offset: number;
  /** 单位 */
  unit: 'mm' | 'cm' | 'px';
  /** 最小刻度间隔（像素） */
  minTickSpacing?: number;
}

/**
 * 单位转换配置
 */
export const UNIT_CONVERSIONS = {
  mm: {
    toPx: 3.7795275591, // 1mm = 3.7795275591px (96 DPI)
    label: 'mm',
    majorInterval: 10, // 每10mm一个主刻度
    minorInterval: 1, // 每1mm一个次刻度
  },
  cm: {
    toPx: 37.795275591, // 1cm = 37.795275591px (96 DPI)
    label: 'cm',
    majorInterval: 1, // 每1cm一个主刻度
    minorInterval: 0.1, // 每0.1cm一个次刻度
  },
  px: {
    toPx: 1,
    label: 'px',
    majorInterval: 100, // 每100px一个主刻度
    minorInterval: 10, // 每10px一个次刻度
  },
} as const;

/**
 * 默认标尺配置
 */
export const DEFAULT_RULER_CONFIG: Partial<RulerConfig> = {
  thickness: 20,
  unit: 'mm',
  scale: 1,
  offset: 0,
  backgroundColor: '#f8f9fa',
  textColor: '#6c757d',
  tickColor: '#adb5bd',
  fontSize: 10,
};