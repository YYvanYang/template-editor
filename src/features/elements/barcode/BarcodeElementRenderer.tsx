import React, { useEffect, useRef } from 'react';
import { Group, Rect, Image } from 'react-konva';
import type { IBarcodeElement } from '../types/barcode.types';
import { useBarcodeRenderer } from './use-barcode-renderer';
import Konva from 'konva';

/**
 * 条形码元素渲染器属性
 */
export interface BarcodeElementRendererProps {
  element: IBarcodeElement;
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: () => void;
  onDragStart?: () => void;
  onDragEnd?: (e: any) => void;
  dynamicValue?: string;
}

/**
 * 条形码元素渲染器
 * 使用 React Konva 渲染条形码到画布上
 */
export const BarcodeElementRenderer: React.FC<BarcodeElementRendererProps> = ({
  element,
  isSelected = false,
  isDragging = false,
  onSelect,
  onDragStart,
  onDragEnd,
  dynamicValue,
}) => {
  const imageRef = useRef<Konva.Image>(null);
  const {
    canvasRef,
    loading,
    error,
    regenerate,
  } = useBarcodeRenderer({
    element,
    value: dynamicValue,
    autoGenerate: true,
    debounceMs: 300,
    onError: (err) => {
      console.error('Barcode generation error:', err);
    },
  });

  // 当画布内容更新时，更新 Konva Image
  useEffect(() => {
    if (canvasRef.current && imageRef.current && !loading && !error) {
      const canvas = canvasRef.current;
      imageRef.current.image(canvas);
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [loading, error, canvasRef]);

  // 处理动态值变化
  useEffect(() => {
    if (dynamicValue !== undefined) {
      regenerate();
    }
  }, [dynamicValue, regenerate]);

  return (
    <Group
      x={element.position.x}
      y={element.position.y}
      rotation={element.rotation}
      draggable={!element.locked}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onTap={onSelect}
    >
      {/* 背景矩形 */}
      <Rect
        width={element.size.width}
        height={element.size.height}
        fill={element.style?.backgroundColor || '#FFFFFF'}
        stroke={isSelected ? '#0066FF' : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        shadowBlur={isDragging ? 10 : 0}
        shadowOpacity={isDragging ? 0.3 : 0}
      />

      {/* 条形码图像 */}
      {!loading && !error && (
        <Image
          ref={imageRef}
          width={element.size.width}
          height={element.size.height}
          listening={false}
        />
      )}

      {/* 加载状态 */}
      {loading && (
        <Group>
          <Rect
            width={element.size.width}
            height={element.size.height}
            fill="#F0F0F0"
          />
          <Rect
            x={element.size.width / 2 - 20}
            y={element.size.height / 2 - 10}
            width={40}
            height={20}
            fill="#CCCCCC"
            cornerRadius={4}
          />
        </Group>
      )}

      {/* 错误状态 */}
      {error && (
        <Group>
          <Rect
            width={element.size.width}
            height={element.size.height}
            fill="#FFE5E5"
            stroke="#FF0000"
            strokeWidth={1}
          />
          <Rect
            x={10}
            y={element.size.height / 2 - 10}
            width={element.size.width - 20}
            height={20}
            fill="#FF6666"
            cornerRadius={4}
          />
        </Group>
      )}

      {/* 隐藏的离屏画布 */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={element.size.width}
        height={element.size.height}
      />
    </Group>
  );
};

/**
 * 条形码元素预览组件
 * 用于属性面板等场景的静态预览
 */
export const BarcodeElementPreview: React.FC<{
  element: IBarcodeElement;
  width?: number;
  height?: number;
  className?: string;
}> = ({ element, width = 200, height = 100, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { loading, error } = useBarcodeRenderer({
    element: {
      ...element,
      size: { width, height },
    },
    autoGenerate: true,
  });

  return (
    <div className={className} style={{ width, height, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <span style={{ color: '#666', fontSize: 12 }}>生成中...</span>
        </div>
      )}
      
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 0, 0, 0.05)',
            border: '1px solid #ff0000',
          }}
        >
          <span style={{ color: '#ff0000', fontSize: 12 }}>生成失败</span>
        </div>
      )}
    </div>
  );
};