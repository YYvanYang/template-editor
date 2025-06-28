import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Group, Rect, Image, Text } from 'react-konva';
import type { BarcodeElement } from '@/features/elements/barcode/BarcodeElement';
import { generateBarcode, isBarcodeTypeSupported } from '@/features/elements/barcode/barcode-generator';
import { render as renderTemplate } from '@/features/data-binding';
import { BarcodeType } from '@/features/elements/types/barcode.types';

interface BarcodeElementRendererProps {
  element: BarcodeElement;
  bindingData?: any;
  selected?: boolean;
  onSelect?: () => void;
  onDeselect?: () => void;
}

/**
 * 条码元素渲染器
 * 支持一维条码和二维码的渲染
 */
export const BarcodeElementRenderer: React.FC<BarcodeElementRendererProps> = ({
  element,
  bindingData = {},
  selected = false,
  onSelect,
  onDeselect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 获取实际要渲染的值
  const value = useMemo(() => {
    const displayValue = element.getDisplayValue();
    if (element.data.binding) {
      try {
        return renderTemplate(displayValue, bindingData);
      } catch (e) {
        console.error('Error rendering barcode binding:', e);
        return displayValue;
      }
    }
    return displayValue;
  }, [element, bindingData]);
  
  // 生成条码图片
  useEffect(() => {
    const generateBarcodeImage = async () => {
      if (!value || !isBarcodeTypeSupported(element.data.barcodeType)) {
        setError('Unsupported barcode type or empty value');
        return;
      }
      
      setIsGenerating(true);
      setError('');
      
      try {
        // 创建离屏Canvas
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        
        const canvas = canvasRef.current;
        canvas.width = element.data.size.width;
        canvas.height = element.data.size.height;
        
        // 生成条码
        await generateBarcode(element.data, canvas, value);
        
        // 转换为Data URL
        const dataUrl = canvas.toDataURL('image/png');
        setImageUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate barcode:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate barcode');
      } finally {
        setIsGenerating(false);
      }
    };
    
    generateBarcodeImage();
  }, [element.data, value]);
  
  const { position, size, style } = element.data;
  const rotation = element.rotation;
  
  return (
    <Group
      x={position.x}
      y={position.y}
      rotation={rotation}
      onClick={onSelect}
      onTap={onSelect}
    >
      {/* 背景 */}
      <Rect
        width={size.width}
        height={size.height}
        fill={style?.backgroundColor || 'white'}
        stroke={style?.borderColor}
        strokeWidth={style?.borderWidth}
        opacity={element.data.visible === false ? 0.3 : 1}
      />
      
      {/* 条码图片 */}
      {imageUrl && !error && !isGenerating && (
        <Image
          image={(() => {
            const img = new window.Image();
            img.src = imageUrl;
            return img;
          })()}
          width={size.width}
          height={size.height}
          opacity={element.data.visible === false ? 0.3 : 1}
        />
      )}
      
      {/* 错误提示 */}
      {error && (
        <Group>
          <Rect
            width={size.width}
            height={size.height}
            fill="#f5f5f5"
            stroke="#e0e0e0"
            strokeWidth={1}
          />
          <Text
            x={0}
            y={size.height / 2 - 10}
            width={size.width}
            text={`⚠ ${error}`}
            fontSize={12}
            fontFamily="Arial"
            fill="#666"
            align="center"
          />
        </Group>
      )}
      
      {/* 加载中提示 */}
      {isGenerating && (
        <Group>
          <Rect
            width={size.width}
            height={size.height}
            fill="#f5f5f5"
            stroke="#e0e0e0"
            strokeWidth={1}
          />
          <Text
            x={0}
            y={size.height / 2 - 10}
            width={size.width}
            text="生成中..."
            fontSize={12}
            fontFamily="Arial"
            fill="#666"
            align="center"
          />
        </Group>
      )}
      
      {/* 选中边框 */}
      {selected && (
        <Rect
          width={size.width}
          height={size.height}
          stroke="#0066FF"
          strokeWidth={2}
          fill="transparent"
          dash={[5, 5]}
          listening={false}
        />
      )}
    </Group>
  );
};

/**
 * 条码预览组件（用于属性面板等场景）
 */
export const BarcodePreview: React.FC<{
  element: BarcodeElement;
  bindingData?: any;
  width?: number;
  height?: number;
}> = ({ element, bindingData = {}, width = 200, height = 100 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  
  // 获取实际要渲染的值
  const value = useMemo(() => {
    const displayValue = element.getDisplayValue();
    if (element.data.binding) {
      try {
        return renderTemplate(displayValue, bindingData);
      } catch (e) {
        return displayValue;
      }
    }
    return displayValue;
  }, [element, bindingData]);
  
  useEffect(() => {
    const generatePreview = async () => {
      if (!canvasRef.current || !value) return;
      
      setError('');
      
      try {
        const previewElement = {
          ...element.data,
          size: { width, height },
        };
        
        await generateBarcode(previewElement, canvasRef.current, value);
      } catch (err) {
        console.error('Failed to generate barcode preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate barcode');
      }
    };
    
    generatePreview();
  }, [element.data, value, width, height]);
  
  return (
    <div style={{ position: 'relative', width, height }}>
      {typeof document !== 'undefined' && (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ width: '100%', height: '100%' }}
        />
      )}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            color: '#666',
            fontSize: '12px',
            textAlign: 'center',
            padding: '8px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};