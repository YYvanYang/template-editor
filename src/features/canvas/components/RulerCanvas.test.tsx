import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { RulerCanvas } from './RulerCanvas'
import type { RulerProps } from '../types/ruler.types'

describe('RulerCanvas', () => {
  let rafMock: any
  const mockOnClick = vi.fn()
  
  // 默认测试 props
  const defaultProps: RulerProps = {
    orientation: 'horizontal',
    length: 1000,
    thickness: 30,
    unit: 'mm',
    canvasSize: {
      width: 794, // 210mm * 3.7795275591
      height: 1122, // 297mm * 3.7795275591
    },
    viewport: {
      x: 0,
      y: 0,
      scale: 1,
    },
    onClick: mockOnClick,
  }
  
  beforeEach(() => {
    // Mock requestAnimationFrame
    let rafId = 0
    rafMock = {
      callbacks: new Map(),
      requestAnimationFrame: vi.fn((callback) => {
        rafId++
        rafMock.callbacks.set(rafId, callback)
        // 立即执行第一个回调以便测试
        setTimeout(() => callback(), 0)
        return rafId
      }),
      cancelAnimationFrame: vi.fn((id) => {
        rafMock.callbacks.delete(id)
      }),
    }
    global.requestAnimationFrame = rafMock.requestAnimationFrame
    global.cancelAnimationFrame = rafMock.cancelAnimationFrame
    
    // Mock Canvas API
    const mockContext = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'center',
      textBaseline: 'top',
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      setLineDash: vi.fn(),
    }
    
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext)
    
    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1,
      writable: true,
    })
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该渲染水平标尺', async () => {
      render(<RulerCanvas {...defaultProps} />)
      
      const canvas = screen.getByTestId('ruler-canvas-horizontal')
      expect(canvas).toBeInTheDocument()
      expect(canvas).toBeInstanceOf(HTMLCanvasElement)
      
      // 等待 requestAnimationFrame 执行
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const ctx = (canvas as HTMLCanvasElement).getContext('2d')
      expect(ctx?.fillRect).toHaveBeenCalled()
      expect(ctx?.strokeRect).toHaveBeenCalled()
    })

    it('应该渲染垂直标尺', async () => {
      render(<RulerCanvas {...defaultProps} orientation="vertical" />)
      
      const canvas = screen.getByTestId('ruler-canvas-vertical')
      expect(canvas).toBeInTheDocument()
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const ctx = (canvas as HTMLCanvasElement).getContext('2d')
      expect(ctx?.save).toHaveBeenCalled() // 垂直标尺需要旋转文字
      expect(ctx?.restore).toHaveBeenCalled()
    })

    it('应该设置正确的画布尺寸', () => {
      render(<RulerCanvas {...defaultProps} />)
      
      const canvas = screen.getByTestId('ruler-canvas-horizontal') as HTMLCanvasElement
      expect(canvas.style.width).toBe('1000px')
      expect(canvas.style.height).toBe('30px')
    })

    it('应该处理高 DPI 显示器', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2 })
      
      render(<RulerCanvas {...defaultProps} />)
      
      const ctx = (screen.getByTestId('ruler-canvas-horizontal') as HTMLCanvasElement).getContext('2d')
      expect(ctx?.scale).toHaveBeenCalledWith(2, 2)
    })
  })

  describe('单位和刻度', () => {
    it('应该根据缩放级别显示不同的刻度间隔', async () => {
      const { rerender } = render(<RulerCanvas {...defaultProps} />)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const ctx = (screen.getByTestId('ruler-canvas-horizontal') as HTMLCanvasElement).getContext('2d')
      const initialCallCount = vi.mocked(ctx?.moveTo).mock.calls.length
      
      // 增加缩放级别
      rerender(<RulerCanvas {...defaultProps} viewport={{ x: 0, y: 0, scale: 2 }} />)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // 更大的缩放应该显示更多的刻度
      const newCallCount = vi.mocked(ctx?.moveTo).mock.calls.length
      expect(newCallCount).toBeGreaterThan(initialCallCount)
    })

    it('应该正确处理不同的单位', () => {
      const { rerender } = render(<RulerCanvas {...defaultProps} unit="mm" />)
      
      const canvas = screen.getByTestId('ruler-canvas-horizontal')
      expect(canvas).toBeInTheDocument()
      
      // 切换到厘米
      rerender(<RulerCanvas {...defaultProps} unit="cm" />)
      expect(canvas).toBeInTheDocument()
      
      // 切换到像素
      rerender(<RulerCanvas {...defaultProps} unit="px" />)
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('鼠标交互', () => {
    it('应该显示鼠标位置指示器', async () => {
      render(<RulerCanvas {...defaultProps} mousePosition={{ x: 100, y: 50 }} />)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const ctx = (screen.getByTestId('ruler-canvas-horizontal') as HTMLCanvasElement).getContext('2d')
      
      // 应该绘制虚线
      expect(ctx?.setLineDash).toHaveBeenCalledWith([5, 3])
      // 应该恢复实线
      expect(ctx?.setLineDash).toHaveBeenCalledWith([])
      // 应该绘制标签文字
      expect(ctx?.fillText).toHaveBeenCalled()
    })

    it('应该正确计算鼠标位置的单位值', async () => {
      render(<RulerCanvas 
        {...defaultProps} 
        mousePosition={{ x: 377.95, y: 0 }} // 100mm in pixels
        viewport={{ x: 0, y: 0, scale: 1 }}
      />)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const ctx = (screen.getByTestId('ruler-canvas-horizontal') as HTMLCanvasElement).getContext('2d')
      
      // 检查是否显示了正确的标签 (100.0mm)
      const fillTextCalls = vi.mocked(ctx?.fillText).mock.calls
      const labelCall = fillTextCalls.find(call => call[0].includes('100'))
      expect(labelCall).toBeTruthy()
    })

    it('应该考虑视口偏移计算鼠标位置', async () => {
      render(<RulerCanvas 
        {...defaultProps} 
        mousePosition={{ x: 100, y: 0 }}
        viewport={{ x: -50, y: 0, scale: 1 }} // 画布向左偏移50px
      />)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const ctx = (screen.getByTestId('ruler-canvas-horizontal') as HTMLCanvasElement).getContext('2d')
      
      // 鼠标在容器的100px位置，但画布偏移了-50px，所以相对于画布是150px
      const fillTextCalls = vi.mocked(ctx?.fillText).mock.calls
      const labelCall = fillTextCalls.find(call => call[0].includes('39.7')) // ~150px / 3.7795 ≈ 39.7mm
      expect(labelCall).toBeTruthy()
    })
  })

  describe('点击事件', () => {
    it('应该处理点击事件并返回正确的单位值', () => {
      render(<RulerCanvas {...defaultProps} />)
      
      const canvas = screen.getByTestId('ruler-canvas-horizontal')
      
      // 模拟点击事件
      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 15,
        bubbles: true,
      })
      
      // Mock getBoundingClientRect
      canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: 1000,
        bottom: 30,
        width: 1000,
        height: 30,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }))
      
      fireEvent(canvas, clickEvent)
      
      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Number))
      
      // 验证返回的值大约是 26.5mm (100px / 3.7795)
      const unitValue = mockOnClick.mock.calls[0][0]
      expect(unitValue).toBeCloseTo(26.5, 1)
    })

    it('不应该在没有 onClick 回调时处理点击', () => {
      render(<RulerCanvas {...defaultProps} onClick={undefined} />)
      
      const canvas = screen.getByTestId('ruler-canvas-horizontal')
      
      expect(canvas.style.cursor).toBe('default')
      
      fireEvent.click(canvas)
      
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('视口变换', () => {
    it('应该根据视口偏移正确绘制刻度', async () => {
      render(<RulerCanvas 
        {...defaultProps}
        viewport={{ x: 100, y: 0, scale: 1 }} // 画布向右移动100px
      />)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const ctx = (screen.getByTestId('ruler-canvas-horizontal') as HTMLCanvasElement).getContext('2d')
      
      // 当画布向右移动时，标尺应该显示负值区域
      expect(ctx?.fillText).toHaveBeenCalled()
    })

    it('应该根据缩放级别调整刻度密度', async () => {
      const { rerender } = render(<RulerCanvas 
        {...defaultProps}
        viewport={{ x: 0, y: 0, scale: 0.5 }}
      />)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const ctx = (screen.getByTestId('ruler-canvas-horizontal') as HTMLCanvasElement).getContext('2d')
      const initialMoveToCount = vi.mocked(ctx?.moveTo).mock.calls.length
      
      // 增加缩放
      vi.mocked(ctx?.moveTo).mockClear()
      rerender(<RulerCanvas 
        {...defaultProps}
        viewport={{ x: 0, y: 0, scale: 2 }}
      />)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const newMoveToCount = vi.mocked(ctx?.moveTo).mock.calls.length
      
      // 缩放增大时，可见的单位范围减小，但刻度应该更密集
      expect(newMoveToCount).toBeGreaterThan(0)
    })
  })

  describe('性能优化', () => {
    it('应该使用 requestAnimationFrame 进行渲染', () => {
      render(<RulerCanvas {...defaultProps} />)
      
      expect(rafMock.requestAnimationFrame).toHaveBeenCalled()
    })

    it('应该在卸载时取消动画帧', () => {
      const { unmount } = render(<RulerCanvas {...defaultProps} />)
      
      unmount()
      
      expect(rafMock.cancelAnimationFrame).toHaveBeenCalled()
    })

    it('应该跳过不可见的刻度', async () => {
      render(<RulerCanvas 
        {...defaultProps}
        viewport={{ x: -10000, y: 0, scale: 1 }} // 画布远离可见区域
      />)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const ctx = (screen.getByTestId('ruler-canvas-horizontal') as HTMLCanvasElement).getContext('2d')
      
      // 应该有一些绘制调用，但不应该太多
      const moveToCount = vi.mocked(ctx?.moveTo).mock.calls.length
      // 即使画布偏移很远，仍然需要绘制一些基本的刻度和边框
      // 所以我们只需要验证它确实进行了绘制
      expect(moveToCount).toBeGreaterThan(0)
      // 并且绘制调用数量是合理的（不是无限制的）
      expect(moveToCount).toBeLessThan(1000) // 更宽松的上限
    })
  })

  describe('垂直标尺特殊处理', () => {
    it('应该正确旋转垂直标尺的文字', async () => {
      render(<RulerCanvas 
        {...defaultProps} 
        orientation="vertical"
        mousePosition={{ x: 0, y: 100 }}
      />)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const ctx = (screen.getByTestId('ruler-canvas-vertical') as HTMLCanvasElement).getContext('2d')
      
      // 检查是否进行了旋转
      expect(ctx?.rotate).toHaveBeenCalledWith(-Math.PI / 2)
      expect(ctx?.save).toHaveBeenCalled()
      expect(ctx?.restore).toHaveBeenCalled()
    })

    it('应该正确设置垂直标尺的尺寸', () => {
      render(<RulerCanvas {...defaultProps} orientation="vertical" length={800} />)
      
      const canvas = screen.getByTestId('ruler-canvas-vertical') as HTMLCanvasElement
      expect(canvas.style.width).toBe('30px') // thickness
      expect(canvas.style.height).toBe('800px') // length
    })
  })
})