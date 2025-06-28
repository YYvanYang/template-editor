import React, { useCallback } from 'react';
import { cn } from '@/shared/utils';
import { useEditorStore } from '@/features/editor/stores/editor.store';
import { ToolButton } from './ToolButton';
import { defaultToolGroups } from '../config/toolbar.config';
import { ToolType, ToolGroup, ToolConfig } from '../types/toolbar.types';

interface ToolbarProps {
  className?: string;
  onToolChange?: (tool: ToolType) => void;
}

/**
 * 工具栏组件
 */
export const Toolbar: React.FC<ToolbarProps> = ({ className, onToolChange }) => {
  const {
    activeTool,
    setActiveTool,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelectedElements,
    selectedIds,
  } = useEditorStore();

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
      // TODO: 实现其他工具功能
      default:
        console.log('Tool clicked:', tool.type);
    }
  }, [undo, redo, deleteSelectedElements, setActiveTool, onToolChange]);

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
      default:
        return tool;
    }
  }, [activeTool, canUndo, canRedo, selectedIds]);

  // 渲染工具组
  const renderToolGroup = (group: ToolGroup, index: number) => {
    return (
      <div
        key={group.name}
        role="group"
        aria-label={group.name}
        className={cn(
          'inline-flex items-center',
          index > 0 && 'ml-2'
        )}
      >
        {group.tools.map((tool) => {
          const config = getToolConfig(tool);
          return (
            <ToolButton
              key={tool.type}
              {...config}
              onClick={() => handleToolClick(tool)}
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
        'flex items-center h-10 px-2 bg-card border-b border-border',
        'select-none',
        className
      )}
    >
      {defaultToolGroups.map((group, index) => renderToolGroup(group, index))}
    </div>
  );
};