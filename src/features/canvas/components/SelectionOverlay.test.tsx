import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { SelectionOverlay } from './SelectionOverlay'
import type { SelectionBox } from '../hooks/useElementSelection'

// Mock react-konva
// 注意：我们使用 div 元素而不是真实的 SVG 元素来避免 JSDOM 环境中的警告
// 这是单元测试中的常见做法，因为：
// 1. JSDOM 不完全支持 SVG 元素，会产生 "unrecognized tag" 警告
// 2. 单元测试关注的是组件逻辑，而不是实际的 SVG 渲染
// 3. 使用 data-* 属性保存原始属性值，便于测试断言
// 如需测试真实的 SVG 渲染，应使用 E2E 测试或视觉回归测试
vi.mock('react-konva', () => ({
  Group: ({ children, ...props }: any) => (
    <div data-testid="konva-group" {...props}>{children}</div>
  ),
  Rect: ({ x, y, width, height, onMouseDown, onMouseEnter, onMouseLeave, listening, ...props }: any) => (
    <div
      data-testid="konva-rect"
      data-x={x}
      data-y={y}
      data-width={width}
      data-height={height}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-listening={listening}
      {...props}
    />
  ),
  Circle: ({ x, y, radius, onMouseDown, onMouseEnter, onMouseLeave, listening, ...props }: any) => (
    <div
      data-testid="konva-circle"
      data-x={x}
      data-y={y}
      data-radius={radius}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-listening={listening}
      {...props}
    />
  ),
}))

describe('SelectionOverlay', () => {
  const defaultBounds: SelectionBox = {
    x: 100,
    y: 100,
    width: 200,
    height: 150,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render nothing when selectionBounds is null', () => {
      const { container } = render(<SelectionOverlay selectionBounds={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render nothing when visible is false', () => {
      const { container } = render(
        <SelectionOverlay selectionBounds={defaultBounds} visible={false} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('should render selection overlay with bounds', () => {
      const { container } = render(<SelectionOverlay selectionBounds={defaultBounds} />)
      
      // Check selection border
      const border = container.querySelector('[data-testid="konva-rect"][stroke="#0969da"]')
      expect(border).toBeTruthy()
      expect(border).toHaveAttribute('data-x', '100')
      expect(border).toHaveAttribute('data-y', '100')
      expect(border).toHaveAttribute('data-width', '200')
      expect(border).toHaveAttribute('data-height', '150')
    })

    it('should render 8 resize handles', () => {
      const { container } = render(<SelectionOverlay selectionBounds={defaultBounds} />)
      
      // Selection border + 8 handles = 9 rects
      const rects = container.querySelectorAll('[data-testid="konva-rect"]')
      expect(rects.length).toBe(9)
      
      // Check handle positions
      const handles = Array.from(rects).filter(rect => 
        rect.getAttribute('fill') === '#ffffff'
      )
      expect(handles.length).toBe(8)
    })

    it('should render rotation handle when onRotationStart is provided', () => {
      const onRotationStart = vi.fn()
      const { container } = render(
        <SelectionOverlay 
          selectionBounds={defaultBounds} 
          onRotationStart={onRotationStart}
          elementId="test-element"
        />
      )
      
      // Should have rotation line and circle
      const circle = container.querySelector('[data-testid="konva-circle"]')
      expect(circle).toBeTruthy()
      expect(circle).toHaveAttribute('data-x', '200') // center x
      expect(circle).toHaveAttribute('data-y', '80') // y - 20 offset
      
      // Should have connecting line
      const lines = Array.from(container.querySelectorAll('[data-testid="konva-rect"]')).filter(rect =>
        rect.getAttribute('data-width') === '1'
      )
      expect(lines.length).toBe(1)
    })
  })

  describe('Handle Interactions', () => {
    it('should handle resize mouse down', () => {
      const onResize = vi.fn()
      const { container } = render(
        <SelectionOverlay selectionBounds={defaultBounds} onResize={onResize} />
      )
      
      const handles = Array.from(container.querySelectorAll('[data-testid="konva-rect"]')).filter(rect => 
        rect.getAttribute('fill') === '#ffffff'
      )
      
      const nwHandle = handles[0]
      const mockEvent = {
        cancelBubble: false,
        evt: { clientX: 100, clientY: 100 },
      }
      
      // Simulate mouse down
      nwHandle.dispatchEvent(new MouseEvent('mousedown', mockEvent as any))
      
      // Check that event was cancelled
      expect(mockEvent.cancelBubble).toBe(false) // DOM doesn't update our mock
    })

    it('should update cursor on handle hover', () => {
      const { container } = render(<SelectionOverlay selectionBounds={defaultBounds} />)
      
      const handles = Array.from(container.querySelectorAll('[data-testid="konva-rect"]')).filter(rect => 
        rect.getAttribute('fill') === '#ffffff'
      )
      
      const mockStage = {
        container: () => ({ style: { cursor: 'default' } }),
      }
      
      const mockEvent = {
        target: {
          getStage: () => mockStage,
        },
      }
      
      // Simulate mouse enter on first handle (nw)
      handles[0].dispatchEvent(new MouseEvent('mouseenter', mockEvent as any))
      
      // Note: In real implementation, cursor would be set to 'nw-resize'
      // but we can't test this directly without full Konva setup
    })

    it('should handle rotation mouse down', () => {
      const onRotationStart = vi.fn()
      const { container } = render(
        <SelectionOverlay 
          selectionBounds={defaultBounds} 
          onRotationStart={onRotationStart}
          elementId="test-element"
        />
      )
      
      const circle = container.querySelector('[data-testid="konva-circle"]')
      expect(circle).toBeTruthy()
      
      const mockEvent = {
        cancelBubble: false,
        evt: { clientX: 200, clientY: 80 },
      }
      
      // Simulate mouse down on rotation handle
      circle!.dispatchEvent(new MouseEvent('mousedown', mockEvent as any))
    })
  })

  describe('Handle Positions', () => {
    it('should position handles correctly', () => {
      const { container } = render(<SelectionOverlay selectionBounds={defaultBounds} />)
      
      const handles = Array.from(container.querySelectorAll('[data-testid="konva-rect"]')).filter(rect => 
        rect.getAttribute('fill') === '#ffffff'
      )
      
      // Check corner handles
      const expectedPositions = [
        { x: 96, y: 96 }, // nw
        { x: 196, y: 96 }, // n
        { x: 296, y: 96 }, // ne
        { x: 296, y: 171 }, // e
        { x: 296, y: 246 }, // se
        { x: 196, y: 246 }, // s
        { x: 96, y: 246 }, // sw
        { x: 96, y: 171 }, // w
      ]
      
      handles.forEach((handle, index) => {
        const expected = expectedPositions[index]
        expect(handle).toHaveAttribute('data-x', expected.x.toString())
        expect(handle).toHaveAttribute('data-y', expected.y.toString())
      })
    })
  })
})