import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDragAndDrop } from './useDragAndDrop'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import type { BaseElementData } from '@/features/elements'

// Mock the editor store
vi.mock('@/features/editor/stores/editor.store')

describe('useDragAndDrop', () => {
  const mockElements = new Map<string, BaseElementData>([
    ['elem1', {
      id: 'elem1',
      type: 'text',
      name: 'Element 1',
      position: { x: 100, y: 100 },
      size: { width: 100, height: 50 },
    }],
    ['elem2', {
      id: 'elem2',
      type: 'shape',
      name: 'Element 2',
      position: { x: 200, y: 200 },
      size: { width: 100, height: 50 },
    }],
  ])
  
  const mockStore = {
    elements: mockElements,
    selectedElementIds: new Set(['elem1']),
    updateElements: vi.fn(),
    addHistoryEntry: vi.fn(),
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useEditorStore as any).mockReturnValue(mockStore)
  })
  
  describe('Drag Start', () => {
    it('should start dragging selected elements', () => {
      const onDragStart = vi.fn()
      const { result } = renderHook(() => useDragAndDrop({ onDragStart }))
      
      const event = new MouseEvent('mousedown', { clientX: 150, clientY: 150 })
      
      act(() => {
        result.current.startDrag(event)
      })
      
      expect(result.current.isDragging).toBe(true)
      expect(result.current.draggedElementIds).toEqual(new Set(['elem1']))
      expect(onDragStart).toHaveBeenCalledWith(new Set(['elem1']))
    })
    
    it('should start dragging specific element if not selected', () => {
      const { result } = renderHook(() => useDragAndDrop())
      
      const event = new MouseEvent('mousedown', { clientX: 250, clientY: 250 })
      
      act(() => {
        result.current.startDrag(event, 'elem2')
      })
      
      expect(result.current.isDragging).toBe(true)
      expect(result.current.draggedElementIds).toEqual(new Set(['elem2']))
    })
    
    it('should drag all selected elements if target is in selection', () => {
      mockStore.selectedElementIds = new Set(['elem1', 'elem2'])
      const { result } = renderHook(() => useDragAndDrop())
      
      const event = new MouseEvent('mousedown', { clientX: 150, clientY: 150 })
      
      act(() => {
        result.current.startDrag(event, 'elem1')
      })
      
      expect(result.current.draggedElementIds).toEqual(new Set(['elem1', 'elem2']))
    })
    
    it('should not start dragging with empty selection', () => {
      mockStore.selectedElementIds = new Set()
      const { result } = renderHook(() => useDragAndDrop())
      
      const event = new MouseEvent('mousedown', { clientX: 150, clientY: 150 })
      
      act(() => {
        result.current.startDrag(event)
      })
      
      expect(result.current.isDragging).toBe(false)
    })
  })
  
  describe('Drag Move', () => {
    it('should update element positions during drag', () => {
      const onDragMove = vi.fn()
      const { result } = renderHook(() => useDragAndDrop({ onDragMove }))
      
      // Start drag
      const startEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 })
      
      // Verify initial state
      expect(result.current.isDragging).toBe(false)
      
      act(() => {
        result.current.startDrag(startEvent)
      })
      
      // Check that drag is started
      expect(result.current.isDragging).toBe(true)
      expect(result.current.draggedElementIds).toEqual(new Set(['elem1']))
      
      // Move
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 180 })
      act(() => {
        result.current.handleDragMove(moveEvent)
      })
      
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        { id: 'elem1', position: { x: 150, y: 130 } },
      ])
      expect(onDragMove).toHaveBeenCalledWith(50, 30)
    })
    
    it('should not update if not dragging', () => {
      const { result } = renderHook(() => useDragAndDrop())
      
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 180 })
      act(() => {
        result.current.handleDragMove(moveEvent)
      })
      
      expect(mockStore.updateElements).not.toHaveBeenCalled()
    })
    
    it('should snap to grid when enabled', () => {
      const { result } = renderHook(() => 
        useDragAndDrop({ snapToGrid: true, gridSize: 10 })
      )
      
      // Start drag
      const startEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 })
      act(() => {
        result.current.startDrag(startEvent)
      })
      
      
      // Move to position that needs snapping
      const moveEvent = new MouseEvent('mousemove', { clientX: 163, clientY: 167 })
      act(() => {
        result.current.handleDragMove(moveEvent)
      })
      
      // Should snap to nearest grid point
      expect(mockStore.updateElements).toHaveBeenCalledWith([
        { id: 'elem1', position: { x: 110, y: 120 } },
      ])
    })
  })
  
  describe('Drag End', () => {
    it('should end drag and add history entry', () => {
      const onDragEnd = vi.fn()
      const { result } = renderHook(() => useDragAndDrop({ onDragEnd }))
      
      // Start drag
      const startEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 })
      act(() => {
        result.current.startDrag(startEvent)
      })
      
      
      // Move
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 180 })
      act(() => {
        result.current.handleDragMove(moveEvent)
      })
      
      // End drag
      act(() => {
        result.current.endDrag()
      })
      
      expect(result.current.isDragging).toBe(false)
      expect(mockStore.addHistoryEntry).toHaveBeenCalled()
      expect(onDragEnd).toHaveBeenCalledWith(new Set(['elem1']), 50, 30)
    })
    
    it('should not add history if no movement', () => {
      const { result } = renderHook(() => useDragAndDrop())
      
      // Start drag
      const startEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 })
      act(() => {
        result.current.startDrag(startEvent)
      })
      
      // End drag without moving
      act(() => {
        result.current.endDrag()
      })
      
      expect(mockStore.addHistoryEntry).not.toHaveBeenCalled()
    })
  })
  
  describe('Cancel Drag', () => {
    it('should restore original positions on cancel', () => {
      const { result } = renderHook(() => useDragAndDrop())
      
      // Start drag
      const startEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 })
      act(() => {
        result.current.startDrag(startEvent)
      })
      
      
      // Move
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 180 })
      act(() => {
        result.current.handleDragMove(moveEvent)
      })
      
      // Cancel
      act(() => {
        result.current.cancelDrag()
      })
      
      expect(result.current.isDragging).toBe(false)
      // Should restore original position
      expect(mockStore.updateElements).toHaveBeenLastCalledWith([
        { id: 'elem1', position: { x: 100, y: 100 } },
      ])
    })
  })
  
  describe('Helper Functions', () => {
    it('should get drag offset', () => {
      const { result } = renderHook(() => useDragAndDrop())
      
      // Not dragging
      expect(result.current.getDragOffset()).toEqual({ x: 0, y: 0 })
      
      // Start drag
      const startEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 })
      act(() => {
        result.current.startDrag(startEvent)
      })
      
      
      // Move
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 180 })
      act(() => {
        result.current.handleDragMove(moveEvent)
      })
      
      expect(result.current.getDragOffset()).toEqual({ x: 50, y: 30 })
    })
    
    it('should check if element is dragging', () => {
      const { result } = renderHook(() => useDragAndDrop())
      
      // Not dragging
      expect(result.current.isElementDragging('elem1')).toBe(false)
      
      // Start drag
      const startEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 150 })
      act(() => {
        result.current.startDrag(startEvent)
      })
      
      
      expect(result.current.isElementDragging('elem1')).toBe(true)
      expect(result.current.isElementDragging('elem2')).toBe(false)
    })
  })
})