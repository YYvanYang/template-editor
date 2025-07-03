import React, { useCallback } from 'react';
import { cn } from '@/shared/utils';
import { useEditorStore } from '@/features/editor/stores/editor.store';
import { ToolButton } from './ToolButton';
import { defaultToolGroups } from '../config/toolbar.config';
import { ToolType, ToolGroup, ToolConfig } from '../types/toolbar.types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface VerticalToolbarProps {
  className?: string;
  onToolChange?: (tool: ToolType) => void;
}

/**
 * 垂直工具栏组件
 */
export const VerticalToolbar: React.FC<VerticalToolbarProps> = ({ className, onToolChange }) => {
  const {
    activeTool,
    setActiveTool,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelectedElements,
    selectedIds,
    canvas,
    toggleSnap,
    toggleAlignment,
    toggleAlignmentGuides,
    toggleMagneticSnap,
    toggleMeasurements,
    togglePerformanceMonitor,
  } = useEditorStore();
  
  // 启用键盘快捷键
  useKeyboardShortcuts();

  // 处理工具点击
  const handleToolClick = useCallback((tool: ToolConfig) => {
    switch (tool.type) {
      case ToolType.UNDO:
        undo();
        break;
      case ToolType.REDO:
        redo();
        break;
      case ToolType.DELETE:
        deleteSelectedElements();
        break;
      case ToolType.SELECT:
      case ToolType.HAND:
      case ToolType.TEXT:
      case ToolType.IMAGE:
      case ToolType.SHAPE:
      case ToolType.TABLE:
      case ToolType.BARCODE:
        setActiveTool(tool.type);
        onToolChange?.(tool.type);
        break;
      case ToolType.TOGGLE_SNAP:
        toggleSnap();
        break;
      case ToolType.TOGGLE_ALIGNMENT:
        toggleAlignment();
        break;
      case ToolType.TOGGLE_GUIDES:
        toggleAlignmentGuides();
        break;
      case ToolType.TOGGLE_MAGNETIC:
        toggleMagneticSnap();
        break;
      case ToolType.TOGGLE_MEASUREMENTS:
        toggleMeasurements();
        break;
      case ToolType.TOGGLE_PERFORMANCE:
        togglePerformanceMonitor();
        break;
      default:
        console.log('Tool clicked:', tool.type);
    }
  }, [undo, redo, deleteSelectedElements, setActiveTool, onToolChange, 
      toggleSnap, toggleAlignment, toggleAlignmentGuides, 
      toggleMagneticSnap, toggleMeasurements, togglePerformanceMonitor]);

  // 获取工具配置
  const getToolConfig = useCallback((tool: ToolConfig): ToolConfig => {
    // 根据状态更新工具配置
    switch (tool.type) {
      case ToolType.UNDO:
        return { ...tool, disabled: !canUndo };
      case ToolType.REDO:
        return { ...tool, disabled: !canRedo };
      case ToolType.DELETE:
      case ToolType.COPY:
        return { ...tool, disabled: selectedIds.size === 0 };
      case ToolType.SELECT:
      case ToolType.HAND:
      case ToolType.TEXT:
      case ToolType.IMAGE:
      case ToolType.SHAPE:
      case ToolType.TABLE:
      case ToolType.BARCODE:
        return { ...tool, active: activeTool === tool.type };
      case ToolType.TOGGLE_SNAP:
        return { ...tool, active: canvas.snapEnabled };
      case ToolType.TOGGLE_ALIGNMENT:
        return { ...tool, active: canvas.alignmentEnabled };
      case ToolType.TOGGLE_GUIDES:
        return { ...tool, active: canvas.showAlignmentGuides };
      case ToolType.TOGGLE_MAGNETIC:
        return { ...tool, active: canvas.magneticSnap };
      case ToolType.TOGGLE_MEASUREMENTS:
        return { ...tool, active: canvas.showMeasurements };
      case ToolType.TOGGLE_PERFORMANCE:
        return { ...tool, active: canvas.showPerformanceMonitor };
      default:
        return tool;
    }
  }, [activeTool, canUndo, canRedo, selectedIds, canvas]);

  // 渲染工具组 - 垂直布局
  const renderToolGroup = (group: ToolGroup, index: number) => {
    return (
      <div
        key={group.name}
        role="group"
        aria-label={group.name}
        className={cn(
          'flex flex-col items-center',
          index > 0 && 'mt-2 pt-2 border-t border-border/50'
        )}
      >
        {group.tools.map((tool) => {
          const config = getToolConfig(tool);
          return (
            <ToolButton
              key={tool.type}
              {...config}
              onClick={() => handleToolClick(tool)}
              className="w-10 h-10 mb-1 last:mb-0"
              iconOnly
              vertical={true}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      role="toolbar"
      aria-label="编辑器工具栏"
      className={cn(
        'flex flex-col items-center w-14 py-2 bg-card border-r border-border',
        'select-none overflow-y-auto flex-shrink-0',
        'min-h-0', // 允许在 flex 容器中正确收缩
        className
      )}
      style={{ height: '100%' }} // 占满父容器高度
    >
      {defaultToolGroups.map((group, index) => renderToolGroup(group, index))}
    </div>
  );
};