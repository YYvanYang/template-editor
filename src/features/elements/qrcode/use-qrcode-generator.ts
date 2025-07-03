import { useState, useEffect, useCallback, useRef } from 'react';
import { generateQRCode, getQRCodeGenerator } from './qrcode-generator';
import type { QRCodeGenerationOptions } from '../types/qrcode.types';

interface UseQRCodeGeneratorOptions {
  autoGenerate?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (dataUrl: string) => void;
}

interface UseQRCodeGeneratorResult {
  dataUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  generate: (options: QRCodeGenerationOptions) => Promise<void>;
  clearCache: () => void;
}

/**
 * React Hook for QR code generation
 */
export function useQRCodeGenerator(
  initialOptions?: QRCodeGenerationOptions,
  config?: UseQRCodeGeneratorOptions
): UseQRCodeGeneratorResult {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(initialOptions);
  const isMountedRef = useRef(true);
  
  // Update options ref when changed
  useEffect(() => {
    optionsRef.current = initialOptions;
  }, [initialOptions]);
  
  // Generate QR code
  const generate = useCallback(async (options: QRCodeGenerationOptions) => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generateQRCode(options);
      
      if (isMountedRef.current) {
        setDataUrl(result);
        config?.onSuccess?.(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('生成二维码失败');
        setError(error);
        config?.onError?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [config]);
  
  // Clear cache
  const clearCache = useCallback(() => {
    const generator = getQRCodeGenerator();
    generator.clearCache();
  }, []);
  
  // Auto generate on mount or options change
  useEffect(() => {
    if (config?.autoGenerate && optionsRef.current) {
      generate(optionsRef.current);
    }
  }, [config?.autoGenerate, generate]);
  
  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return {
    dataUrl,
    isLoading,
    error,
    generate,
    clearCache,
  };
}

/**
 * Hook for batch QR code generation
 */
export function useQRCodeBatch(
  optionsList: QRCodeGenerationOptions[]
): {
  results: Map<number, string>;
  errors: Map<number, Error>;
  isLoading: boolean;
  progress: number;
  generate: () => Promise<void>;
} {
  const [results, setResults] = useState<Map<number, string>>(new Map());
  const [errors, setErrors] = useState<Map<number, Error>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const isMountedRef = useRef(true);
  
  const generate = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setProgress(0);
    setResults(new Map());
    setErrors(new Map());
    
    const total = optionsList.length;
    let completed = 0;
    
    // Process in parallel with concurrency limit
    const concurrency = 5;
    const chunks: QRCodeGenerationOptions[][] = [];
    
    for (let i = 0; i < optionsList.length; i += concurrency) {
      chunks.push(optionsList.slice(i, i + concurrency));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (options, localIndex) => {
        const globalIndex = chunks.indexOf(chunk) * concurrency + localIndex;
        
        try {
          const result = await generateQRCode(options);
          
          if (isMountedRef.current) {
            setResults(prev => new Map(prev).set(globalIndex, result));
          }
        } catch (err) {
          if (isMountedRef.current) {
            const error = err instanceof Error ? err : new Error('生成失败');
            setErrors(prev => new Map(prev).set(globalIndex, error));
          }
        } finally {
          completed++;
          if (isMountedRef.current) {
            setProgress((completed / total) * 100);
          }
        }
      });
      
      await Promise.all(promises);
    }
    
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  }, [optionsList]);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return {
    results,
    errors,
    isLoading,
    progress,
    generate,
  };
}

/**
 * Hook for QR code preview with live updates
 */
export function useQRCodePreview(
  options: QRCodeGenerationOptions,
  debounceMs = 300
): UseQRCodeGeneratorResult {
  const [debouncedOptions, setDebouncedOptions] = useState(options);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  // Debounce options changes
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedOptions(options);
    }, debounceMs);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [options, debounceMs]);
  
  // Use the generator hook with auto-generate
  return useQRCodeGenerator(debouncedOptions, { autoGenerate: true });
}