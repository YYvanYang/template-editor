import React, { useMemo, useCallback } from 'react';
import type { RulerProps } from '../types/ruler.types';
import { DEFAULT_RULER_CONFIG, UNIT_CONVERSIONS } from '../types/ruler.types';

/**
 * 修复后的标尺组件
 * 解决了单位转换、刻度显示和对齐问题
 */
export const RulerFixed: React.FC<RulerProps> = (props) => {
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

  // 计算刻度
  const ticks = useMemo(() => {
    const result = [];
    const unitConfig = UNIT_CONVERSIONS[unit];
    
    // 计算可见范围（像素值）
    const visibleStart = -viewport.x / viewport.scale;
    const visibleEnd = (length - viewport.x) / viewport.scale;
    
    // 转换为实际单位
    const startValue = visibleStart / unitConfig.toPx;
    const endValue = visibleEnd / unitConfig.toPx;
    
    // 根据缩放级别决定刻度间隔
    let step = 1; // 默认1mm
    let labelStep = 10; // 默认10mm显示标签
    
    if (unit === 'mm') {
      const pixelsPerMm = unitConfig.toPx * viewport.scale;
      
      if (pixelsPerMm < 3) {
        // 太小，只显示10mm刻度
        step = 10;
        labelStep = 10;
      } else if (pixelsPerMm < 6) {
        // 显示5mm刻度
        step = 5;
        labelStep = 10;
      } else {
        // 显示1mm刻度
        step = 1;
        labelStep = 10;
      }
    }
    
    // 对齐到步长
    const startTick = Math.floor(startValue / step) * step;
    
    // 生成刻度
    for (let value = startTick; value <= endValue + step; value += step) {
      const pixelPos = value * unitConfig.toPx;
      const screenPos = pixelPos * viewport.scale + viewport.x;
      
      // 跳过画面外的刻度
      if (screenPos < -50 || screenPos > length + 50) continue;
      
      const isMajor = value % 10 === 0;
      const showLabel = value % labelStep === 0;
      
      result.push({
        position: screenPos,
        value: value,
        label: showLabel ? value.toString() : undefined,
        isMajor,
      });
    }
    
    return result;
  }, [length, viewport, unit]);

  // 处理点击事件
  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickPos = orientation === 'horizontal'
      ? event.clientX - rect.left
      : event.clientY - rect.top;
    
    // 转换为画布坐标（毫米）
    const pixelPos = (clickPos - viewport.x) / viewport.scale;
    const value = pixelPos / UNIT_CONVERSIONS[unit].toPx;
    
    onClick(value);
  }, [onClick, orientation, viewport, unit]);

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
              top: tick.isMajor ? 0 : thickness * 0.6,
              width: 1,
              height: tick.isMajor ? thickness : thickness * 0.4,
              backgroundColor: tickColor,
            }
          : {
              position: 'absolute',
              top: tick.position,
              left: tick.isMajor ? 0 : thickness * 0.6,
              width: tick.isMajor ? thickness : thickness * 0.4,
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
            <div style={tickStyle} />
            {tick.label && (
              <div style={labelStyle}>
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
                  transform: 'translateX(-0.5px)',
                }
              : {
                  top: mouseIndicatorPosition,
                  left: 0,
                  width: thickness,
                  height: 1,
                  transform: 'translateY(-0.5px)',
                }),
            backgroundColor: '#3B82F6',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 鼠标位置数值 */}
      {mouseIndicatorPosition !== null && (
        <div
          style={{
            position: 'absolute',
            ...(orientation === 'horizontal'
              ? {
                  left: mouseIndicatorPosition,
                  bottom: 2,
                  transform: 'translateX(-50%)',
                }
              : {
                  top: mouseIndicatorPosition,
                  right: 2,
                  transform: 'translateY(-50%) rotate(-90deg)',
                  transformOrigin: 'center',
                }),
            fontSize: fontSize - 1,
            color: '#3B82F6',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '0 2px',
            borderRadius: 2,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {Math.round((mouseIndicatorPosition - viewport.x) / viewport.scale / UNIT_CONVERSIONS[unit].toPx)}
        </div>
      )}
    </div>
  );
};