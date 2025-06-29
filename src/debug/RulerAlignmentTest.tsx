import React, { useState, useCallback } from 'react';
import { RulerCanvas } from '@/features/canvas/components/RulerCanvas';

/**
 * 标尺对齐测试组件
 * 用于验证鼠标位置与刻度的对齐
 */
export const RulerAlignmentTest: React.FC = () => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  
  const rulerThickness = 30;
  const containerWidth = 800;
  const containerHeight = 600;
  
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
  
  const handlePan = useCallback((dx: number, dy: number) => {
    setViewport(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-100 p-8">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">标尺对齐测试</h1>
        
        <div className="mb-4 flex gap-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}
          >
            重置视图
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => handlePan(50, 0)}
          >
            向右平移
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => handlePan(-50, 0)}
          >
            向左平移
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => handlePan(0, 50)}
          >
            向下平移
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => handlePan(0, -50)}
          >
            向上平移
          </button>
        </div>
        
        <div className="mb-4 text-sm">
          <p>视口：x={viewport.x.toFixed(2)}, y={viewport.y.toFixed(2)}, scale={viewport.scale.toFixed(2)}</p>
          <p>鼠标：{mousePosition ? `x=${mousePosition.x.toFixed(0)}, y=${mousePosition.y.toFixed(0)}` : '移动鼠标查看坐标'}</p>
        </div>
        
        <div 
          className="relative border border-gray-300"
          style={{ width: containerWidth, height: containerHeight }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        >
          {/* 角落 */}
          <div 
            className="absolute bg-gray-700 z-20"
            style={{
              width: rulerThickness,
              height: rulerThickness,
              left: 0,
              top: 0,
            }}
          />
          
          {/* 水平标尺 */}
          <div 
            className="absolute z-10"
            style={{
              left: rulerThickness,
              top: 0,
              width: containerWidth - rulerThickness,
              height: rulerThickness,
            }}
          >
            <RulerCanvas
              orientation="horizontal"
              length={containerWidth - rulerThickness}
              thickness={rulerThickness}
              unit="mm"
              viewport={viewport}
              mousePosition={mousePosition ? { x: mousePosition.x - rulerThickness, y: 0 } : undefined}
            />
          </div>
          
          {/* 垂直标尺 */}
          <div 
            className="absolute z-10"
            style={{
              left: 0,
              top: rulerThickness,
              width: rulerThickness,
              height: containerHeight - rulerThickness,
            }}
          >
            <RulerCanvas
              orientation="vertical"
              length={containerHeight - rulerThickness}
              thickness={rulerThickness}
              unit="mm"
              viewport={viewport}
              mousePosition={mousePosition ? { x: 0, y: mousePosition.y - rulerThickness } : undefined}
            />
          </div>
          
          {/* 画布区域 */}
          <div 
            className="absolute bg-white overflow-hidden"
            style={{
              left: rulerThickness,
              top: rulerThickness,
              right: 0,
              bottom: 0,
            }}
          >
            {/* 网格背景 */}
            <div 
              className="absolute"
              style={{
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `
                  repeating-linear-gradient(0deg, #f0f0f0 0px, transparent 1px, transparent ${10 * viewport.scale}px, #f0f0f0 ${10 * viewport.scale + 1}px),
                  repeating-linear-gradient(90deg, #f0f0f0 0px, transparent 1px, transparent ${10 * viewport.scale}px, #f0f0f0 ${10 * viewport.scale + 1}px)
                `,
                backgroundPosition: `${viewport.x}px ${viewport.y}px`,
              }}
            />
            
            {/* 模拟画布 */}
            <div 
              className="absolute bg-white border-2 border-blue-500 shadow-lg"
              style={{
                left: viewport.x,
                top: viewport.y,
                width: 210 * 3.7795275591 * viewport.scale, // A4 width in px
                height: 297 * 3.7795275591 * viewport.scale, // A4 height in px
              }}
            >
              <div className="p-4">
                <h2 className="text-lg font-bold">A4 画布 (210mm × 297mm)</h2>
                <p className="text-sm text-gray-600">鼠标悬停在标尺上查看坐标</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};