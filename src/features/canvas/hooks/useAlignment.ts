import { useState, useCallback, useMemo } from 'react';
import type {
  GuideLine,
  DynamicGuide,
  AlignmentConfig,
  AlignmentResult,
} from '../types/alignment.types';
import { DEFAULT_ALIGNMENT_CONFIG } from '../types/alignment.types';
import {
  calculateElementBounds,
  checkAlignment,
  generateDynamicGuides,
  getElementsAlignmentGuides,
  snapToGrid,
} from '../utils/alignment.utils';
import { useEditorStore } from '@/features/editor/stores/editor.store';

interface UseAlignmentOptions {
  config?: Partial<AlignmentConfig>;
}

/**
 * 对齐管理 Hook
 * 提供对齐辅助线的管理和计算功能
 */
export function useAlignment(options: UseAlignmentOptions = {}) {
  const config = useMemo(
    () => ({ ...DEFAULT_ALIGNMENT_CONFIG, ...options.config }),
    [options.config]
  );

  const { elements } = useEditorStore();
  const [manualGuides, setManualGuides] = useState<GuideLine[]>([]);
  const [dynamicGuides, setDynamicGuides] = useState<DynamicGuide[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 获取所有静态辅助线（手动 + 自动生成）
  const staticGuides = useMemo(() => {
    const autoGuides = config.snapToElements
      ? getElementsAlignmentGuides(elements, config)
      : [];
    return [...manualGuides, ...autoGuides];
  }, [manualGuides, elements, config]);

  // 添加手动辅助线
  const addManualGuide = useCallback((guide: Omit<GuideLine, 'id'>) => {
    const newGuide: GuideLine = {
      ...guide,
      id: `manual-${Date.now()}`,
      type: 'manual',
    };
    setManualGuides(prev => [...prev, newGuide]);
    return newGuide.id;
  }, []);

  // 删除手动辅助线
  const removeManualGuide = useCallback((guideId: string) => {
    setManualGuides(prev => prev.filter(g => g.id !== guideId));
  }, []);

  // 切换辅助线可见性
  const toggleGuideVisibility = useCallback((guideId: string) => {
    setManualGuides(prev =>
      prev.map(g =>
        g.id === guideId ? { ...g, visible: !g.visible } : g
      )
    );
  }, []);

  // 开始拖拽
  const startDragging = useCallback(
    (elementId: string) => {
      setIsDragging(true);
      setDynamicGuides([]);
    },
    []
  );

  // 结束拖拽
  const endDragging = useCallback(() => {
    setIsDragging(false);
    setDynamicGuides([]);
  }, []);

  // 检查对齐并生成动态辅助线
  const checkDragAlignment = useCallback(
    (draggedElementId: string, position: { x: number; y: number }) => {
      if (!isDragging || !config.enabled) {
        return { aligned: false, x: position.x, y: position.y, deltaX: 0, deltaY: 0 };
      }

      // 获取被拖拽元素
      const draggedElement = elements.find(e => e.id === draggedElementId);
      if (!draggedElement) {
        return { aligned: false, x: position.x, y: position.y, deltaX: 0, deltaY: 0 };
      }

      // 计算新位置的边界
      const draggedBounds = calculateElementBounds({
        ...draggedElement,
        x: position.x,
        y: position.y,
      });

      // 获取其他元素的边界（排除被拖拽元素）
      const otherElements = elements.filter(e => e.id !== draggedElementId);
      const otherBounds = otherElements.map(e => calculateElementBounds(e));

      // 生成动态辅助线
      if (config.snapToElements) {
        const guides = generateDynamicGuides(draggedBounds, otherBounds, config);
        setDynamicGuides(guides);
      }

      // 检查对齐
      let alignmentResult = checkAlignment(position, staticGuides, config);

      // 如果启用了网格对齐
      if (config.snapToGrid && !alignmentResult.aligned) {
        const snapped = snapToGrid(position, config.gridSize);
        alignmentResult = {
          aligned: true,
          x: snapped.x,
          y: snapped.y,
          deltaX: snapped.x - position.x,
          deltaY: snapped.y - position.y,
        };
      }

      return alignmentResult;
    },
    [isDragging, config, elements, staticGuides]
  );

  // 检查缩放对齐
  const checkResizeAlignment = useCallback(
    (
      elementId: string,
      newBounds: { x: number; y: number; width: number; height: number },
      handle: string
    ): AlignmentResult => {
      if (!config.enabled) {
        return {
          aligned: false,
          x: newBounds.x,
          y: newBounds.y,
          deltaX: 0,
          deltaY: 0,
        };
      }

      // 根据缩放控制点确定需要对齐的点
      let alignPoint = { x: newBounds.x, y: newBounds.y };
      
      if (handle.includes('right')) {
        alignPoint.x = newBounds.x + newBounds.width;
      } else if (handle.includes('center')) {
        alignPoint.x = newBounds.x + newBounds.width / 2;
      }
      
      if (handle.includes('bottom')) {
        alignPoint.y = newBounds.y + newBounds.height;
      } else if (handle.includes('middle')) {
        alignPoint.y = newBounds.y + newBounds.height / 2;
      }

      // 检查对齐
      const result = checkAlignment(alignPoint, staticGuides, config);
      
      // 根据对齐结果调整边界
      if (result.aligned) {
        if (handle.includes('right') && result.verticalGuide) {
          newBounds.width = result.x - newBounds.x;
        } else if (handle.includes('left') && result.verticalGuide) {
          const right = newBounds.x + newBounds.width;
          newBounds.x = result.x;
          newBounds.width = right - result.x;
        }
        
        if (handle.includes('bottom') && result.horizontalGuide) {
          newBounds.height = result.y - newBounds.y;
        } else if (handle.includes('top') && result.horizontalGuide) {
          const bottom = newBounds.y + newBounds.height;
          newBounds.y = result.y;
          newBounds.height = bottom - result.y;
        }
      }

      return result;
    },
    [config, staticGuides]
  );

  // 清除所有手动辅助线
  const clearManualGuides = useCallback(() => {
    setManualGuides([]);
  }, []);

  // 更新配置
  const updateConfig = useCallback((newConfig: Partial<AlignmentConfig>) => {
    Object.assign(config, newConfig);
  }, [config]);

  return {
    // 状态
    manualGuides,
    staticGuides,
    dynamicGuides,
    isDragging,
    config,
    
    // 方法
    addManualGuide,
    removeManualGuide,
    toggleGuideVisibility,
    clearManualGuides,
    startDragging,
    endDragging,
    checkDragAlignment,
    checkResizeAlignment,
    updateConfig,
  };
}