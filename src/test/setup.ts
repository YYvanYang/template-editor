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

// Mock Canvas API
const createMockContext = () => ({
  // Canvas reference
  canvas: {} as HTMLCanvasElement,
  
  // Drawing methods
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
  
  // State methods
  save: vi.fn(),
  restore: vi.fn(),
  
  // Transform methods
  scale: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  setTransform: vi.fn(),
  getTransform: vi.fn(() => new DOMMatrix()),
  resetTransform: vi.fn(),
  
  // Drawing methods
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  
  // Text methods
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ 
    width: 50,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 50,
    actualBoundingBoxAscent: 10,
    actualBoundingBoxDescent: 0,
    fontBoundingBoxAscent: 10,
    fontBoundingBoxDescent: 0,
  })),
  
  // Path methods
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  ellipse: vi.fn(),
  rect: vi.fn(),
  quadraticCurveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  
  // Path drawing
  stroke: vi.fn(),
  fill: vi.fn(),
  clip: vi.fn(),
  isPointInPath: vi.fn(() => false),
  isPointInStroke: vi.fn(() => false),
  
  // Image methods
  drawImage: vi.fn(),
  createImageData: vi.fn((sw: number | ImageData, sh?: number) => ({
    data: new Uint8ClampedArray(4),
    width: typeof sw === 'number' ? sw : sw.width,
    height: typeof sw === 'number' ? (sh || 1) : sw.height,
    colorSpace: 'srgb' as PredefinedColorSpace,
  })),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
    colorSpace: 'srgb' as PredefinedColorSpace,
  })),
  putImageData: vi.fn(),
  
  // Pattern & Gradient
  createPattern: vi.fn(() => ({} as CanvasPattern)),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createConicGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  
  // Line styles
  setLineDash: vi.fn(),
  getLineDash: vi.fn(() => []),
  lineDashOffset: 0,
  lineJoin: 'miter' as CanvasLineJoin,
  lineCap: 'butt' as CanvasLineCap,
  miterLimit: 10,
  
  // Shadows
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  
  // Filters
  filter: 'none',
  
  // Image smoothing
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low' as ImageSmoothingQuality,
  
  // Text drawing direction
  direction: 'ltr' as CanvasDirection,
  
  // Canvas state
  getContextAttributes: vi.fn(() => ({ alpha: true })),
} as CanvasRenderingContext2D)

// Create a properly typed mock function for getContext
const getContextMock = vi.fn(function(
  this: HTMLCanvasElement,
  contextId: string,
  options?: any
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