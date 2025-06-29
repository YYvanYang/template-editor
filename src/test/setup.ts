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
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left',
  textBaseline: 'alphabetic',
  globalAlpha: 1,
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 50 })),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  createPattern: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  setLineDash: vi.fn(),
  getLineDash: vi.fn(() => []),
  lineDashOffset: 0,
})

HTMLCanvasElement.prototype.getContext = vi.fn(function(type) {
  if (type === '2d') {
    // Create a new context for each canvas
    return createMockContext()
  }
  return null
})

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