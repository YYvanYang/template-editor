import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResize } from './useResize'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import type { BaseElementData } from '@/features/elements'

// Mock the editor store
vi.mock('@/features/editor/stores/editor.store')

describe('useResize', () => {
  let mockElement: BaseElementData
  let mockStore: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockElement = {
      id: 'elem1',
      type: 'text',
      name: 'Element 1',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
    }
    
    mockStore = {
      elements: new Map([['elem1', mockElement]]),
      selectedElementIds: new Set(['elem1']),
      updateElements: vi.fn((updates: any[]) => {
        // Simulate store update behavior
        updates.forEach(update => {
          const element = mockStore.elements.get(update.id)
          if (element) {
            if (update.size) {
              element.size = { ...element.size, ...update.size }
            }
            if (update.position) {
              element.position = { ...element.position, ...update.position }
            }
          }
        })
      }),
      addHistoryEntry: vi.fn(),
    }
    
    ;(useEditorStore as any).mockReturnValue(mockStore)
  })
  
  describe('Resize Start', () => {
    it('should start resizing from a handle', () => {
      const onResizeStart = vi.fn()
      const { result } = renderHook(() => useResize({ onResizeStart }))
      
      const event = new MouseEvent('mousedown', { clientX: 300, clientY: 200 })
      
      act(() => {
        result.current.startResize('elem1', 'se', event)
      })
      
      expect(result.current.isResizing).toBe(true)
      expect(result.current.resizingElementId).toBe('elem1')
      expect(result.current.resizeHandle).toBe('se')
      expect(onResizeStart).toHaveBeenCalledWith('elem1', 'se')
    })
    
    it('should not start resizing for non-existent element', () => {
      const { result } = renderHook(() => useResize())
      
      const event = new MouseEvent('mousedown', { clientX: 300, clientY: 200 })
      
      act(() => {
        result.current.startResize('invalid', 'se', event)
      })
      
      expect(result.current.isResizing).toBe(false)
    })
  })
  
  describe('Resize Move', () => {
    it('should resize from southeast handle', () => {
      const onResizeMove = vi.fn()
      const { result } = renderHook(() => useResize({ onResizeMove }))
      
      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 300, clientY: 200 })
      act(() => {
        result.current.startResize('elem1', 'se', startEvent)
      })
      
      // Move to resize
      const moveEvent = new MouseEvent('mousemove', { clientX: 350, clientY: 230 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        {
          id: 'elem1',
          size: { width: 250, height: 130 },
        },
      ])
      expect(onResizeMove).toHaveBeenCalledWith('elem1', { width: 250, height: 130 })
    })
    
    it('should resize from northwest handle', () => {
      const { result } = renderHook(() => useResize())
      
      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      act(() => {
        result.current.startResize('elem1', 'nw', startEvent)
      })
      
      // Move to resize
      const moveEvent = new MouseEvent('mousemove', { clientX: 80, clientY: 90 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        {
          id: 'elem1',
          position: { x: 80, y: 90 },
          size: { width: 220, height: 110 },
        },
      ])
    })
    
    it('should maintain aspect ratio when enabled', () => {
      const { result } = renderHook(() => useResize({ maintainAspectRatio: true }))
      
      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 300, clientY: 200 })
      act(() => {
        result.current.startResize('elem1', 'se', startEvent)
      })
      
      // Move to resize (50px width change)
      const moveEvent = new MouseEvent('mousemove', { clientX: 350, clientY: 200 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      // Height should change proportionally (original ratio is 2:1)
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        {
          id: 'elem1',
          size: { width: 250, height: 125 },
        },
      ])
    })
    
    it('should respect minimum size constraints', () => {
      const { result } = renderHook(() => useResize({ minWidth: 50, minHeight: 30 }))
      
      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 300, clientY: 200 })
      act(() => {
        result.current.startResize('elem1', 'se', startEvent)
      })
      
      // Try to resize smaller than minimum
      const moveEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 110 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        {
          id: 'elem1',
          size: { width: 50, height: 30 },
        },
      ])
    })
    
    it('should snap to grid when enabled', () => {
      const { result } = renderHook(() => useResize({ snapToGrid: true, gridSize: 10 }))
      
      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 300, clientY: 200 })
      act(() => {
        result.current.startResize('elem1', 'se', startEvent)
      })
      
      // Move to position that needs snapping
      const moveEvent = new MouseEvent('mousemove', { clientX: 347, clientY: 228 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      // Should snap to nearest grid point
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        {
          id: 'elem1',
          size: { width: 250, height: 130 },
        },
      ])
    })
  })
  
  describe('Resize End', () => {
    it('should end resize and add history entry', () => {
      const onResizeEnd = vi.fn()
      const { result } = renderHook(() => useResize({ onResizeEnd }))
      
      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 300, clientY: 200 })
      act(() => {
        result.current.startResize('elem1', 'se', startEvent)
      })
      
      // Move to resize
      const moveEvent = new MouseEvent('mousemove', { clientX: 350, clientY: 230 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      // End resize
      act(() => {
        result.current.endResize()
      })
      
      expect(result.current.isResizing).toBe(false)
      expect(mockStore.addHistoryEntry).toHaveBeenCalled()
      expect(onResizeEnd).toHaveBeenCalledWith('elem1', { width: 250, height: 130 })
    })
    
    it('should not add history if no size change', () => {
      const { result } = renderHook(() => useResize())
      
      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 300, clientY: 200 })
      act(() => {
        result.current.startResize('elem1', 'se', startEvent)
      })
      
      // End without moving
      act(() => {
        result.current.endResize()
      })
      
      expect(mockStore.addHistoryEntry).not.toHaveBeenCalled()
    })
  })
  
  describe('Cancel Resize', () => {
    it('should restore original size on cancel', () => {
      const { result } = renderHook(() => useResize())
      
      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 300, clientY: 200 })
      act(() => {
        result.current.startResize('elem1', 'se', startEvent)
      })
      
      // Move to resize
      const moveEvent = new MouseEvent('mousemove', { clientX: 350, clientY: 230 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      // Cancel
      act(() => {
        result.current.cancelResize()
      })
      
      expect(result.current.isResizing).toBe(false)
      // Should restore original size
      expect(mockStore.updateElements).toHaveBeenLastCalledWith([
        {
          id: 'elem1',
          position: { x: 100, y: 100 },
          size: { width: 200, height: 100 },
        },
      ])
    })
  })
  
  describe('Edge Resize', () => {
    it('should resize from north edge', () => {
      const { result } = renderHook(() => useResize())
      
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 100 })
      act(() => {
        result.current.startResize('elem1', 'n', startEvent)
      })
      
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 80 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        {
          id: 'elem1',
          position: { x: 100, y: 80 },
          size: { width: 200, height: 120 },
        },
      ])
    })
    
    it('should resize from east edge', () => {
      const { result } = renderHook(() => useResize())
      
      const startEvent = new MouseEvent('mousedown', { clientX: 300, clientY: 150 })
      act(() => {
        result.current.startResize('elem1', 'e', startEvent)
      })
      
      const moveEvent = new MouseEvent('mousemove', { clientX: 320, clientY: 150 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        {
          id: 'elem1',
          size: { width: 220, height: 100 },
        },
      ])
    })
    
    it('should resize from south edge', () => {
      const { result } = renderHook(() => useResize())
      
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 200 })
      act(() => {
        result.current.startResize('elem1', 's', startEvent)
      })
      
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 220 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        {
          id: 'elem1',
          size: { width: 200, height: 120 },
        },
      ])
    })
    
    it('should resize from west edge', () => {
      const { result } = renderHook(() => useResize())
      
      const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 150 })
      act(() => {
        result.current.startResize('elem1', 'w', startEvent)
      })
      
      const moveEvent = new MouseEvent('mousemove', { clientX: 80, clientY: 150 })
      act(() => {
        result.current.handleResizeMove(moveEvent)
      })
      
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        {
          id: 'elem1',
          position: { x: 80, y: 100 },
          size: { width: 220, height: 100 },
        },
      ])
    })
  })
})