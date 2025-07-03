import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useElementCreation } from './useElementCreation'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { ToolType } from '@/features/toolbar/types/toolbar.types'
import type { KonvaEventObject } from 'konva/lib/Node'

// Mock element factories
vi.mock('@/features/elements/utils/element-factories', () => ({
  createTextElement: vi.fn((pos) => ({
    id: 'text-123',
    type: 'text',
    name: 'Text',
    position: { x: pos.x, y: pos.y },
    size: { width: 200, height: 50 },
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 0,
    content: 'Test Text',
    style: {
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      verticalAlign: 'top',
      color: '#000000',
      lineHeight: 1.2,
    }
  })),
  createRectangleElement: vi.fn((pos) => ({
    id: 'rect-123',
    type: 'shape',
    shape: 'rectangle',
    name: 'Rectangle',
    position: { x: pos.x, y: pos.y },
    size: { width: 100, height: 100 },
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 0,
    style: {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
    }
  })),
  createImageElement: vi.fn((pos) => ({
    id: 'image-123',
    type: 'image',
    name: 'Image',
    position: { x: pos.x, y: pos.y },
    size: { width: 200, height: 150 },
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 0,
    src: '',
    fit: 'contain',
  })),
  createBarcodeElement: vi.fn((pos) => ({
    id: 'barcode-123',
    type: 'barcode',
    name: 'Barcode',
    position: { x: pos.x, y: pos.y },
    size: { width: 200, height: 80 },
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 0,
    format: 'CODE128',
    value: '123456789',
    style: {
      showText: true,
      textPosition: 'bottom',
      textAlign: 'center',
      fontSize: 12,
      background: '#ffffff',
      foreground: '#000000',
    }
  })),
  createTableElement: vi.fn((pos) => ({
    id: 'table-123',
    type: 'table',
    name: 'Table',
    position: { x: pos.x, y: pos.y },
    size: { width: 300, height: 150 },
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 0,
    rows: [],
    columns: [],
    style: {
      borderWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      cellPadding: 8,
      cellSpacing: 0,
      headerBackground: '#f0f0f0',
    }
  })),
}))

describe('useElementCreation', () => {
  beforeEach(() => {
    // Reset store
    useEditorStore.setState({
      elements: new Map(),
      selectedIds: new Set(),
      activeTool: ToolType.SELECT,
    })
    
    // Clear mocks
    vi.clearAllMocks()
  })

  it('should not create element when SELECT tool is active', async () => {
    const { result } = renderHook(() => useElementCreation())
    
    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: 100, y: 200 }),
          x: () => 0,
          y: () => 0,
          scaleX: () => 1,
          scaleY: () => 1,
        })
      }
    } as unknown as KonvaEventObject<MouseEvent>
    
    act(() => {
      result.current.handleCanvasClick(mockEvent)
    })
    
    expect(useEditorStore.getState().elements.size).toBe(0)
  })

  it('should create text element when TEXT tool is active', async () => {
    useEditorStore.setState({ activeTool: ToolType.TEXT })
    
    const { result } = renderHook(() => useElementCreation())
    
    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: 100, y: 200 }),
          x: () => 0,
          y: () => 0,
          scaleX: () => 1,
          scaleY: () => 1,
        })
      }
    } as unknown as KonvaEventObject<MouseEvent>
    
    act(() => {
      result.current.handleCanvasClick(mockEvent)
    })
    
    const state = useEditorStore.getState()
    expect(state.elements.size).toBe(1)
    expect(state.elements.get('text-123')).toBeDefined()
    expect(state.elements.get('text-123')?.type).toBe('text')
  })

  it('should create rectangle element when SHAPE tool is active', async () => {
    useEditorStore.setState({ activeTool: ToolType.SHAPE })
    
    const { result } = renderHook(() => useElementCreation())
    
    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: 50, y: 100 }),
          x: () => 0,
          y: () => 0,
          scaleX: () => 1,
          scaleY: () => 1,
        })
      }
    } as unknown as KonvaEventObject<MouseEvent>
    
    act(() => {
      result.current.handleCanvasClick(mockEvent)
    })
    
    const state = useEditorStore.getState()
    expect(state.elements.size).toBe(1)
    expect(state.elements.get('rect-123')).toBeDefined()
    expect(state.elements.get('rect-123')?.type).toBe('shape')
  })

  it('should automatically select newly created element', async () => {
    useEditorStore.setState({ activeTool: ToolType.TEXT })
    
    const { result } = renderHook(() => useElementCreation())
    
    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: 100, y: 200 }),
          x: () => 0,
          y: () => 0,
          scaleX: () => 1,
          scaleY: () => 1,
        })
      }
    } as unknown as KonvaEventObject<MouseEvent>
    
    act(() => {
      result.current.handleCanvasClick(mockEvent)
    })
    
    const state = useEditorStore.getState()
    expect(state.selectedIds.has('text-123')).toBe(true)
    expect(state.selectedIds.size).toBe(1)
  })

  it('should switch back to SELECT tool after creating element', async () => {
    useEditorStore.setState({ activeTool: ToolType.TEXT })
    
    const { result } = renderHook(() => useElementCreation())
    
    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: 100, y: 200 }),
          x: () => 0,
          y: () => 0,
          scaleX: () => 1,
          scaleY: () => 1,
        })
      }
    } as unknown as KonvaEventObject<MouseEvent>
    
    act(() => {
      result.current.handleCanvasClick(mockEvent)
    })
    
    expect(useEditorStore.getState().activeTool).toBe(ToolType.SELECT)
  })

  it('should handle null pointer position gracefully', async () => {
    useEditorStore.setState({ activeTool: ToolType.TEXT })
    
    const { result } = renderHook(() => useElementCreation())
    
    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => null
        })
      }
    } as unknown as KonvaEventObject<MouseEvent>
    
    act(() => {
      result.current.handleCanvasClick(mockEvent)
    })
    
    expect(useEditorStore.getState().elements.size).toBe(0)
  })

  it('should create elements with correct positions', async () => {
    useEditorStore.setState({ activeTool: ToolType.SHAPE })
    
    const { result } = renderHook(() => useElementCreation())
    
    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: 250, y: 350 }),
          x: () => 0,
          y: () => 0,
          scaleX: () => 1,
          scaleY: () => 1,
        })
      }
    } as unknown as KonvaEventObject<MouseEvent>
    
    act(() => {
      result.current.handleCanvasClick(mockEvent)
    })
    
    const element = useEditorStore.getState().elements.get('rect-123')
    expect(element?.position.x).toBe(250)
    expect(element?.position.y).toBe(350)
  })

})