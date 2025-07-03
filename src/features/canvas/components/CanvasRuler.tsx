/**
 * @deprecated 此组件已废弃，请使用 RulerCanvas 组件替代
 * 
 * 废弃原因：
 * 1. 这是早期的 Canvas 实现版本，功能不够完善
 * 2. 缺少性能优化（如 requestAnimationFrame、视口裁剪等）
 * 3. 不支持高 DPI 屏幕和动态刻度调整
 * 4. RulerCanvas 提供了更专业、更完整的实现
 * 
 * 迁移指南：
 * import { RulerCanvas } from './RulerCanvas';
 * 
 * @see RulerCanvas
 */

import React, { useRef, useEffect, useCallback } from 'react';
import type { RulerProps } from '../types/ruler.types';
import { DEFAULT_RULER_CONFIG } from '../types/ruler.types';
import { convertUnit, formatLabel } from '../utils/ruler.utils';

/**
 * Canvas-based ruler component（已废弃）
 * Inspired by @scena/react-ruler implementation
 */
export const CanvasRuler: React.FC<RulerProps> = (props) => {
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
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Calculate actual scale and offset
  const actualScale = viewport.scale * scale;
  const actualOffset = orientation === 'horizontal' 
    ? viewport.x + offset 
    : viewport.y + offset;

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

    // Set styles
    ctx.strokeStyle = tickColor;
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = orientation === 'horizontal' ? 'top' : 'middle';
    ctx.lineWidth = 1;

    // Calculate visible range
    const unitPx = convertUnit(1, unit, 'px');
    
    // Calculate the range of values that should be visible
    const minValue = -actualOffset / actualScale / unitPx;
    const maxValue = (-actualOffset + length) / actualScale / unitPx;
    
    // Determine tick intervals based on zoom
    let majorInterval = 10;
    let minorInterval = 1;
    
    if (actualScale > 2) {
      majorInterval = 5;
      minorInterval = 1;
    } else if (actualScale < 0.5) {
      majorInterval = 20;
      minorInterval = 5;
    }

    // Adjust intervals to ensure reasonable spacing
    while (minorInterval * unitPx * actualScale < 5) {
      minorInterval *= 2;
      majorInterval *= 2;
    }

    // Start from a rounded value
    const startValue = Math.floor(minValue / minorInterval) * minorInterval;
    const endValue = Math.ceil(maxValue / minorInterval) * minorInterval;

    // Draw ticks and labels
    ctx.beginPath();
    
    for (let value = startValue; value <= endValue; value += minorInterval) {
      // Calculate screen position
      const pos = (value * unitPx + actualOffset / actualScale) * actualScale;
      
      // Skip if outside visible area
      if (pos < 0 || pos > length) continue;
      
      const isMajor = Math.abs(value % majorInterval) < 0.0001;
      const tickLength = isMajor ? thickness : thickness * 0.6;
      
      // Draw tick
      if (orientation === 'horizontal') {
        ctx.moveTo(pos, isMajor ? 0 : thickness * 0.4);
        ctx.lineTo(pos, tickLength);
      } else {
        ctx.moveTo(isMajor ? 0 : thickness * 0.4, pos);
        ctx.lineTo(tickLength, pos);
      }
      
      // Draw label for major ticks
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

    // Draw border
    ctx.strokeStyle = tickColor;
    ctx.strokeRect(0, 0, length, thickness);

    // Draw mouse indicator
    if (mousePosition) {
      const mousePos = orientation === 'horizontal' ? mousePosition.x : mousePosition.y;
      
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      if (orientation === 'horizontal') {
        ctx.moveTo(mousePos, 0);
        ctx.lineTo(mousePos, thickness);
      } else {
        ctx.moveTo(0, mousePos);
        ctx.lineTo(thickness, mousePos);
      }
      
      ctx.stroke();
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

  // Handle click
  const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const position = orientation === 'horizontal'
      ? event.clientX - rect.left
      : event.clientY - rect.top;
    
    const unitPx = convertUnit(1, unit, 'px');
    const value = (position - actualOffset) / actualScale / unitPx;
    onClick(value);
  }, [orientation, actualScale, actualOffset, unit, onClick]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={handleClick}
      data-testid={`canvas-ruler-${orientation}`}
    />
  );
};