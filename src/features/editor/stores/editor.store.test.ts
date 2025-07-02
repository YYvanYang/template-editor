import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from './editor.store'

describe('EditorStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useEditorStore.setState({
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
    })
  })

  describe('Canvas Actions', () => {
    it('should update zoom level', () => {
      const { setZoom, canvas } = useEditorStore.getState()
      
      setZoom(1.5)
      
      const newState = useEditorStore.getState()
      expect(newState.canvas.zoom).toBe(1.5)
    })

    it('should clamp zoom level between min and max', () => {
      const { setZoom } = useEditorStore.getState()
      
      setZoom(0.05) // 小于最小值
      expect(useEditorStore.getState().canvas.zoom).toBe(0.1)
      
      setZoom(10) // 大于最大值
      expect(useEditorStore.getState().canvas.zoom).toBe(5)
    })

    it('should update canvas offset', () => {
      const { setOffset } = useEditorStore.getState()
      
      setOffset({ x: 100, y: 200 })
      
      const { canvas } = useEditorStore.getState()
      expect(canvas.offset).toEqual({ x: 100, y: 200 })
    })

    it('should toggle grid', () => {
      const { toggleGrid } = useEditorStore.getState()
      const initialGrid = useEditorStore.getState().canvas.gridEnabled
      
      toggleGrid()
      
      expect(useEditorStore.getState().canvas.gridEnabled).toBe(!initialGrid)
    })
  })

  describe('Element Management', () => {
    it('should add an element', () => {
      const { addElement } = useEditorStore.getState()
      
      const element = {
        id: 'test-1',
        type: 'text' as const,
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        rotation: 0,
        locked: false,
        visible: true,
        zIndex: 1,
        content: 'Test Text',
        style: {},
      }
      
      addElement(element)
      
      const { elements } = useEditorStore.getState()
      expect(elements.size).toBe(1)
      expect(elements.get('test-1')).toEqual(element)
    })

    it('should update an element', () => {
      const { addElement, updateElement } = useEditorStore.getState()
      
      const element = {
        id: 'test-1',
        type: 'text' as const,
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        rotation: 0,
        locked: false,
        visible: true,
        zIndex: 1,
        content: 'Test Text',
        style: {},
      }
      
      addElement(element)
      updateElement('test-1', { position: { x: 50, y: 60 } })
      
      const { elements } = useEditorStore.getState()
      expect(elements.get('test-1')?.position).toEqual({ x: 50, y: 60 })
    })

    it('should delete an element', () => {
      const { addElement, deleteElement } = useEditorStore.getState()
      
      const element = {
        id: 'test-1',
        type: 'text' as const,
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        rotation: 0,
        locked: false,
        visible: true,
        zIndex: 1,
        content: 'Test Text',
        style: {},
      }
      
      addElement(element)
      deleteElement('test-1')
      
      const { elements } = useEditorStore.getState()
      expect(elements.size).toBe(0)
    })

    it('should add element with auto-select option', () => {
      const { addElement } = useEditorStore.getState()
      
      const element = {
        id: 'test-1',
        type: 'text' as const,
        name: 'Text',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1,
        content: 'Test Text',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        textAlign: 'left' as const,
        verticalAlign: 'top' as const,
        color: '#000000',
        lineHeight: 1.2,
      }
      
      // Add element with auto-select
      addElement(element, { autoSelect: true })
      
      const { elements, selectedIds } = useEditorStore.getState()
      expect(elements.size).toBe(1)
      expect(elements.get('test-1')).toEqual(element)
      expect(selectedIds.has('test-1')).toBe(true)
      expect(selectedIds.size).toBe(1)
    })

    it('should select and deselect elements', () => {
      const { selectElement, deselectElement, clearSelection } = useEditorStore.getState()
      
      selectElement('test-1')
      selectElement('test-2')
      
      let { selectedIds } = useEditorStore.getState()
      expect(selectedIds.size).toBe(2)
      expect(selectedIds.has('test-1')).toBe(true)
      expect(selectedIds.has('test-2')).toBe(true)
      
      deselectElement('test-1')
      
      selectedIds = useEditorStore.getState().selectedIds
      expect(selectedIds.size).toBe(1)
      expect(selectedIds.has('test-1')).toBe(false)
      
      clearSelection()
      
      selectedIds = useEditorStore.getState().selectedIds
      expect(selectedIds.size).toBe(0)
    })
  })

  describe('Selected Element Getter', () => {
    it('should return null when no element is selected', () => {
      const store = useEditorStore.getState()
      expect(store.selectedElement?.()).toBe(null)
    })

    it('should return null when multiple elements are selected', () => {
      const { addElement, selectElement } = useEditorStore.getState()
      
      const element1 = {
        id: 'test-1',
        type: 'text' as const,
        name: 'Text 1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1,
        content: 'Test Text 1',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        textAlign: 'left' as const,
        verticalAlign: 'top' as const,
        color: '#000000',
        lineHeight: 1.2,
      }
      
      const element2 = {
        id: 'test-2',
        type: 'text' as const,
        name: 'Text 2',
        x: 50,
        y: 60,
        width: 100,
        height: 50,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1,
        content: 'Test Text 2',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        textAlign: 'left' as const,
        verticalAlign: 'top' as const,
        color: '#000000',
        lineHeight: 1.2,
      }
      
      addElement(element1)
      addElement(element2)
      selectElement('test-1')
      selectElement('test-2')
      
      const store = useEditorStore.getState()
      expect(store.selectedElement?.()).toBe(null)
    })

    it('should return the selected element when exactly one is selected', () => {
      const { addElement, selectElement } = useEditorStore.getState()
      
      const element = {
        id: 'test-1',
        type: 'text' as const,
        name: 'Text 1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1,
        content: 'Test Text',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        textAlign: 'left' as const,
        verticalAlign: 'top' as const,
        color: '#000000',
        lineHeight: 1.2,
      }
      
      addElement(element)
      selectElement('test-1')
      
      const store = useEditorStore.getState()
      const selectedElement = store.selectedElement?.()
      expect(selectedElement).toEqual(element)
    })

    it('should update when selection changes', () => {
      const { addElement, selectElement, clearSelection } = useEditorStore.getState()
      
      const element = {
        id: 'test-1',
        type: 'text' as const,
        name: 'Text 1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1,
        content: 'Test Text',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        textAlign: 'left' as const,
        verticalAlign: 'top' as const,
        color: '#000000',
        lineHeight: 1.2,
      }
      
      addElement(element)
      
      // Initially no selection
      let store = useEditorStore.getState()
      expect(store.selectedElement?.()).toBe(null)
      
      // Select element
      selectElement('test-1')
      store = useEditorStore.getState()
      expect(store.selectedElement?.()).toEqual(element)
      
      // Clear selection
      clearSelection()
      store = useEditorStore.getState()
      expect(store.selectedElement?.()).toBe(null)
    })
  })

  describe('History (Undo/Redo)', () => {
    it('should save history when adding element', () => {
      const { addElement } = useEditorStore.getState()
      
      const element = {
        id: 'test-1',
        type: 'text' as const,
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        rotation: 0,
        locked: false,
        visible: true,
        zIndex: 1,
        content: 'Test Text',
        style: {},
      }
      
      addElement(element)
      
      const { history } = useEditorStore.getState()
      expect(history.past.length).toBe(1)
      expect(history.future.length).toBe(0)
    })

    it('should undo and redo actions', () => {
      const { addElement, undo, redo } = useEditorStore.getState()
      
      const element = {
        id: 'test-1',
        type: 'text' as const,
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        rotation: 0,
        locked: false,
        visible: true,
        zIndex: 1,
        content: 'Test Text',
        style: {},
      }
      
      addElement(element)
      
      // Undo
      undo()
      let state = useEditorStore.getState()
      expect(state.elements.size).toBe(0)
      expect(state.history.past.length).toBe(0)
      expect(state.history.future.length).toBe(1)
      
      // Redo
      redo()
      state = useEditorStore.getState()
      expect(state.elements.size).toBe(1)
      expect(state.history.past.length).toBe(1)
      expect(state.history.future.length).toBe(0)
    })
  })
})