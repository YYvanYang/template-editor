import React, { useRef, useEffect, useState, useCallback } from 'react';
import Guides from '@scena/react-guides';
import { Canvas } from './Canvas';
import { useEditorStore } from '@/features/editor/stores/editor.store';
import type { Point } from '../types/canvas.types';

interface CanvasWithGuidesProps {
  showRulers?: boolean;
  unit?: 'mm' | 'cm' | 'px';
}

const MM_TO_PX = 3.7795275591; // 1mm = 3.7795275591px at 96 DPI

export const CanvasWithGuides: React.FC<CanvasWithGuidesProps> = ({ 
  showRulers = true,
  unit = 'mm'
}) => {
  const { canvas, template } = useEditorStore();
  const horizontalGuidesRef = useRef<any>(null);
  const verticalGuidesRef = useRef<any>(null);
  const [horizontalGuides, setHorizontalGuides] = useState<number[]>([]);
  const [verticalGuides, setVerticalGuides] = useState<number[]>([]);
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

  // Calculate zoom and unit based on unit type
  let zoom = canvas.zoom;
  let unitSize = 50;
  
  if (unit === 'mm') {
    // For mm: we want the ruler to show mm values
    // 1mm in ruler = 3.7795275591px on screen
    zoom = canvas.zoom * MM_TO_PX;
    unitSize = 10; // Show marks every 10mm
  } else if (unit === 'cm') {
    // For cm: 1cm = 10mm = 37.795275591px
    zoom = canvas.zoom * MM_TO_PX * 10;
    unitSize = 1; // Show marks every 1cm
  }

  // Update scroll when canvas offset changes
  useEffect(() => {
    if (horizontalGuidesRef.current) {
      // For horizontal ruler, we scroll based on X offset
      const scrollPos = -canvas.offset.x / MM_TO_PX;
      horizontalGuidesRef.current.scrollGuides(scrollPos);
      horizontalGuidesRef.current.scroll(scrollPos);
    }
    if (verticalGuidesRef.current) {
      // For vertical ruler, we scroll based on Y offset
      const scrollPos = -canvas.offset.y / MM_TO_PX;
      verticalGuidesRef.current.scrollGuides(scrollPos);
      verticalGuidesRef.current.scroll(scrollPos);
    }
  }, [canvas.offset]);

  const rulerThickness = 30;

  if (!showRulers) {
    return <Canvas />;
  }

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
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

      {/* Horizontal Ruler Container */}
      <div 
        className="absolute z-10 bg-slate-800"
        style={{
          left: rulerThickness,
          top: 0,
          width: containerSize.width - rulerThickness,
          height: rulerThickness,
        }}
      >
        <Guides
          ref={horizontalGuidesRef}
          type="horizontal"
          width={containerSize.width - rulerThickness}
          height={containerSize.height}
          unit={unitSize}
          zoom={zoom}
          direction="end"
          rulerStyle={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: rulerThickness,
          }}
          displayDragPos
          dragPosFormat={(value: number) => {
            if (unit === 'mm') {
              return `${Math.round(value)}mm`;
            } else if (unit === 'cm') {
              return `${(value / 10).toFixed(1)}cm`;
            }
            return `${Math.round(value)}px`;
          }}
          backgroundColor="#333333"
          lineColor="#777777"
          textColor="#ffffff"
          guides={horizontalGuides}
          onChangeGuides={(e: any) => {
            console.log('Horizontal guides changed:', e.guides);
            setHorizontalGuides(e.guides);
          }}
          useResizeObserver={true}
          textFormat={(scale: number) => {
            // Format the ruler labels
            return scale.toString();
          }}
          font="10px sans-serif"
          segment={10}
          mainLineSize="100%"
          longLineSize={10}
          shortLineSize={7}
        />
      </div>

      {/* Vertical Ruler Container */}
      <div 
        className="absolute z-10 bg-slate-800"
        style={{
          left: 0,
          top: rulerThickness,
          width: rulerThickness,
          height: containerSize.height - rulerThickness,
        }}
      >
        <Guides
          ref={verticalGuidesRef}
          type="vertical"
          width={containerSize.width}
          height={containerSize.height - rulerThickness}
          unit={unitSize}
          zoom={zoom}
          direction="end"
          rulerStyle={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: rulerThickness,
            height: '100%',
          }}
          displayDragPos
          dragPosFormat={(value: number) => {
            if (unit === 'mm') {
              return `${Math.round(value)}mm`;
            } else if (unit === 'cm') {
              return `${(value / 10).toFixed(1)}cm`;
            }
            return `${Math.round(value)}px`;
          }}
          backgroundColor="#333333"
          lineColor="#777777"
          textColor="#ffffff"
          guides={verticalGuides}
          onChangeGuides={(e: any) => {
            console.log('Vertical guides changed:', e.guides);
            setVerticalGuides(e.guides);
          }}
          useResizeObserver={true}
          textFormat={(scale: number) => {
            // Format the ruler labels
            return scale.toString();
          }}
          font="10px sans-serif"
          segment={10}
          mainLineSize="100%"
          longLineSize={10}
          shortLineSize={7}
        />
      </div>

      {/* Canvas Container */}
      <div 
        className="absolute overflow-hidden"
        style={{
          left: rulerThickness,
          top: rulerThickness,
          right: 0,
          bottom: 0,
        }}
      >
        <div className="relative w-full h-full">
          <Canvas />
          
          {/* Render horizontal guidelines over canvas */}
          {horizontalGuides.map((pos, index) => (
            <div
              key={`h-guide-${index}`}
              className="absolute w-full pointer-events-none"
              style={{
                height: 1,
                backgroundColor: '#00bcd4',
                top: pos * zoom + canvas.offset.y,
                left: 0,
              }}
            />
          ))}
          
          {/* Render vertical guidelines over canvas */}
          {verticalGuides.map((pos, index) => (
            <div
              key={`v-guide-${index}`}
              className="absolute h-full pointer-events-none"
              style={{
                width: 1,
                backgroundColor: '#00bcd4',
                left: pos * zoom + canvas.offset.x,
                top: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};