import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from './Canvas';
import { RulerCanvas } from './RulerCanvas';
import { RulerCorner } from './RulerCorner';
import { useEditorStore } from '@/features/editor/stores/editor.store';
import { RulerDiagnostics } from '@/debug/RulerDiagnostics';

interface CanvasWithRulersProps {
  showRulers?: boolean;
  unit?: 'mm' | 'cm' | 'px';
  onUnitChange?: (unit: 'mm' | 'cm' | 'px') => void;
  showDiagnostics?: boolean;
}

/**
 * 带标尺的画布组件
 * 使用 Canvas 渲染标尺，提供高性能和精确的标尺显示
 */
export const CanvasWithRulers: React.FC<CanvasWithRulersProps> = ({
  showRulers = true,
  unit: initialUnit = 'mm',
  onUnitChange,
  showDiagnostics = false,
}) => {
  const [unit, setUnit] = useState(initialUnit);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvas, template } = useEditorStore();
  const rulerThickness = 30;
  const MM_TO_PX = 3.7795275591; // 1mm = 3.7795275591px at 96dpi
  
  // 构建 viewport 对象
  // 重要：这里的坐标变换确保了标尺0刻度始终对应画布左上角
  const viewport = {
    x: canvas.offset.x, // 画布在屏幕上的位置
    y: canvas.offset.y,
    scale: canvas.zoom,
  };
  
  // 监听容器大小变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };
    
    updateSize();
    
    // 使用 ResizeObserver 获得更准确的尺寸变化
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
    if (!showRulers) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    // 鼠标位置相对于整个容器
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 减去标尺厚度，得到相对于画布的位置
    const canvasX = x - rulerThickness;
    const canvasY = y - rulerThickness;
    
    setMousePosition({ x: canvasX, y: canvasY });
  }, [showRulers, rulerThickness]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
  }, []);

  // 处理标尺点击（创建参考线）
  const handleRulerClick = useCallback((value: number, orientation: 'horizontal' | 'vertical') => {
    console.log(`创建${orientation === 'horizontal' ? '水平' : '垂直'}参考线于 ${value}${unit}`);
    // TODO: 实现创建参考线的逻辑
  }, [unit]);

  if (!showRulers) {
    return <Canvas unit={unit} />;
  }

  return (
    <div 
      ref={containerRef} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        position: 'relative',
        backgroundColor: '#f0f0f0',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 顶部区域：角落 + 水平标尺 */}
      <div style={{ display: 'flex', flexShrink: 0 }}>
        <RulerCorner
          size={rulerThickness}
          unit={unit}
          onClick={handleUnitChange}
        />
        <div style={{ width: containerSize.width - rulerThickness }}>
          <RulerCanvas
            orientation="horizontal"
            length={containerSize.width - rulerThickness}
            thickness={rulerThickness}
            unit={unit}
            canvasSize={{ 
              width: template.size.width * MM_TO_PX,
              height: template.size.height * MM_TO_PX,
            }}
            viewport={viewport}
            mousePosition={mousePosition}
            onClick={(value) => handleRulerClick(value, 'horizontal')}
          />
        </div>
      </div>

      {/* 底部区域：垂直标尺 + 画布 */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ height: containerSize.height - rulerThickness }}>
          <RulerCanvas
            orientation="vertical"
            length={containerSize.height - rulerThickness}
            thickness={rulerThickness}
            unit={unit}
            canvasSize={{ 
              width: template.size.width * MM_TO_PX,
              height: template.size.height * MM_TO_PX,
            }}
            viewport={viewport}
            mousePosition={mousePosition}
            onClick={(value) => handleRulerClick(value, 'vertical')}
          />
        </div>
        <div 
          style={{ 
            flex: 1, 
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Canvas unit={unit} />
        </div>
      </div>
      
      {/* 调试信息 */}
      {showDiagnostics && <RulerDiagnostics />}
    </div>
  );
};