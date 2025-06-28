import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { enableMapSet } from 'immer'
import type { 
  EditorState, 
  CanvasState, 
  TemplateElement, 
  ElementUpdate,
  EditorSnapshot 
} from '../types'
import { ToolType } from '@/features/toolbar/types/toolbar.types'

// 启用 Immer 对 Map 和 Set 的支持
enableMapSet()

interface EditorActions {
  // Canvas actions
  setZoom: (zoom: number) => void
  setOffset: (offset: { x: number; y: number }) => void
  toggleGrid: () => void
  toggleSnap: () => void
  
  // Element actions
  addElement: (element: TemplateElement) => void
  updateElement: (id: string, updates: ElementUpdate) => void
  deleteElement: (id: string) => void
  deleteSelectedElements: () => void
  selectElement: (id: string) => void
  deselectElement: (id: string) => void
  clearSelection: () => void
  
  // History actions
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  
  // Template actions
  setTemplateName: (name: string) => void
  setTemplateSize: (size: { width: number; height: number }) => void
  
  // Tool actions
  activeTool: ToolType
  setActiveTool: (tool: ToolType) => void
}

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

const createSnapshot = (state: EditorState): EditorSnapshot => ({
  elements: new Map(state.elements),
  selectedIds: new Set(state.selectedIds),
})

export const useEditorStore = create<EditorState & EditorActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        canvas: {
          zoom: 1,
          offset: { x: 0, y: 0 },
          gridEnabled: true,
          snapEnabled: true,
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
        
        // Tool state
        activeTool: ToolType.SELECT,
        
        // Computed properties
        get canUndo() {
          return get().history.past.length > 0
        },
        
        get canRedo() {
          return get().history.future.length > 0
        },

        // Canvas actions
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

        // Element actions
        addElement: (element) =>
          set((state) => {
            // 保存历史
            state.history.past.push(createSnapshot(state))
            state.history.future = []
            
            // 添加元素
            state.elements.set(element.id, element)
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
          
        deleteSelectedElements: () =>
          set((state) => {
            if (state.selectedIds.size === 0) return
            
            // 保存历史
            state.history.past.push(createSnapshot(state))
            state.history.future = []
            
            // 删除所有选中的元素
            state.selectedIds.forEach(id => {
              state.elements.delete(id)
            })
            state.selectedIds.clear()
          }),

        selectElement: (id) =>
          set((state) => {
            state.selectedIds.add(id)
          }),

        deselectElement: (id) =>
          set((state) => {
            state.selectedIds.delete(id)
          }),

        clearSelection: () =>
          set((state) => {
            state.selectedIds.clear()
          }),

        // History actions
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

        // Template actions
        setTemplateName: (name) =>
          set((state) => {
            state.template.name = name
          }),

        setTemplateSize: (size) =>
          set((state) => {
            state.template.size = size
          }),
          
        // Tool actions
        setActiveTool: (tool) =>
          set((state) => {
            state.activeTool = tool
          }),
      }))
    ),
    {
      name: 'editor-store',
    }
  )
)