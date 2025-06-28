import React, { useCallback, useState, useEffect } from 'react';
import { Canvas } from './Canvas';
import { CanvasRuler } from './CanvasRuler';
import { useEditorStore } from '@/features/editor/stores/editor.store';
import type { Point } from '../types/canvas.types';

interface CanvasWithCanvasRulersProps {
  showRulers?: boolean;
}

const MM_TO_PX = 3.7795275591; // 1mm = 3.7795275591px at 96 DPI

export const CanvasWithCanvasRulers: React.FC<CanvasWithCanvasRulersProps> = ({ 
  showRulers = true 
}) => {
  const { canvas, template } = useEditorStore();
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Get container size
  useEffect(() => {
    const updateSize = () => {
      setContainerSize({
        width: window.innerWidth - 400, // Subtract sidebars
        height: window.innerHeight - 60, // Subtract header
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle mouse move
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

  // Convert template size from mm to px
  const canvasSize = {
    width: template.size.width * MM_TO_PX,
    height: template.size.height * MM_TO_PX,
  };

  // Calculate viewport info for rulers
  const viewport = {
    x: -canvas.offset.x,
    y: -canvas.offset.y,
    scale: canvas.zoom,
  };

  const rulerThickness = 30;

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      {showRulers && (
        <>
          {/* Corner */}
          <div 
            className="absolute z-20 bg-slate-800 border-r border-b border-slate-600"
            style={{
              width: rulerThickness,
              height: rulerThickness,
              left: 0,
              top: 0,
            }}
          />

          {/* Horizontal Ruler */}
          <div 
            className="absolute z-10"
            style={{
              left: rulerThickness,
              top: 0,
              width: containerSize.width - rulerThickness,
              height: rulerThickness,
            }}
          >
            <CanvasRuler
              orientation="horizontal"
              length={containerSize.width - rulerThickness}
              thickness={rulerThickness}
              unit="mm"
              scale={1}
              offset={0}
              canvasSize={canvasSize}
              viewport={viewport}
              mousePosition={mousePosition ? { x: mousePosition.x - rulerThickness, y: 0 } : undefined}
            />
          </div>

          {/* Vertical Ruler */}
          <div 
            className="absolute z-10"
            style={{
              left: 0,
              top: rulerThickness,
              width: rulerThickness,
              height: containerSize.height - rulerThickness,
            }}
          >
            <CanvasRuler
              orientation="vertical"
              length={containerSize.height - rulerThickness}
              thickness={rulerThickness}
              unit="mm"
              scale={1}
              offset={0}
              canvasSize={canvasSize}
              viewport={viewport}
              mousePosition={mousePosition ? { x: 0, y: mousePosition.y - rulerThickness } : undefined}
            />
          </div>
        </>
      )}

      {/* Canvas Container */}
      <div 
        className="absolute overflow-auto"
        style={{
          left: showRulers ? rulerThickness : 0,
          top: showRulers ? rulerThickness : 0,
          right: 0,
          bottom: 0,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Canvas />
      </div>
    </div>
  );
};