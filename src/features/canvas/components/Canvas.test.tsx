import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Canvas } from './Canvas'
import { useEditorStore } from '@/features/editor/stores/editor.store'

// Mock Konva
vi.mock('react-konva', () => ({
  Stage: React.forwardRef(({ children, onWheel, scaleX, scaleY, x, y, ...props }: any, ref: any) => {
    const stageRef = React.useRef({
      getPointerPosition: () => ({ x: 100, y: 100 }),
    })
    
    React.useImperativeHandle(ref, () => stageRef.current)
    
    const handleWheel = (e: WheelEvent) => {
      if (onWheel) {
        // Simulate Konva event structure
        const konvaEvent = {
          evt: e,
          target: stageRef.current,
        }
        onWheel(konvaEvent)
      }
    }
    return (
      <div 
        data-testid="konva-stage" 
        onWheel={handleWheel}
        data-scalex={scaleX}
        data-scaley={scaleY}
        data-x={x}
        data-y={y}
        {...props}
      >
        {children}
      </div>
    )
  }),
  Layer: ({ children }: any) => <div data-testid="konva-layer">{children}</div>,
  Line: ({ points, ...props }: any) => (
    <div data-testid="konva-line" data-points={points} {...props} />
  ),
}))

// Mock store
vi.mock('@/features/editor/stores/editor.store')

// Mock useCanvasEvents hook
vi.mock('../hooks/useCanvasEvents', () => ({
  useCanvasEvents: vi.fn(),
}))

describe('Canvas', () => {
  beforeEach(() => {
    // Reset mock
    vi.mocked(useEditorStore).mockReturnValue({
      canvas: {
        zoom: 1,
        offset: { x: 0, y: 0 },
        gridEnabled: true,
        snapEnabled: true,
      },
      elements: new Map(),
      selectedIds: new Set(),
      setZoom: vi.fn(),
      setOffset: vi.fn(),
    } as any)
  })

  it('should render canvas stage', () => {
    render(<Canvas />)
    
    expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    expect(screen.getByTestId('konva-layer')).toBeInTheDocument()
  })

  it('should apply zoom and offset from store', () => {
    vi.mocked(useEditorStore).mockReturnValue({
      canvas: {
        zoom: 2,
        offset: { x: 100, y: 50 },
        gridEnabled: true,
        snapEnabled: true,
      },
      elements: new Map(),
      selectedIds: new Set(),
      setZoom: vi.fn(),
      setOffset: vi.fn(),
    } as any)

    render(<Canvas />)
    
    const stage = screen.getByTestId('konva-stage')
    expect(stage).toHaveAttribute('data-scalex', '2')
    expect(stage).toHaveAttribute('data-scaley', '2')
    expect(stage).toHaveAttribute('data-x', '100')
    expect(stage).toHaveAttribute('data-y', '50')
  })

  it('should handle wheel zoom', () => {
    const setZoom = vi.fn()
    vi.mocked(useEditorStore).mockReturnValue({
      canvas: {
        zoom: 1,
        offset: { x: 0, y: 0 },
        gridEnabled: true,
        snapEnabled: true,
      },
      elements: new Map(),
      selectedIds: new Set(),
      setZoom,
      setOffset: vi.fn(),
    } as any)

    render(<Canvas />)
    
    const stage = screen.getByTestId('konva-stage')
    
    // Simulate wheel event for zoom in with preventDefault
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: -100,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    
    // Add preventDefault method
    Object.defineProperty(wheelEvent, 'preventDefault', {
      value: vi.fn(),
      writable: true,
    })
    
    stage.dispatchEvent(wheelEvent)
    
    expect(setZoom).toHaveBeenCalled()
  })
})