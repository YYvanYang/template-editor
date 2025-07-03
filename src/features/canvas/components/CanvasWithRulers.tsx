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
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvas, template, ui } = useEditorStore();
  const rulerThickness = 30;
  
  // 按照 Figma/Adobe XD/Sketch 的行业标准：
  // 垂直标尺始终有固定的左边距，保持视觉一致性
  const TOOLBAR_WIDTH = 56; // 工具栏标准宽度
  const leftPadding = TOOLBAR_WIDTH; // 始终保持工具栏宽度的左边距，符合行业标准
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
    setMousePosition(undefined);
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
      {/* 顶部区域：标准行业布局 - 左边距 + 角落 + 水平标尺 */}
      <div style={{ display: 'flex', flexShrink: 0 }}>
        {/* 
          左边距区域：符合 Figma/Adobe XD/Sketch 标准
          - 顶部工具栏模式：显示为空白区域，保持视觉一致性
          - 侧边工具栏模式：工具栏会覆盖这个区域
        */}
        <div 
          style={{ 
            width: leftPadding, 
            flexShrink: 0,
            backgroundColor: ui.toolbarPosition === 'top' ? '#f8f9fa' : 'transparent', // 顶部模式显示背景
            borderRight: ui.toolbarPosition === 'top' ? '1px solid #e9ecef' : 'none', // 顶部模式显示分割线
          }}
        >
          {/* 只在没有侧边工具栏时显示视觉提示 */}
          {ui.toolbarPosition === 'top' && (
            <div style={{ 
              width: '100%', 
              height: rulerThickness,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#6c757d',
            }}>
              {/* 可以放工具栏图标或留空 */}
            </div>
          )}
        </div>
        
        {/* 角落区域 */}
        <div style={{ width: rulerThickness, flexShrink: 0 }}>
          <RulerCorner
            size={rulerThickness}
            unit={unit}
            onClick={handleUnitChange}
          />
        </div>
        
        {/* 水平标尺 */}
        <div style={{ flex: 1 }}>
          <RulerCanvas
            orientation="horizontal"
            length={Math.max(0, containerSize.width - leftPadding - rulerThickness)}
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
        {/* 左边距区域 - 与顶部保持对齐 */}
        <div style={{ width: leftPadding, flexShrink: 0 }} />
        
        {/* 垂直标尺 */}
        <div style={{ width: rulerThickness, flexShrink: 0 }}>
          <RulerCanvas
            orientation="vertical"
            length={Math.max(0, containerSize.height - rulerThickness)}
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