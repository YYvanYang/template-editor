import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { ToolType } from '../types/toolbar.types';
import { useEditorStore } from '@/features/editor/stores/editor.store';

// Mock Zustand store
vi.mock('@/features/editor/stores/editor.store', () => ({
  useEditorStore: vi.fn(() => ({
    activeTool: ToolType.SELECT,
    setActiveTool: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: true,
    canRedo: true,
    deleteSelectedElements: vi.fn(),
    selectedIds: new Set(['element1']),
  })),
}));

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    vi.clearAllMocks();
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('应该注册和清理键盘事件监听器', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts());
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('应该处理工具快捷键 (V 键选择工具)', () => {
    const setActiveTool = vi.fn();
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.SELECT,
      setActiveTool,
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: true,
      deleteSelectedElements: vi.fn(),
      selectedIds: new Set(),
    } as any);

    renderHook(() => useKeyboardShortcuts());
    
    const handler = addEventListenerSpy.mock.calls[0][1];
    const event = new KeyboardEvent('keydown', { 
      key: 'v',
      ctrlKey: false,
      shiftKey: false,
      altKey: false 
    });
    
    act(() => {
      handler(event);
    });
    
    expect(setActiveTool).toHaveBeenCalledWith(ToolType.SELECT);
  });

  it('应该处理撤销快捷键 (Ctrl+Z)', () => {
    const undo = vi.fn();
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.SELECT,
      setActiveTool: vi.fn(),
      undo,
      redo: vi.fn(),
      canUndo: true,
      canRedo: true,
      deleteSelectedElements: vi.fn(),
      selectedIds: new Set(),
    } as any);

    renderHook(() => useKeyboardShortcuts());
    
    const handler = addEventListenerSpy.mock.calls[0][1];
    const event = new KeyboardEvent('keydown', { 
      key: 'z',
      ctrlKey: true 
    });
    
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    
    act(() => {
      handler(event);
    });
    
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(undo).toHaveBeenCalled();
  });

  it('应该处理重做快捷键 (Ctrl+Y)', () => {
    const redo = vi.fn();
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.SELECT,
      setActiveTool: vi.fn(),
      undo: vi.fn(),
      redo,
      canUndo: true,
      canRedo: true,
      deleteSelectedElements: vi.fn(),
      selectedIds: new Set(),
    } as any);

    renderHook(() => useKeyboardShortcuts());
    
    const handler = addEventListenerSpy.mock.calls[0][1];
    const event = new KeyboardEvent('keydown', { 
      key: 'y',
      ctrlKey: true 
    });
    
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    
    act(() => {
      handler(event);
    });
    
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(redo).toHaveBeenCalled();
  });

  it('应该处理删除快捷键 (Delete)', () => {
    const deleteSelectedElements = vi.fn();
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.SELECT,
      setActiveTool: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: true,
      deleteSelectedElements,
      selectedIds: new Set(['element1']),
    } as any);

    renderHook(() => useKeyboardShortcuts());
    
    const handler = addEventListenerSpy.mock.calls[0][1];
    const event = new KeyboardEvent('keydown', { key: 'Delete' });
    
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    
    act(() => {
      handler(event);
    });
    
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(deleteSelectedElements).toHaveBeenCalled();
  });

  it('应该忽略在输入框中的快捷键', () => {
    const setActiveTool = vi.fn();
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.SELECT,
      setActiveTool,
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: true,
      deleteSelectedElements: vi.fn(),
      selectedIds: new Set(),
    } as any);

    renderHook(() => useKeyboardShortcuts());
    
    const handler = addEventListenerSpy.mock.calls[0][1];
    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', { key: 'v' });
    Object.defineProperty(event, 'target', { value: input, writable: false });
    
    act(() => {
      handler(event);
    });
    
    expect(setActiveTool).not.toHaveBeenCalled();
  });

  it('不应该在无法撤销时执行撤销', () => {
    const undo = vi.fn();
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.SELECT,
      setActiveTool: vi.fn(),
      undo,
      redo: vi.fn(),
      canUndo: false,
      canRedo: true,
      deleteSelectedElements: vi.fn(),
      selectedIds: new Set(),
    } as any);

    renderHook(() => useKeyboardShortcuts());
    
    const handler = addEventListenerSpy.mock.calls[0][1];
    const event = new KeyboardEvent('keydown', { 
      key: 'z',
      ctrlKey: true 
    });
    
    act(() => {
      handler(event);
    });
    
    expect(undo).not.toHaveBeenCalled();
  });

  it('不应该在没有选中元素时执行删除', () => {
    const deleteSelectedElements = vi.fn();
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.SELECT,
      setActiveTool: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: true,
      deleteSelectedElements,
      selectedIds: new Set(),
    } as any);

    renderHook(() => useKeyboardShortcuts());
    
    const handler = addEventListenerSpy.mock.calls[0][1];
    const event = new KeyboardEvent('keydown', { key: 'Delete' });
    
    act(() => {
      handler(event);
    });
    
    expect(deleteSelectedElements).not.toHaveBeenCalled();
  });

  it('应该处理工具快捷键 (T 键文本工具)', () => {
    const setActiveTool = vi.fn();
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.SELECT,
      setActiveTool,
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: true,
      deleteSelectedElements: vi.fn(),
      selectedIds: new Set(),
    } as any);

    renderHook(() => useKeyboardShortcuts());
    
    const handler = addEventListenerSpy.mock.calls[0][1];
    const event = new KeyboardEvent('keydown', { key: 't' });
    
    act(() => {
      handler(event);
    });
    
    expect(setActiveTool).toHaveBeenCalledWith(ToolType.TEXT);
  });

  it('应该处理重做快捷键 (Ctrl+Shift+Z)', () => {
    const redo = vi.fn();
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.SELECT,
      setActiveTool: vi.fn(),
      undo: vi.fn(),
      redo,
      canUndo: true,
      canRedo: true,
      deleteSelectedElements: vi.fn(),
      selectedIds: new Set(),
    } as any);

    renderHook(() => useKeyboardShortcuts());
    
    const handler = addEventListenerSpy.mock.calls[0][1];
    const event = new KeyboardEvent('keydown', { 
      key: 'z',
      ctrlKey: true,
      shiftKey: true 
    });
    
    act(() => {
      handler(event);
    });
    
    expect(redo).toHaveBeenCalled();
  });
});