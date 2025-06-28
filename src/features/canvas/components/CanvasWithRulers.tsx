import React, { useState, useCallback } from 'react';
import { Canvas } from './Canvas';
import { Ruler } from './Ruler';
import { RulerCorner } from './RulerCorner';
import { useEditorStore } from '@/features/editor/stores/editor.store';

interface CanvasWithRulersProps {
  showRulers?: boolean;
  unit?: 'mm' | 'cm' | 'px';
  onUnitChange?: (unit: 'mm' | 'cm' | 'px') => void;
}

/**
 * 带标尺的画布组件
 */
export const CanvasWithRulers: React.FC<CanvasWithRulersProps> = ({
  showRulers = true,
  unit: initialUnit = 'mm',
  onUnitChange,
}) => {
  const [unit, setUnit] = useState(initialUnit);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  
  const { canvas, template } = useEditorStore();
  const rulerThickness = 20;
  
  // 构建 viewport 对象
  const viewport = {
    x: canvas.offset.x,
    y: canvas.offset.y,
    scale: canvas.zoom,
  };

  // 处理单位切换
  const handleUnitChange = useCallback(() => {
    const units: ('mm' | 'cm' | 'px')[] = ['mm', 'cm', 'px'];
    const currentIndex = units.indexOf(unit);
    const nextUnit = units[(currentIndex + 1) % units.length];
    setUnit(nextUnit);
    onUnitChange?.(nextUnit);
  }, [unit, onUnitChange]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: event.clientX - rect.left - (showRulers ? rulerThickness : 0),
      y: event.clientY - rect.top - (showRulers ? rulerThickness : 0),
    });
  }, [showRulers, rulerThickness]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
  }, []);

  // 处理标尺点击
  const handleRulerClick = useCallback((value: number, orientation: 'horizontal' | 'vertical') => {
    console.log(`Ruler clicked at ${value}${unit} (${orientation})`);
    // 可以在这里添加创建参考线的逻辑
  }, [unit]);

  if (!showRulers) {
    return <Canvas />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 顶部区域：角落 + 水平标尺 */}
      <div style={{ display: 'flex' }}>
        <RulerCorner
          size={rulerThickness}
          unit={unit}
          onClick={handleUnitChange}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Ruler
            orientation="horizontal"
            length={template.size.width}
            thickness={rulerThickness}
            unit={unit}
            canvasSize={template.size}
            viewport={viewport}
            mousePosition={mousePosition}
            onClick={(value) => handleRulerClick(value, 'horizontal')}
          />
        </div>
      </div>

      {/* 底部区域：垂直标尺 + 画布 */}
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ overflow: 'hidden' }}>
          <Ruler
            orientation="vertical"
            length={template.size.height}
            thickness={rulerThickness}
            unit={unit}
            canvasSize={template.size}
            viewport={viewport}
            mousePosition={mousePosition}
            onClick={(value) => handleRulerClick(value, 'vertical')}
          />
        </div>
        <div 
          style={{ flex: 1, position: 'relative' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <Canvas />
        </div>
      </div>
    </div>
  );
};