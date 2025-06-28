import React, { useMemo, useCallback } from 'react';
import type { RulerProps } from '../types/ruler.types';
import { DEFAULT_RULER_CONFIG } from '../types/ruler.types';
import { calculateTicks, getMouseValue, formatLabel } from '../utils/ruler.utils';

/**
 * 标尺组件
 * 用于显示画布的测量标尺
 */
export const Ruler: React.FC<RulerProps> = (props) => {
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

  // 计算实际的缩放和偏移
  const actualScale = viewport.scale * scale;
  const actualOffset = orientation === 'horizontal' 
    ? viewport.x + offset 
    : viewport.y + offset;

  // 计算刻度
  const ticks = useMemo(() => {
    return calculateTicks({
      length,
      scale: actualScale,
      offset: actualOffset,
      unit,
      minTickSpacing: 5,
    });
  }, [length, actualScale, actualOffset, unit]);

  // 处理点击事件
  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const position = orientation === 'horizontal'
      ? event.clientX - rect.left
      : event.clientY - rect.top;
    
    const value = getMouseValue(position, actualScale, actualOffset, unit);
    onClick(value);
  }, [orientation, actualScale, actualOffset, unit, onClick]);

  // 计算鼠标指示器位置
  const mouseIndicatorPosition = useMemo(() => {
    if (!mousePosition) return null;
    
    return orientation === 'horizontal'
      ? mousePosition.x
      : mousePosition.y;
  }, [orientation, mousePosition]);

  // 渲染样式
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: orientation === 'horizontal' ? length : thickness,
    height: orientation === 'horizontal' ? thickness : length,
    backgroundColor,
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    borderRight: orientation === 'vertical' ? `1px solid ${tickColor}` : undefined,
    borderBottom: orientation === 'horizontal' ? `1px solid ${tickColor}` : undefined,
  };

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      data-testid={`ruler-${orientation}`}
    >
      {/* 刻度线和标签 */}
      {ticks.map((tick, index) => {
        const tickStyle: React.CSSProperties = orientation === 'horizontal'
          ? {
              position: 'absolute',
              left: tick.position,
              top: tick.isMajor ? 0 : thickness * 0.5,
              width: 1,
              height: tick.isMajor ? thickness : thickness * 0.5,
              backgroundColor: tickColor,
            }
          : {
              position: 'absolute',
              top: tick.position,
              left: tick.isMajor ? 0 : thickness * 0.5,
              width: tick.isMajor ? thickness : thickness * 0.5,
              height: 1,
              backgroundColor: tickColor,
            };

        const labelStyle: React.CSSProperties = orientation === 'horizontal'
          ? {
              position: 'absolute',
              left: tick.position,
              top: 2,
              transform: 'translateX(-50%)',
              fontSize,
              color: textColor,
              whiteSpace: 'nowrap',
            }
          : {
              position: 'absolute',
              top: tick.position,
              left: 2,
              transform: 'translateY(-50%) rotate(-90deg)',
              transformOrigin: 'center',
              fontSize,
              color: textColor,
              whiteSpace: 'nowrap',
            };

        return (
          <React.Fragment key={index}>
            <div 
              style={tickStyle}
              data-testid={`tick-${tick.isMajor ? 'major' : 'minor'}-${index}`}
            />
            {tick.label && (
              <div 
                style={labelStyle}
                data-testid={`label-${index}`}
              >
                {tick.label}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* 鼠标位置指示器 */}
      {mouseIndicatorPosition !== null && (
        <div
          style={{
            position: 'absolute',
            ...(orientation === 'horizontal'
              ? {
                  left: mouseIndicatorPosition,
                  top: 0,
                  width: 1,
                  height: thickness,
                }
              : {
                  top: mouseIndicatorPosition,
                  left: 0,
                  width: thickness,
                  height: 1,
                }),
            backgroundColor: '#007bff',
            pointerEvents: 'none',
          }}
          data-testid="mouse-indicator"
        />
      )}

      {/* 当前值显示（可选） */}
      {mouseIndicatorPosition !== null && (
        <div
          style={{
            position: 'absolute',
            ...(orientation === 'horizontal'
              ? {
                  left: mouseIndicatorPosition,
                  bottom: -20,
                  transform: 'translateX(-50%)',
                }
              : {
                  top: mouseIndicatorPosition,
                  right: -40,
                  transform: 'translateY(-50%)',
                }),
            backgroundColor: 'rgba(0, 123, 255, 0.9)',
            color: 'white',
            padding: '2px 4px',
            borderRadius: 2,
            fontSize: fontSize - 2,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {formatLabel(
            getMouseValue(mouseIndicatorPosition, actualScale, actualOffset, unit),
            unit
          )}
          {unit}
        </div>
      )}
    </div>
  );
};