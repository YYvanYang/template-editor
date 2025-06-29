import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/features/editor/stores/editor.store';
import { PerformanceMonitor, createPerformanceMonitor } from '../utils/performance-monitor';
import type { PerformanceThresholds } from '../utils/performance-monitor';

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  thresholds?: Partial<PerformanceThresholds>;
  onDegradation?: () => void;
}

/**
 * 性能监控 Hook
 * 自动跟踪画布性能并提供优化建议
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const { enabled = true, thresholds, onDegradation } = options;
  const { elements, canvas } = useEditorStore();
  
  const monitorRef = useRef<PerformanceMonitor | null>(null);

  // 初始化监控器
  useEffect(() => {
    if (!enabled) return;

    const monitor = createPerformanceMonitor(thresholds);
    monitorRef.current = monitor;

    // 监听性能降级
    if (onDegradation) {
      monitor.addListener((metrics) => {
        if (metrics.performanceLevel === 'poor') {
          onDegradation();
        }
      });
    }

    return () => {
      monitor.dispose();
      monitorRef.current = null;
    };
  }, [enabled, thresholds, onDegradation]);

  // 更新元素计数
  useEffect(() => {
    if (!monitorRef.current) return;

    const totalElements = elements.size;
    
    // 计算可见元素（简化版，实际应该基于视口）
    const visibleBounds = {
      left: -canvas.offset.x / canvas.zoom,
      top: -canvas.offset.y / canvas.zoom,
      right: (-canvas.offset.x + window.innerWidth) / canvas.zoom,
      bottom: (-canvas.offset.y + window.innerHeight) / canvas.zoom,
    };

    let visibleCount = 0;
    elements.forEach(element => {
      const inViewport = 
        element.position.x + element.size.width >= visibleBounds.left &&
        element.position.x <= visibleBounds.right &&
        element.position.y + element.size.height >= visibleBounds.top &&
        element.position.y <= visibleBounds.bottom;
      
      if (inViewport) visibleCount++;
    });

    monitorRef.current.updateElementCount(totalElements, visibleCount);
  }, [elements, canvas]);

  // 记录对齐操作
  const recordAlignment = useCallback((duration: number, cacheHit: boolean = false) => {
    monitorRef.current?.recordAlignment(duration, cacheHit);
  }, []);

  // 记录性能事件
  const recordEvent = useCallback((
    type: 'alignment' | 'render' | 'drag' | 'zoom' | 'pan',
    duration: number,
    details?: Record<string, any>
  ) => {
    monitorRef.current?.recordEvent(type, duration, details);
  }, []);

  // 测量操作性能
  const measure = useCallback(<T,>(
    operation: () => T,
    type: 'alignment' | 'render' | 'drag' | 'zoom' | 'pan'
  ): T => {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    
    recordEvent(type, duration);
    
    return result;
  }, [recordEvent]);

  // 获取监控器实例
  const getMonitor = useCallback(() => monitorRef.current, []);

  return {
    monitor: monitorRef.current,
    recordAlignment,
    recordEvent,
    measure,
    getMonitor,
  };
}

/**
 * 性能优化建议 Hook
 */
export function usePerformanceOptimization() {
  const { canvas, elements } = useEditorStore();
  
  // 获取优化建议
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: Array<{
      id: string;
      title: string;
      description: string;
      action?: () => void;
    }> = [];

    // 元素数量检查
    if (elements.size > 500) {
      suggestions.push({
        id: 'too-many-elements',
        title: 'Too Many Elements',
        description: 'Consider grouping or hiding some elements for better performance',
      });
    }

    // 缩放级别检查
    if (canvas.zoom > 3) {
      suggestions.push({
        id: 'high-zoom',
        title: 'High Zoom Level',
        description: 'High zoom levels can impact performance. Consider resetting to 100%',
        action: () => {
          // Reset zoom action
        },
      });
    }

    // 网格检查
    if (canvas.gridEnabled && elements.size > 100) {
      suggestions.push({
        id: 'grid-with-many-elements',
        title: 'Grid Performance',
        description: 'Disable grid when working with many elements',
        action: () => {
          // Toggle grid action
        },
      });
    }

    return suggestions;
  }, [canvas, elements]);

  // 自动优化设置
  const applyAutoOptimizations = useCallback(() => {
    const elementCount = elements.size;
    
    // 基于元素数量的优化
    if (elementCount > 200) {
      return {
        snapThreshold: 10, // 增加吸附阈值
        disableAnimation: true,
        simplifyGuides: true,
      };
    } else if (elementCount > 100) {
      return {
        snapThreshold: 7,
        disableAnimation: false,
        simplifyGuides: false,
      };
    }
    
    return {
      snapThreshold: 5,
      disableAnimation: false,
      simplifyGuides: false,
    };
  }, [elements]);

  return {
    getOptimizationSuggestions,
    applyAutoOptimizations,
  };
}