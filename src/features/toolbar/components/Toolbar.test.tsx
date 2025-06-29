import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Toolbar } from './Toolbar';
import { defaultToolGroups } from '../config/toolbar.config';
import { ToolType } from '../types/toolbar.types';
import { useEditorStore } from '@/features/editor/stores/editor.store';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MousePointer2: () => null,
  Hand: () => null,
  Type: () => null,
  Image: () => null,
  Square: () => null,
  Table: () => null,
  Barcode: () => null,
  Undo2: () => null,
  Redo2: () => null,
  Trash2: () => null,
  Copy: () => null,
  Clipboard: () => null,
  AlignLeft: () => null,
  AlignCenter: () => null,
  AlignRight: () => null,
  AlignStartVertical: () => null,
  AlignCenterVertical: () => null,
  AlignEndVertical: () => null,
  Columns3: () => null,
  Rows3: () => null,
  ZoomIn: () => null,
  ZoomOut: () => null,
  Maximize: () => null,
  Percent: () => null,
  Settings: () => null,
  Download: () => null,
  Eye: () => null,
  Grid3x3: () => null,
  Magnet: () => null,
  Minus: () => null,
  Ruler: () => null,
  Activity: () => null,
  ScanLine: () => null,
}));

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
    canvas: {
      snapEnabled: false,
      alignmentEnabled: false,
      showAlignmentGuides: false,
      magneticSnap: false,
      showMeasurements: false,
      showPerformanceMonitor: false,
    },
    toggleSnap: vi.fn(),
    toggleAlignment: vi.fn(),
    toggleAlignmentGuides: vi.fn(),
    toggleMagneticSnap: vi.fn(),
    toggleMeasurements: vi.fn(),
    togglePerformanceMonitor: vi.fn(),
  })),
}));

// Helper to create default store mock
const createStoreMock = (overrides = {}) => ({
  activeTool: ToolType.SELECT,
  setActiveTool: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: true,
  canRedo: true,
  deleteSelectedElements: vi.fn(),
  selectedIds: new Set(['element1']),
  canvas: {
    snapEnabled: false,
    alignmentEnabled: false,
    showAlignmentGuides: false,
    magneticSnap: false,
    showMeasurements: false,
    showPerformanceMonitor: false,
  },
  toggleSnap: vi.fn(),
  toggleAlignment: vi.fn(),
  toggleAlignmentGuides: vi.fn(),
  toggleMagneticSnap: vi.fn(),
  toggleMeasurements: vi.fn(),
  togglePerformanceMonitor: vi.fn(),
  ...overrides,
});

describe('Toolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染工具栏', () => {
    const { container } = render(<Toolbar />);
    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar).toBeTruthy();
  });

  it('应该渲染所有工具组', () => {
    const { container } = render(<Toolbar />);
    const groups = container.querySelectorAll('[role="group"]');
    expect(groups.length).toBe(defaultToolGroups.length);
  });

  it('应该渲染所有工具按钮', () => {
    const { container } = render(<Toolbar />);
    const buttons = container.querySelectorAll('button');
    
    const totalTools = defaultToolGroups.reduce(
      (sum, group) => sum + group.tools.length,
      0
    );
    expect(buttons.length).toBe(totalTools);
  });

  it('应该显示激活的工具', () => {
    const { container } = render(<Toolbar />);
    const selectButton = container.querySelector('[aria-label="选择"]');
    expect(selectButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('应该处理工具切换', () => {
    const setActiveTool = vi.fn();
    
    vi.mocked(useEditorStore).mockReturnValue(createStoreMock({
      setActiveTool,
    }) as any);

    const { container } = render(<Toolbar />);
    const textButton = container.querySelector('[aria-label="文本"]');
    
    fireEvent.click(textButton!);
    expect(setActiveTool).toHaveBeenCalledWith(ToolType.TEXT);
  });

  it('应该处理撤销操作', () => {
    const undo = vi.fn();
    
    vi.mocked(useEditorStore).mockReturnValue(createStoreMock({
      undo,
    }) as any);

    const { container } = render(<Toolbar />);
    const undoButton = container.querySelector('[aria-label="撤销"]');
    
    fireEvent.click(undoButton!);
    expect(undo).toHaveBeenCalled();
  });

  it('应该处理重做操作', () => {
    const redo = vi.fn();
    
    vi.mocked(useEditorStore).mockReturnValue(createStoreMock({
      redo,
    }) as any);

    const { container } = render(<Toolbar />);
    const redoButton = container.querySelector('[aria-label="重做"]');
    
    fireEvent.click(redoButton!);
    expect(redo).toHaveBeenCalled();
  });

  it('应该禁用撤销按钮当无法撤销时', () => {
    vi.mocked(useEditorStore).mockReturnValue(createStoreMock({
      canUndo: false,
    }) as any);

    const { container } = render(<Toolbar />);
    const undoButton = container.querySelector('[aria-label="撤销"]');
    
    expect(undoButton).toBeDisabled();
  });

  it('应该处理删除操作', () => {
    const deleteSelectedElements = vi.fn();
    
    vi.mocked(useEditorStore).mockReturnValue(createStoreMock({
      deleteSelectedElements,
    }) as any);

    const { container } = render(<Toolbar />);
    const deleteButton = container.querySelector('[aria-label="删除"]');
    
    fireEvent.click(deleteButton!);
    expect(deleteSelectedElements).toHaveBeenCalled();
  });

  it('应该禁用删除按钮当没有选中元素时', () => {
    vi.mocked(useEditorStore).mockReturnValue(createStoreMock({
      selectedIds: new Set(),
    }) as any);

    const { container } = render(<Toolbar />);
    const deleteButton = container.querySelector('[aria-label="删除"]');
    
    expect(deleteButton).toBeDisabled();
  });

  it('应该支持自定义类名', () => {
    const { container } = render(<Toolbar className="custom-toolbar" />);
    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar?.className).toContain('custom-toolbar');
  });

  it('应该触发工具变更事件', () => {
    const onToolChange = vi.fn();
    const { container } = render(<Toolbar onToolChange={onToolChange} />);
    const imageButton = container.querySelector('[aria-label="图片"]');
    
    fireEvent.click(imageButton!);
    expect(onToolChange).toHaveBeenCalledWith(ToolType.IMAGE);
  });

  it('应该渲染分隔符', () => {
    const { container } = render(<Toolbar />);
    const separators = container.querySelectorAll('[data-separator="true"]');
    expect(separators.length).toBeGreaterThan(0);
  });
});