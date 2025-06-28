import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Canvas } from './Canvas'
import { useEditorStore } from '@/features/editor/stores/editor.store'

// Mock Konva
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => (
    <div data-testid="konva-stage" {...props}>{children}</div>
  ),
  Layer: ({ children }: any) => <div data-testid="konva-layer">{children}</div>,
  Line: ({ points, ...props }: any) => (
    <div data-testid="konva-line" data-points={points} {...props} />
  ),
}))

// Mock store
vi.mock('@/features/editor/stores/editor.store')

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
    expect(stage).toHaveAttribute('scaleX', '2')
    expect(stage).toHaveAttribute('scaleY', '2')
    expect(stage).toHaveAttribute('x', '100')
    expect(stage).toHaveAttribute('y', '50')
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
    
    // Simulate wheel event for zoom in
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: -100,
      ctrlKey: true,
    })
    stage.dispatchEvent(wheelEvent)
    
    expect(setZoom).toHaveBeenCalled()
  })
})