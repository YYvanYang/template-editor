import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import type { RulerProps } from '../types/ruler.types';
import { DEFAULT_RULER_CONFIG, UNIT_CONVERSIONS } from '../types/ruler.types';

/**
 * 基于 Canvas 的专业标尺组件
 * 提供高性能、高精度的标尺渲染
 */
export const RulerCanvas: React.FC<RulerProps> = (props) => {
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number>();

  // 获取设备像素比
  const devicePixelRatio = window.devicePixelRatio || 1;

  // 计算画布实际尺寸
  const canvasWidth = orientation === 'horizontal' ? length : thickness;
  const canvasHeight = orientation === 'horizontal' ? thickness : length;

  // 初始化 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // 设置画布尺寸（考虑设备像素比）
    canvas.width = canvasWidth * devicePixelRatio;
    canvas.height = canvasHeight * devicePixelRatio;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    // 缩放上下文以适应设备像素比
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    contextRef.current = ctx;
  }, [canvasWidth, canvasHeight, devicePixelRatio]);

  // 计算刻度参数
  const tickParams = useMemo(() => {
    const unitConfig = UNIT_CONVERSIONS[unit];
    const pixelsPerUnit = unitConfig.toPx * viewport.scale;
    
    // 动态计算刻度间隔
    let minorInterval = unitConfig.minorInterval;
    let majorInterval = unitConfig.majorInterval;
    let subMinorInterval = 0; // 更小的刻度（如0.5mm）
    
    if (unit === 'mm') {
      if (pixelsPerUnit >= 15) {
        // 非常大的缩放，显示0.5mm刻度
        subMinorInterval = 0.5;
        minorInterval = 1;
        majorInterval = 10;
      } else if (pixelsPerUnit >= 7.5) {
        // 大缩放，显示1mm刻度
        minorInterval = 1;
        majorInterval = 10;
      } else if (pixelsPerUnit >= 3) {
        // 中等缩放，显示5mm刻度
        minorInterval = 5;
        majorInterval = 10;
      } else if (pixelsPerUnit >= 1.5) {
        // 小缩放，显示10mm刻度
        minorInterval = 10;
        majorInterval = 50;
      } else {
        // 极小缩放，显示50mm刻度
        minorInterval = 50;
        majorInterval = 100;
      }
    }
    
    return {
      unitConfig,
      pixelsPerUnit,
      minorInterval,
      majorInterval,
      subMinorInterval,
    };
  }, [unit, viewport.scale]);

  // 渲染标尺
  const render = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // 清空画布
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 设置字体
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // 计算可见范围
    // viewport.x/y 是画布在屏幕上的偏移（正值表示画布向右/下移动）
    // 所以当画布向右移动时，标尺应该显示更小的值（负偏移）
    const viewportOffset = orientation === 'horizontal' ? viewport.x : viewport.y;
    const startPixel = -viewportOffset;
    const endPixel = (orientation === 'horizontal' ? canvasWidth : canvasHeight) - viewportOffset;
    const startUnit = startPixel / (tickParams.unitConfig.toPx * viewport.scale);
    const endUnit = endPixel / (tickParams.unitConfig.toPx * viewport.scale);

    // 绘制刻度线和标签
    const drawTick = (value: number, height: number, drawLabel: boolean) => {
      // 将单位值转换为屏幕像素位置
      // value: 单位值（如 10mm）
      // 公式：单位值 * 像素/单位 * 缩放 + 视口偏移
      const viewportOffset = orientation === 'horizontal' ? viewport.x : viewport.y;
      const pixelPos = value * tickParams.unitConfig.toPx * viewport.scale + viewportOffset;
      
      // 跳过不可见的刻度
      const maxPos = orientation === 'horizontal' ? canvasWidth : canvasHeight;
      if (pixelPos < -50 || pixelPos > maxPos + 50) return;

      ctx.strokeStyle = tickColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      if (orientation === 'horizontal') {
        ctx.moveTo(pixelPos + 0.5, canvasHeight - height);
        ctx.lineTo(pixelPos + 0.5, canvasHeight);
      } else {
        ctx.moveTo(canvasWidth - height, pixelPos + 0.5);
        ctx.lineTo(canvasWidth, pixelPos + 0.5);
      }
      
      ctx.stroke();

      // 绘制标签
      if (drawLabel) {
        ctx.fillStyle = textColor;
        const label = Math.round(value).toString();
        
        if (orientation === 'horizontal') {
          ctx.fillText(label, pixelPos, 2);
        } else {
          // 垂直标尺的文字需要旋转
          ctx.save();
          ctx.translate(10, pixelPos); // 增加左边距，避免被遮挡
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
      }
    };

    // 绘制子刻度（最小刻度）
    if (tickParams.subMinorInterval > 0) {
      const start = Math.floor(startUnit / tickParams.subMinorInterval) * tickParams.subMinorInterval;
      for (let value = start; value <= endUnit; value += tickParams.subMinorInterval) {
        if (value % tickParams.minorInterval !== 0) {
          drawTick(value, thickness * 0.3, false);
        }
      }
    }

    // 绘制次要刻度
    const minorStart = Math.floor(startUnit / tickParams.minorInterval) * tickParams.minorInterval;
    for (let value = minorStart; value <= endUnit; value += tickParams.minorInterval) {
      if (value % tickParams.majorInterval !== 0) {
        drawTick(value, thickness * 0.5, false);
      }
    }

    // 绘制主要刻度和标签
    const majorStart = Math.floor(startUnit / tickParams.majorInterval) * tickParams.majorInterval;
    for (let value = majorStart; value <= endUnit; value += tickParams.majorInterval) {
      drawTick(value, thickness, true);
    }

    // 绘制边框
    ctx.strokeStyle = tickColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvasWidth - 1, canvasHeight - 1);

    // 绘制鼠标指示器
    if (mousePosition) {
      // mousePosition 是相对于画布容器的坐标
      // 需要转换为标尺上的位置
      const mousePos = orientation === 'horizontal' ? mousePosition.x : mousePosition.y;
      
      // 绘制指示线
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      if (orientation === 'horizontal') {
        ctx.moveTo(mousePos + 0.5, 0);
        ctx.lineTo(mousePos + 0.5, canvasHeight);
      } else {
        ctx.moveTo(0, mousePos + 0.5);
        ctx.lineTo(canvasWidth, mousePos + 0.5);
      }
      
      ctx.stroke();

      // 绘制数值标签
      // mousePos 是相对于画布容器的坐标（已经是相对于画布左上角的位置）
      // 直接转换为画布坐标系中的像素值
      const canvasPixelValue = mousePos / viewport.scale;
      // 从像素转换为单位值
      const unitValue = canvasPixelValue / tickParams.unitConfig.toPx;
      const label = `${unitValue.toFixed(1)}${unit}`;

      ctx.fillStyle = '#007bff';
      ctx.fillRect(
        orientation === 'horizontal' ? mousePos - 20 : canvasWidth - 40,
        orientation === 'horizontal' ? canvasHeight - 15 : mousePos - 10,
        40,
        15
      );

      ctx.fillStyle = 'white';
      ctx.font = `${fontSize - 1}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (orientation === 'horizontal') {
        ctx.fillText(label, mousePos, canvasHeight - 7.5);
      } else {
        ctx.save();
        ctx.translate(canvasWidth - 20, mousePos);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    }
  }, [
    orientation,
    canvasWidth,
    canvasHeight,
    thickness,
    backgroundColor,
    textColor,
    tickColor,
    fontSize,
    viewport,
    mousePosition,
    tickParams,
    unit,
  ]);

  // 使用 requestAnimationFrame 进行渲染
  useEffect(() => {
    const renderFrame = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };
    
    renderFrame();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // 处理点击事件
  const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickPos = orientation === 'horizontal'
      ? event.clientX - rect.left
      : event.clientY - rect.top;
    
    const pixelValue = (clickPos - (orientation === 'horizontal' ? viewport.x : viewport.y)) / viewport.scale;
    const unitValue = pixelValue / UNIT_CONVERSIONS[unit].toPx;
    
    onClick(unitValue);
  }, [onClick, orientation, viewport, unit]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={handleClick}
      data-testid={`ruler-canvas-${orientation}`}
    />
  );
};