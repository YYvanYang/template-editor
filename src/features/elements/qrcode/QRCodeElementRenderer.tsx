import React, { useEffect, useRef, useState } from 'react';
import { Group, Rect, Image } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { IQRCodeElement } from '../types/qrcode.types';
import { generateQRCode } from './qrcode-generator';

interface QRCodeElementRendererProps {
  element: IQRCodeElement;
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: (e: KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
  onTransform?: (e: KonvaEventObject<Event>) => void;
  data?: Record<string, any>; // 用于数据绑定
}

/**
 * 二维码元素渲染器
 */
export const QRCodeElementRenderer: React.FC<QRCodeElementRendererProps> = ({
  element,
  isSelected = false,
  isDragging = false,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransform,
  data,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lastGeneratedValue = useRef<string>('');
  
  // 获取实际显示的值
  const getDisplayValue = (): string => {
    if (element.binding && data) {
      try {
        const keys = element.binding.replace('{{', '').replace('}}', '').trim().split('.');
        let value: any = data;
        
        for (const key of keys) {
          value = value[key];
          if (value === undefined || value === null) {
            return element.value;
          }
        }
        
        return String(value);
      } catch {
        return element.value;
      }
    }
    
    return element.value;
  };
  
  // 生成二维码
  useEffect(() => {
    const generateImage = async () => {
      const value = getDisplayValue();
      
      // 如果值没有变化，不重新生成
      if (value === lastGeneratedValue.current && imageRef.current) {
        setImage(imageRef.current);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const dataUrl = await generateQRCode({
          value,
          errorCorrectionLevel: element.errorCorrection,
          size: Math.max(element.bounds.width, element.bounds.height),
          margin: 0,
          style: {
            ...element.style,
            size: Math.max(element.bounds.width, element.bounds.height),
          },
        });
        
        const img = new window.Image();
        img.onload = () => {
          imageRef.current = img;
          lastGeneratedValue.current = value;
          setImage(img);
          setIsLoading(false);
        };
        
        img.onerror = () => {
          setError('加载二维码图片失败');
          setIsLoading(false);
        };
        
        img.src = dataUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : '生成二维码失败');
        setIsLoading(false);
      }
    };
    
    generateImage();
  }, [element.value, element.binding, element.errorCorrection, element.style, element.bounds.width, element.bounds.height, data]);
  
  // 清理
  useEffect(() => {
    return () => {
      imageRef.current = null;
      lastGeneratedValue.current = '';
    };
  }, []);
  
  return (
    <Group
      x={element.bounds.x}
      y={element.bounds.y}
      rotation={element.rotation}
      opacity={element.opacity}
      visible={element.visible}
      draggable={!element.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransform}
    >
      {/* 背景 */}
      <Rect
        width={element.bounds.width}
        height={element.bounds.height}
        fill={element.style?.backgroundColor || '#FFFFFF'}
        strokeWidth={isSelected ? 2 : 0}
        stroke={isSelected ? '#1890ff' : undefined}
      />
      
      {/* 二维码图片 */}
      {image && !isLoading && !error && (
        <Image
          image={image}
          x={0}
          y={0}
          width={element.bounds.width}
          height={element.bounds.height}
        />
      )}
      
      {/* 加载中状态 */}
      {isLoading && (
        <Group>
          <Rect
            width={element.bounds.width}
            height={element.bounds.height}
            fill="#f0f0f0"
          />
          <Rect
            x={element.bounds.width / 2 - 20}
            y={element.bounds.height / 2 - 2}
            width={40}
            height={4}
            fill="#1890ff"
            opacity={0.5}
          />
        </Group>
      )}
      
      {/* 错误状态 */}
      {error && (
        <Group>
          <Rect
            width={element.bounds.width}
            height={element.bounds.height}
            fill="#fff2f0"
            stroke="#ffccc7"
            strokeWidth={1}
          />
          <Rect
            x={element.bounds.width / 2 - 15}
            y={element.bounds.height / 2 - 15}
            width={30}
            height={30}
            fill="#ff4d4f"
            opacity={0.1}
          />
        </Group>
      )}
    </Group>
  );
};

/**
 * 二维码预览组件（用于属性面板）
 */
interface QRCodePreviewProps {
  value: string;
  errorCorrection?: IQRCodeElement['errorCorrection'];
  style?: IQRCodeElement['style'];
  size?: number;
  className?: string;
}

export const QRCodePreview: React.FC<QRCodePreviewProps> = ({
  value,
  errorCorrection = 'M',
  style,
  size = 200,
  className,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const generate = async () => {
      if (!value) {
        setImageSrc(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const dataUrl = await generateQRCode({
          value,
          errorCorrectionLevel: errorCorrection,
          size,
          margin: 0,
          style: {
            ...style,
            size,
          },
        });
        
        setImageSrc(dataUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : '生成失败');
        setImageSrc(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    const timer = setTimeout(generate, 300); // 防抖
    
    return () => clearTimeout(timer);
  }, [value, errorCorrection, style, size]);
  
  if (!value) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-400 text-sm">无内容</span>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 border border-red-200 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-red-500 text-sm text-center px-2">{error}</span>
      </div>
    );
  }
  
  return (
    <div className={className} style={{ width: size, height: size }}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt="QR Code Preview"
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
      )}
    </div>
  );
};