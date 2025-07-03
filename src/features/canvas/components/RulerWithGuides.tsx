import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAlignment } from '../hooks/useAlignment';
import type { RulerProps } from '../types/ruler.types';
import { DEFAULT_RULER_CONFIG } from '../types/ruler.types';
import { convertUnit, formatLabel } from '../utils/ruler.utils';

interface RulerWithGuidesProps extends RulerProps {
  onCreateGuide?: (position: number, orientation: 'horizontal' | 'vertical') => void;
  guides?: Array<{ id: string; position: number }>;
}

/**
 * 增强的标尺组件，支持拖拽创建辅助线
 * 提供专业级的交互体验
 */
export const RulerWithGuides: React.FC<RulerWithGuidesProps> = (props) => {
  const {
    orientation,
    length,
    thickness = DEFAULT_RULER_CONFIG.thickness!,
    unit = DEFAULT_RULER_CONFIG.unit!,
    scale = DEFAULT_RULER_CONFIG.scale!,
    offset = DEFAULT_RULER_CONFIG.offset!,
    backgroundColor = DEFAULT_RULER_CONFIG.backgroundColor!,
    textColor = DEFAULT_RULER_CONFIG.textColor!,
    tickColor = DEFAULT_RULER_CONFIG.tickColor!,
    fontSize = DEFAULT_RULER_CONFIG.fontSize!,
    viewport,
    mousePosition,
    onClick,
    onCreateGuide,
    guides = [],
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const dragGhostRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const [hoveredGuide, setHoveredGuide] = useState<string | null>(null);
  
  const alignment = useAlignment();

  // Calculate actual scale and offset
  const actualScale = viewport.scale * scale;
  const actualOffset = orientation === 'horizontal' 
    ? viewport.x + offset 
    : viewport.y + offset;

  // Convert screen position to ruler value
  const screenToRulerValue = useCallback((screenPos: number) => {
    const unitPx = convertUnit(1, unit, 'px');
    return (screenPos - actualOffset) / actualScale / unitPx;
  }, [actualOffset, actualScale, unit]);

  // Convert ruler value to screen position
  const rulerValueToScreen = useCallback((value: number) => {
    const unitPx = convertUnit(1, unit, 'px');
    return (value * unitPx + actualOffset / actualScale) * actualScale;
  }, [actualOffset, actualScale, unit]);

  // Draw ruler
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = length * dpr;
    canvas.height = thickness * dpr;
    canvas.style.width = `${length}px`;
    canvas.style.height = `${thickness}px`;
    
    // Scale for device pixel ratio
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, length, thickness);

    // Set background
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, length, thickness);
    }

    // Draw ticks and labels (same as before)
    ctx.strokeStyle = tickColor;
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = orientation === 'horizontal' ? 'top' : 'middle';
    ctx.lineWidth = 1;

    // Calculate visible range
    const unitPx = convertUnit(1, unit, 'px');
    
    const minValue = -actualOffset / actualScale / unitPx;
    const maxValue = (-actualOffset + length) / actualScale / unitPx;
    
    // Determine tick intervals
    let majorInterval = 10;
    let minorInterval = 1;
    
    if (actualScale > 2) {
      majorInterval = 5;
      minorInterval = 1;
    } else if (actualScale < 0.5) {
      majorInterval = 20;
      minorInterval = 5;
    }

    while (minorInterval * unitPx * actualScale < 5) {
      minorInterval *= 2;
      majorInterval *= 2;
    }

    const startValue = Math.floor(minValue / minorInterval) * minorInterval;
    const endValue = Math.ceil(maxValue / minorInterval) * minorInterval;

    // Draw ticks
    ctx.beginPath();
    
    for (let value = startValue; value <= endValue; value += minorInterval) {
      const pos = rulerValueToScreen(value);
      
      if (pos < 0 || pos > length) continue;
      
      const isMajor = Math.abs(value % majorInterval) < 0.0001;
      const tickLength = isMajor ? thickness : thickness * 0.6;
      
      if (orientation === 'horizontal') {
        ctx.moveTo(pos, isMajor ? 0 : thickness * 0.4);
        ctx.lineTo(pos, tickLength);
      } else {
        ctx.moveTo(isMajor ? 0 : thickness * 0.4, pos);
        ctx.lineTo(tickLength, pos);
      }
      
      if (isMajor) {
        ctx.save();
        const label = formatLabel(value, unit);
        
        if (orientation === 'horizontal') {
          ctx.fillText(label, pos, 2);
        } else {
          ctx.translate(thickness / 2, pos);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(label, 0, 0);
        }
        ctx.restore();
      }
    }
    
    ctx.stroke();

    // Draw guides indicators
    guides.forEach(guide => {
      const pos = rulerValueToScreen(guide.position);
      if (pos < 0 || pos > length) return;

      ctx.save();
      ctx.strokeStyle = hoveredGuide === guide.id ? '#0066cc' : '#3B82F6';
      ctx.lineWidth = hoveredGuide === guide.id ? 2 : 1;
      ctx.fillStyle = hoveredGuide === guide.id ? '#0066cc' : '#3B82F6';
      
      // Draw guide indicator
      ctx.beginPath();
      if (orientation === 'horizontal') {
        // Triangle pointing down
        ctx.moveTo(pos - 4, 0);
        ctx.lineTo(pos + 4, 0);
        ctx.lineTo(pos, 8);
        ctx.closePath();
      } else {
        // Triangle pointing right
        ctx.moveTo(0, pos - 4);
        ctx.lineTo(0, pos + 4);
        ctx.lineTo(8, pos);
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    });

    // Draw border
    ctx.strokeStyle = tickColor;
    ctx.strokeRect(0, 0, length, thickness);

    // Draw mouse indicator
    if (mousePosition && !isDragging) {
      const mousePos = orientation === 'horizontal' ? mousePosition.x : mousePosition.y;
      
      ctx.save();
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      
      if (orientation === 'horizontal') {
        ctx.moveTo(mousePos, 0);
        ctx.lineTo(mousePos, thickness);
      } else {
        ctx.moveTo(0, mousePos);
        ctx.lineTo(thickness, mousePos);
      }
      
      ctx.stroke();
      ctx.restore();
    }

    // Draw drag preview
    if (isDragging && dragPosition !== null) {
      ctx.save();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#10B981';
      
      ctx.beginPath();
      if (orientation === 'horizontal') {
        ctx.moveTo(dragPosition - 5, 0);
        ctx.lineTo(dragPosition + 5, 0);
        ctx.lineTo(dragPosition, 10);
        ctx.closePath();
      } else {
        ctx.moveTo(0, dragPosition - 5);
        ctx.lineTo(0, dragPosition + 5);
        ctx.lineTo(10, dragPosition);
        ctx.closePath();
      }
      ctx.fill();
      
      // Draw value label
      const value = screenToRulerValue(dragPosition);
      const label = formatLabel(Math.round(value), unit);
      ctx.fillStyle = '#10B981';
      ctx.font = `bold ${fontSize}px sans-serif`;
      
      if (orientation === 'horizontal') {
        ctx.fillText(label, dragPosition, thickness - 5);
      } else {
        ctx.save();
        ctx.translate(thickness - 5, dragPosition);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
      
      ctx.restore();
    }
  }, [
    orientation,
    length,
    thickness,
    unit,
    actualScale,
    actualOffset,
    backgroundColor,
    textColor,
    tickColor,
    fontSize,
    mousePosition,
    isDragging,
    dragPosition,
    guides,
    hoveredGuide,
    rulerValueToScreen,
    screenToRulerValue,
  ]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    contextRef.current = ctx;
    draw();
  }, [draw]);

  // Handle mouse down (start drag)
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCreateGuide) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const position = orientation === 'horizontal'
      ? event.clientX - rect.left
      : event.clientY - rect.top;

    // Check if clicking on existing guide
    const clickedGuide = guides.find(guide => {
      const guidePos = rulerValueToScreen(guide.position);
      return Math.abs(guidePos - position) < 10;
    });

    if (clickedGuide) {
      // TODO: Handle guide manipulation
      return;
    }

    // Start dragging new guide
    setIsDragging(true);
    setDragPosition(position);
    
    // Set cursor
    document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
  }, [orientation, guides, rulerValueToScreen, onCreateGuide]);

  // Handle mouse move
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = orientation === 'horizontal'
      ? event.clientX - rect.left
      : event.clientY - rect.top;

    // Check hover on guides
    const hoveredGuideId = guides.find(guide => {
      const guidePos = rulerValueToScreen(guide.position);
      return Math.abs(guidePos - position) < 10;
    })?.id || null;

    setHoveredGuide(hoveredGuideId);

    if (isDragging) {
      setDragPosition(position);
    }
  }, [orientation, isDragging, guides, rulerValueToScreen]);

  // Handle mouse up (end drag)
  const handleMouseUp = useCallback((_event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !onCreateGuide || dragPosition === null) return;

    const value = screenToRulerValue(dragPosition);
    
    // Snap to nice values
    const snappedValue = Math.round(value);
    
    // Create guide
    alignment.addManualGuide({
      orientation: orientation === 'horizontal' ? 'vertical' : 'horizontal',
      position: snappedValue * convertUnit(1, unit, 'px'),
      type: 'manual',
      visible: true,
    });

    // Reset drag state
    setIsDragging(false);
    setDragPosition(null);
    document.body.style.cursor = 'default';
  }, [isDragging, dragPosition, orientation, unit, onCreateGuide, screenToRulerValue, alignment]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragPosition(null);
      document.body.style.cursor = 'default';
    }
    setHoveredGuide(null);
  }, [isDragging]);

  // Handle click
  const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick || isDragging) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const position = orientation === 'horizontal'
      ? event.clientX - rect.left
      : event.clientY - rect.top;
    
    const value = screenToRulerValue(position);
    onClick(value);
  }, [orientation, isDragging, onClick, screenToRulerValue]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          cursor: isDragging 
            ? (orientation === 'horizontal' ? 'col-resize' : 'row-resize')
            : hoveredGuide ? 'pointer' : 'crosshair',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        data-testid={`ruler-with-guides-${orientation}`}
      />
      
      {/* Drag ghost line */}
      {isDragging && dragPosition !== null && (
        <div
          ref={dragGhostRef}
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 9999,
            ...(orientation === 'horizontal' ? {
              left: dragPosition,
              top: thickness,
              width: 1,
              height: '100vh',
              background: 'linear-gradient(180deg, #10B981 0%, rgba(16, 185, 129, 0.5) 50%, rgba(16, 185, 129, 0) 100%)',
            } : {
              top: dragPosition,
              left: thickness,
              height: 1,
              width: '100vw',
              background: 'linear-gradient(90deg, #10B981 0%, rgba(16, 185, 129, 0.5) 50%, rgba(16, 185, 129, 0) 100%)',
            }),
          }}
        />
      )}
    </>
  );
};