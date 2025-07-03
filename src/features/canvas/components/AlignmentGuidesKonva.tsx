import React, { useMemo, useCallback } from 'react';
import { Group, Line, Rect, Text, Circle } from 'react-konva';
import type { GuideLine, DynamicGuide } from '../types/alignment.types';

interface AlignmentGuidesKonvaProps {
  /** 静态辅助线 */
  guides?: GuideLine[];
  /** 动态辅助线（拖拽时显示） */
  dynamicGuides?: DynamicGuide[];
  /** 视口信息 */
  viewport: {
    scale: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 画布尺寸 */
  canvasSize: {
    width: number;
    height: number;
  };
  /** 点击辅助线时的回调 */
  onGuideClick?: (guideId: string) => void;
  /** 双击辅助线时的回调 */
  onGuideDoubleClick?: (guideId: string) => void;
  /** 拖拽辅助线时的回调 */
  onGuideDrag?: (guideId: string, position: number) => void;
  /** 是否显示测量标注 */
  showMeasurements?: boolean;
}

/**
 * 辅助线样式配置
 */
const GUIDE_STYLES = {
  manual: {
    stroke: '#E5E7EB',
    strokeWidth: 1,
    dash: [4, 4],
    opacity: 1,
  },
  auto: {
    stroke: '#E5E7EB',
    strokeWidth: 1,
    dash: [4, 4],
    opacity: 0.8,
  },
  center: {
    stroke: '#10B981',
    strokeWidth: 1,
    dash: [8, 4],
    opacity: 0.8,
  },
  edge: {
    stroke: '#E5E7EB',
    strokeWidth: 1,
    dash: [4, 4],
    opacity: 0.6,
  },
  dynamic: {
    stroke: '#3B82F6',
    strokeWidth: 1,
    dash: undefined,
    opacity: 1,
  },
  spacing: {
    stroke: '#F59E0B',
    strokeWidth: 1,
    dash: [2, 2],
    opacity: 0.8,
  },
};

/**
 * 测量标注样式
 */
const MEASUREMENT_STYLE = {
  fontSize: 11,
  fill: '#6B7280',
  padding: 4,
  cornerRadius: 3,
  background: 'rgba(255, 255, 255, 0.9)',
};

/**
 * 基于 Konva 的对齐辅助线组件
 * 提供高性能的辅助线渲染和交互
 */
export const AlignmentGuidesKonva: React.FC<AlignmentGuidesKonvaProps> = ({
  guides = [],
  dynamicGuides = [],
  viewport,
  canvasSize,
  onGuideClick,
  onGuideDoubleClick,
  onGuideDrag,
  showMeasurements = false,
}) => {
  // 计算可见区域
  const visibleBounds = useMemo(() => {
    const padding = 200; // 额外的边距
    return {
      left: viewport.x - padding,
      top: viewport.y - padding,
      right: viewport.x + viewport.width + padding,
      bottom: viewport.y + viewport.height + padding,
    };
  }, [viewport]);

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
  const getGuideStyle = useCallback((type: string = 'auto') => {
    return GUIDE_STYLES[type as keyof typeof GUIDE_STYLES] || GUIDE_STYLES.auto;
  }, []);

  // 渲染静态辅助线
  const renderStaticGuide = useCallback((guide: GuideLine) => {
    const style = getGuideStyle(guide.type);
    const isVertical = guide.orientation === 'vertical';

    const points = isVertical
      ? [guide.position, visibleBounds.top, guide.position, visibleBounds.bottom]
      : [visibleBounds.left, guide.position, visibleBounds.right, guide.position];

    return (
      <Group key={guide.id}>
        <Line
          points={points}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          dash={style.dash || undefined}
          opacity={style.opacity}
          hitStrokeWidth={10} // 增加点击区域
          onClick={() => onGuideClick?.(guide.id)}
          onDblClick={() => onGuideDoubleClick?.(guide.id)}
          onDragStart={(e) => {
            if (guide.type === 'manual' && onGuideDrag) {
              e.target.startDrag();
            }
          }}
          onDragMove={(e) => {
            if (guide.type === 'manual' && onGuideDrag) {
              const pos = isVertical ? e.target.x() : e.target.y();
              onGuideDrag(guide.id, pos);
            }
          }}
          draggable={guide.type === 'manual' && !!onGuideDrag}
          dragBoundFunc={(pos) => {
            // 限制拖拽方向
            if (isVertical) {
              return { x: pos.x, y: guide.position };
            } else {
              return { x: guide.position, y: pos.y };
            }
          }}
        />
        
        {/* 悬停高亮 */}
        <Line
          points={points}
          stroke={style.stroke}
          strokeWidth={3}
          opacity={0}
          hitStrokeWidth={10}
          onMouseEnter={(e) => {
            e.target.opacity(0.3);
            e.target.getLayer()?.batchDraw();
          }}
          onMouseLeave={(e) => {
            e.target.opacity(0);
            e.target.getLayer()?.batchDraw();
          }}
        />
      </Group>
    );
  }, [visibleBounds, getGuideStyle, onGuideClick, onGuideDoubleClick, onGuideDrag]);

  // 渲染动态辅助线
  const renderDynamicGuide = useCallback((guide: DynamicGuide, index: number) => {
    const style = guide.type === 'spacing' ? GUIDE_STYLES.spacing : GUIDE_STYLES.dynamic;
    const isVertical = guide.orientation === 'vertical';

    const points = isVertical
      ? [guide.position, guide.start, guide.position, guide.end]
      : [guide.start, guide.position, guide.end, guide.position];

    return (
      <Group key={`dynamic-${guide.id || index}`}>
        <Line
          points={points}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          dash={style.dash || undefined}
          opacity={style.opacity}
          listening={false}
        />

        {/* 间距标注 */}
        {showMeasurements && guide.type === 'spacing' && guide.metadata?.spacing && (
          <Group>
            {/* 背景 */}
            <Rect
              x={isVertical ? guide.position - 20 : (guide.start + guide.end) / 2 - 20}
              y={isVertical ? (guide.start + guide.end) / 2 - 10 : guide.position - 20}
              width={40}
              height={20}
              fill={MEASUREMENT_STYLE.background}
              cornerRadius={MEASUREMENT_STYLE.cornerRadius}
              listening={false}
            />
            {/* 文本 */}
            <Text
              x={isVertical ? guide.position : (guide.start + guide.end) / 2}
              y={isVertical ? (guide.start + guide.end) / 2 : guide.position}
              text={`${guide.metadata.spacing}px`}
              fontSize={MEASUREMENT_STYLE.fontSize}
              fill={MEASUREMENT_STYLE.fill}
              align="center"
              verticalAlign="middle"
              offsetX={20}
              offsetY={10}
              listening={false}
            />
          </Group>
        )}

        {/* 对齐点指示器 */}
        {guide.type === 'element' && (
          <>
            <Circle
              x={isVertical ? guide.position : guide.start}
              y={isVertical ? guide.start : guide.position}
              radius={3}
              fill={style.stroke}
              opacity={style.opacity}
              listening={false}
            />
            <Circle
              x={isVertical ? guide.position : guide.end}
              y={isVertical ? guide.end : guide.position}
              radius={3}
              fill={style.stroke}
              opacity={style.opacity}
              listening={false}
            />
          </>
        )}
      </Group>
    );
  }, [showMeasurements]);

  // 渲染画布边界辅助线
  const renderCanvasBounds = useCallback(() => {
    if (!canvasSize.width || !canvasSize.height) return null;

    const style = GUIDE_STYLES.edge;
    
    return (
      <Group>
        {/* 上边界 */}
        <Line
          points={[0, 0, canvasSize.width, 0]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          dash={style.dash || undefined}
          opacity={style.opacity * 0.5}
          listening={false}
        />
        {/* 下边界 */}
        <Line
          points={[0, canvasSize.height, canvasSize.width, canvasSize.height]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          dash={style.dash || undefined}
          opacity={style.opacity * 0.5}
          listening={false}
        />
        {/* 左边界 */}
        <Line
          points={[0, 0, 0, canvasSize.height]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          dash={style.dash || undefined}
          opacity={style.opacity * 0.5}
          listening={false}
        />
        {/* 右边界 */}
        <Line
          points={[canvasSize.width, 0, canvasSize.width, canvasSize.height]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          dash={style.dash || undefined}
          opacity={style.opacity * 0.5}
          listening={false}
        />
      </Group>
    );
  }, [canvasSize]);

  return (
    <Group name="alignment-guides">
      {/* 画布边界 */}
      {renderCanvasBounds()}
      
      {/* 静态辅助线 */}
      <Group name="static-guides">
        {visibleGuides.map(renderStaticGuide)}
      </Group>

      {/* 动态辅助线 */}
      <Group name="dynamic-guides">
        {dynamicGuides.map(renderDynamicGuide)}
      </Group>
    </Group>
  );
};

