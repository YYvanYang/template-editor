import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RulerWithGuides } from './RulerWithGuides';
import { useEditorStore } from '@/features/editor/stores/editor.store';
import { useAlignment } from '../hooks/useAlignment';

interface RulerContainerProps {
  children: React.ReactNode;
  unit?: 'px' | 'mm' | 'cm';
  thickness?: number;
  backgroundColor?: string;
  textColor?: string;
  tickColor?: string;
  fontSize?: number;
}

/**
 * 标尺容器组件
 * 提供水平和垂直标尺，支持拖拽创建辅助线
 */
export const RulerContainer: React.FC<RulerContainerProps> = ({
  children,
  unit = 'mm',
  thickness = 30,
  backgroundColor = '#f8f9fa',
  textColor = '#6c757d',
  tickColor = '#dee2e6',
  fontSize = 11,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | undefined>(undefined);
  
  const { canvas, template } = useEditorStore();
  const alignment = useAlignment();

  // 监听容器大小变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width - thickness,
          height: rect.height - thickness,
        });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [thickness]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setMousePosition({
      x: event.clientX - rect.left - thickness,
      y: event.clientY - rect.top - thickness,
    });
  }, [thickness]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    setMousePosition(undefined);
  }, []);

  // 处理标尺点击
  const handleRulerClick = useCallback((value: number, orientation: 'horizontal' | 'vertical') => {
    console.log(`Ruler clicked: ${value} ${unit} on ${orientation} ruler`);
  }, [unit]);

  // 处理创建辅助线
  const handleCreateGuide = useCallback((position: number, orientation: 'horizontal' | 'vertical') => {
    const guideOrientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
    alignment.addManualGuide({
      orientation: guideOrientation,
      position: position,
      type: 'manual',
      visible: true,
    });
  }, [alignment]);

  // 获取现有的辅助线
  const guides = alignment.manualGuides.map(guide => ({
    id: guide.id,
    position: guide.position,
  }));

  const viewport = {
    scale: canvas.zoom,
    x: canvas.offset.x,
    y: canvas.offset.y,
    width: containerSize.width,
    height: containerSize.height,
  };

  const canvasSize = {
    width: template.size.width * 3.7795275591, // mm to px
    height: template.size.height * 3.7795275591,
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-100"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 角落方块 */}
      <div
        className="absolute top-0 left-0 z-20"
        style={{
          width: thickness,
          height: thickness,
          backgroundColor,
          borderRight: `1px solid ${tickColor}`,
          borderBottom: `1px solid ${tickColor}`,
        }}
      >
        <div className="flex items-center justify-center w-full h-full text-xs" style={{ color: textColor }}>
          {unit.toUpperCase()}
        </div>
      </div>

      {/* 水平标尺 */}
      <div
        className="absolute top-0 z-10"
        style={{
          left: thickness,
          width: containerSize.width,
          height: thickness,
        }}
      >
        <RulerWithGuides
          orientation="horizontal"
          length={containerSize.width}
          thickness={thickness}
          unit={unit}
          scale={1}
          offset={0}
          backgroundColor={backgroundColor}
          textColor={textColor}
          tickColor={tickColor}
          fontSize={fontSize}
          canvasSize={canvasSize}
          viewport={viewport}
          mousePosition={mousePosition}
          onClick={(value) => handleRulerClick(value, 'horizontal')}
          onCreateGuide={handleCreateGuide}
          guides={guides.filter(g => alignment.staticGuides.find(sg => sg.id === g.id && sg.orientation === 'vertical'))}
        />
      </div>

      {/* 垂直标尺 */}
      <div
        className="absolute left-0 z-10"
        style={{
          top: thickness,
          width: thickness,
          height: containerSize.height,
        }}
      >
        <RulerWithGuides
          orientation="vertical"
          length={containerSize.height}
          thickness={thickness}
          unit={unit}
          scale={1}
          offset={0}
          backgroundColor={backgroundColor}
          textColor={textColor}
          tickColor={tickColor}
          fontSize={fontSize}
          canvasSize={canvasSize}
          viewport={viewport}
          mousePosition={mousePosition}
          onClick={(value) => handleRulerClick(value, 'vertical')}
          onCreateGuide={handleCreateGuide}
          guides={guides.filter(g => alignment.staticGuides.find(sg => sg.id === g.id && sg.orientation === 'horizontal'))}
        />
      </div>

      {/* 画布内容区域 */}
      <div
        className="absolute overflow-hidden bg-gray-50"
        style={{
          left: thickness,
          top: thickness,
          width: containerSize.width,
          height: containerSize.height,
        }}
      >
        {children}
      </div>

      {/* 鼠标坐标显示 */}
      {mousePosition && (
        <div
          className="absolute z-30 px-2 py-1 text-xs bg-white rounded shadow-sm pointer-events-none"
          style={{
            left: mousePosition.x + thickness + 10,
            top: mousePosition.y + thickness + 10,
            border: '1px solid #e5e7eb',
          }}
        >
          <div className="text-gray-600">
            X: {Math.round((mousePosition.x - viewport.x) / viewport.scale)} {unit}
          </div>
          <div className="text-gray-600">
            Y: {Math.round((mousePosition.y - viewport.y) / viewport.scale)} {unit}
          </div>
        </div>
      )}
    </div>
  );
};