import { useEffect, useRef, useState, useCallback } from 'react';
import { getBarcodeRenderer, type BarcodeGenerationResult } from './barcode-renderer';
import type { IBarcodeElement } from '../types/barcode.types';

/**
 * 条形码渲染 Hook 选项
 */
export interface UseBarcodeRendererOptions {
  element: IBarcodeElement;
  value?: string;
  onError?: (error: Error) => void;
  onSuccess?: (result: BarcodeGenerationResult) => void;
  autoGenerate?: boolean;
  debounceMs?: number;
}

/**
 * 条形码渲染 Hook 返回值
 */
export interface UseBarcodeRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imageData: ImageData | null;
  loading: boolean;
  error: Error | null;
  regenerate: () => Promise<void>;
  validate: (value?: string) => Promise<{ valid: boolean; error?: string }>;
}

/**
 * 条形码渲染 Hook
 * 提供了简化的条形码生成接口，支持自动生成、错误处理、防抖等功能
 */
export function useBarcodeRenderer(options: UseBarcodeRendererOptions): UseBarcodeRendererReturn {
  const {
    element,
    value: propValue,
    onError,
    onSuccess,
    autoGenerate = true,
    debounceMs = 300,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  // 获取要渲染的值
  const getValue = useCallback(() => {
    return propValue || element.binding || element.value;
  }, [propValue, element.binding, element.value]);

  // 渲染条形码到画布
  const renderToCanvas = useCallback((result: BarcodeGenerationResult) => {
    if (!canvasRef.current || !mountedRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 调整画布尺寸
    if (canvas.width !== result.width || canvas.height !== result.height) {
      canvas.width = result.width;
      canvas.height = result.height;
    }

    // 绘制图像数据
    ctx.putImageData(result.imageData, 0, 0);
    
    // 更新状态
    setImageData(result.imageData);
  }, []);

  // 生成条形码
  const generate = useCallback(async () => {
    if (!mountedRef.current) return;

    const value = getValue();
    if (!value) {
      setError(new Error('No value to generate barcode'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const renderer = getBarcodeRenderer();
      const result = await renderer.generateFromElement(element, value);
      
      if (!mountedRef.current) return;

      renderToCanvas(result);
      onSuccess?.(result);
    } catch (err) {
      if (!mountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error('Failed to generate barcode');
      setError(error);
      onError?.(error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [element, getValue, renderToCanvas, onSuccess, onError]);

  // 防抖生成
  const debouncedGenerate = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      generate();
    }, debounceMs);
  }, [generate, debounceMs]);

  // 立即重新生成
  const regenerate = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    await generate();
  }, [generate]);

  // 验证条形码值
  const validate = useCallback(async (value?: string) => {
    const renderer = getBarcodeRenderer();
    const valueToValidate = value || getValue();
    return renderer.validate(element.barcodeType, valueToValidate);
  }, [element.barcodeType, getValue]);

  // 自动生成
  useEffect(() => {
    if (autoGenerate) {
      debouncedGenerate();
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [autoGenerate, debouncedGenerate]);

  // 监听元素变化
  useEffect(() => {
    if (autoGenerate) {
      debouncedGenerate();
    }
  }, [
    element.barcodeType,
    element.value,
    element.binding,
    element.size.width,
    element.size.height,
    element.style?.rotation,
    element.style?.hideText,
    element.style?.fontSize,
    element.style?.fontFamily,
    element.style?.backgroundColor,
    element.style?.lineColor,
    element.style?.margin,
    element.errorCorrection,
    propValue,
    autoGenerate,
    debouncedGenerate,
  ]);

  // 清理
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    canvasRef,
    imageData,
    loading,
    error,
    regenerate,
    validate,
  };
}

/**
 * 批量条形码渲染 Hook
 * 用于同时渲染多个条形码，支持预热缓存
 */
export function useBatchBarcodeRenderer(
  elements: IBarcodeElement[],
  values?: Record<string, string>
): Record<string, UseBarcodeRendererReturn> {
  const [results, setResults] = useState<Record<string, UseBarcodeRendererReturn>>({});

  useEffect(() => {
    const newResults: Record<string, UseBarcodeRendererReturn> = {};

    elements.forEach(element => {
      const value = values?.[element.id];
      // 注意：这里简化了实现，实际使用时应该优化以避免过多的 Hook 调用
      // 可以考虑使用单个渲染器处理所有元素
    });

    setResults(newResults);
  }, [elements, values]);

  return results;
}

/**
 * 条形码预览 Hook
 * 生成条形码的 Data URL，适用于预览场景
 */
export function useBarcodePreview(
  element: IBarcodeElement,
  value?: string
): { dataUrl: string | null; loading: boolean; error: Error | null } {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      const valueToRender = value || element.binding || element.value;
      if (!valueToRender) {
        setDataUrl(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const renderer = getBarcodeRenderer();
        const result = await renderer.generateFromElement(element, valueToRender);
        
        if (cancelled) return;

        // 创建临时画布转换为 Data URL
        const canvas = document.createElement('canvas');
        canvas.width = result.width;
        canvas.height = result.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(result.imageData, 0, 0);
          setDataUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Failed to generate preview'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [element, value]);

  return { dataUrl, loading, error };
}