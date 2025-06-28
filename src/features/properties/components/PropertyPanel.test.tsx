import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertyPanel } from './PropertyPanel';
import { usePropertyPanelStore } from '../stores/property-panel.store';
import type { BaseElementData } from '@/features/elements/types/base.types';

// Mock dependencies
vi.mock('../stores/property-panel.store');
vi.mock('@/shared/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('PropertyPanel', () => {
  const mockOnPropertyChange = vi.fn();
  const mockStore = {
    isOpen: true,
    width: 320,
    expandedCategories: new Set(['basic', 'style']),
    searchKeyword: '',
    showAdvanced: false,
    setSearchKeyword: vi.fn(),
    toggleCategory: vi.fn(),
    toggleShowAdvanced: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePropertyPanelStore).mockReturnValue(mockStore as any);
  });

  describe('渲染', () => {
    it('应该在打开时渲染面板', () => {
      render(<PropertyPanel element={null} onPropertyChange={mockOnPropertyChange} />);
      
      expect(screen.getByText('属性面板')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('搜索属性...')).toBeInTheDocument();
    });

    it('应该在关闭时不渲染面板', () => {
      vi.mocked(usePropertyPanelStore).mockReturnValue({
        ...mockStore,
        isOpen: false,
      } as any);

      const { container } = render(
        <PropertyPanel element={null} onPropertyChange={mockOnPropertyChange} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('应该在没有选中元素时显示提示', () => {
      render(<PropertyPanel element={null} onPropertyChange={mockOnPropertyChange} />);
      
      expect(screen.getByText('请选择一个元素以查看其属性')).toBeInTheDocument();
    });

    it('应该显示元素属性', () => {
      const element: BaseElementData = {
        id: '1',
        type: 'text',
        name: 'Text Element',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
      };

      render(
        <PropertyPanel
          element={element}
          onPropertyChange={mockOnPropertyChange}
        />
      );
      
      // 应该显示分类
      expect(screen.getByText('基础属性')).toBeInTheDocument();
      expect(screen.getByText('样式')).toBeInTheDocument();
      
      // 应该显示属性
      expect(screen.getByText('名称')).toBeInTheDocument();
      expect(screen.getByLabelText('可见')).toBeInTheDocument();
    });
  });

  describe('搜索功能', () => {
    it('应该能够搜索属性', async () => {
      const element: BaseElementData = {
        id: '1',
        type: 'text',
        name: 'Text Element',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
      };

      render(
        <PropertyPanel
          element={element}
          onPropertyChange={mockOnPropertyChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('搜索属性...');
      await userEvent.type(searchInput, '名称');

      // userEvent.type triggers onChange for each character, so check that it was called multiple times
      expect(mockStore.setSearchKeyword).toHaveBeenCalledTimes(2);
      expect(mockStore.setSearchKeyword).toHaveBeenCalledWith('名');
      expect(mockStore.setSearchKeyword).toHaveBeenCalledWith('称');
    });

    it('应该在没有搜索结果时显示提示', () => {
      vi.mocked(usePropertyPanelStore).mockReturnValue({
        ...mockStore,
        searchKeyword: 'nonexistent',
      } as any);

      const element: BaseElementData = {
        id: '1',
        type: 'text',
        name: 'Text Element',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
      };

      render(
        <PropertyPanel
          element={element}
          onPropertyChange={mockOnPropertyChange}
        />
      );

      expect(screen.getByText('没有找到匹配的属性')).toBeInTheDocument();
    });
  });

  describe('分类展开/折叠', () => {
    it('应该能够切换分类展开状态', () => {
      const element: BaseElementData = {
        id: '1',
        type: 'text',
        name: 'Text Element',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
      };

      render(
        <PropertyPanel
          element={element}
          onPropertyChange={mockOnPropertyChange}
        />
      );

      const basicCategory = screen.getByRole('button', { name: /基础属性/ });
      fireEvent.click(basicCategory);

      expect(mockStore.toggleCategory).toHaveBeenCalledWith('basic');
    });

    it('应该显示展开的分类内容', () => {
      const element: BaseElementData = {
        id: '1',
        type: 'text',
        name: 'Text Element',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
      };

      render(
        <PropertyPanel
          element={element}
          onPropertyChange={mockOnPropertyChange}
        />
      );

      // basic 分类是展开的
      expect(screen.getByText('名称')).toBeInTheDocument();
    });

    it('应该隐藏折叠的分类内容', () => {
      vi.mocked(usePropertyPanelStore).mockReturnValue({
        ...mockStore,
        expandedCategories: new Set(), // 所有分类都折叠
      } as any);

      const element: BaseElementData = {
        id: '1',
        type: 'text',
        name: 'Text Element',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
      };

      render(
        <PropertyPanel
          element={element}
          onPropertyChange={mockOnPropertyChange}
        />
      );

      // 分类标题应该在，但内容不应该显示
      expect(screen.getByText('基础属性')).toBeInTheDocument();
      expect(screen.queryByText('名称')).not.toBeInTheDocument();
    });
  });

  describe('高级属性', () => {
    it('应该能够切换高级属性显示', () => {
      const element: BaseElementData = {
        id: '1',
        type: 'text',
        name: 'Text Element',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
      };

      render(
        <PropertyPanel
          element={element}
          onPropertyChange={mockOnPropertyChange}
        />
      );

      const advancedButton = screen.getByRole('button', { name: /显示高级属性/ });
      fireEvent.click(advancedButton);

      expect(mockStore.toggleShowAdvanced).toHaveBeenCalled();
    });
  });

  describe('属性编辑', () => {
    it('应该能够编辑文本属性', async () => {
      const element: BaseElementData = {
        id: '1',
        type: 'text',
        name: 'Text Element',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
      };

      render(
        <PropertyPanel
          element={element}
          onPropertyChange={mockOnPropertyChange}
        />
      );

      const nameInput = screen.getByDisplayValue('Text Element');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'New Name');

      await waitFor(() => {
        expect(mockOnPropertyChange).toHaveBeenCalledWith('name', 'New Name');
      });
    });

    it('应该在禁用时不能编辑属性', async () => {
      const element: BaseElementData = {
        id: '1',
        type: 'text',
        name: 'Text Element',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
      };

      render(
        <PropertyPanel
          element={element}
          onPropertyChange={mockOnPropertyChange}
          disabled={true}
        />
      );

      const nameInput = screen.getByDisplayValue('Text Element');
      expect(nameInput).toBeDisabled();
      
      await userEvent.type(nameInput, 'New Name');
      expect(mockOnPropertyChange).not.toHaveBeenCalled();
    });
  });

  describe('特定元素类型属性', () => {
    it('应该显示文本元素特有的属性', () => {
      const textElement: BaseElementData = {
        id: '1',
        type: 'text',
        name: 'Text Element',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
        content: 'Hello World',
      };

      vi.mocked(usePropertyPanelStore).mockReturnValue({
        ...mockStore,
        expandedCategories: new Set(['basic', 'style', 'text']),
      } as any);

      render(
        <PropertyPanel
          element={textElement}
          onPropertyChange={mockOnPropertyChange}
        />
      );

      // 应该显示文本特有的属性
      expect(screen.getByText('文本内容')).toBeInTheDocument();
      expect(screen.getByText('字体')).toBeInTheDocument();
      expect(screen.getByText('字号')).toBeInTheDocument();
    });

    it('应该显示条码元素特有的属性', () => {
      const barcodeElement: BaseElementData = {
        id: '1',
        type: 'barcode',
        name: 'Barcode Element',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        rotation: 0,
        visible: true,
        locked: false,
        style: {},
        barcodeType: 'code128',
        value: '123456',
      };

      render(
        <PropertyPanel
          element={barcodeElement}
          onPropertyChange={mockOnPropertyChange}
        />
      );

      // 应该显示条码特有的属性
      expect(screen.getByText('条码类型')).toBeInTheDocument();
      expect(screen.getByText('条码值')).toBeInTheDocument();
    });
  });
});