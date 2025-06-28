import React, { useRef, useEffect, useCallback } from 'react';
import Ruler from '@scena/react-ruler';
import type { RulerProps as OurRulerProps } from '../types/ruler.types';
import { DEFAULT_RULER_CONFIG } from '../types/ruler.types';
import { convertUnit } from '../utils/ruler.utils';

/**
 * Wrapper for @scena/react-ruler to match our interface
 */
export const ScenaRulerWrapper: React.FC<OurRulerProps> = (props) => {
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
    canvasSize,
    viewport,
    mousePosition,
    onClick,
  } = props;

  const rulerRef = useRef<any>(null);

  // Calculate unit size and zoom based on unit type
  // According to @scena/react-ruler docs:
  // - unit: defines interval between lines  
  // - zoom: scales the ruler's measurement
  // - For 1cm = 37.7952px, use zoom: 37.7952, unit: 1
  
  let unitSize = 50; // Default unit size for pixels
  let zoom = viewport.scale;
  let scrollPos = -(viewport.x + offset); // Default scroll position in pixels

  // Adjust for different units
  if (unit === 'mm') {
    // For mm: 1mm = 3.7795275591px
    // We want major lines every 10mm, minor lines every 1mm
    unitSize = 10; // Major line every 10mm
    zoom = viewport.scale * convertUnit(1, 'mm', 'px'); // 3.7795275591 * scale
    // Convert scroll position from pixels to mm
    scrollPos = -(viewport.x + offset) / convertUnit(1, 'mm', 'px');
  } else if (unit === 'cm') {
    // For cm: 1cm = 37.795275591px  
    // We want major lines every 1cm, minor lines every 0.1cm
    unitSize = 1; // Major line every 1cm
    zoom = viewport.scale * convertUnit(1, 'cm', 'px'); // 37.795275591 * scale
    // Convert scroll position from pixels to cm
    scrollPos = -(viewport.x + offset) / convertUnit(1, 'cm', 'px');
  }

  // Update scroll position when viewport changes
  useEffect(() => {
    if (rulerRef.current) {
      rulerRef.current.scroll(scrollPos, zoom);
    }
  }, [scrollPos, zoom]);

  // Handle resize
  useEffect(() => {
    if (rulerRef.current) {
      rulerRef.current.resize();
    }
  }, [length, thickness]);


  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!onClick) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const position = orientation === 'horizontal'
      ? e.clientX - rect.left
      : e.clientY - rect.top;
    
    const value = (position + scrollPos) / zoom / convertUnit(1, unit, 'px');
    onClick(value);
  }, [orientation, scrollPos, zoom, unit, onClick]);

  // Format text to show unit values instead of pixel values
  const textFormat = useCallback((value: number) => {
    if (unit === 'px') {
      return Math.round(value).toString();
    }
    // For mm/cm, the value is already in the correct unit
    return value.toString();
  }, [unit]);

  return (
    <div onClick={handleClick} style={{ 
      cursor: onClick ? 'pointer' : 'default',
      width: '100%',
      height: '100%',
      overflow: 'visible',
    }}>
      <Ruler
        ref={rulerRef}
        type={orientation}
        width={orientation === 'horizontal' ? length : thickness}
        height={orientation === 'horizontal' ? thickness : length}
        unit={unitSize}
        zoom={zoom}
        direction="end"
        style={{
          display: 'block',
          width: orientation === 'horizontal' ? length : thickness,
          height: orientation === 'horizontal' ? thickness : length,
        }}
        backgroundColor={backgroundColor}
        lineColor={tickColor}
        textColor={textColor}
        font={`${fontSize}px sans-serif`}
        negativeRuler={true}
        textAlign="center"
        segment={10}
        mainLineSize="100%"
        longLineSize={10}
        shortLineSize={7}
        lineWidth={1}
        defaultScrollPos={scrollPos}
        textFormat={textFormat}
        useResizeObserver={true}
      />
    </div>
  );
};