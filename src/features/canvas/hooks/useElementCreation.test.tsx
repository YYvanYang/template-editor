import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useElementCreation } from './useElementCreation'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { ToolType } from '@/features/toolbar/types/toolbar.types'

// Mock the store
vi.mock('@/features/editor/stores/editor.store')

describe('useElementCreation', () => {
  const mockAddElement = vi.fn()
  const mockSetActiveTool = vi.fn()
  const mockClearSelection = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup store mock
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.TEXT,
      addElement: mockAddElement,
      setActiveTool: mockSetActiveTool,
      clearSelection: mockClearSelection,
    } as any)
  })

  it('should create text element at correct position when clicking with text tool', () => {
    const { result } = renderHook(() => useElementCreation())

    // Mock Konva event with stage and pointer
    const mockStage = {
      getPointerPosition: () => ({ x: 200, y: 150 }),
      x: () => 50, // stage offset x
      y: () => 30, // stage offset y
      scaleX: () => 1.5, // zoom
      scaleY: () => 1.5, // zoom
    }

    const mockEvent = {
      target: {
        getStage: () => mockStage,
      },
    } as any

    act(() => {
      result.current.handleCanvasClick(mockEvent)
    })

    // Verify element was created with correct canvas coordinates
    expect(mockClearSelection).toHaveBeenCalled()
    expect(mockAddElement).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text',
        position: {
          x: (200 - 50) / 1.5, // (pointer.x - stage.x) / zoom = 100
          y: (150 - 30) / 1.5, // (pointer.y - stage.y) / zoom = 80
        },
        size: { width: 200, height: 50 },
        content: 'Double-click to edit',
      }),
      { autoSelect: true }
    )
    expect(mockSetActiveTool).toHaveBeenCalledWith(ToolType.SELECT)
  })

  it('should not create element when clicking with select tool', () => {
    vi.mocked(useEditorStore).mockReturnValue({
      activeTool: ToolType.SELECT,
      addElement: mockAddElement,
      setActiveTool: mockSetActiveTool,
      clearSelection: mockClearSelection,
    } as any)

    const { result } = renderHook(() => useElementCreation())

    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: 100, y: 100 }),
          x: () => 0,
          y: () => 0,
          scaleX: () => 1,
          scaleY: () => 1,
        }),
      },
    } as any

    act(() => {
      result.current.handleCanvasClick(mockEvent)
    })

    expect(mockAddElement).not.toHaveBeenCalled()
  })

  it('should handle null pointer position gracefully', () => {
    const { result } = renderHook(() => useElementCreation())

    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => null,
          x: () => 0,
          y: () => 0,
          scaleX: () => 1,
          scaleY: () => 1,
        }),
      },
    } as any

    // Should not throw
    expect(() => {
      act(() => {
        result.current.handleCanvasClick(mockEvent)
      })
    }).not.toThrow()

    expect(mockAddElement).not.toHaveBeenCalled()
  })
})