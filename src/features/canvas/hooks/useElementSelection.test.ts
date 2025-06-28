import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useElementSelection } from './useElementSelection'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import type { BaseElementData } from '@/features/elements'

// Mock the editor store
vi.mock('@/features/editor/stores/editor.store')

describe('useElementSelection', () => {
  const mockElements = new Map<string, BaseElementData>([
    ['elem1', {
      id: 'elem1',
      type: 'text',
      name: 'Element 1',
      position: { x: 10, y: 10 },
      size: { width: 100, height: 50 },
    }],
    ['elem2', {
      id: 'elem2',
      type: 'shape',
      name: 'Element 2',
      position: { x: 150, y: 10 },
      size: { width: 100, height: 50 },
    }],
    ['elem3', {
      id: 'elem3',
      type: 'image',
      name: 'Element 3',
      position: { x: 10, y: 100 },
      size: { width: 100, height: 50 },
    }],
  ])
  
  const mockStore = {
    elements: mockElements,
    selectedElementIds: new Set<string>(),
    selectElement: vi.fn(),
    selectElements: vi.fn(),
    clearSelection: vi.fn(),
    toggleElementSelection: vi.fn(),
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useEditorStore as any).mockReturnValue(mockStore)
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })
  
  describe('Element Click Handling', () => {
    it('should select element on click', () => {
      const { result } = renderHook(() => useElementSelection())
      
      act(() => {
        result.current.handleElementClick('elem1')
      })
      
      expect(mockStore.selectElement).toHaveBeenCalledWith('elem1')
    })
    
    it('should toggle selection with ctrl/cmd key', () => {
      const { result } = renderHook(() => useElementSelection({ multiSelect: true }))
      
      const event = new MouseEvent('click', { ctrlKey: true })
      
      act(() => {
        result.current.handleElementClick('elem1', event)
      })
      
      expect(mockStore.toggleElementSelection).toHaveBeenCalledWith('elem1')
    })
    
    it('should toggle selection with meta key (Mac)', () => {
      const { result } = renderHook(() => useElementSelection({ multiSelect: true }))
      
      const event = new MouseEvent('click', { metaKey: true })
      
      act(() => {
        result.current.handleElementClick('elem1', event)
      })
      
      expect(mockStore.toggleElementSelection).toHaveBeenCalledWith('elem1')
    })
    
    it('should not toggle if multiSelect is disabled', () => {
      const { result } = renderHook(() => useElementSelection({ multiSelect: false }))
      
      const event = new MouseEvent('click', { ctrlKey: true })
      
      act(() => {
        result.current.handleElementClick('elem1', event)
      })
      
      expect(mockStore.selectElement).toHaveBeenCalledWith('elem1')
      expect(mockStore.toggleElementSelection).not.toHaveBeenCalled()
    })
    
    it('should do nothing if element is already selected alone', () => {
      mockStore.selectedElementIds = new Set(['elem1'])
      const { result } = renderHook(() => useElementSelection())
      
      act(() => {
        result.current.handleElementClick('elem1')
      })
      
      expect(mockStore.selectElement).not.toHaveBeenCalled()
    })
  })
  
  describe('Canvas Click Handling', () => {
    it('should clear selection on canvas background click', () => {
      const { result } = renderHook(() => useElementSelection())
      
      const event = {
        target: { classList: { contains: (name: string) => name === 'canvas-background' } },
      } as any
      
      act(() => {
        result.current.handleCanvasClick(event)
      })
      
      expect(mockStore.clearSelection).toHaveBeenCalled()
    })
    
    it('should clear selection on canvas element click', () => {
      const { result } = renderHook(() => useElementSelection())
      
      const event = {
        target: { tagName: 'CANVAS', classList: { contains: () => false } },
      } as any
      
      act(() => {
        result.current.handleCanvasClick(event)
      })
      
      expect(mockStore.clearSelection).toHaveBeenCalled()
    })
    
    it('should not clear selection on other element click', () => {
      const { result } = renderHook(() => useElementSelection())
      
      const event = {
        target: { tagName: 'DIV', classList: { contains: () => false } },
      } as any
      
      act(() => {
        result.current.handleCanvasClick(event)
      })
      
      expect(mockStore.clearSelection).not.toHaveBeenCalled()
    })
  })
  
  describe('Selection Box', () => {
    it('should select elements within selection box', () => {
      const { result } = renderHook(() => useElementSelection())
      
      const selectionBox = {
        x: 0,
        y: 0,
        width: 120,
        height: 80,
      }
      
      act(() => {
        result.current.handleSelectionBox(selectionBox)
      })
      
      expect(mockStore.selectElements).toHaveBeenCalledWith(new Set(['elem1']))
    })
    
    it('should select multiple elements within selection box', () => {
      const { result } = renderHook(() => useElementSelection())
      
      const selectionBox = {
        x: 0,
        y: 0,
        width: 300,
        height: 80,
      }
      
      act(() => {
        result.current.handleSelectionBox(selectionBox)
      })
      
      expect(mockStore.selectElements).toHaveBeenCalledWith(new Set(['elem1', 'elem2']))
    })
    
    it('should handle inverted selection box', () => {
      const { result } = renderHook(() => useElementSelection())
      
      const selectionBox = {
        x: 120,
        y: 80,
        width: -120,
        height: -80,
      }
      
      act(() => {
        result.current.handleSelectionBox(selectionBox)
      })
      
      expect(mockStore.selectElements).toHaveBeenCalledWith(new Set(['elem1']))
    })
    
    it('should clear selection if no elements in box', () => {
      const { result } = renderHook(() => useElementSelection())
      
      const selectionBox = {
        x: 500,
        y: 500,
        width: 100,
        height: 100,
      }
      
      act(() => {
        result.current.handleSelectionBox(selectionBox)
      })
      
      expect(mockStore.clearSelection).toHaveBeenCalled()
    })
  })
  
  describe('Selection Bounds', () => {
    it('should calculate bounds for single selection', () => {
      mockStore.selectedElementIds = new Set(['elem1'])
      const { result } = renderHook(() => useElementSelection())
      
      const bounds = result.current.getSelectionBounds()
      
      expect(bounds).toEqual({
        x: 10,
        y: 10,
        width: 100,
        height: 50,
      })
    })
    
    it('should calculate bounds for multiple selection', () => {
      mockStore.selectedElementIds = new Set(['elem1', 'elem3'])
      const { result } = renderHook(() => useElementSelection())
      
      const bounds = result.current.getSelectionBounds()
      
      expect(bounds).toEqual({
        x: 10,
        y: 10,
        width: 100,
        height: 140,
      })
    })
    
    it('should return null for empty selection', () => {
      mockStore.selectedElementIds = new Set()
      const { result } = renderHook(() => useElementSelection())
      
      const bounds = result.current.getSelectionBounds()
      
      expect(bounds).toBeNull()
    })
  })
  
  describe('Keyboard Shortcuts', () => {
    it('should select all on Ctrl+A', () => {
      const { result } = renderHook(() => useElementSelection())
      
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true })
      
      act(() => {
        window.dispatchEvent(event)
      })
      
      expect(mockStore.selectElements).toHaveBeenCalledWith(new Set(['elem1', 'elem2', 'elem3']))
    })
    
    it('should select all on Cmd+A (Mac)', () => {
      const { result } = renderHook(() => useElementSelection())
      
      const event = new KeyboardEvent('keydown', { key: 'a', metaKey: true })
      
      act(() => {
        window.dispatchEvent(event)
      })
      
      expect(mockStore.selectElements).toHaveBeenCalledWith(new Set(['elem1', 'elem2', 'elem3']))
    })
    
    it('should clear selection on Escape', () => {
      const { result } = renderHook(() => useElementSelection())
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      
      act(() => {
        window.dispatchEvent(event)
      })
      
      expect(mockStore.clearSelection).toHaveBeenCalled()
    })
  })
  
  describe('Selection Change Callback', () => {
    it('should call onSelectionChange when selection changes', () => {
      const onSelectionChange = vi.fn()
      mockStore.selectedElementIds = new Set(['elem1'])
      
      renderHook(() => useElementSelection({ onSelectionChange }))
      
      expect(onSelectionChange).toHaveBeenCalledWith(new Set(['elem1']))
    })
  })
})