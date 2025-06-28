import { useEffect, useCallback } from 'react';
import { ToolType } from '../types/toolbar.types';
import { getShortcutMap } from '../config/toolbar.config';
import { useEditorStore } from '@/features/editor/stores/editor.store';

/**
 * Hook to handle keyboard shortcuts for toolbar tools
 */
export const useKeyboardShortcuts = () => {
  const { activeTool, setActiveTool, undo, redo, deleteSelectedElements, selectedIds, canUndo, canRedo } = useEditorStore();
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 忽略在输入框中的快捷键
    const target = event.target as HTMLElement | null;
    if (target && (
        target instanceof HTMLInputElement || 
        target instanceof HTMLTextAreaElement ||
        target.contentEditable === 'true'
    )) {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    // 构建快捷键字符串
    let shortcut = '';
    if (ctrl) shortcut += 'ctrl+';
    if (shift) shortcut += 'shift+';
    if (alt) shortcut += 'alt+';
    shortcut += key;

    // 处理特殊快捷键
    if (ctrl && key === 'z' && !shift) {
      event.preventDefault();
      if (canUndo) undo();
      return;
    }

    if ((ctrl && key === 'y') || (ctrl && shift && key === 'z')) {
      event.preventDefault();
      if (canRedo) redo();
      return;
    }

    if (ctrl && key === 'c') {
      event.preventDefault();
      // TODO: 实现复制功能
      return;
    }

    if (ctrl && key === 'v') {
      event.preventDefault();
      // TODO: 实现粘贴功能
      return;
    }

    if (key === 'delete' || key === 'backspace') {
      event.preventDefault();
      if (selectedIds.size > 0) {
        deleteSelectedElements();
      }
      return;
    }

    // 处理缩放快捷键
    if (ctrl && (key === '+' || key === '=')) {
      event.preventDefault();
      // TODO: 实现放大功能
      return;
    }

    if (ctrl && key === '-') {
      event.preventDefault();
      // TODO: 实现缩小功能
      return;
    }

    if (ctrl && key === '0') {
      event.preventDefault();
      // TODO: 实现适应窗口功能
      return;
    }

    if (ctrl && key === '1') {
      event.preventDefault();
      // TODO: 实现100%缩放功能
      return;
    }

    // 获取工具快捷键映射
    const shortcutMap = getShortcutMap();
    
    // 检查单键快捷键
    const toolType = shortcutMap.get(key);
    if (toolType && !ctrl && !shift && !alt) {
      event.preventDefault();
      setActiveTool(toolType);
    }
  }, [activeTool, setActiveTool, undo, redo, deleteSelectedElements, selectedIds, canUndo, canRedo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { activeTool };
};