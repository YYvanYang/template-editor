import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRotation } from './useRotation'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import type { BaseElementData } from '@/features/elements'

// Mock the editor store
vi.mock('@/features/editor/stores/editor.store')

describe('useRotation', () => {
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
      rotation: 0,
    }
    
    mockStore = {
      elements: new Map([['elem1', mockElement]]),
      selectedElementIds: new Set(['elem1']),
      updateElements: vi.fn((updates: any[]) => {
        // Simulate store update behavior
        updates.forEach(update => {
          const element = mockStore.elements.get(update.id)
          if (element && update.rotation !== undefined) {
            element.rotation = update.rotation
          }
        })
      }),
      addHistoryEntry: vi.fn(),
    }
    
    ;(useEditorStore as any).mockReturnValue(mockStore)
  })
  
  describe('Rotation Start', () => {
    it('should start rotating an element', () => {
      const onRotationStart = vi.fn()
      const { result } = renderHook(() => useRotation({ onRotationStart }))
      
      const event = new MouseEvent('mousedown', { clientX: 200, clientY: 80 })
      
      act(() => {
        result.current.startRotation('elem1', event)
      })
      
      expect(result.current.isRotating).toBe(true)
      expect(result.current.rotatingElementId).toBe('elem1')
      expect(onRotationStart).toHaveBeenCalledWith('elem1')
    })
    
    it('should not start rotating for non-existent element', () => {
      const { result } = renderHook(() => useRotation())
      
      const event = new MouseEvent('mousedown', { clientX: 200, clientY: 80 })
      
      act(() => {
        result.current.startRotation('invalid', event)
      })
      
      expect(result.current.isRotating).toBe(false)
    })
  })
  
  describe('Rotation Move', () => {
    it('should rotate element based on mouse movement', async () => {
      const onRotationMove = vi.fn()
      const { result } = renderHook(() => useRotation({ onRotationMove }))
      
      // Start rotation
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 80 })
      act(() => {
        result.current.startRotation('elem1', startEvent)
      })
      
      await waitFor(() => {
        expect(result.current.isRotating).toBe(true)
      })
      
      // Move to rotate (90 degrees clockwise)
      const moveEvent = new MouseEvent('mousemove', { clientX: 220, clientY: 150 })
      act(() => {
        result.current.handleRotationMove(moveEvent)
      })
      
      // The exact angle will depend on the calculation
      expect(mockStore.updateElements).toHaveBeenCalled()
      const updateCall = mockStore.updateElements.mock.calls[0][0][0]
      expect(updateCall.id).toBe('elem1')
      expect(typeof updateCall.rotation).toBe('number')
      expect(Math.abs(updateCall.rotation)).toBeGreaterThan(0)
      expect(onRotationMove).toHaveBeenCalled()
    })
    
    it('should snap to 45-degree increments when enabled', async () => {
      const { result } = renderHook(() => useRotation({ snapToAngles: true, snapAngle: 45 }))
      
      // Start rotation
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 80 })
      act(() => {
        result.current.startRotation('elem1', startEvent)
      })
      
      await waitFor(() => {
        expect(result.current.isRotating).toBe(true)
      })
      
      // Move to rotate to create an angle that should snap to 45 degrees
      // Moving from (200, 80) to (250, 130) creates approximately a 45-degree angle
      const moveEvent = new MouseEvent('mousemove', { clientX: 250, clientY: 130 })
      act(() => {
        result.current.handleRotationMove(moveEvent)
      })
      
      // Should snap to 45 degrees (or -45, 0, 90, etc.)
      const updateCall = mockStore.updateElements.mock.calls[0][0][0]
      expect(Math.abs(updateCall.rotation % 45)).toBe(0)
    })
    
    it('should handle rotation with shift key for 15-degree snapping', async () => {
      const { result } = renderHook(() => useRotation())
      
      // Start rotation
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 80 })
      act(() => {
        result.current.startRotation('elem1', startEvent)
      })
      
      await waitFor(() => {
        expect(result.current.isRotating).toBe(true)
      })
      
      // Move with shift key pressed
      const moveEvent = new MouseEvent('mousemove', { 
        clientX: 205, 
        clientY: 100,
        shiftKey: true 
      })
      act(() => {
        result.current.handleRotationMove(moveEvent)
      })
      
      // Should snap to 15-degree increment
      const updateCall = mockStore.updateElements.mock.calls[0][0][0]
      // Handle both positive and negative angles
      const normalizedRotation = ((updateCall.rotation % 15) + 15) % 15
      expect(normalizedRotation).toBe(0)
    })
  })
  
  describe('Rotation End', () => {
    it('should end rotation and add history entry', async () => {
      const onRotationEnd = vi.fn()
      const { result } = renderHook(() => useRotation({ onRotationEnd }))
      
      // Start rotation
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 80 })
      act(() => {
        result.current.startRotation('elem1', startEvent)
      })
      
      await waitFor(() => {
        expect(result.current.isRotating).toBe(true)
      })
      
      // Move to rotate
      const moveEvent = new MouseEvent('mousemove', { clientX: 250, clientY: 150 })
      act(() => {
        result.current.handleRotationMove(moveEvent)
      })
      
      // End rotation
      act(() => {
        result.current.endRotation()
      })
      
      expect(result.current.isRotating).toBe(false)
      expect(mockStore.addHistoryEntry).toHaveBeenCalled()
      expect(onRotationEnd).toHaveBeenCalled()
    })
    
    it('should not add history if no rotation occurred', async () => {
      const { result } = renderHook(() => useRotation())
      
      // Start rotation
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 80 })
      act(() => {
        result.current.startRotation('elem1', startEvent)
      })
      
      await waitFor(() => {
        expect(result.current.isRotating).toBe(true)
      })
      
      // End without moving
      act(() => {
        result.current.endRotation()
      })
      
      expect(mockStore.addHistoryEntry).not.toHaveBeenCalled()
    })
  })
  
  describe('Cancel Rotation', () => {
    it('should restore original rotation on cancel', async () => {
      const { result } = renderHook(() => useRotation())
      
      // Start rotation
      const startEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 80 })
      act(() => {
        result.current.startRotation('elem1', startEvent)
      })
      
      await waitFor(() => {
        expect(result.current.isRotating).toBe(true)
      })
      
      // Move to rotate
      const moveEvent = new MouseEvent('mousemove', { clientX: 250, clientY: 150 })
      act(() => {
        result.current.handleRotationMove(moveEvent)
      })
      
      // Cancel
      act(() => {
        result.current.cancelRotation()
      })
      
      expect(result.current.isRotating).toBe(false)
      // Should restore original rotation
      expect(mockStore.updateElements).toHaveBeenLastCalledWith([
        { id: 'elem1', rotation: 0 },
      ])
    })
  })
  
  describe('Rotation Helpers', () => {
    it('should calculate angle between two points', () => {
      const { result } = renderHook(() => useRotation())
      
      // Test various angles
      expect(result.current.getAngleBetweenPoints(
        { x: 100, y: 100 }, // center
        { x: 200, y: 100 }  // right (0 degrees)
      )).toBe(0)
      
      expect(result.current.getAngleBetweenPoints(
        { x: 100, y: 100 }, // center
        { x: 100, y: 0 }    // top (90 degrees)
      )).toBe(90)
      
      expect(result.current.getAngleBetweenPoints(
        { x: 100, y: 100 }, // center
        { x: 0, y: 100 }    // left (180 degrees)
      )).toBe(180)
      
      expect(result.current.getAngleBetweenPoints(
        { x: 100, y: 100 }, // center
        { x: 100, y: 200 }  // bottom (-90 or 270 degrees)
      )).toBe(-90)
    })
    
    it('should normalize angle to -180 to 180 range', () => {
      const { result } = renderHook(() => useRotation())
      
      expect(result.current.normalizeAngle(0)).toBe(0)
      expect(result.current.normalizeAngle(90)).toBe(90)
      expect(result.current.normalizeAngle(180)).toBe(180)
      expect(result.current.normalizeAngle(270)).toBe(-90)
      expect(result.current.normalizeAngle(360)).toBe(0)
      expect(result.current.normalizeAngle(-270)).toBe(90)
      expect(result.current.normalizeAngle(450)).toBe(90)
    })
  })
})