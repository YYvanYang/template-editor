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
    x: pos.x,
    y: pos.y,
    width: 200,
    height: 50,
    rotation: 0,
    locked: false,
    visible: true,
    opacity: 1,
    content: 'Test Text',
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    verticalAlign: 'top',
    color: '#000000',
    lineHeight: 1.2,
  })),
  createRectangleElement: vi.fn((pos) => ({
    id: 'rect-123',
    type: 'shape',
    shapeType: 'rectangle',
    name: 'Rectangle',
    x: pos.x,
    y: pos.y,
    width: 100,
    height: 100,
    rotation: 0,
    locked: false,
    visible: true,
    opacity: 1,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 1,
    strokeDasharray: [],
    cornerRadius: 0,
  })),
  createImageElement: vi.fn((pos) => ({
    id: 'image-123',
    type: 'image',
    name: 'Image',
    x: pos.x,
    y: pos.y,
    width: 200,
    height: 150,
    rotation: 0,
    locked: false,
    visible: true,
    opacity: 1,
    src: '',
    fit: 'contain',
    crossOrigin: 'anonymous',
  })),
  createBarcodeElement: vi.fn((pos) => ({
    id: 'barcode-123',
    type: 'barcode',
    name: 'Barcode',
    x: pos.x,
    y: pos.y,
    width: 200,
    height: 80,
    rotation: 0,
    locked: false,
    visible: true,
    opacity: 1,
    format: 'CODE128',
    value: '123456789',
    showText: true,
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 2,
    fontSize: 12,
    background: '#ffffff',
    lineColor: '#000000',
    margin: 10,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
  })),
  createTableElement: vi.fn((pos) => ({
    id: 'table-123',
    type: 'table',
    name: 'Table',
    x: pos.x,
    y: pos.y,
    width: 300,
    height: 150,
    rotation: 0,
    locked: false,
    visible: true,
    opacity: 1,
    rows: [],
    columns: [],
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    cellPadding: 8,
    cellSpacing: 0,
    showHeader: true,
    headerBackground: '#f0f0f0',
    alternateRowBackground: false,
    alternateRowColor: '#f9f9f9',
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
          getPointerPosition: () => ({ x: 100, y: 200 })
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
          getPointerPosition: () => ({ x: 100, y: 200 })
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

  it('should create rectangle element when RECTANGLE tool is active', async () => {
    useEditorStore.setState({ activeTool: ToolType.RECTANGLE })
    
    const { result } = renderHook(() => useElementCreation())
    
    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: 50, y: 100 })
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
          getPointerPosition: () => ({ x: 100, y: 200 })
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
          getPointerPosition: () => ({ x: 100, y: 200 })
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
    useEditorStore.setState({ activeTool: ToolType.RECTANGLE })
    
    const { result } = renderHook(() => useElementCreation())
    
    const mockEvent = {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: 250, y: 350 })
        })
      }
    } as unknown as KonvaEventObject<MouseEvent>
    
    act(() => {
      result.current.handleCanvasClick(mockEvent)
    })
    
    const element = useEditorStore.getState().elements.get('rect-123')
    expect(element?.x).toBe(250)
    expect(element?.y).toBe(350)
  })

})