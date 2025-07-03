import React, { useState, useCallback, useRef } from 'react';
import { RulerCanvas } from '@/features/canvas/components/RulerCanvas';

/**
 * 增强的标尺调试组件
 * 提供详细的坐标对齐信息和视觉辅助
 */
export const EnhancedRulerDebug: React.FC = () => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [unit, setUnit] = useState<'mm' | 'cm' | 'px'>('mm');
  const [showGrid, setShowGrid] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerThickness = 30;
  const canvasWidth = 210 * 3.7795275591; // A4 width in px
  const canvasHeight = 297 * 3.7795275591; // A4 height in px
  
  const MM_TO_PX = 3.7795275591;
  const CM_TO_PX = 37.795275591;
  
  const getUnitConversion = () => {
    switch (unit) {
      case 'mm': return MM_TO_PX;
      case 'cm': return CM_TO_PX;
      case 'px': return 1;
    }
  };
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(10, prev.scale * delta))
    }));
  }, []);
  
  // 计算鼠标在画布上的实际坐标
  const getCanvasCoordinates = () => {
    if (!mousePosition) return null;
    
    const canvasX = (mousePosition.x - rulerThickness - viewport.x) / viewport.scale;
    const canvasY = (mousePosition.y - rulerThickness - viewport.y) / viewport.scale;
    
    const unitConversion = getUnitConversion();
    return {
      pixelX: canvasX,
      pixelY: canvasY,
      unitX: canvasX / unitConversion,
      unitY: canvasY / unitConversion,
    };
  };
  
  const canvasCoords = getCanvasCoordinates();

  return (
    <div className="w-screen h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">增强标尺调试工具</h1>
        
        {/* 控制面板 */}
        <div className="mb-4 flex gap-4 items-center">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded ${unit === 'mm' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setUnit('mm')}
            >
              毫米
            </button>
            <button
              className={`px-3 py-1 rounded ${unit === 'cm' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setUnit('cm')}
            >
              厘米
            </button>
            <button
              className={`px-3 py-1 rounded ${unit === 'px' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setUnit('px')}
            >
              像素
            </button>
          </div>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              显示网格
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showCrosshair}
                onChange={(e) => setShowCrosshair(e.target.checked)}
              />
              显示十字线
            </label>
          </div>
          
          <button
            className="px-4 py-2 bg-green-500 text-white rounded"
            onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}
          >
            重置视图
          </button>
        </div>
        
        {/* 信息面板 */}
        <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-semibold mb-1">视口信息</h3>
            <p>偏移: ({viewport.x.toFixed(1)}, {viewport.y.toFixed(1)}) px</p>
            <p>缩放: {(viewport.scale * 100).toFixed(0)}%</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-semibold mb-1">鼠标位置（屏幕）</h3>
            {mousePosition ? (
              <>
                <p>X: {mousePosition.x.toFixed(0)} px</p>
                <p>Y: {mousePosition.y.toFixed(0)} px</p>
              </>
            ) : (
              <p className="text-gray-500">移动鼠标查看</p>
            )}
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-semibold mb-1">画布坐标</h3>
            {canvasCoords ? (
              <>
                <p>X: {canvasCoords.unitX.toFixed(1)} {unit} ({canvasCoords.pixelX.toFixed(0)} px)</p>
                <p>Y: {canvasCoords.unitY.toFixed(1)} {unit} ({canvasCoords.pixelY.toFixed(0)} px)</p>
              </>
            ) : (
              <p className="text-gray-500">移动鼠标查看</p>
            )}
          </div>
        </div>
        
        {/* 主视图区域 */}
        <div 
          ref={containerRef}
          className="relative border-2 border-gray-300 bg-gray-50"
          style={{ width: 900, height: 600 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        >
          {/* 角落 */}
          <div 
            className="absolute bg-gray-800 z-20 flex items-center justify-center text-white text-xs"
            style={{
              width: rulerThickness,
              height: rulerThickness,
              left: 0,
              top: 0,
            }}
          >
            {unit}
          </div>
          
          {/* 水平标尺 */}
          <div 
            className="absolute z-10 bg-white"
            style={{
              left: rulerThickness,
              top: 0,
              width: 900 - rulerThickness,
              height: rulerThickness,
            }}
          >
            <RulerCanvas
              orientation="horizontal"
              length={900 - rulerThickness}
              thickness={rulerThickness}
              unit={unit}
              viewport={viewport}
              mousePosition={mousePosition ? { x: mousePosition.x - rulerThickness, y: 0 } : undefined}
              canvasSize={{ width: canvasWidth, height: canvasHeight }}
            />
          </div>
          
          {/* 垂直标尺 */}
          <div 
            className="absolute z-10 bg-white"
            style={{
              left: 0,
              top: rulerThickness,
              width: rulerThickness,
              height: 600 - rulerThickness,
            }}
          >
            <RulerCanvas
              orientation="vertical"
              length={600 - rulerThickness}
              thickness={rulerThickness}
              unit={unit}
              viewport={viewport}
              mousePosition={mousePosition ? { x: 0, y: mousePosition.y - rulerThickness } : undefined}
              canvasSize={{ width: canvasWidth, height: canvasHeight }}
            />
          </div>
          
          {/* 内容区域 */}
          <div 
            className="absolute overflow-hidden"
            style={{
              left: rulerThickness,
              top: rulerThickness,
              right: 0,
              bottom: 0,
            }}
          >
            {/* 网格 */}
            {showGrid && (
              <div 
                className="absolute pointer-events-none"
                style={{
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `
                    repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, transparent 1px, transparent ${10 * getUnitConversion() * viewport.scale - 1}px, rgba(0,0,0,0.05) ${10 * getUnitConversion() * viewport.scale}px),
                    repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0px, transparent 1px, transparent ${10 * getUnitConversion() * viewport.scale - 1}px, rgba(0,0,0,0.05) ${10 * getUnitConversion() * viewport.scale}px)
                  `,
                  backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                }}
              />
            )}
            
            {/* A4 画布 */}
            <div 
              className="absolute bg-white border-2 border-blue-500 shadow-xl"
              style={{
                left: viewport.x,
                top: viewport.y,
                width: canvasWidth * viewport.scale,
                height: canvasHeight * viewport.scale,
              }}
            >
              <div className="p-4" style={{ transform: `scale(${viewport.scale})`, transformOrigin: '0 0' }}>
                <h2 className="text-xl font-bold mb-2">A4 画布</h2>
                <p className="text-gray-600">210mm × 297mm</p>
                
                {/* 测试标记点 */}
                <div className="mt-4">
                  <div 
                    className="absolute w-2 h-2 bg-red-500 rounded-full"
                    style={{ left: 0, top: 0 }}
                    title="(0, 0)"
                  />
                  <div 
                    className="absolute w-2 h-2 bg-red-500 rounded-full"
                    style={{ left: 50 * MM_TO_PX - 4, top: 50 * MM_TO_PX - 4 }}
                    title="(50mm, 50mm)"
                  />
                  <div 
                    className="absolute w-2 h-2 bg-red-500 rounded-full"
                    style={{ left: 100 * MM_TO_PX - 4, top: 100 * MM_TO_PX - 4 }}
                    title="(100mm, 100mm)"
                  />
                </div>
              </div>
            </div>
            
            {/* 十字线 */}
            {showCrosshair && mousePosition && (
              <>
                <div 
                  className="absolute w-px bg-red-500 pointer-events-none opacity-50"
                  style={{
                    left: mousePosition.x - rulerThickness,
                    top: 0,
                    height: '100%',
                  }}
                />
                <div 
                  className="absolute h-px bg-red-500 pointer-events-none opacity-50"
                  style={{
                    left: 0,
                    top: mousePosition.y - rulerThickness,
                    width: '100%',
                  }}
                />
              </>
            )}
          </div>
        </div>
        
        {/* 使用说明 */}
        <div className="mt-4 text-sm text-gray-600">
          <p>• 滚动鼠标滚轮进行缩放</p>
          <p>• 移动鼠标查看坐标，红色标记点应该对应准确的刻度值</p>
          <p>• 观察控制台查看详细的调试信息</p>
        </div>
      </div>
    </div>
  );
};