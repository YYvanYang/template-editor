import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface PropertyPanelState {
  // 面板是否展开
  isOpen: boolean;
  // 面板宽度
  width: number;
  // 展开的分类
  expandedCategories: Set<string>;
  // 搜索关键词
  searchKeyword: string;
  // 是否显示高级属性
  showAdvanced: boolean;
}

interface PropertyPanelActions {
  // 切换面板展开状态
  togglePanel: () => void;
  // 设置面板展开状态
  setOpen: (isOpen: boolean) => void;
  // 设置面板宽度
  setWidth: (width: number) => void;
  // 切换分类展开状态
  toggleCategory: (categoryName: string) => void;
  // 设置分类展开状态
  setCategoryExpanded: (categoryName: string, expanded: boolean) => void;
  // 展开所有分类
  expandAllCategories: () => void;
  // 折叠所有分类
  collapseAllCategories: () => void;
  // 设置搜索关键词
  setSearchKeyword: (keyword: string) => void;
  // 切换高级属性显示
  toggleShowAdvanced: () => void;
  // 重置面板状态
  reset: () => void;
}

export type PropertyPanelStore = PropertyPanelState & PropertyPanelActions;

const initialState: PropertyPanelState = {
  isOpen: true,
  width: 320,
  expandedCategories: new Set(['basic', 'style', 'text', 'layout']),
  searchKeyword: '',
  showAdvanced: false,
};

export const usePropertyPanelStore = create<PropertyPanelStore>()(
  immer((set) => ({
    ...initialState,

    togglePanel: () =>
      set((state) => {
        state.isOpen = !state.isOpen;
      }),

    setOpen: (isOpen) =>
      set((state) => {
        state.isOpen = isOpen;
      }),

    setWidth: (width) =>
      set((state) => {
        state.width = Math.max(200, Math.min(600, width));
      }),

    toggleCategory: (categoryName) =>
      set((state) => {
        if (state.expandedCategories.has(categoryName)) {
          state.expandedCategories.delete(categoryName);
        } else {
          state.expandedCategories.add(categoryName);
        }
      }),

    setCategoryExpanded: (categoryName, expanded) =>
      set((state) => {
        if (expanded) {
          state.expandedCategories.add(categoryName);
        } else {
          state.expandedCategories.delete(categoryName);
        }
      }),

    expandAllCategories: () =>
      set((state) => {
        state.expandedCategories = new Set([
          'basic',
          'style',
          'text',
          'layout',
          'data',
          'advanced',
        ]);
      }),

    collapseAllCategories: () =>
      set((state) => {
        state.expandedCategories.clear();
      }),

    setSearchKeyword: (keyword) =>
      set((state) => {
        state.searchKeyword = keyword;
      }),

    toggleShowAdvanced: () =>
      set((state) => {
        state.showAdvanced = !state.showAdvanced;
      }),

    reset: () => set(() => initialState),
  }))
);

// Persist store configuration
if (typeof window !== 'undefined') {
  // Save state to localStorage
  usePropertyPanelStore.subscribe((state) => {
    localStorage.setItem(
      'property-panel-state',
      JSON.stringify({
        isOpen: state.isOpen,
        width: state.width,
        expandedCategories: Array.from(state.expandedCategories),
        showAdvanced: state.showAdvanced,
      })
    );
  });

  // Load state from localStorage
  const savedState = localStorage.getItem('property-panel-state');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      usePropertyPanelStore.setState({
        // 首次访问时强制展开，后续尊重用户设置
        isOpen: parsed.isOpen !== undefined ? parsed.isOpen : initialState.isOpen,
        width: parsed.width ?? initialState.width,
        expandedCategories: new Set(parsed.expandedCategories ?? Array.from(initialState.expandedCategories)),
        showAdvanced: parsed.showAdvanced ?? initialState.showAdvanced,
      });
    } catch (e) {
      console.error('Failed to load property panel state:', e);
    }
  }
  
  // 临时：清除localStorage以确保默认展开（已执行，现在注释掉）
  // localStorage.removeItem('property-panel-state');
}