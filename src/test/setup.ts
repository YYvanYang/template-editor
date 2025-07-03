import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock browser APIs only if not already defined
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0) as any)
}
if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))
}

// Mock Canvas API - simplified to only include methods actually used
const createMockContext = () => ({
  // Canvas reference
  canvas: {} as HTMLCanvasElement,
  
  // Style properties
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
  
  // State methods
  save: vi.fn(),
  restore: vi.fn(),
  
  // Transform methods
  scale: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  
  // Drawing methods
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  
  // Path methods
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  
  // Line dash
  setLineDash: vi.fn(),
  getLineDash: vi.fn(() => []),
  
  // Additional methods that might be needed by other components
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  measureText: vi.fn(() => ({ width: 50 })),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  })),
  createImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  })),
} as unknown as CanvasRenderingContext2D)

// Create a properly typed mock function for getContext
const getContextMock = vi.fn(function(
  this: HTMLCanvasElement,
  contextId: string
): RenderingContext | null {
  if (contextId === '2d') {
    const ctx = createMockContext()
    // Set the canvas reference
    ;(ctx as any).canvas = this
    return ctx
  }
  // Return null for other context types
  return null
})

// Apply the mock with proper overloads
HTMLCanvasElement.prototype.getContext = getContextMock as {
  (contextId: '2d', options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null
  (contextId: 'bitmaprenderer', options?: ImageBitmapRenderingContextSettings): ImageBitmapRenderingContext | null
  (contextId: 'webgl' | 'experimental-webgl', options?: WebGLContextAttributes): WebGLRenderingContext | null
  (contextId: 'webgl2' | 'experimental-webgl2', options?: WebGLContextAttributes): WebGL2RenderingContext | null
  (contextId: string, options?: any): RenderingContext | null
}

// Mock Image constructor
global.Image = vi.fn().mockImplementation(() => {
  const img = {
    src: '',
    onload: null as any,
    onerror: null as any,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  Object.defineProperty(img, 'src', {
    get() {
      return this._src
    },
    set(value) {
      this._src = value
      // Simulate successful image load
      if (this.onload) {
        setTimeout(() => this.onload(), 0)
      }
    },
  })
  return img
}) as any

// 每个测试后自动清理
afterEach(() => {
  cleanup()
  vi.clearAllTimers()
})