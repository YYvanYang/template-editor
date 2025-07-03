import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { enableMapSet } from 'immer'
import { shallow } from 'zustand/shallow'
import type { 
  TemplateElement,
  BaseElement,
  Point,
  Size,
  ElementType,
  ExtractElement,
  generateId
} from '@/types/unified.types'
import { ToolType } from '@/features/toolbar/types/toolbar.types'

// 启用 Immer 对 Map 和 Set 的支持
enableMapSet()

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 画布状态
 */
export interface CanvasState {
  zoom: number
  offset: Point
  gridEnabled: boolean
  snapEnabled: boolean
  // 对齐系统配置
  alignmentEnabled: boolean
  alignmentThreshold: number
  showAlignmentGuides: boolean
  magneticSnap: boolean
  magneticCurve: 'linear' | 'quadratic' | 'cubic' | 'exponential'
  showMeasurements: boolean
  showPerformanceMonitor: boolean
}

/**
 * 编辑器快照（用于历史记录）
 */
export interface EditorSnapshot {
  elements: Map<string, TemplateElement>
  selectedIds: Set<string>
}

/**
 * 模板元数据
 */
export interface TemplateMetadata {
  id: string
  name: string
  size: Size
  unit: 'mm' | 'px'
}

/**
 * UI 配置
 */
export interface UIConfig {
  toolbarPosition: 'top' | 'left'
}

/**
 * 编辑器状态
 */
export interface EditorState {
  canvas: CanvasState
  elements: Map<string, TemplateElement>
  selectedIds: Set<string>
  history: {
    past: EditorSnapshot[]
    future: EditorSnapshot[]
  }
  template: TemplateMetadata
  activeTool: ToolType
  ui: UIConfig
}

/**
 * 元素更新类型 - 使用更严格的类型
 */
export type ElementUpdate<T extends TemplateElement = TemplateElement> = 
  Partial<Omit<T, 'id' | 'type'>>

/**
 * 编辑器操作接口
 */
export interface EditorActions {
  // Canvas actions
  setZoom: (zoom: number) => void
  setOffset: (offset: Point) => void
  toggleGrid: () => void
  toggleSnap: () => void
  
  // Alignment actions
  toggleAlignment: () => void
  setAlignmentThreshold: (threshold: number) => void
  toggleAlignmentGuides: () => void
  toggleMagneticSnap: () => void
  setMagneticCurve: (curve: 'linear' | 'quadratic' | 'cubic' | 'exponential') => void
  toggleMeasurements: () => void
  togglePerformanceMonitor: () => void
  
  // Element actions
  addElement: (element: TemplateElement, options?: { autoSelect?: boolean }) => void
  addElements: (elements: TemplateElement[], options?: { autoSelect?: boolean }) => void
  updateElement: <T extends TemplateElement>(id: string, updates: ElementUpdate<T>) => void
  updateElements: (updates: Array<{ id: string; updates: ElementUpdate }>) => void
  deleteElement: (id: string) => void
  deleteElements: (ids: string[]) => void
  deleteSelectedElements: () => void
  selectElement: (id: string, options?: { addToSelection?: boolean }) => void
  selectElements: (ids: string[]) => void
  deselectElement: (id: string) => void
  clearSelection: () => void
  selectAll: () => void
  
  // History actions
  undo: () => void
  redo: () => void
  
  // Template actions
  setTemplateName: (name: string) => void
  setTemplateSize: (size: Size) => void
  
  // Tool actions
  setActiveTool: (tool: ToolType) => void
  
  // UI actions
  setToolbarPosition: (position: 'top' | 'left') => void
}

/**
 * 选择器类型
 */
export interface EditorSelectors {
  // 计算属性
  canUndo: () => boolean
  canRedo: () => boolean
  
  // 元素选择器
  getElementById: (id: string) => TemplateElement | undefined
  getElementsByType: <T extends ElementType>(type: T) => ExtractElement<T>[]
  getSelectedElements: () => TemplateElement[]
  getSelectedElement: () => TemplateElement | null
  getVisibleElements: () => TemplateElement[]
  
  // 统计选择器
  getElementCount: () => number
  getSelectedCount: () => number
}

// ============================================================================
// 常量
// ============================================================================

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const MAX_HISTORY_SIZE = 100

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 创建历史快照
 */
const createSnapshot = (state: EditorState): EditorSnapshot => ({
  elements: new Map(state.elements),
  selectedIds: new Set(state.selectedIds),
})

/**
 * 批量更新优化
 */
const batchUpdateElements = (
  elements: Map<string, TemplateElement>,
  updates: Array<{ id: string; updates: ElementUpdate }>
): void => {
  updates.forEach(({ id, updates }) => {
    const element = elements.get(id)
    if (element) {
      Object.assign(element, updates)
    }
  })
}

// ============================================================================
// Store 定义
// ============================================================================

export type EditorStore = EditorState & EditorActions & EditorSelectors

export const useEditorStore = create<EditorStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ========================================================================
        // 初始状态
        // ========================================================================
        canvas: {
          zoom: 1,
          offset: { x: 0, y: 0 },
          gridEnabled: true,
          snapEnabled: true,
          alignmentEnabled: true,
          alignmentThreshold: 5,
          showAlignmentGuides: true,
          magneticSnap: true,
          magneticCurve: 'quadratic',
          showMeasurements: true,
          showPerformanceMonitor: false,
        },
        elements: new Map(),
        selectedIds: new Set(),
        history: {
          past: [],
          future: [],
        },
        template: {
          id: '',
          name: '未命名模板',
          size: { width: 210, height: 297 },
          unit: 'mm',
        },
        activeTool: ToolType.SELECT,
        ui: {
          toolbarPosition: 'top',
        },

        // ========================================================================
        // 选择器（使用 getter 实现缓存）
        // ========================================================================
        canUndo: () => get().history.past.length > 0,
        canRedo: () => get().history.future.length > 0,
        
        getElementById: (id: string) => get().elements.get(id),
        
        getElementsByType: <T extends ElementType>(type: T) => {
          const elements: ExtractElement<T>[] = []
          get().elements.forEach((element) => {
            if (element.type === type) {
              elements.push(element as ExtractElement<T>)
            }
          })
          return elements
        },
        
        getSelectedElements: () => {
          const state = get()
          const selected: TemplateElement[] = []
          state.selectedIds.forEach((id) => {
            const element = state.elements.get(id)
            if (element) selected.push(element)
          })
          return selected
        },
        
        getSelectedElement: () => {
          const state = get()
          if (state.selectedIds.size === 1) {
            const id = Array.from(state.selectedIds)[0]
            return state.elements.get(id) || null
          }
          return null
        },
        
        getVisibleElements: () => {
          const elements: TemplateElement[] = []
          get().elements.forEach((element) => {
            if (element.visible) elements.push(element)
          })
          return elements
        },
        
        getElementCount: () => get().elements.size,
        getSelectedCount: () => get().selectedIds.size,

        // ========================================================================
        // Canvas Actions
        // ========================================================================
        setZoom: (zoom) =>
          set((state) => {
            state.canvas.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
          }),

        setOffset: (offset) =>
          set((state) => {
            state.canvas.offset = offset
          }),

        toggleGrid: () =>
          set((state) => {
            state.canvas.gridEnabled = !state.canvas.gridEnabled
          }),

        toggleSnap: () =>
          set((state) => {
            state.canvas.snapEnabled = !state.canvas.snapEnabled
          }),

        // ========================================================================
        // Alignment Actions
        // ========================================================================
        toggleAlignment: () =>
          set((state) => {
            state.canvas.alignmentEnabled = !state.canvas.alignmentEnabled
          }),

        setAlignmentThreshold: (threshold) =>
          set((state) => {
            state.canvas.alignmentThreshold = threshold
          }),

        toggleAlignmentGuides: () =>
          set((state) => {
            state.canvas.showAlignmentGuides = !state.canvas.showAlignmentGuides
          }),

        toggleMagneticSnap: () =>
          set((state) => {
            state.canvas.magneticSnap = !state.canvas.magneticSnap
          }),

        setMagneticCurve: (curve) =>
          set((state) => {
            state.canvas.magneticCurve = curve
          }),

        toggleMeasurements: () =>
          set((state) => {
            state.canvas.showMeasurements = !state.canvas.showMeasurements
          }),

        togglePerformanceMonitor: () =>
          set((state) => {
            state.canvas.showPerformanceMonitor = !state.canvas.showPerformanceMonitor
          }),

        // ========================================================================
        // Element Actions
        // ========================================================================
        addElement: (element, options) =>
          set((state) => {
            // 保存历史
            state.history.past.push(createSnapshot(state))
            state.history.future = []
            
            // 限制历史记录大小
            if (state.history.past.length > MAX_HISTORY_SIZE) {
              state.history.past = state.history.past.slice(-MAX_HISTORY_SIZE)
            }
            
            // 添加元素
            state.elements.set(element.id, element)
            
            // 自动选择
            if (options?.autoSelect) {
              state.selectedIds.clear()
              state.selectedIds.add(element.id)
            }
          }),

        addElements: (elements, options) =>
          set((state) => {
            // 保存历史
            state.history.past.push(createSnapshot(state))
            state.history.future = []
            
            // 批量添加元素
            elements.forEach((element) => {
              state.elements.set(element.id, element)
            })
            
            // 自动选择
            if (options?.autoSelect) {
              state.selectedIds.clear()
              elements.forEach((element) => {
                state.selectedIds.add(element.id)
              })
            }
          }),

        updateElement: (id, updates) =>
          set((state) => {
            const element = state.elements.get(id)
            if (!element) return
            
            // 保存历史
            state.history.past.push(createSnapshot(state))
            state.history.future = []
            
            // 更新元素
            Object.assign(element, updates)
          }),

        updateElements: (updates) =>
          set((state) => {
            // 检查是否有有效更新
            const validUpdates = updates.filter(({ id }) => state.elements.has(id))
            if (validUpdates.length === 0) return
            
            // 保存历史
            state.history.past.push(createSnapshot(state))
            state.history.future = []
            
            // 批量更新
            batchUpdateElements(state.elements, validUpdates)
          }),

        deleteElement: (id) =>
          set((state) => {
            if (!state.elements.has(id)) return
            
            // 保存历史
            state.history.past.push(createSnapshot(state))
            state.history.future = []
            
            // 删除元素
            state.elements.delete(id)
            state.selectedIds.delete(id)
          }),

        deleteElements: (ids) =>
          set((state) => {
            const toDelete = ids.filter((id) => state.elements.has(id))
            if (toDelete.length === 0) return
            
            // 保存历史
            state.history.past.push(createSnapshot(state))
            state.history.future = []
            
            // 批量删除
            toDelete.forEach((id) => {
              state.elements.delete(id)
              state.selectedIds.delete(id)
            })
          }),

        deleteSelectedElements: () => {
          const state = get()
          if (state.selectedIds.size === 0) return
          
          const idsToDelete = Array.from(state.selectedIds)
          get().deleteElements(idsToDelete)
        },

        selectElement: (id, options) =>
          set((state) => {
            if (!state.elements.has(id)) return
            
            if (!options?.addToSelection) {
              state.selectedIds.clear()
            }
            state.selectedIds.add(id)
          }),

        selectElements: (ids) =>
          set((state) => {
            state.selectedIds.clear()
            ids.forEach((id) => {
              if (state.elements.has(id)) {
                state.selectedIds.add(id)
              }
            })
          }),

        deselectElement: (id) =>
          set((state) => {
            state.selectedIds.delete(id)
          }),

        clearSelection: () =>
          set((state) => {
            state.selectedIds.clear()
          }),

        selectAll: () =>
          set((state) => {
            state.selectedIds.clear()
            state.elements.forEach((_, id) => {
              state.selectedIds.add(id)
            })
          }),

        // ========================================================================
        // History Actions
        // ========================================================================
        undo: () =>
          set((state) => {
            if (state.history.past.length === 0) return
            
            const snapshot = state.history.past.pop()!
            state.history.future.push(createSnapshot(state))
            
            state.elements = snapshot.elements
            state.selectedIds = snapshot.selectedIds
          }),

        redo: () =>
          set((state) => {
            if (state.history.future.length === 0) return
            
            const snapshot = state.history.future.pop()!
            state.history.past.push(createSnapshot(state))
            
            state.elements = snapshot.elements
            state.selectedIds = snapshot.selectedIds
          }),

        // ========================================================================
        // Template Actions
        // ========================================================================
        setTemplateName: (name) =>
          set((state) => {
            state.template.name = name
          }),

        setTemplateSize: (size) =>
          set((state) => {
            state.template.size = size
          }),

        // ========================================================================
        // Tool Actions
        // ========================================================================
        setActiveTool: (tool) =>
          set((state) => {
            state.activeTool = tool
          }),
          
        // ========================================================================
        // UI Actions
        // ========================================================================
        setToolbarPosition: (position) =>
          set((state) => {
            state.ui.toolbarPosition = position
          }),
      }))
    ),
    {
      name: 'editor-store',
    }
  )
)

// ============================================================================
// 性能优化的选择器 Hooks
// ============================================================================

/**
 * 使用画布状态（浅比较）
 */
export const useCanvasState = () => 
  useEditorStore((state) => state.canvas, shallow)

/**
 * 使用选中的元素 IDs
 */
export const useSelectedIds = () => 
  useEditorStore((state) => Array.from(state.selectedIds))

/**
 * 使用特定元素
 */
export const useElement = (id: string) => 
  useEditorStore((state) => state.elements.get(id))

/**
 * 使用元素列表（返回数组以便使用）
 */
export const useElements = () => 
  useEditorStore((state) => Array.from(state.elements.values()))

/**
 * 使用选中的元素
 */
export const useSelectedElements = () => 
  useEditorStore((state) => state.getSelectedElements())

/**
 * 使用单个选中的元素
 */
export const useSelectedElement = () => 
  useEditorStore((state) => state.getSelectedElement())

/**
 * 使用历史状态
 */
export const useHistoryState = () => 
  useEditorStore((state) => ({
    canUndo: state.canUndo(),
    canRedo: state.canRedo(),
  }), shallow)

/**
 * 使用模板信息
 */
export const useTemplateInfo = () => 
  useEditorStore((state) => state.template, shallow)

/**
 * 使用当前工具
 */
export const useActiveTool = () => 
  useEditorStore((state) => state.activeTool)

// ============================================================================
// 动作 Hooks（无状态订阅）
// ============================================================================

/**
 * 使用画布操作
 */
export const useCanvasActions = () => {
  const store = useEditorStore()
  return {
    setZoom: store.setZoom,
    setOffset: store.setOffset,
    toggleGrid: store.toggleGrid,
    toggleSnap: store.toggleSnap,
  }
}

/**
 * 使用元素操作
 */
export const useElementActions = () => {
  const store = useEditorStore()
  return {
    addElement: store.addElement,
    addElements: store.addElements,
    updateElement: store.updateElement,
    updateElements: store.updateElements,
    deleteElement: store.deleteElement,
    deleteElements: store.deleteElements,
    deleteSelectedElements: store.deleteSelectedElements,
    selectElement: store.selectElement,
    selectElements: store.selectElements,
    deselectElement: store.deselectElement,
    clearSelection: store.clearSelection,
    selectAll: store.selectAll,
  }
}

/**
 * 使用历史操作
 */
export const useHistoryActions = () => {
  const store = useEditorStore()
  return {
    undo: store.undo,
    redo: store.redo,
  }
}

/**
 * 使用对齐系统操作
 */
export const useAlignmentActions = () => {
  const store = useEditorStore()
  return {
    toggleAlignment: store.toggleAlignment,
    setAlignmentThreshold: store.setAlignmentThreshold,
    toggleAlignmentGuides: store.toggleAlignmentGuides,
    toggleMagneticSnap: store.toggleMagneticSnap,
    setMagneticCurve: store.setMagneticCurve,
    toggleMeasurements: store.toggleMeasurements,
    togglePerformanceMonitor: store.togglePerformanceMonitor,
  }
}