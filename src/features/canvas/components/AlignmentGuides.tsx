import React, { useMemo } from 'react';
import type { GuideLine, DynamicGuide } from '../types/alignment.types';

interface AlignmentGuidesProps {
  /** 静态辅助线 */
  guides?: GuideLine[];
  /** 动态辅助线（拖拽时显示） */
  dynamicGuides?: DynamicGuide[];
  /** 视口信息 */
  viewport: {
    scale: number;
    x: number;
    y: number;
  };
  /** 画布尺寸 */
  canvasSize: {
    width: number;
    height: number;
  };
  /** 辅助线颜色 */
  guideColor?: string;
  /** 辅助线宽度 */
  guideWidth?: number;
  /** 辅助线样式 */
  guideStyle?: 'solid' | 'dashed' | 'dotted';
  /** 点击辅助线时的回调 */
  onGuideClick?: (guideId: string) => void;
  /** 双击辅助线时的回调 */
  onGuideDoubleClick?: (guideId: string) => void;
}

/**
 * 对齐辅助线组件
 * 用于显示静态和动态的对齐辅助线
 */
export const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({
  guides = [],
  dynamicGuides = [],
  viewport,
  canvasSize,
  guideColor = '#00bcd4',
  guideWidth = 1,
  guideStyle = 'solid',
  onGuideClick,
  onGuideDoubleClick,
}) => {
  // 计算可见区域
  const visibleBounds = useMemo(() => {
    const padding = 100; // 额外的边距
    return {
      left: -viewport.x / viewport.scale - padding,
      top: -viewport.y / viewport.scale - padding,
      right: (-viewport.x + canvasSize.width) / viewport.scale + padding,
      bottom: (-viewport.y + canvasSize.height) / viewport.scale + padding,
    };
  }, [viewport, canvasSize]);

  // 过滤可见的静态辅助线
  const visibleGuides = useMemo(() => {
    return guides.filter(guide => {
      if (!guide.visible) return false;
      
      if (guide.orientation === 'vertical') {
        return guide.position >= visibleBounds.left && guide.position <= visibleBounds.right;
      } else {
        return guide.position >= visibleBounds.top && guide.position <= visibleBounds.bottom;
      }
    });
  }, [guides, visibleBounds]);

  // 获取辅助线样式
  const getGuideStyle = (
    orientation: 'vertical' | 'horizontal',
    type?: 'manual' | 'auto' | 'center' | 'edge'
  ): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      pointerEvents: onGuideClick || onGuideDoubleClick ? 'auto' : 'none',
      cursor: onGuideClick || onGuideDoubleClick ? 'pointer' : 'default',
    };

    if (orientation === 'vertical') {
      baseStyle.width = guideWidth;
      baseStyle.height = '100%';
      baseStyle.top = 0;
    } else {
      baseStyle.height = guideWidth;
      baseStyle.width = '100%';
      baseStyle.left = 0;
    }

    // 根据类型设置颜色和样式
    let color = guideColor;
    let opacity = 1;
    
    if (type === 'center') {
      opacity = 0.8;
    } else if (type === 'edge') {
      opacity = 0.6;
    }

    baseStyle.backgroundColor = color;
    baseStyle.opacity = opacity;

    // 处理虚线样式
    if (guideStyle === 'dashed') {
      baseStyle.backgroundImage = orientation === 'vertical'
        ? `repeating-linear-gradient(0deg, ${color} 0px, ${color} 5px, transparent 5px, transparent 10px)`
        : `repeating-linear-gradient(90deg, ${color} 0px, ${color} 5px, transparent 5px, transparent 10px)`;
      baseStyle.backgroundColor = 'transparent';
    } else if (guideStyle === 'dotted') {
      baseStyle.backgroundImage = orientation === 'vertical'
        ? `repeating-linear-gradient(0deg, ${color} 0px, ${color} 2px, transparent 2px, transparent 5px)`
        : `repeating-linear-gradient(90deg, ${color} 0px, ${color} 2px, transparent 2px, transparent 5px)`;
      baseStyle.backgroundColor = 'transparent';
    }

    return baseStyle;
  };

  // 转换坐标
  const transformPosition = (position: number, isX: boolean) => {
    return position * viewport.scale + (isX ? viewport.x : viewport.y);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* 静态辅助线 */}
      {visibleGuides.map(guide => {
        const style = getGuideStyle(guide.orientation, guide.type);
        
        if (guide.orientation === 'vertical') {
          style.left = transformPosition(guide.position, true);
        } else {
          style.top = transformPosition(guide.position, false);
        }

        return (
          <div
            key={guide.id}
            data-testid={`guide-${guide.id}`}
            style={style}
            onClick={() => onGuideClick?.(guide.id)}
            onDoubleClick={() => onGuideDoubleClick?.(guide.id)}
          />
        );
      })}

      {/* 动态辅助线 */}
      {dynamicGuides.map((guide, index) => {
        const style = getGuideStyle(guide.orientation);
        style.backgroundColor = '#ff5722'; // 动态辅助线使用不同的颜色
        style.opacity = 0.8;
        
        if (guide.orientation === 'vertical') {
          style.left = transformPosition(guide.position, true);
          style.top = transformPosition(guide.start, false);
          style.height = (guide.end - guide.start) * viewport.scale;
        } else {
          style.top = transformPosition(guide.position, false);
          style.left = transformPosition(guide.start, true);
          style.width = (guide.end - guide.start) * viewport.scale;
        }

        return (
          <div
            key={`dynamic-${index}`}
            data-testid={`dynamic-guide-${index}`}
            style={style}
          />
        );
      })}
    </div>
  );
};